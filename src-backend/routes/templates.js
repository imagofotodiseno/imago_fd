const express = require('express');
const { openDatabase } = require('../db/client');
const { syncTemplates, getMetaConfig } = require('../services/meta-service');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = openDatabase();
  try {
    const templates = await db.all('SELECT * FROM templates ORDER BY name');
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

router.post('/sync', async (req, res) => {
  try {
    const config = await getMetaConfig();
    if (!config || !config.access_token || !config.waba_id) {
      return res.status(400).json({ error: 'Meta configuration not found' });
    }
    const templates = await syncTemplates(config);
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
