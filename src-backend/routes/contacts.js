const express = require('express');
// Importamos el cliente de Supabase usando la propiedad exportada con CommonJS
const { supabase } = require('../db/client');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Realizamos la consulta a la tabla 'contacts' de Supabase ordenando por 'name'
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, phone, name, var1, var2, source, created_at')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Retornamos la respuesta en el mismo formato que esperaba tu frontend
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { phone, name, var1, var2 } = req.body || {};

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'El campo phone es obligatorio.' });
    }

    const contactPayload = {
      phone: String(phone).trim(),
      name: name ? String(name).trim() : null,
      var1: var1 ? String(var1).trim() : null,
      var2: var2 ? String(var2).trim() : null,
      source: 'manual'
    };

    const { data: createdContact, error } = await supabase
      .from('contacts')
      .insert(contactPayload)
      .select('id, phone, name, var1, var2, source, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ contact: createdContact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;