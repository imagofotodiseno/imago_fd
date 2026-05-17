// api/chat.js — Vercel Serverless Function
// Ruta pública: /api/chat  (vercel.json redirige /api/chat/web → aquí)
// Compatible con @google/genai SDK v0.x

const { GoogleGenAI } = require('@google/genai');

// Historial en memoria por sesión (por invocación de la función)
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
