import express from 'express';
import { supabase } from '../db/client.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Realizamos la consulta ordenando por la columna 'name' de manera ascendente
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

export default router;