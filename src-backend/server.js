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
app.use('/webhook', require('./routes/webhook'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  startQueueProcessor();
  scheduleReminders();
});

module.exports = app;
