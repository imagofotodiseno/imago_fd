const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { extractHeaders, previewImport, commitImport, uploadDir } = require('../services/excel-import');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const valid = /\.(xlsx|csv)$/i.test(file.originalname);
    cb(null, valid);
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const filePath = req.file.path;
    const headers = await extractHeaders(filePath);
    res.json({ filePath, headers, originalname: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/preview', async (req, res) => {
  try {
    const { filePath, mapping, defaultCountry } = req.body;
    const preview = await previewImport(filePath, mapping, defaultCountry);
    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/commit', async (req, res) => {
  try {
    const { filePath, mapping, defaultCountry } = req.body;
    const result = await commitImport(filePath, mapping, defaultCountry);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
