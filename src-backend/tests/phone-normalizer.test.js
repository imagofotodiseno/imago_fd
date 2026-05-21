const { normalizePhone, normalizeBatch } = require('../services/phone-normalizer');

test('normaliza teléfono sin prefijo usando +57', () => {
  const result = normalizePhone('312 555 0123', '+57');
  expect(result.valid).toBe(true);
  expect(result.phone).toBe('+573125550123');
});

test('rechaza teléfono inválido', () => {
  const result = normalizePhone('12345', '+57');
  expect(result.valid).toBe(false);
  expect(result.error).toContain('Formato inválido');
});

test('detecta duplicados en lotes', () => {
  const rows = [{ phone: '3125550123' }, { phone: '+573125550123' }];
  const preview = normalizeBatch(rows, '+57');
  expect(preview[0].duplicate).toBe(false);
  expect(preview[1].duplicate).toBe(true);
});
