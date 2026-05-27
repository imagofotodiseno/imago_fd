/**
 * phone-normalizer.js
 * Normalizes phone numbers to E.164 format and provides string sanitization.
 */

/**
 * Sanitize a raw string value coming from Excel cells.
 * Strips unicode control characters, non-breaking spaces, and trims whitespace.
 * @param {*} value - Raw value from the spreadsheet cell.
 * @param {number} [maxLength=500] - Maximum allowed length after trimming.
 * @returns {string}
 */
const sanitizeString = (value, maxLength = 500) => {
  if (value === null || value === undefined) return '';
  // Convert to string, remove non-breaking spaces (U+00A0) and other control chars
  const str = String(value)
    .replace(/\u00A0/g, ' ')           // non-breaking space → regular space
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip ASCII control characters
    .trim();
  return str.length > maxLength ? str.slice(0, maxLength) : str;
};

/**
 * Normalize a single phone number string to E.164 format.
 * Handles:
 *  - Numbers with country prefix starting with '+' or '00'
 *  - Dot-separated formats: 57.300.123.4567
 *  - Numbers without prefix (prefixed with defaultCountry)
 *
 * @param {string|number} raw
 * @param {string} [defaultCountry='+57']
 * @returns {{ valid: boolean, phone?: string, original?: string, originalRaw?: string, error?: string }}
 */
const normalizePhone = (raw, defaultCountry = '+57') => {
  if (raw === null || raw === undefined || raw === '') {
    return { valid: false, originalRaw: String(raw ?? ''), error: 'Teléfono vacío' };
  }

  const originalRaw = String(raw).trim();
  const original = originalRaw;

  // Strip all non-numeric characters EXCEPT leading '+' and dots
  // First replace dots used as separators (e.g. 57.300.123.4567)
  let cleaned = originalRaw.replace(/\./g, '');

  // Remove all non-digit, non-'+' characters (parens, spaces, dashes, etc.)
  cleaned = cleaned.replace(/[^\d+]/g, '');

  // Handle '00' international prefix
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Apply default country prefix if no country code present
  if (!cleaned.startsWith('+')) {
    const stripped = cleaned.replace(/^0+/, '');
    cleaned = `${defaultCountry}${stripped}`;
  }

  // Validate E.164: +[1-9][7-14 digits]
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return {
      valid: false,
      originalRaw,
      error: `Formato inválido ("${originalRaw}"). Use E.164, ej. +57300...`
    };
  }

  return { valid: true, phone: cleaned, original, originalRaw };
};

/**
 * Normalize a batch of row objects, detecting duplicates in-session.
 * @param {Array<{phone: string, [key: string]: string}>} rows
 * @param {string} [defaultCountry='+57']
 * @returns {Array}
 */
const normalizeBatch = (rows, defaultCountry = '+57') => {
  const seen = new Set();
  return rows.map((row, index) => {
    const result = normalizePhone(row.phone, defaultCountry);
    let duplicate = false;
    if (result.valid) {
      if (seen.has(result.phone)) {
        duplicate = true;
      } else {
        seen.add(result.phone);
      }
    }
    return {
      rowIndex: index + 1,
      ...row,
      normalizedPhone: result.phone || null,
      valid: result.valid,
      error: result.error || null,
      originalRaw: result.originalRaw || null,
      duplicate
    };
  });
};

module.exports = { normalizePhone, normalizeBatch, sanitizeString };
