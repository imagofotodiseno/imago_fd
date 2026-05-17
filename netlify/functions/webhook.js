// netlify/functions/webhook.js
// Recibe eventos de WhatsApp Cloud API (Meta) y los procesa con Gemini.
// Netlify.toml redirige /webhook → aquí.

const { GoogleGenerativeAI } = require("@google/genai");
const https = require("https");

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
- Si el usuario pregunta por precios, di que varían según el proyecto y que puedes agendar una valoración gratuita.`;

// Helper para hacer HTTP requests sin axios (evitar dependencias en Netlify)
function sendWhatsAppMessage(to, text) {
  return new Promise((resolve, reject) => {
    const token = process.env.META_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.log(`[SIMULACIÓN] Respuesta a ${to}: ${text}`);
      return resolve();
    }

    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/v19.0/${phoneId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`✅ WhatsApp enviado a ${to}: ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function (event, context) {
  const verifyToken = process.env.META_VERIFY_TOKEN;

  // ── GET: Verificación del webhook por Meta ──────────────────────────────────
  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    if (
      params["hub.mode"] === "subscribe" &&
      params["hub.verify_token"] === verifyToken
    ) {
      console.log("✅ Webhook verificado por Meta");
      return { statusCode: 200, body: params["hub.challenge"] };
    }
    return { statusCode: 403, body: "Forbidden" };
  }

  // ── POST: Recepción de mensajes ─────────────────────────────────────────────
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Responder 200 inmediatamente a Meta para evitar timeouts
  // (procesamos en background)
  try {
    const body = JSON.parse(event.body || "{}");

    if (!body.object) {
      return { statusCode: 404, body: "Not a Meta event" };
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const messages = change?.value?.messages;

    if (!messages || messages.length === 0) {
      // Evento de estado (leído, entregado) — ignorar
      return { statusCode: 200, body: "OK" };
    }

    const message = messages[0];
    const senderId = change.value.contacts?.[0]?.wa_id;
    const text = message.text?.body || "";

    if (!text || !senderId) {
      return { statusCode: 200, body: "OK" };
    }

    console.log(`📩 WhatsApp de ${senderId}: ${text}`);

    // Inicializar historial
    if (!chatSessions[senderId]) {
      chatSessions[senderId] = [];
    }
    chatSessions[senderId].push({ role: "user", parts: [{ text }] });

    const apiKey = process.env.GEMINI_API_KEY;
    let replyText = "Hola, gracias por contactar a Imago. En breve te atendemos 🙌";

    if (apiKey) {
      const ai = new GoogleGenerativeAI({ apiKey });
      const history = chatSessions[senderId].slice(-20);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: { systemInstruction: SYSTEM_PROMPT },
        contents: history,
      });

      replyText = response.text;
      chatSessions[senderId].push({ role: "model", parts: [{ text: replyText }] });
    }

    await sendWhatsAppMessage(senderId, replyText);

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    return { statusCode: 200, body: "OK" }; // Siempre 200 a Meta
  }
};
