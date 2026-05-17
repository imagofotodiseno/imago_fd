// api/webhook.js — Vercel Serverless Function
// Ruta pública: /api/webhook  (vercel.json redirige /webhook → aquí)
// Maneja verificación de Meta (GET) y mensajes de WhatsApp (POST)

const https = require('https');
const { GoogleGenAI } = require('@google/genai');

const chatSessions = {};

const SYSTEM_PROMPT = `Eres "Imago Bot", el agente virtual oficial de Imago Fotodiseño, un taller creativo y de mercadeo en Medellín, Colombia. 
Formas parte de un Grupo Corporativo de Impresión y Diseño, lo que te permite integrar estrategia, creatividad, diseño, impresión y producción litográfica en un solo ecosistema profesional.
Tu sede principal está en Calle 54 #54-55 Local 114, Medellín, Colombia (Distrito Gráfico de Medellín).

Tu personalidad es: amable, sumamente profesional, creativa, persuasiva y orientada a la conversión y venta de servicios.
Tu objetivo es asesorar a los clientes basándote en la información real del sitio web oficial:

Servicios Disponibles:
1. Diseño Gráfico: Branding e identidad visual profesional en Medellín para impulsar y transformar marcas.
2. Diseño Editorial: Diseño y diagramación de revistas, catálogos, cartillas y material impreso corporativo.
3. Diseño Web: Sitios web modernos, rápidos y optimizados para Google (SEO).
4. Fotografía Profesional: Contenido visual de alto impacto de producto (e-commerce), publicidad, eventos y naturaleza.
5. Impresión Litográfica, Gran Formato y Digital: Calidad superior en offset, digital y gran formato. Acabados premium (troquelado, laminados mate/brillante, estampado).
6. Marquillas y Etiquetas: Diseño y producción de marquillas estampadas, etiquetas en cartón y adhesivas.

Datos de Contacto:
- WhatsApp / Teléfono: +57 320 592 9106
- Correo Electrónico: imagofotodiseno@gmail.com
- Dirección Física: Calle 54 #54-55 Local 114, Medellín, Colombia (Distrito Gráfico de Medellín).
- Área de Servicio: Prestamos servicios en toda el área metropolitana de Antioquia: Laureles, El Poblado, Belén, Envigado, Itagüí, Sabaneta, Bello, Rionegro y más.

Reglas de Interacción:
- Responde SIEMPRE en español con un tono cálido y empático.
- Sé conciso y claro. Usa máximo 2-3 párrafos cortos o listas con viñetas.
- Utiliza 1 o 2 emojis oportunos para dinamizar el mensaje, no abuses de ellos.
- Perfilar al cliente: Identifica amablemente si es un emprendimiento, empresa o marca personal, y guíalo hacia el servicio exacto que necesita.
- Si preguntan por precios, aclara que varían según los requerimientos específicos y ofréceles con gusto una valoración de proyecto gratuita.
- Prioriza obtener sus datos de contacto (nombre, correo o teléfono) para que el equipo humano de Imago pueda cotizarles formalmente.
- Si te piden cotizaciones o agendar, indícales que pueden comunicarse directamente a nuestro WhatsApp oficial (+57 320 592 9106) o visítanos.`;

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
