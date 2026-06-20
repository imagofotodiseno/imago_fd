const express = require('express');
const { openDatabase, supabase, isSupabaseConfigured } = require('../db/client');
const { syncTemplates, getMetaConfig } = require('../services/meta-service');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let templates = [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      templates = data || [];
    } else {
      const db = openDatabase();
      try {
        templates = await db.all('SELECT * FROM templates ORDER BY name');
      } finally {
        await db.close();
      }
    }

    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
