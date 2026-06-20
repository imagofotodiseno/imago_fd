const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Almacenar contexto de conversaciones en memoria (máximo 20 últimos mensajes por sesión)
const conversaciones = new Map();

router.post('/web', async (req, res) => {
  const { senderId, message, apiKey } = req.body;
  
  if (!senderId || !message) {
    return res.status(400).json({ error: 'Faltan datos (senderId o message)' });
  }

  try {
    // Obtener o crear historial de conversación
    if (!conversaciones.has(senderId)) {
      conversaciones.set(senderId, []);
    }
    
    const historial = conversaciones.get(senderId);
    historial.push({ role: 'user', content: message });
    
    // Limitar a últimos 20 mensajes para no saturar token limit
    if (historial.length > 20) {
      historial.shift();
    }

    // Preparar contexto de conversación
    const contextoPrevio = historial
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n\n');

    // Llamar a Gemini
    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const ai = new GoogleGenAI({ apiKey: activeApiKey });
    const systemPrompt = `Eres el Agente Estratega Imago, especialista en marketing digital, diseño gráfico, fotografía y redes sociales para Imago Fotodiseño. 
Responde siempre en español, sé conciso pero profesional, da recomendaciones accionables.
Contexto previo de la conversación:
${contextoPrevio || 'Primera pregunta del usuario'}\n\nMensaje actual del usuario: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const reply = response.text || 'Disculpa, no pude generar una respuesta.';
    
    // Guardar respuesta en historial
    historial.push({ role: 'assistant', content: reply });

    // Limpiar sesiones antiguas (más de 1 hora)
    const ahora = Date.now();
    for (const [id, hist] of conversaciones.entries()) {
      if (hist._createdAt && ahora - hist._createdAt > 3600000) {
        conversaciones.delete(id);
      }
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat/web:', error);
    res.status(500).json({ error: `Error: ${error.message || 'No se pudo procesar el mensaje'}` });
  }
});

module.exports = router;
