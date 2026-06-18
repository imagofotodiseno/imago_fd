/**
 * excel-import.js
 * Handles Excel/CSV ingestion with dynamic merge-tag column mapping.
 * Returns structured { validRecords, errorLogs } for clean API responses.
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../db/client');
const { normalizePhone, normalizeBatch, sanitizeString } = require('./phone-normalizer');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load an ExcelJS workbook from a file path (xlsx or csv).
 */
const loadWorkbook = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  if (filePath.toLowerCase().endsWith('.csv')) {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }
  return workbook;
};

/**
 * Extract column header names from the first row of the first sheet.
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
const extractHeaders = async (filePath) => {
  const workbook = await loadWorkbook(filePath);
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  return headerRow.values
    .slice(1)
    .map((v) => sanitizeString(v))
    .filter(Boolean);
};

/**
 * Read all data rows as a flat array of objects keyed by header name.
 * Empty rows (all blank cells) are skipped.
 * @param {string} filePath
 * @returns {Promise<Array<Record<string, string>>>}
 */
const readRows = async (filePath) => {
  const workbook = await loadWorkbook(filePath);
  const worksheet = workbook.worksheets[0];
  const headers = worksheet.getRow(1).values
    .slice(1)
    .map((v) => sanitizeString(v));
  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    const entry = {};
    headers.forEach((header, idx) => {
      entry[header] = sanitizeString(values[idx]);
    });
    if (Object.values(entry).some((v) => v !== '')) {
      rows.push(entry);
    }
  });
  return rows;
};

// ─── Mapping Schema ────────────────────────────────────────────────────────────
/**
 * mapping = {
 *   phoneColumn: 'Teléfono',        // required
 *   nameColumn: 'Nombre',           // optional
 *   mergeTags: {                     // dynamic — any number of tags
 *     empresa: 'Empresa',
 *     ciudad: 'Ciudad',
 *     producto: 'Producto Interés'
 *   }
 * }
 */

/**
 * Apply the mapping to a raw row, returning a normalized record shape.
 */
const applyMapping = (row, mapping) => {
  const phone = row[mapping.phoneColumn] || '';
  const name = sanitizeString(row[mapping.nameColumn] || '');
  const mergeTags = {};
  if (mapping.mergeTags && typeof mapping.mergeTags === 'object') {
    for (const [tagName, columnName] of Object.entries(mapping.mergeTags)) {
      mergeTags[sanitizeString(tagName)] = sanitizeString(row[columnName] || '');
    }
  }
  return { phone, name, mergeTags };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Preview an import: parse rows, apply mapping, validate phones.
 * Returns { validRecords[], errorLogs[], totalRows }.
 *
 * @param {string} filePath
 * @param {object} mapping
 * @param {string} [defaultCountry='+57']
 * @returns {Promise<{ validRecords: object[], errorLogs: object[], totalRows: number }>}
 */
const previewImport = async (filePath, mapping, defaultCountry = '+57') => {
  const rows = await readRows(filePath);
  const mapped = rows.map((row) => applyMapping(row, mapping));

  const seen = new Set();
  const validRecords = [];
  const errorLogs = [];

  mapped.forEach((record, index) => {
    const rowIndex = index + 1;
    const result = normalizePhone(record.phone, defaultCountry);

    if (!result.valid) {
      errorLogs.push({
        row: rowIndex,
        originalPhone: record.phone,
        originalRaw: result.originalRaw,
        name: record.name,
        error: result.error
      });
      return;
    }

    if (seen.has(result.phone)) {
      errorLogs.push({
        row: rowIndex,
        originalPhone: record.phone,
        originalRaw: result.originalRaw,
        name: record.name,
        error: 'Número duplicado en este archivo'
      });
      return;
    }

    seen.add(result.phone);
    validRecords.push({
      rowIndex,
      normalizedPhone: result.phone,
      name: record.name,
      mergeTags: record.mergeTags
    });
  });

  return { validRecords, errorLogs, totalRows: rows.length };
};

/**
 * Commit validated records into the contacts table.
 * Stores merge tags in custom_vars_json column.
 * Ensures the column exists before writing (additive migration).
 *
 * @param {string} filePath
 * @param {object} mapping
 * @param {string} [defaultCountry='+57']
 * @param {string} [source='excel']
 * @returns {Promise<{ totalRows: number, imported: number, rejected: number, errorLogs: object[] }>}
 */
const commitImport = async (filePath, mapping, defaultCountry = '+57', source = 'excel') => {
  const db = openDatabase();

  // Additive migration: ensure custom_vars_json column exists
  try {
    await db.run('ALTER TABLE contacts ADD COLUMN custom_vars_json TEXT');
  } catch (_) {
    // Column already exists — safe to ignore
  }

  const { validRecords, errorLogs, totalRows } = await previewImport(filePath, mapping, defaultCountry);

  const insertSql = `
    INSERT OR IGNORE INTO contacts
      (phone, country_code, name, var1, var2, custom_vars_json, source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  for (const record of validRecords) {
    const var1 = record.mergeTags?.var1 || '';
    const var2 = record.mergeTags?.var2 || '';
    const customVarsJson = JSON.stringify(record.mergeTags || {});
    await db.run(insertSql, [
      record.normalizedPhone,
      defaultCountry,
      record.name,
      var1,
      var2,
      customVarsJson,
      source
    ]);
  }

  // Log the import job
  const jobSql = `
    INSERT INTO import_jobs
      (filename, mapping_json, rows_total, rows_valid, rows_invalid, duplicates_count, errors_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const duplicatesCount = errorLogs.filter((e) => e.error.includes('duplicado') || e.error.includes('Duplicado')).length;
  await db.run(jobSql, [
    path.basename(filePath),
    JSON.stringify(mapping),
    totalRows,
    validRecords.length,
    errorLogs.length,
    duplicatesCount,
    JSON.stringify(errorLogs)
  ]);

  await db.close();

  return {
    totalRows,
    imported: validRecords.length,
    rejected: errorLogs.length,
    errorLogs
  };
};

module.exports = { extractHeaders, previewImport, commitImport, uploadDir };
