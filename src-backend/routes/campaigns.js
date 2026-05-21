const express = require('express');
const { openDatabase } = require('../db/client');
const { sendPendingBatch } = require('../services/pacing');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, templateId, meta_template_id } = req.body;
  const db = openDatabase();
  try {
    const result = await db.run('INSERT INTO campaigns (name, template_id, meta_template_id, status, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))', [name, templateId, meta_template_id || null, 'draft']);
    res.json({ campaignId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

router.post('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { messageBody, contactIds = [] } = req.body;
  const db = openDatabase();
  try {
    const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }
    if (!contactIds.length) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un contacto' });
    }
    await db.run('UPDATE campaigns SET status = ?, scheduled_at = datetime(\'now\') WHERE id = ?', ['running', id]);
    const placeholders = contactIds.map(() => '?').join(',');
    const contacts = await db.all(`SELECT id, phone, var1, var2 FROM contacts WHERE id IN (${placeholders})`, contactIds);
    const insertMessage = 'INSERT INTO messages (campaign_id, contact_id, phone, body, vars_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))';
    for (const contact of contacts) {
      const vars = { var1: contact.var1 || '', var2: contact.var2 || '' };
      await db.run(insertMessage, [id, contact.id, contact.phone, messageBody, JSON.stringify(vars), 'pending']);
    }
    res.json({ ok: true, queued: contacts.length });
    sendPendingBatch();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

router.get('/:id/status', async (req, res) => {
  const { id } = req.params;
  const db = openDatabase();
  try {
    const status = await db.all('SELECT status, COUNT(*) as count FROM messages WHERE campaign_id = ? GROUP BY status', [id]);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await db.close();
  }
});

module.exports = router;
