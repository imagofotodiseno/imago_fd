# Imago Social Agent - Backend Multicanal

Este proyecto ahora incluye un servidor Node.js que permite la integración con **WhatsApp, Instagram y Facebook Messenger** a través de la API oficial de Meta (Graph API).

## Requisitos Previos
1. Instalar [Node.js](https://nodejs.org/).
2. Crear una cuenta en [Meta for Developers](https://developers.facebook.com/).
3. Configurar una App de WhatsApp e Instagram para obtener los Tokens.

## Instalación y Ejecución

1. Abre una terminal en esta carpeta.
2. Ejecuta `npm install` para instalar las dependencias (Express, Axios, Google GenAI).
3. Renombra el archivo `.env.example` a `.env` y coloca ahí tus API Keys reales.
4. Ejecuta el servidor con el comando:
   ```bash
   npm start
   ```

## Configuración de Webhooks en Meta
- Tu servidor debe estar corriendo (puerto 3000 por defecto).
- Para pruebas locales, usa `ngrok` para exponer tu puerto 3000: `ngrok http 3000`.
- En el panel de Meta, configura el Webhook apuntando a tu URL de ngrok (ej: `https://tu-url.ngrok-free.app/webhook`).
- El "Verify Token" que pongas en Meta debe coincidir con el que configuraste en tu archivo `.env`.

## Arquitectura de Agentes
El archivo principal de lógica está en `agents/orchestrator.js`.
Por ahora, un solo agente maestro (Gemini) recibe el contexto de WhatsApp/IG y responde de forma persuasiva para ventas y soporte de Imago Fotodiseño.
