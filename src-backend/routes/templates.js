const express = require('express');
<<<<<<< HEAD
const { supabase } = require('../db/client');
=======
const { openDatabase } = require('../db/client');
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
const { syncTemplates, getMetaConfig } = require('../services/meta-service');

const router = express.Router();

<<<<<<< HEAD
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
=======
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

>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
router.post('/sync', async (req, res) => {
  try {
    const config = await getMetaConfig();
    if (!config || !config.access_token || !config.waba_id) {
      return res.status(400).json({ error: 'Meta configuration not found' });
    }
<<<<<<< HEAD
    
=======
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
    const templates = await syncTemplates(config);
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
