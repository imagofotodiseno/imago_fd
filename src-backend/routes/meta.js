const express = require('express');
const router = express.Router();
const { getMetaConfig, saveMetaConfig, pingMeta, syncTemplates } = require('../services/meta-service');

router.get('/config', async (req, res) => {
  try {
    const config = await getMetaConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    await saveMetaConfig(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ping', async (req, res) => {
  try {
    const config = await getMetaConfig();
    if (!config.access_token || !config.phone_number_id) {
      return res.status(400).json({ error: 'Meta configuration incomplete' });
    }
    const result = await pingMeta(config);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/templates/sync', async (req, res) => {
  try {
    const config = await getMetaConfig();
    if (!config.access_token || !config.waba_id) {
      return res.status(400).json({ error: 'Meta configuration incomplete' });
    }
    const templates = await syncTemplates(config);
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
