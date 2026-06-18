const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../../agents/orchestrator');

// Ruta para interactuar desde el chat web o panel de control
router.post('/web', async (req, res) => {
  const { senderId, message } = req.body;
  
  if (!senderId || !message) {
    return res.status(400).json({ error: 'Faltan datos (senderId o message)' });
  }

  try {
    // El canal 'web' delega el procesamiento al orquestador y devuelve la respuesta del agente
    const reply = await handleIncomingMessage(senderId, message, 'web');
    res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat/web backend route:', error);
    res.status(500).json({ error: 'Error procesando el mensaje del chat' });
  }
});

module.exports = router;