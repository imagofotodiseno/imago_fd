// netlify/functions/chat.js
// Equivale al endpoint POST /api/chat/web en el servidor Express local.
// Se activa automáticamente en Netlify en la ruta /.netlify/functions/chat
// El netlify.toml redirige /api/chat/web → aquí.

const { GoogleGenerativeAI } = require("@google/genai");

// Historial en memoria (por invocación). En producción escalar a Supabase/Redis.
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

exports.handler = async function (event, context) {
  // Solo acepta POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // CORS headers para el widget incrustado en otros dominios
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { senderId, message } = JSON.parse(event.body || "{}");

    if (!senderId || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Faltan campos: senderId y message son requeridos." }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ reply: "El agente no está configurado. Falta la GEMINI_API_KEY." }),
      };
    }

    // Inicializar historial de sesión
    if (!chatSessions[senderId]) {
      chatSessions[senderId] = [];
    }

    // Agregar mensaje del usuario
    chatSessions[senderId].push({ role: "user", parts: [{ text: message }] });

    // Limitar historial a los últimos 20 turnos para no exceder tokens
    const history = chatSessions[senderId].slice(-20);

    // Llamar a Gemini
    const ai = new GoogleGenerativeAI({ apiKey });
    const model = ai.models;

    // Formato de la API de Gemini con historial y system instruction
    const geminiPayload = {
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      contents: history,
    };

    const response = await model.generateContent(geminiPayload);
    const replyText = response.text;

    // Guardar respuesta en historial
    chatSessions[senderId].push({ role: "model", parts: [{ text: replyText }] });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: replyText }),
    };
  } catch (error) {
    console.error("Error en la función chat:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ reply: "Hubo un error interno. Por favor intenta de nuevo." }),
    };
  }
};
