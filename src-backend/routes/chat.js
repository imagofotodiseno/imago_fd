const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../../agents/orchestrator');

<<<<<<< HEAD
// Ruta para interactuar desde el chat web o panel de control
router.post('/web', async (req, res) => {
  const { senderId, message } = req.body;
  
=======
router.post('/web', async (req, res) => {
  const { senderId, message } = req.body;
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
  if (!senderId || !message) {
    return res.status(400).json({ error: 'Faltan datos (senderId o message)' });
  }

  try {
<<<<<<< HEAD
    // El canal 'web' delega el procesamiento al orquestador y devuelve la respuesta del agente
=======
    // El canal 'web' devuelve el texto en lugar de intentar llamar a la API de Meta
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
    const reply = await handleIncomingMessage(senderId, message, 'web');
    res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat/web backend route:', error);
    res.status(500).json({ error: 'Error procesando el mensaje del chat' });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
