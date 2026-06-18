# Plan de Implementación — CRM Unificado (Meta Cloud / WhatsApp)

Fecha: 21 de mayo de 2026

Resumen
-------
Este documento propone la estructura de carpetas, el esquema de base de datos SQLite y las rutas de API para implementar un CRM unificado con integración a Meta Cloud (WhatsApp Business API). Está pensado para revisión y aprobación antes de generar código.

Objetivos clave
- Importador inteligente desde Excel con mapeo visual y normalización de teléfonos.
- Integración segura con Meta: validación de credenciales, sincronización de plantillas.
- Motor de envío masivo con pacing configurable y estado por mensaje.
- Agenda de citas con recordatorios automáticos por WhatsApp.
- Receptor de Webhooks para actualizar estados (entrega, lectura, respuestas).

Estructura propuesta de carpetas
-------------------------------

- / (raíz)
  - implementation_plan.md
  - setup.sh
  - package.json
  - server.js             # punto de entrada Express
  - netlify.toml / vercel.json (opcional)
  - /public               # assets públicos
  - /src-frontend         # proyecto React (Vite + Tailwind)
    - /src
      - /components
      - /pages
      - /services         # llamadas a backend
      - /hooks
      - main.jsx
    - index.html
  - /src-backend          # servidor Express
    - /controllers
    - /routes
    - /services           # lógica: meta, pacing, scheduler
    - /jobs               # workers, cron
    - /db                 # migraciones / sqlite file
    - /tests

Dependencias iniciales (sugeridas)
---------------------------------
- Backend: express, sqlite3 or better-sqlite3, knex (opcional), axios, node-cron, exceljs (o xlsx), date-fns, dotenv, pino/winston
- Frontend: react, vite, tailwindcss, react-query (opcional), xlsx (si procesamiento en cliente), chart.js or recharts

Esquema SQLite (tablas principales)
----------------------------------

-- Tabla: `contacts`
CREATE TABLE contacts (
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

-- Tabla: `meta_config`
CREATE TABLE meta_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT,
  phone_number_id TEXT,
  waba_id TEXT,
  last_ping_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: `templates`
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE,
  name TEXT,
  language TEXT,
  components_json TEXT, -- JSON con los placeholders y estructura
  raw_json TEXT,
  fetched_at DATETIME
);

-- Tabla: `import_jobs`
CREATE TABLE import_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  mapping_json TEXT, -- mapping columnas -> campos (phone,name,var1,var2)
  rows_total INTEGER,
  rows_valid INTEGER,
  rows_invalid INTEGER,
  duplicates_count INTEGER,
  errors_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: `campaigns`
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  template_id INTEGER,
  meta_template_id TEXT,
  status TEXT DEFAULT 'draft', -- draft, scheduled, running, completed
  scheduled_at DATETIME,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: `messages`
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  contact_id INTEGER,
  phone TEXT,
  body TEXT,
  vars_json TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  meta_message_id TEXT,
  error_text TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: `appointments`
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  service TEXT,
  starts_at DATETIME,
  ends_at DATETIME,
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- Tabla: `webhook_events`
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT,
  type TEXT,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

Notas de esquema
- `contacts.phone` se normaliza a E.164 preferiblemente, guardando `country_code` separado si se desea.
- `messages.vars_json` contendrá un objeto con valores para placeholders de plantilla.

Rutas de API propuestas (Express)
--------------------------------

- POST /api/import/upload
  - Recibe archivo .xlsx/.csv (multipart). Registra `import_job` y devuelve mapping provisional de columnas.

- POST /api/import/preview
  - Recibe mapping (columna->campo) y devuelve preview con validaciones (teléfonos corregidos, duplicados, inválidos).

- POST /api/import/commit
  - Confirma importación, escribe `contacts` y crea `import_job` con resultados.

- GET /api/meta/config
  - Obtiene credenciales guardadas.

- POST /api/meta/config
  - Guarda `access_token`, `phone_number_id`, `waba_id` (en `meta_config`).

- POST /api/meta/ping
  - Valida conexión contra Graph API: verifica `phone_number_id` estado, rating, límites de tier.

- POST /api/meta/templates/sync
  - Descarga plantillas aprobadas y guarda en `templates`.

