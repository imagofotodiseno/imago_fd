const express = require('express');
const { supabase } = require('../db/client');
const { getMetaConfig, sendWhatsAppMessage } = require('../services/meta-service');
const { normalizePhone } = require('../services/phone-normalizer');

const router = express.Router();

// 1. Obtener todas las citas (con JOIN de contactos)
router.get('/', async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        contacts (
          name,
          phone,
          var1,
          var2
        )
      `)
      .order('starts_at', { ascending: false });

    if (error) throw error;

    // Aplanamos la respuesta para mantener la compatibilidad con tu estructura anterior
    const formattedAppointments = appointments.map(app => ({
      ...app,
      contact_name: app.contacts ? app.contacts.name : null,
      contact_phone: app.contacts ? app.contacts.phone : null,
      var1: app.contacts ? app.contacts.var1 : null,
      var2: app.contacts ? app.contacts.var2 : null
    }));

    res.json({ appointments: formattedAppointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear una nueva cita (e insertar contacto si no existe)
router.post('/', async (req, res) => {
  const { phone, name, service, starts_at, ends_at, defaultCountry } = req.body;
  const normalized = normalizePhone(phone, defaultCountry || '+57');
  
  if (!normalized.valid) {
    return res.status(400).json({ error: normalized.error });
  }
  
  const cleanPhone = normalized.phone;

  try {
    // Buscar si el contacto ya existe por su teléfono
    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle(); // Retorna null si no encuentra filas en vez de lanzar error

    if (contactError) throw contactError;

    // Si no existe, lo creamos
    if (!contact) {
      const { data: newContact, error: insertContactError } = await supabase
        .from('contacts')
        .insert([{ phone: cleanPhone, name, source: 'appointment' }])
        .select()
        .single();

      if (insertContactError) throw insertContactError;
      contact = newContact;
    }

    // Insertar la cita asignando el contact_id correspondiente
    const { data: newAppointment, error: appError } = await supabase
      .from('appointments')
      .insert([
        {
          contact_id: contact.id,
          service,
          starts_at,
          ends_at,
          status: 'scheduled'
        }
      ])
      .select()
      .single();

    if (appError) throw appError;

    // Enviar notificación por WhatsApp
    const config = await getMetaConfig();
    await sendWhatsAppMessage({
      access_token: config.access_token,
      phone_number_id: config.phone_number_id,
      to: cleanPhone,
      templateName: 'utility_confirmation',
      language: 'es',
      components: [
        { 
          type: 'body', 
          parameters: [
            { type: 'text', text: name }, 
            { type: 'text', text: service }, 
            { type: 'text', text: starts_at }
          ] 
        }
      ]
    });

    res.json({ appointmentId: newAppointment.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Confirmar una cita cambiándole el estado
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;