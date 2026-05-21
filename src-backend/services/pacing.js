const { openDatabase } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('./meta-service');

let isProcessing = false;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_INTERVAL_MS = 5000;

const sendPendingBatch = async () => {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const db = openDatabase();
    const messages = await db.all('SELECT * FROM messages WHERE status = ? ORDER BY created_at LIMIT ?', ['pending', DEFAULT_BATCH_SIZE]);
    if (!messages.length) {
      await db.close();
      return;
    }
    const config = await getMetaConfig();
    const sendPromises = messages.map(async (message) => {
      try {
        const templateComponents = [];
        if (message.vars_json) {
          const vars = JSON.parse(message.vars_json);
          templateComponents.push({ type: 'body', parameters: Object.values(vars).map((value) => ({ type: 'text', text: value })) });
        }
        const result = await sendWhatsAppMessage({
          access_token: config.access_token,
          phone_number_id: config.phone_number_id,
          to: message.phone,
          templateName: message.body || 'default_template',
          components: templateComponents
        });
        await db.run('UPDATE messages SET status = ?, meta_message_id = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime(\'now\') WHERE id = ?', ['sent', result.messages?.[0]?.id || null, message.id]);
      } catch (err) {
        await db.run('UPDATE messages SET status = ?, error_text = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime(\'now\') WHERE id = ?', ['failed', err.message, message.id]);
      }
    });
    await Promise.all(sendPromises);
    await db.close();
  } finally {
    isProcessing = false;
  }
};

const startQueueProcessor = () => {
  setInterval(sendPendingBatch, DEFAULT_INTERVAL_MS);
};

module.exports = { startQueueProcessor, sendPendingBatch };
