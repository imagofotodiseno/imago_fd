// netlify/functions/chat.js
// Equivale al endpoint POST /api/chat/web en el servidor Express local.
// Se activa automáticamente en Netlify en la ruta /.netlify/functions/chat
// El netlify.toml redirige /api/chat/web → aquí.

const { GoogleGenAI } = require("@google/genai");

// Historial en memoria (por invocación). En producción escalar a Supabase/Redis.
const chatSessions = {};

const SYSTEM_PROMPT = `Eres "Imago Bot", el agente virtual oficial de Imago Fotodiseño, un taller creativo y de mercadeo en Medellín, Colombia. 
Formas parte de un Grupo Corporativo de Impresión y Diseño, lo que te permite integrar estrategia, creatividad, diseño, impresión y producción litográfica en un solo ecosistema profesional.
Tu sede principal está en Calle 54 #54-55 Local 114, Medellín, Colombia (Distrito Gráfico de Medellín).

Tu personalidad es: amable, sumamente profesional, creativa, persuasiva y orientada a la conversión and venta de servicios.
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
    const ai = new GoogleGenAI({ apiKey });
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
