const express = require('express');
const { openDatabase } = require('../db/client');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = openDatabase();
  try {
    const contacts = await db.all('SELECT id, phone, name, var1, var2 FROM contacts ORDER BY name');
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

module.exports = router;
