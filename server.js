require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (el widget)
app.use(express.static('public'));

// Rutas
app.use('/webhook', webhookRoutes);

// Endpoint para el Web Widget
const { handleIncomingMessage } = require('./agents/orchestrator');
app.post('/api/chat/web', async (req, res) => {
    const { senderId, message } = req.body;
    if (!senderId || !message) return res.status(400).json({ error: 'Faltan datos' });
    
    // Llamar al orquestador (canal 'web' devolverá el texto en lugar de enviar a Meta)
    const reply = await handleIncomingMessage(senderId, message, 'web');
    res.json({ reply });
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Agentes Imago funcionando correctamente.');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`📡 Esperando Webhooks de Meta...`);
});
