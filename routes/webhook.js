const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../agents/orchestrator');

// Validación del Webhook (Requerido por Meta)
router.get('/', (req, res) => {
    const verify_token = process.env.META_VERIFY_TOKEN;

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === verify_token) {
            console.log('✅ Webhook verificado correctamente por Meta');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.status(400).send('Bad Request');
    }
});

// Recepción de mensajes (WhatsApp / Messenger / Instagram)
router.post('/', async (req, res) => {
    try {
        let body = req.body;

        // Meta siempre envía el body con el objeto `object` (whatsapp_business_account, page, instagram)
        if (body.object) {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                
                // Extraer información del mensaje
                const message = body.entry[0].changes[0].value.messages[0];
                const senderId = body.entry[0].changes[0].value.contacts[0].wa_id; // Para WhatsApp
                const text = message.text ? message.text.body : '';

                console.log(`📩 Mensaje recibido de ${senderId}: ${text}`);

                // Responder a Meta rápidamente para evitar timeouts
                res.sendStatus(200);

                // Enviar el mensaje al orquestador de agentes
                if (text) {
                    await handleIncomingMessage(senderId, text, 'whatsapp');
                }
            } else {
                res.sendStatus(200); // Es un evento diferente (status de lectura, entrega, etc.)
            }
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('❌ Error procesando el webhook:', error);
        res.sendStatus(500);
    }
});

module.exports = router;
