const express = require('express');
const { supabase } = require('../db/client');
const { sendPendingBatch } = require('../services/pacing');

const router = express.Router();

// 1. Crear una campaña en modo borrador
router.post('/', async (req, res) => {
  const { name, templateId, meta_template_id } = req.body;
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([
        {
          name,
          template_id: templateId,
          meta_template_id: meta_template_id || null,
          status: 'draft'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ campaignId: campaign.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Programar y poner en cola los mensajes de una campaña (Inserción masiva optimizada)
router.post('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { messageBody, contactIds = [] } = req.body;

  try {
    // Verificar si la campaña existe
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    if (!contactIds.length) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un contacto' });
    }

    // Actualizar el estado de la campaña a 'running' y registrar fecha
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'running', scheduled_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    // Obtener los datos de todos los contactos seleccionados (.in maneja la lista de IDs de forma nativa)
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, phone, var1, var2')
      .in('id', contactIds);

    if (contactsError) throw contactsError;

    // Preparar el bloque de mensajes para hacer una inserción masiva (Bulk Insert)
    const messagesToInsert = contacts.map(contact => {
      const vars = { var1: contact.var1 || '', var2: contact.var2 || '' };
      return {
        campaign_id: id,
        contact_id: contact.id,
        phone: contact.phone,
        body: messageBody,
        vars_json: vars, // Supabase/PostgreSQL procesa el objeto JSON nativamente sin necesidad de JSON.stringify
        status: 'pending'
      };
    });

    // Insertar todos los mensajes en una sola consulta
    const { error: insertMessagesError } = await supabase
      .from('messages')
      .insert(messagesToInsert);

    if (insertMessagesError) throw insertMessagesError;

    res.json({ ok: true, queued: contacts.length });
    
    // Ejecutar el procesador en segundo plano
    sendPendingBatch();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Obtener métricas y estado actual de los mensajes de una campaña
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;
  try {
    // Agrupamos usando funciones de selección nativas de Supabase
    const { data: statusCounts, error } = await supabase
      .from('messages')
      .select('status')
      .eq('campaign_id', id);

    if (error) throw error;

    // Reducimos los datos para entregar exactamente el formato agrupado que el frontend requiere
    const counts = statusCounts.reduce((acc, current) => {
      const existing = acc.find(item => item.status === current.status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: current.status, count: 1 });
      }
      return acc;
    }, []);

    res.json({ status: counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;