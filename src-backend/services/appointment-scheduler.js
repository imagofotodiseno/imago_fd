const cron = require('node-cron');
const { openDatabase, supabase, isSupabaseConfigured } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('./meta-service');

const scheduleReminders = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      let rows = [];
      let db = null;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            starts_at,
            status,
            service,
            contact_id,
            reminder_sent_at,
            contacts (
              name,
              phone
            )
          `)
          .eq('status', 'scheduled')
          .gt('starts_at', now.toISOString())
          .lte('starts_at', next24h.toISOString())
          .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${oneHourAgo.toISOString()}`);

        if (error) throw error;

        rows = (data || []).map((item) => ({
          id: item.id,
          starts_at: item.starts_at,
          service: item.service,
          contact_id: item.contact_id,
          name: item.contacts?.name,
          phone: item.contacts?.phone
        }));
      } else {
        db = openDatabase();
        rows = await db.all(`
          SELECT a.id, a.starts_at, a.status, a.service, a.contact_id, c.name, c.phone
          FROM appointments a
          JOIN contacts c ON c.id = a.contact_id
          WHERE a.status = 'scheduled'
            AND a.starts_at > datetime('now')
            AND a.starts_at <= datetime('now', '+24 hours')
            AND (a.reminder_sent_at IS NULL OR a.reminder_sent_at < datetime('now', '-1 hour'))
        `);
      }

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

          if (isSupabaseConfigured) {
            await supabase
              .from('appointments')
              .update({ reminder_sent_at: new Date().toISOString() })
              .eq('id', appointment.id);
          } else {
            await db.run('UPDATE appointments SET reminder_sent_at = datetime(\'now\') WHERE id = ?', [appointment.id]);
          }
        } catch (err) {
          console.error('Error sending reminder', err.message);
        }
      }

      if (db) await db.close();
    } catch (err) {
      console.error('Error processing reminders', err.message);
    }
  });
};

module.exports = { scheduleReminders };
