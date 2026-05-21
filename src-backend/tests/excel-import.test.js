const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { extractHeaders, previewImport } = require('../services/excel-import');

const testFile = path.join(__dirname, 'sample.xlsx');

beforeAll(async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(['Teléfono', 'Nombre', 'Variable 1', 'Variable 2']);
  sheet.addRow(['3125550123', 'Carlos', 'Descuento', '12%']);
  sheet.addRow(['+573125550124', 'Laura', 'Oferta', '24%']);
  await workbook.xlsx.writeFile(testFile);
});

afterAll(() => {
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
});

test('extrae encabezados del archivo Excel', async () => {
  const headers = await extractHeaders(testFile);
  expect(headers).toEqual(['Teléfono', 'Nombre', 'Variable 1', 'Variable 2']);
});

test('genera preview con normalización correcta', async () => {
  const preview = await previewImport(testFile, { phone: 'Teléfono', name: 'Nombre', var1: 'Variable 1', var2: 'Variable 2' }, '+57');
  expect(preview.totalRows).toBe(2);
  expect(preview.preview[0].normalizedPhone).toBe('+573125550123');
  expect(preview.preview[1].valid).toBe(true);
});
