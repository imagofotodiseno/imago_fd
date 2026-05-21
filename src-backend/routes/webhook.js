const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const VERIFY_TOKEN = process.env.WH_WEBHOOK_VERIFY_TOKEN || 'change_me';
const DB_FILE = path.join(__dirname, '..', 'db', 'database.sqlite');

const normalizeResponseText = (text) => {
  if (!text) return '';
  return text.toString().trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
};

// Verification endpoint (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Receive webhook events (POST)
router.post('/', (req, res) => {
  const body = req.body;
  const db = new sqlite3.Database(DB_FILE);
  db.serialize(() => {
    db.run('INSERT INTO webhook_events (raw_json, type) VALUES (?, ?)', [JSON.stringify(body), 'meta_webhook']);
    const entries = body.entry || [];
    entries.forEach((entry) => {
      const changes = entry.changes || [];
      changes.forEach((change) => {
        const value = change.value || {};
        const messages = value.messages || [];
        messages.forEach((message) => {
          const from = message.from;
          const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
          const normalized = normalizeResponseText(text);
          const confirmationKeywords = ['SI', 'SÍ', 'CONFIRMAR', 'ACEPTAR'];
          if (confirmationKeywords.includes(normalized)) {
            db.get('SELECT id FROM contacts WHERE phone = ?', [from], (err, contact) => {
              if (!err && contact) {
                db.run('UPDATE appointments SET status = ?, updated_at = datetime(\'now\') WHERE contact_id = ? AND status = ?', ['confirmed', contact.id, 'scheduled']);
              }
            });
          }
          if (message.status) {
            db.run('UPDATE messages SET status = ? WHERE meta_message_id = ?', [message.status, message.id]);
          }
        });
      });
    });
  });
  db.close((err) => {
    if (err) {
      console.error('Error closing DB after webhook event', err);
      return res.sendStatus(500);
    }
    res.sendStatus(200);
  });
});

module.exports = router;
