# 🚀 Imago Micro-CRM con Agente IA

Panel de operaciones multichannel para **Imago Fotodiseño** — IA + Inbox + CRM Kanban + WhatsApp.

---

## 📁 Estructura del Repositorio

```
imago_agente/
├── index.html                  ← App completa (Dashboard, Chat, Ads, Inbox, CRM)
├── style.css                   ← Estilos principales
├── netlify.toml                ← Configuración de Netlify (build + redirects)
├── .env.example                ← Plantilla de variables de entorno
├── package.json                ← Dependencias (para desarrollo local)
├── server.js                   ← Servidor Express (solo desarrollo local)
│
├── netlify/
│   └── functions/
│       ├── chat.js             ← Serverless: Web Chat → Gemini AI
│       └── webhook.js          ← Serverless: WhatsApp/Meta webhook
│
├── agents/
│   └── orchestrator.js         ← Agente IA (historial, Gemini, Meta API)
│
├── routes/
│   └── webhook.js              ← Rutas Express (solo local)
│
└── public/
    ├── widget.js               ← Widget de chat embebible
    └── widget.css              ← Estilos del widget
```

---

## ⚡ Despliegue en Netlify (vía GitHub)

### 1. Subir el código a GitHub

```bash
git add .
git commit -m "feat: Micro-CRM con Inbox y Kanban"
git push origin main
```

### 2. Conectar con Netlify

1. Ve a [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Selecciona **GitHub** y elige el repositorio `imagofotodiseno/imago_fd`
3. Configura el build:
   - **Base directory:** *(dejar vacío)*
   - **Build command:** *(dejar vacío — no hay proceso de build)*
   - **Publish directory:** `.`
4. Haz clic en **Deploy site**

### 3. Configurar Variables de Entorno en Netlify

Ve a: **Site settings → Environment variables → Add variable**

| Variable | Valor |
|---|---|
| `GEMINI_API_KEY` | Tu API Key de Google AI Studio |
| `META_VERIFY_TOKEN` | Token secreto que tú eliges |
| `META_ACCESS_TOKEN` | Token de acceso permanente de Meta |
| `WHATSAPP_PHONE_ID` | Phone Number ID de WhatsApp Business |

> ⚠️ **Importante:** Nunca pongas estos valores en el código ni en el repositorio.

### 4. Configurar el Webhook de WhatsApp en Meta

Una vez desplegado en Netlify:

1. Ve a [developers.facebook.com](https://developers.facebook.com) → Tu App → WhatsApp → Configuración
2. En **Webhook URL** ingresa:
   ```
   https://TU-SITIO.netlify.app/webhook
   ```
3. En **Verify Token** ingresa el mismo valor que pusiste en `META_VERIFY_TOKEN`
4. Suscríbete al evento: `messages`
5. ¡Listo! El agente IA responderá automáticamente en WhatsApp.

---

## 💻 Desarrollo Local

```bash
# 1. Clonar
git clone https://github.com/imagofotodiseno/imago_fd.git
cd imago_fd

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus keys reales

# 4. Iniciar servidor
npm run dev
# → http://localhost:3000
```

---

## 🧠 Módulos del Sistema

| Módulo | Descripción |
|---|---|
| **Panel Estratégico** | Investigación de mercado, audiencias y estrategia de contenido con Gemini + Google Search |
| **Chatbot Experto** | Chat directo con el agente de marketing |
| **Meta Ads Copywriter** | Genera copy AIDA + imagen visual con IA |
| **Inbox** | Conversaciones entrantes (WhatsApp, Instagram, Web Chat) con respuesta manual |
| **CRM Kanban** | Pipeline de leads: Nuevo → En Progreso → Cerrado, con drag & drop |
| **Widget Web** | Chat embebible en cualquier sitio, conectado al agente IA |

---

## 🔮 Próximos Pasos (Escalar)

- [ ] Conectar **Supabase** para persistencia real de leads y conversaciones
- [ ] Agregar **Instagram DMs** al webhook de Meta
- [ ] Implementar **notificaciones** (email/push) para nuevos leads
- [ ] Panel de **analíticas**: mensajes/día, tasa de conversión
- [ ] **Autenticación** básica para el panel (Netlify Identity)
