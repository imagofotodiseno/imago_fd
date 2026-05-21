const cron = require('node-cron');
const { openDatabase } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('./meta-service');

const scheduleReminders = () => {
  cron.schedule('*/5 * * * *', async () => {
    const db = openDatabase();
    const rows = await db.all(`
      SELECT a.id, a.starts_at, a.status, a.service, a.contact_id, c.name, c.phone
      FROM appointments a
      JOIN contacts c ON c.id = a.contact_id
      WHERE a.status = 'scheduled'
        AND a.starts_at > datetime('now')
        AND a.starts_at <= datetime('now', '+24 hours')
        AND (a.reminder_sent_at IS NULL OR a.reminder_sent_at < datetime('now', '-1 hour'))
    `);
    const config = await getMetaConfig();
    for (const appointment of rows) {
      try {
        await sendWhatsAppMessage({
          access_token: config.access_token,
          phone_number_id: config.phone_number_id,
          to: appointment.phone,
          templateName: 'utility_reminder',
          language: 'es',
          components: [
            { type: 'body', parameters: [{ type: 'text', text: appointment.name }, { type: 'text', text: appointment.service }, { type: 'text', text: appointment.starts_at }] }
          ]
        });
        await db.run('UPDATE appointments SET reminder_sent_at = datetime(\'now\') WHERE id = ?', [appointment.id]);
      } catch (err) {
        console.error('Error sending reminder', err.message);
      }
    }
    await db.close();
  });
};

module.exports = { scheduleReminders };
