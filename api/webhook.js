// api/webhook.js — Vercel Serverless Function
// Ruta pública: /api/webhook  (vercel.json redirige /webhook → aquí)
// Maneja verificación de Meta (GET) y mensajes de WhatsApp (POST)

const https = require('https');
const { GoogleGenAI } = require('@google/genai');

const chatSessions = {};

const SYSTEM_PROMPT = `Eres "Imago Bot", el agente virtual de Imago Fotodiseño, una agencia de diseño y marketing en Colombia.
Tu personalidad es: amable, profesional, persuasiva y con un toque creativo.
Tu objetivo es:
1. Saludar al usuario y entender su necesidad.
2. Perfilarlo: ¿es una empresa, emprendimiento o persona natural? ¿Qué servicio necesita?
3. Responder preguntas frecuentes sobre: fotografía de producto, branding, redes sociales, pauta digital, diseño gráfico.
4. Capturar sus datos de contacto (nombre, email, teléfono) cuando el interés sea claro.
Reglas:
- Responde SIEMPRE en español.
- Usa máximo 3 párrafos cortos o bullets. Sé conciso.
- Usa 1-2 emojis relevantes por respuesta, no más.
- Si preguntan por precios, di que varían y ofrece una valoración gratuita.`;

function sendWhatsAppMessage(to, text) {
    return new Promise((resolve, reject) => {
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            console.log(`[SIMULACIÓN] Respuesta a ${to}: ${text}`);
            return resolve();
        }

        const payload = JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        });

        const options = {
            hostname: 'graph.facebook.com',
            path: `/v19.0/${phoneId}/messages`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => (data += chunk));
            response.on('end', () => {
                console.log(`✅ WhatsApp enviado a ${to}: HTTP ${response.statusCode}`);
                resolve(data);
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

module.exports = async function handler(req, res) {
    const verifyToken = process.env.META_VERIFY_TOKEN;

    // ── GET: Verificación del webhook por Meta ────────────────────────────────
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Webhook verificado por Meta');
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Forbidden');
    }

    // ── POST: Recepción de mensajes de WhatsApp ───────────────────────────────
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Siempre responder 200 a Meta inmediatamente
    res.status(200).send('OK');

    try {
        const body = req.body;
        if (!body?.object) return;

        const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
        if (!messages?.length) return;

        const message = messages[0];
        const senderId = body.entry[0].changes[0].value.contacts?.[0]?.wa_id;
        const text = message.text?.body || '';

        if (!text || !senderId) return;

        console.log(`📩 WhatsApp de ${senderId}: ${text}`);

        const apiKey = process.env.GEMINI_API_KEY;
        let replyText = 'Hola, gracias por contactar a Imago. En breve te atendemos 🙌';

        if (apiKey) {
            if (!chatSessions[senderId]) chatSessions[senderId] = [];
            chatSessions[senderId].push({ role: 'user', parts: [{ text }] });
            const history = chatSessions[senderId].slice(-20);

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: SYSTEM_PROMPT },
                contents: history,
            });

            replyText = response.text;
            chatSessions[senderId].push({ role: 'model', parts: [{ text: replyText }] });
        }

        await sendWhatsAppMessage(senderId, replyText);

    } catch (error) {
        console.error('❌ Error en webhook:', error);
    }
};
