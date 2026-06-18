<<<<<<< HEAD
const express = require('express');
// Importamos el cliente de Supabase usando la propiedad exportada con CommonJS
const { supabase } = require('../db/client');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Realizamos la consulta a la tabla 'contacts' de Supabase ordenando por 'name'
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, phone, name, var1, var2')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Retornamos la respuesta en el mismo formato que esperaba tu frontend
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
=======
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { startQueueProcessor } = require('./services/pacing');
const { scheduleReminders } = require('./services/appointment-scheduler');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (Widget de Chat)
app.use(express.static(path.join(__dirname, '..', 'public')));

const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/meta', require('./routes/meta'));
app.use('/api/import', require('./routes/import'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/gemini', require('./routes/gemini'));
app.use('/api/chat', require('./routes/chat'));
app.use('/webhook', require('./routes/webhook'));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
    startQueueProcessor();
    scheduleReminders();
  });
}

module.exports = app;
>>>>>>> dad71fb8a11e88e016d890b4ddceb8ffdf989a7b
