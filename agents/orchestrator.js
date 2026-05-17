const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

// Simulación de una base de datos en memoria para guardar el historial de chats
const chatSessions = {};

// Inicializa el cliente de Gemini si la API key existe
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

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
            const systemPrompt = `Eres "Imago Bot", el agente virtual oficial de Imago Fotodiseño, un taller creativo y de mercadeo en Medellín, Colombia. 
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
