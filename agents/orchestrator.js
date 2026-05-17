const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/genai');

// Simulación de una base de datos en memoria para guardar el historial de chats
const chatSessions = {};

// Inicializa el cliente de Gemini si la API key existe
const ai = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Función principal que orquesta qué agente debe responder
 */
async function handleIncomingMessage(senderId, text, channel) {
    try {
        console.log(`🤖 Orquestando mensaje de ${channel} para ${senderId}...`);

        // Recuperar o inicializar sesión
        if (!chatSessions[senderId]) {
            chatSessions[senderId] = [];
        }

        // Agregar el mensaje del usuario al historial
        chatSessions[senderId].push({ role: 'user', content: text });

        // Aquí iría el Router Agent: Decide quién atiende (Ventas, Soporte, Agendamiento)
        // Por simplicidad en esta versión, enviaremos todo a un Agente Estratega Unificado.
        
        let responseText = "";

        if (ai) {
            // Llamar a Gemini con el historial
            const systemPrompt = `Eres un agente de atención multicanal (WhatsApp/Instagram) para Imago Fotodiseño. 
            Eres amable, persuasivo y experto en ventas de servicios de fotografía y marketing. 
            Responde de manera concisa y clara, usando emojis apropiados.`;

            // Construir el formato que espera la nueva API de @google/genai
            // Nota: Esta es una simplificación. En un entorno real se pasaría el array de historial completo.
            const prompt = `${systemPrompt}\n\nUsuario dice: "${text}"\n\nRespuesta del agente:`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            responseText = response.text;
        } else {
            // Fallback si no hay API Key configurada
            responseText = `Hola, soy el agente de Imago. He recibido tu mensaje: "${text}". (Nota: Falta configurar GEMINI_API_KEY en el servidor).`;
        }

        // Agregar la respuesta del asistente al historial
        chatSessions[senderId].push({ role: 'assistant', content: responseText });

        // Enviar el mensaje de vuelta al usuario a través del canal correspondiente
        if (channel === 'web') {
            return responseText;
        } else {
            await sendMessage(senderId, responseText, channel);
        }

    } catch (error) {
        console.error('❌ Error en el orquestador:', error);
        return "Hubo un error procesando tu mensaje.";
    }
}

/**
 * Función para enviar el mensaje usando la API de Meta (WhatsApp Cloud API)
 */
async function sendMessage(to, text, channel) {
    if (channel !== 'whatsapp') {
        console.log(`⚠️ Envío a ${channel} no implementado aún.`);
        return;
    }

    const token = process.env.META_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.log(`⚠️ Credenciales de Meta no configuradas. Simulando envío a ${to}:\n"${text}"`);
        return;
    }

    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v19.0/${phoneId}/messages`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            }
        });
        console.log(`✅ Mensaje enviado a ${to}`);
    } catch (error) {
        console.error('❌ Error enviando mensaje por WhatsApp:', error.response ? error.response.data : error.message);
    }
}

module.exports = {
    handleIncomingMessage
};
