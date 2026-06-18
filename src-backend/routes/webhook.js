const express = require('express');
const router = express.Router();
const { supabase } = require('../db/client');
const { handleIncomingMessage } = require('../../agents/orchestrator');

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'change_me';

const normalizeResponseText = (text) => {
  if (!text) return '';
  return text.toString().trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
};

// 1. Endpoint de verificación de Meta (GET) - Se mantiene igual
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

// 2. Recepción de eventos del Webhook (POST) - Migrado a Supabase
router.post('/', async (req, res) => {
  const body = req.body;

  try {
    // Guardar el log del evento crudo en Supabase
    const { error: logError } = await supabase
      .from('webhook_events')
      .insert([{ raw_json: body, type: 'meta_webhook' }]);

    if (logError) console.error('Error insertando webhook_event:', logError);

    const entries = body.entry || [];
    
    // Iteramos sobre los datos recibidos
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const messages = change.value?.messages || [];
        
        for (const message of messages) {
          const from = message.from;
          const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
          
          // Si es un mensaje de texto entrante y no una actualización de estado
          if (text && !message.status) {
            handleIncomingMessage(from, text, 'whatsapp')
              .catch(err => console.error('Error en el agente del webhook handler:', err));
          }

          // Validación de palabras clave para confirmación automática de citas
          const normalized = normalizeResponseText(text);
          const confirmationKeywords = ['SI', 'SÍ', 'CONFIRMAR', 'ACEPTAR'];
          
          if (confirmationKeywords.includes(normalized)) {
            // Buscamos el contacto por teléfono en Supabase
            const { data: contact, error: contactError } = await supabase
              .from('contacts')
              .select('id')
              .eq('phone', from)
              .maybeSingle();

            if (!contactError && contact) {
              // Actualizamos el estado de la cita programada (scheduled) a confirmada (confirmed)
              await supabase
                .from('appointments')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('contact_id', contact.id)
                .eq('status', 'scheduled');
            }
          }

          // Si el webhook reporta un cambio de estado del mensaje enviado (sent, delivered, read)
          if (message.status) {
            await supabase
              .from('messages')
              .update({ status: message.status })
              .eq('meta_message_id', message.id);
          }
        }
      }
    }

    // Respondemos inmediatamente a Meta con un 200 OK para evitar reintentos duplicados
    res.sendStatus(200);

  } catch (err) {
    console.error('Error general procesando webhook event:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;