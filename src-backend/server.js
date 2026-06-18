const express = require('express');
// Importamos el cliente de Supabase usando la propiedad exportada con CommonJS
const { supabase } = require('../db/client');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Realizamos la consulta a la tabla 'contacts' de Supabase ordenando por 'name'
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, phone, name, var1, var2')
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

module.exports = router;