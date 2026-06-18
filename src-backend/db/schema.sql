-- Schema inicial generado desde implementation_plan.md

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  country_code TEXT,
  name TEXT,
  var1 TEXT,
  var2 TEXT,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS meta_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT,
  phone_number_id TEXT,
  waba_id TEXT,
  last_ping_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE,
  name TEXT,
  language TEXT,
  components_json TEXT,
  raw_json TEXT,
  fetched_at DATETIME
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  mapping_json TEXT,
  rows_total INTEGER,
  rows_valid INTEGER,
  rows_invalid INTEGER,
  duplicates_count INTEGER,
  errors_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  template_id INTEGER,
  meta_template_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at DATETIME,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  contact_id INTEGER,
  phone TEXT,
  body TEXT,
  vars_json TEXT,
  status TEXT DEFAULT 'pending',
  meta_message_id TEXT,
  error_text TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  service TEXT,
  starts_at DATETIME,
  ends_at DATETIME,
  status TEXT DEFAULT 'scheduled',
  reminder_sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT,
  type TEXT,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
