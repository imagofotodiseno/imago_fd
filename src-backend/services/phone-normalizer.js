const normalizePhone = (raw, defaultCountry = '+57') => {
  if (!raw && raw !== 0) {
    return { valid: false, error: 'Teléfono vacío' };
  }

  const original = String(raw).trim();
  let cleaned = original.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    const stripped = cleaned.replace(/^0+/, '');
    cleaned = `${defaultCountry}${stripped}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Formato inválido. Use E.164 con código de país, por ejemplo +57...'
    };
  }

  return { valid: true, phone: cleaned, original };
};

const normalizeBatch = (rows, defaultCountry = '+57') => {
  const seen = new Set();
  const preview = rows.map((row, index) => {
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
      duplicate
    };
  });
  return preview;
};

module.exports = { normalizePhone, normalizeBatch };
