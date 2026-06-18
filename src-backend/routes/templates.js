const express = require('express');
const { supabase } = require('../db/client');
const { syncTemplates, getMetaConfig } = require('../services/meta-service');

const router = express.Router();

// 1. Obtener todas las plantillas guardadas en Supabase
router.get('/', async (req, res) => {
  try {
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Sincronizar plantillas desde la API de Meta
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