const { openDatabase, supabase, isSupabaseConfigured } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('./meta-service');

let isProcessing = false;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_INTERVAL_MS = 5000;

const sendPendingBatch = async () => {
  if (isProcessing) return;
  isProcessing = true;
  try {
    let db = null;
    let messages = [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(DEFAULT_BATCH_SIZE);

      if (error) throw error;
      messages = data || [];
    } else {
      db = openDatabase();
      messages = await db.all('SELECT * FROM messages WHERE status = ? ORDER BY created_at LIMIT ?', ['pending', DEFAULT_BATCH_SIZE]);
    }

    if (!messages.length) {
      if (db) await db.close();
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

        if (isSupabaseConfigured) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              status: 'sent',
              meta_message_id: result.messages?.[0]?.id || null,
              attempt_count: (message.attempt_count || 0) + 1,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', message.id);

          if (updateError) throw updateError;
        } else {
          await db.run('UPDATE messages SET status = ?, meta_message_id = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime(\'now\') WHERE id = ?', ['sent', result.messages?.[0]?.id || null, message.id]);
        }
      } catch (err) {
        if (isSupabaseConfigured) {
          await supabase
            .from('messages')
            .update({
              status: 'failed',
              error_text: err.message,
              attempt_count: (message.attempt_count || 0) + 1,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', message.id);
        } else {
          await db.run('UPDATE messages SET status = ?, error_text = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime(\'now\') WHERE id = ?', ['failed', err.message, message.id]);
        }
      }
    });
    await Promise.all(sendPromises);

    if (db) await db.close();
  } finally {
    isProcessing = false;
  }
};

const startQueueProcessor = () => {
  setInterval(sendPendingBatch, DEFAULT_INTERVAL_MS);
};

module.exports = { startQueueProcessor, sendPendingBatch };
