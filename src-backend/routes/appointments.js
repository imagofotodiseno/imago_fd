const express = require('express');
const { openDatabase } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('../services/meta-service');
const { normalizePhone } = require('../services/phone-normalizer');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = openDatabase();
  try {
    const appointments = await db.all(`
      SELECT a.*, c.name AS contact_name, c.phone AS contact_phone, c.var1, c.var2
      FROM appointments a
      LEFT JOIN contacts c ON c.id = a.contact_id
      ORDER BY a.starts_at DESC
    `);
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

router.post('/', async (req, res) => {
  const { phone, name, service, starts_at, ends_at, defaultCountry } = req.body;
  const normalized = normalizePhone(phone, defaultCountry || '+57');
  if (!normalized.valid) {
    return res.status(400).json({ error: normalized.error });
  }
  const cleanPhone = normalized.phone;
  const db = openDatabase();
  try {
    let contact = await db.get('SELECT * FROM contacts WHERE phone = ?', [cleanPhone]);
    if (!contact) {
      const result = await db.run('INSERT INTO contacts (phone, name, source, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))', [cleanPhone, name, 'appointment']);
      contact = { id: result.lastID, phone: cleanPhone, name };
    }
    const appointmentResult = await db.run('INSERT INTO appointments (contact_id, service, starts_at, ends_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))', [contact.id, service, starts_at, ends_at, 'scheduled']);
    const config = await getMetaConfig();
    await sendWhatsAppMessage({
      access_token: config.access_token,
      phone_number_id: config.phone_number_id,
      to: cleanPhone,
      templateName: 'utility_confirmation',
      language: 'es',
      components: [
        { type: 'body', parameters: [{ type: 'text', text: name }, { type: 'text', text: service }, { type: 'text', text: starts_at }] }
      ]
    });
    res.json({ appointmentId: appointmentResult.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const db = openDatabase();
  try {
    await db.run('UPDATE appointments SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['confirmed', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

module.exports = router;
