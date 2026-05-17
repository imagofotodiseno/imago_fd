// api/chat.js — Vercel Serverless Function
// Ruta pública: /api/chat  (vercel.json redirige /api/chat/web → aquí)
// Compatible con @google/genai SDK v0.x

const { GoogleGenAI } = require('@google/genai');

// Historial en memoria por sesión (por invocación de la función)
const chatSessions = {};

const SYSTEM_PROMPT = `Eres "Imago Bot", el agente virtual de Imago Fotodiseño, una agencia de diseño y marketing en Colombia.
Tu personalidad es: amable, profesional, persuasiva y con un toque creativo.
Tu objetivo es:
1. Saludar al usuario y entender su necesidad.
2. Perfilarlo: ¿es una empresa, emprendimiento o persona natural? ¿Qué servicio necesita?
3. Responder preguntas frecuentes sobre: fotografía de producto, branding, redes sociales, pauta digital, diseño gráfico.
4. Capturar sus datos de contacto (nombre, email, teléfono) cuando el interés sea claro.
5. Agendar una llamada o enviar al equipo humano si el lead está calificado.
Reglas:
- Responde SIEMPRE en español.
- Usa máximo 3 párrafos cortos o una lista de bullets. Sé conciso.
- Usa 1-2 emojis relevantes por respuesta, no más.
- Si el usuario pregunta por precios, di que varían según el proyecto y que puedes agendar una valoración gratuita.
- Si ya tienes nombre y contacto, confírmalo amablemente en lugar de pedirlo de nuevo.`;

module.exports = async function handler(req, res) {
    // CORS — permite que el widget funcione desde cualquier dominio
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { senderId, message } = req.body;

        if (!senderId || !message) {
            return res.status(400).json({ error: 'Faltan campos requeridos: senderId y message.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ reply: 'El agente no está configurado. Falta la GEMINI_API_KEY en las variables de entorno.' });
        }

        // Inicializar o recuperar historial de sesión
        if (!chatSessions[senderId]) {
            chatSessions[senderId] = [];
        }
        chatSessions[senderId].push({ role: 'user', parts: [{ text: message }] });

        // Limitar a los últimos 20 turnos para no exceder el límite de tokens
        const history = chatSessions[senderId].slice(-20);

        // Llamar a Gemini
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: SYSTEM_PROMPT },
            contents: history,
        });

        const replyText = response.text;
        chatSessions[senderId].push({ role: 'model', parts: [{ text: replyText }] });

        return res.status(200).json({ reply: replyText });

    } catch (error) {
        console.error('Error en /api/chat:', error);
        return res.status(500).json({ reply: 'Hubo un error interno. Por favor intenta de nuevo.' });
    }
};
