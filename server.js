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
const path = require('path');

// Servir archivos estáticos (el widget)
app.use(express.static('public'));

// NUEVO: Servir la raíz del proyecto para que index.html y style.css funcionen
app.use(express.static(__dirname));

// NUEVO: Ruta principal que entrega tu CRM cuando visitas http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Endpoint para proxy de Gemini desde el Frontend
const { GoogleGenAI } = require('@google/genai');
app.post('/api/gemini', async (req, res) => {
    try {
        // Recibimos la apiKey del request body
        const { prompt, system, useSearch, apiKey } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Falta prompt' });

        // Priorizamos la Key del cliente (frontend), si no, usamos la del servidor (.env)
        const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!activeApiKey) {
            return res.status(500).json({ error: 'Falta GEMINI_API_KEY. Configúrala en el panel o en el archivo .env.' });
        }

        const ai = new GoogleGenAI({ apiKey: activeApiKey });
        const config = {};
        if (system) config.systemInstruction = system;
        if (useSearch) config.tools = [{ googleSearch: {} }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config
        });

        res.json({ text: response.text });
    } catch (err) {
        console.error('Error /api/gemini local:', err);
        res.status(500).json({ error: err.message || 'Error interno' });
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Agentes Imago funcionando correctamente.');
});

// Iniciar servidor
// Iniciar servidor SOLO si no estamos en un entorno Serverless (Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
        console.log(`📡 Esperando Webhooks de Meta...`);
    });
}

// ¡ESTA LÍNEA ES LA MAGIA PARA VERCEL! Exportamos la app de Express
module.exports = app;