- GET /api/templates
  - Lista plantillas locales con placeholders parseados.

- POST /api/campaigns
  - Crea campaña con template y listado de contactos (o filtro).

- POST /api/campaigns/:id/schedule
  - Programa la campaña; coloca mensajes en `messages` y crea colas.

- POST /api/campaigns/:id/send (internal worker)
  - Endpoint interno/worker para disparar envíos por lotes según pacing.

- GET /api/campaigns/:id/status
  - Estado y métricas (enviados, entregados, fallidos)

- POST /webhook
  - Receptor público para Webhooks de Meta. Verifica `hub.verify_token` para GET y procesa POST.

- GET /api/appointments
  - Lista citas (mes/semana/día con filtros).

- POST /api/appointments
  - Crea cita; al crear dispara envío de plantilla de confirmación (utility template).

- POST /api/appointments/:id/confirm
  - Marca cita como confirmada (invocado desde webhook al recibir 'SÍ' o Quick Reply).

Flujo de importación y normalización
------------------------------------
1. Usuario sube archivo en UI (Drag & Drop) -> /api/import/upload
2. Backend extrae columnas con `exceljs` y devuelve columnas disponibles.
3. Usuario mapea columnas a campos estándar (Teléfono, Nombre, Var1, Var2) -> /api/import/preview
4. Backend aplica limpieza:
   - Eliminar espacios, paréntesis, guiones.
   - Si no tiene prefijo '+', intentar inferir usando country default (configurable, ej. '+57').
   - Validar con regex E.164: ^\\+[1-9]\\d{7,14}$.
   - Detectar duplicados locales y marcar errores.
5. Usuario confirma y /api/import/commit persiste contactos.

Estrategia de Pacing para envíos masivos
---------------------------------------
- Configuración por campaña: `batch_size` (ej. 10), `interval_ms` (ej. 5000), `max_concurrency`.
- Worker toma mensajes `pending` ordenados por id y los envía en lotes. Tras cada lote espera `interval_ms`.
- Guardar `attempt_count`, `last_attempt_at`. Reintentos exponenciales con límite configurado.

Webhooks y actualización de estados
----------------------------------
- `/webhook` recibe eventos de mensajes: status updates, inbound messages, reactions.
- Al recibir entregas/lecturas, actualizar `messages.status`.
- Al recibir inbound con texto 'SÍ' o payload de Quick Reply 'confirm', buscar cita pendiente vinculada y cambiar su `status` a `confirmed`.

Scheduler de recordatorios (cron)
--------------------------------
- Job periódico (ej. cada 5 minutos) que:
  - Busca `appointments` con `starts_at` en 24 horas y `status = 'scheduled'`.
  - Crea mensajes usando una plantilla de recordatorio y los inserta en la cola `messages` para envío.

Seguridad y configuración
-------------------------
- Guardar `access_token` en `meta_config` (archivo .env en desarrollo). Nunca exponer token en frontend.
- Validar firma y `hub.verify_token` en `GET /webhook` según documentación de Meta.

Pruebas y validación
--------------------
- Crear tests que:
  - Verifiquen que la lectura de Excel produce el mapping correcto y normaliza teléfonos.
  - Simulen Webhook POST y verifiquen actualización de `appointments` y `messages`.
  - Validen la lógica de pacing (mock de axios para Graph API y conteo de requests).

Script de orquestación (`setup.sh`)
----------------------------------
- Instalar dependencias: `npm install` en raíz y en `src-frontend` si separamos proyectos.
- Crear archivo de base de datos SQLite `src-backend/db/database.sqlite` y ejecutar scripts SQL para crear tablas.
- Exportar variables de entorno ejemplo `.env.example`.
- Comandos para desarrollo:
  - `npm run dev:backend` -> arranca Express (puerto 3001 por ejemplo)
  - `npm run dev:frontend` -> arranca Vite (puerto 3000)

Entrega y próximos pasos
-----------------------
1) Revisar y aprobar este `implementation_plan.md`.
2) Al aprobar, procedo a scaffold del backend (Express) y crear las migraciones/tabla SQLite básicas.
3) Luego scaffold del frontend (Vite + Tailwind) con la UI del importador.

Fin del plan.
