const express = require('express');
const { supabase } = require('../db/client');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, phone, name, var1, var2')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;