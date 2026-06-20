const axios = require('axios');
const { openDatabase, supabase, isSupabaseConfigured } = require('../db/client');

const isDisabled = () => {
  const v = process.env.DISABLE_META;
  return v === '1' || v === 'true';
};

const getMetaConfig = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('meta_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;
    return data || {};
  }

  const db = openDatabase();
  try {
    const config = await db.get('SELECT * FROM meta_config WHERE id = 1');
    return config || {};
  } finally {
    await db.close();
  }
};

const saveMetaConfig = async ({ access_token, phone_number_id, waba_id }) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('meta_config')
      .upsert(
        {
          id: 1,
          access_token,
          phone_number_id,
          waba_id,
          last_ping_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) throw error;
    return;
  }

  const db = openDatabase();
  try {
    await db.run(
      `INSERT INTO meta_config (id, access_token, phone_number_id, waba_id, last_ping_at)
       VALUES (1, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token, phone_number_id=excluded.phone_number_id, waba_id=excluded.waba_id, last_ping_at=datetime('now')`,
      [access_token, phone_number_id, waba_id]
    );
  } finally {
    await db.close();
  }
};

const pingMeta = async ({ access_token, phone_number_id }) => {
  if (isDisabled()) return { disabled: true };
  const url = `https://graph.facebook.com/v17.0/${phone_number_id}`;
  const params = {
    access_token,
    fields: 'quality_rating,display_phone_number,account_review_status'
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const syncTemplates = async ({ access_token, waba_id }) => {
  if (isDisabled()) return [];
  const url = `https://graph.facebook.com/v17.0/${waba_id}/message_templates`;
  const params = {
    access_token,
    limit: 100
  };
  const response = await axios.get(url, { params });
  const templates = response.data.data || [];

  if (isSupabaseConfigured) {
    const payload = templates.map((template) => ({
      template_id: template.id,
      name: template.name,
      language: template.language,
      components_json: JSON.stringify(template.components || []),
      raw_json: JSON.stringify(template),
      fetched_at: new Date().toISOString()
    }));

    if (payload.length) {
      const { error: upsertError } = await supabase
        .from('templates')
        .upsert(payload, { onConflict: 'template_id' });

      if (upsertError) throw upsertError;
    }

    const { data: rows, error: selectError } = await supabase
      .from('templates')
      .select('*')
      .order('name', { ascending: true });

    if (selectError) throw selectError;
    return rows || [];
  }

  const db = openDatabase();
  try {
    for (const template of templates) {
      const existing = await db.get('SELECT id FROM templates WHERE template_id = ?', [template.id]);
      if (existing) {
        await db.run('UPDATE templates SET name = ?, language = ?, components_json = ?, raw_json = ?, fetched_at = datetime(\'now\') WHERE template_id = ?', [template.name, template.language, JSON.stringify(template.components || []), JSON.stringify(template), template.id]);
      } else {
        await db.run('INSERT INTO templates (template_id, name, language, components_json, raw_json, fetched_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))', [template.id, template.name, template.language, JSON.stringify(template.components || []), JSON.stringify(template)]);
      }
    }
    return await db.all('SELECT * FROM templates');
  } finally {
    await db.close();
  }
};

const sendWhatsAppMessage = async ({ access_token, phone_number_id, to, templateName, language = 'es', components = [] }) => {
  if (isDisabled()) {
    console.log('[meta-service] DISABLED - skipping sendWhatsAppMessage', { to, templateName, language, components });
    return { disabled: true };
  }
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
