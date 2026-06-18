# CRM IMAGO - Guía de Instalación y Uso

## Descripción
CRM unificado con integración a Meta Cloud (WhatsApp Business API) para Imago Fotodiseño.

## Características
- 📥 Importador inteligente desde Excel con mapeo visual
- ⚙️ Integración segura con Meta Cloud
- 📧 Motor de envío masivo con pacing configurable
- 📅 Agenda de citas con recordatorios automáticos
- 🔔 Receptor de Webhooks para actualizar estados

## Requisitos
- Node.js 16+ 
- npm o yarn
- SQLite3

## Instalación

### 1. Backend

```bash
cd src-backend
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar .env con tus credenciales de Meta
# META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_WABA_ID, etc.

# Inicializar base de datos
npm run init-db

# Desarrollar
npm run dev
```

El backend estará en: `http://localhost:3001`

### 2. Frontend

```bash
cd src-frontend
npm install

# Copiar variables de entorno
cp .env.example .env

# Desarrollar
npm run dev
```

El frontend estará en: `http://localhost:5173`

## Uso

### Importar Contactos
1. Ve a "Importar Contactos"
2. Carga un archivo Excel o CSV
3. Mapea las columnas (teléfono es obligatorio)
4. Previsualiza los datos
5. Confirma la importación

### Configurar Meta
1. Ve a "Config Meta"
2. Ingresa tu Access Token, Phone Number ID y WABA ID
3. Haz clic en "Verificar Conexión"
4. Si está correcto, puedes sincronizar plantillas

### Crear Campañas
1. Ve a "Campañas"
2. Crea una nueva campaña
3. Selecciona plantilla y contactos
4. Programa el envío

### Gestionar Citas
1. Ve a "Citas"
2. Crea una nueva cita
3. Se enviará confirmación automática
4. Gestiona el estado de las citas

## Estructura de carpetas

```
imago_fd/
├── src-backend/
│   ├── db/
│   │   ├── schema.sql          # Esquema de la BD
│   │   ├── init_db.js          # Script de inicialización
│   │   └── client.js           # Cliente SQLite
│   ├── routes/                 # Rutas API
│   ├── services/               # Servicios principales
│   ├── controllers/            # Controllers (si es necesario)
│   ├── middleware/             # Middleware Express
│   ├── jobs/                   # Workers/Cron jobs
│   ├── tests/                  # Tests
│   ├── server.js               # Punto de entrada
│   └── package.json
│
├── src-frontend/
│   ├── src/
│   │   ├── pages/              # Páginas principales
│   │   ├── components/         # Componentes reutilizables
│   │   ├── services/           # Servicios API
│   │   ├── hooks/              # Custom hooks
│   │   ├── App.jsx             # Componente principal
│   │   └── main.jsx            # Punto de entrada
│   ├── vite.config.js          # Config Vite
│   └── package.json
│
├── docs/                       # Documentación
├── implementation_plan.md      # Plan de implementación
└── README.md
```

## API Endpoints

### Importación
- `POST /api/import/upload` - Subir archivo
- `POST /api/import/preview` - Previsualizar datos
- `POST /api/import/commit` - Confirmar importación

### Meta
- `GET /api/meta/config` - Obtener configuración
- `POST /api/meta/config` - Guardar configuración
- `POST /api/meta/ping` - Verificar conexión
- `POST /api/meta/templates/sync` - Sincronizar plantillas

### Contactos
- `GET /api/contacts` - Listar contactos
- `POST /api/contacts` - Crear contacto

### Campañas
- `POST /api/campaigns` - Crear campaña
- `POST /api/campaigns/:id/schedule` - Programar envío
- `GET /api/campaigns/:id/status` - Estado de campaña

### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `POST /api/appointments/:id/confirm` - Confirmar cita

### Plantillas
- `GET /api/templates` - Listar plantillas

### Webhooks
- `POST /webhook` - Receptor de webhooks de Meta

## Configuración de Webhooks en Meta

1. Ve a Meta Developer Console
2. Configura el endpoint del webhook: `https://tudominio.com/webhook`
3. Usa el `META_VERIFY_TOKEN` como token de verificación
4. Suscribete a los eventos: `message_template_status_update`, `messages`, `message_status`

## Variables de Entorno

### Backend (.env)
```
PORT=3001
META_ACCESS_TOKEN=tu_token
META_PHONE_NUMBER_ID=tu_phone_id
META_WABA_ID=tu_waba_id
META_VERIFY_TOKEN=tu_verify_token
DATABASE_URL=./db/database.sqlite
DISABLE_META=false
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

## Testing

```bash
cd src-backend
npm test
```

## Deployment

### Con Netlify/Vercel
1. El proyecto ya incluye `netlify.toml` y `vercel.json`
2. Deploy automático al pushear a main

### Manual
1. Build frontend: `npm run build` en src-frontend
2. Deploy backend a tu servidor
3. Configura variables de entorno en el servidor

## Troubleshooting

### Puerto 3001 ocupado
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Error de CORS
Asegúrate de que `src-backend/server.js` tenga CORS habilitado.

### Base de datos no inicializa
```bash
cd src-backend
npm run init-db
```

## Contacto y Soporte
Para más información sobre Meta Cloud API, visita: https://developers.facebook.com/docs/whatsapp/cloud-api

## Licencia
Privado - Imago Fotodiseño
