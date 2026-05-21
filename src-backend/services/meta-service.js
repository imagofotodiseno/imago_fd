const axios = require('axios');
const { openDatabase } = require('../db/client');

const getMetaConfig = async () => {
  const db = openDatabase();
  const config = await db.get('SELECT * FROM meta_config WHERE id = 1');
  await db.close();
  return config || {};
};

const saveMetaConfig = async ({ access_token, phone_number_id, waba_id }) => {
  const db = openDatabase();
  await db.run(
    `INSERT INTO meta_config (id, access_token, phone_number_id, waba_id, last_ping_at)
     VALUES (1, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token, phone_number_id=excluded.phone_number_id, waba_id=excluded.waba_id, last_ping_at=datetime('now')`,
    [access_token, phone_number_id, waba_id]
  );
  await db.close();
};

const pingMeta = async ({ access_token, phone_number_id }) => {
  const url = `https://graph.facebook.com/v17.0/${phone_number_id}`;
  const params = {
    access_token,
    fields: 'quality_rating,display_phone_number,account_review_status'
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const syncTemplates = async ({ access_token, waba_id }) => {
  const url = `https://graph.facebook.com/v17.0/${waba_id}/message_templates`;
  const params = {
    access_token,
    limit: 100
  };
  const response = await axios.get(url, { params });
  const templates = response.data.data || [];
  const db = openDatabase();
  for (const template of templates) {
    const existing = await db.get('SELECT id FROM templates WHERE template_id = ?', [template.id]);
    if (existing) {
      await db.run('UPDATE templates SET name = ?, language = ?, components_json = ?, raw_json = ?, fetched_at = datetime(\'now\') WHERE template_id = ?', [template.name, template.language, JSON.stringify(template.components || []), JSON.stringify(template), template.id]);
    } else {
      await db.run('INSERT INTO templates (template_id, name, language, components_json, raw_json, fetched_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))', [template.id, template.name, template.language, JSON.stringify(template.components || []), JSON.stringify(template)]);
    }
  }
  const rows = await db.all('SELECT * FROM templates');
  await db.close();
  return rows;
};

const sendWhatsAppMessage = async ({ access_token, phone_number_id, to, templateName, language = 'es', components = [] }) => {
  const url = `https://graph.facebook.com/v17.0/${phone_number_id}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components
    }
  };
  const response = await axios.post(url, payload, {
    params: { access_token }
  });
  return response.data;
};

module.exports = { getMetaConfig, saveMetaConfig, pingMeta, syncTemplates, sendWhatsAppMessage };
