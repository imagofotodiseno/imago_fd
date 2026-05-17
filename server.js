require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/webhook', webhookRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Agentes Imago funcionando correctamente.');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`📡 Esperando Webhooks de Meta...`);
});
