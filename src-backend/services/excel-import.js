const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../db/client');
const { normalizePhone, normalizeBatch } = require('./phone-normalizer');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const extractHeaders = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  if (filePath.endsWith('.csv')) {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  return headerRow.values.slice(1).map(String);
};

const readRows = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  if (filePath.endsWith('.csv')) {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }
  const worksheet = workbook.worksheets[0];
  const headers = worksheet.getRow(1).values.slice(1).map(String);
  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    const entry = {};
    headers.forEach((header, idx) => {
      entry[header] = values[idx] == null ? '' : String(values[idx]).trim();
    });
    if (Object.values(entry).some((value) => value !== '')) {
      rows.push(entry);
    }
  });
  return rows;
};

const previewImport = async (filePath, mapping, defaultCountry = '+57') => {
  const rows = await readRows(filePath);
  const mappedRows = rows.map((row) => ({
    phone: row[mapping.phone] || '',
    name: row[mapping.name] || '',
    var1: row[mapping.var1] || '',
    var2: row[mapping.var2] || ''
  }));
  const preview = normalizeBatch(mappedRows, defaultCountry);
  const errors = preview.filter((item) => !item.valid || item.duplicate).map((item) => ({
    row: item.rowIndex,
    phone: item.phone,
    error: item.error || (item.duplicate ? 'Duplicado detectado' : null)
  }));
  return { preview, totalRows: rows.length, errors };
};

const commitImport = async (filePath, mapping, defaultCountry = '+57', source = 'excel') => {
  const db = openDatabase();
  const rows = await readRows(filePath);
  const mappedRows = rows.map((row) => ({
    phone: row[mapping.phone] || '',
    name: row[mapping.name] || '',
    var1: row[mapping.var1] || '',
    var2: row[mapping.var2] || ''
  }));
  const preview = normalizeBatch(mappedRows, defaultCountry);
  const validRows = preview.filter((item) => item.valid && !item.duplicate);
  const insertStatement = 'INSERT OR IGNORE INTO contacts (phone, country_code, name, var1, var2, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))';
  for (const row of validRows) {
    await db.run(insertStatement, [row.normalizedPhone, defaultCountry, row.name, row.var1, row.var2, source]);
  }
  const importJobSql = 'INSERT INTO import_jobs (filename, mapping_json, rows_total, rows_valid, rows_invalid, duplicates_count, errors_json) VALUES (?, ?, ?, ?, ?, ?, ?)';
  await db.run(importJobSql, [path.basename(filePath), JSON.stringify(mapping), rows.length, validRows.length, rows.length - validRows.length, preview.filter((item) => item.duplicate).length, JSON.stringify(preview.filter((item) => !item.valid || item.duplicate))]);
  await db.close();
  return { totalRows: rows.length, imported: validRows.length, rejected: rows.length - validRows.length };
};

module.exports = { extractHeaders, previewImport, commitImport, uploadDir };
