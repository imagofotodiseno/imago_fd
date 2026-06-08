import os
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from db.client import db_client
from services.meta_service import get_meta_config, send_whatsapp_text_message

logger = logging.getLogger(__name__)

# System Prompt oficial de Imago Bot
SYSTEM_PROMPT = """Eres "Imago Bot", el agente virtual oficial de Imago Fotodiseño, un taller creativo y de mercadeo en Medellín, Colombia. 
Formas parte de un Grupo Corporativo de Impresión y Diseño, lo que te permite integrar estrategia, creatividad, diseño, impresión y producción litográfica en un solo ecosistema profesional.
Tu sede principal está en Calle 54 #54-55 Local 114, Medellín, Colombia (Distrito Gráfico de Medellín).

Tu personalidad es: amable, sumamente profesional, creativa, persuasiva y orientada a la conversión y venta de servicios.
Tu objetivo es asesorar a los clientes basándote en la información real del sitio web oficial:

Servicios Disponibles:
1. Diseño Gráfico: Branding e identidad visual profesional en Medellín para impulsar y transformar marcas.
2. Diseño Editorial: Diseño y diagramación de revistas, catálogos, cartillas y material impreso corporativo.
3. Diseño Web: Sitios web modernos, rápidos y optimizados para Google (SEO).
4. Fotografía Profesional: Contenido visual de alto impacto de producto (e-commerce), publicidad, eventos y naturaleza.
5. Impresión Litográfica, Gran Formato y Digital: Calidad superior en offset, digital y gran formato. Acabados premium (troquelado, laminados mate/brillante, estampado).
6. Marquillas y Etiquetas: Diseño y producción de marquillas estampadas, etiquetas en cartón y adhesivas.

Datos de Contacto:
- WhatsApp / Teléfono: +57 320 592 9106
- Correo Electrónico: imagofotodiseno@gmail.com
- Dirección Física: Calle 54 #54-55 Local 114, Medellín, Colombia (Distrito Gráfico de Medellín).
- Área de Servicio: Prestamos servicios en toda el área metropolitana de Antioquia: Laureles, El Poblado, Belén, Envigado, Itagüí, Sabaneta, Bello, Rionegro y más.

Reglas de Interacción:
- Responde SIEMPRE en español con un tono cálido y empático.
- Sé conciso y claro. Usa máximo 2-3 párrafos cortos o listas con viñetas.
- Utiliza 1 o 2 emojis oportunos para dinamizar el mensaje, no abuses de ellos.
- Perfilar al cliente: Identifica amablemente si es un emprendimiento, empresa o marca personal, y guíalo hacia el servicio exacto que necesita.
- Si preguntan por precios, aclara que varían según los requerimientos específicos y ofréceles con gusto una valoración de proyecto gratuita.
- Prioriza obtener sus datos de contacto (nombre, correo o teléfono) para que el equipo humano de Imago pueda cotizarles formalmente.
- Si te piden cotizaciones o agendar, indícales que pueden comunicarse directamente a nuestro WhatsApp oficial (+57 320 592 9106) o visítanos."""

def get_gemini_api_key() -> Optional[str]:
    return os.getenv("GEMINI_API_KEY")

async def save_chat_message(sender_id: str, role: str, content: str) -> None:
    """
    Guarda el mensaje de chat en la base de datos con un límite de 800 caracteres 
    para mitigar el desperdicio de tokens (Token Management).
    """
    truncated = content[:800] if len(content) > 800 else content
    sql = """
        INSERT INTO chat_history (sender_id, role, content, timestamp)
        VALUES (?, ?, ?, datetime('now'))
    """
    await db_client.run(sql, (sender_id, role, truncated))

async def get_sliding_chat_history(sender_id: str, limit: int = 8) -> List[Dict[str, str]]:
    """
    Recupera el historial de chat persistido en base de datos limitado a los últimos N turnos
    para evitar un crecimiento desmedido de tokens.
    """
    sql = """
        SELECT role, content FROM chat_history
        WHERE sender_id = ?
        ORDER BY id DESC LIMIT ?
    """
    rows = await db_client.all(sql, (sender_id, limit))
    # Invertir el orden para devolverlo cronológico
    return list(reversed(rows))

async def handle_incoming_message(sender_id: str, text: str, channel: str) -> str:
    """
    Orquesta el flujo del mensaje entrante: recupera historial, invoca Gemini 2.5 asíncronamente
    y envía la respuesta por WhatsApp o Web.
    """
    try:
        logger.info(f"🤖 Orquestando mensaje de {channel} para {sender_id}...")
        
        # 1. Guardar mensaje del usuario
        await save_chat_message(sender_id, "user", text)
        
        # 2. Configurar la llamada a Gemini
        api_key = get_gemini_api_key()
        reply_text = ""
        
        if api_key:
            genai.configure(api_key=api_key)
            
            # Obtener historial de chat optimizado (sliding window)
            history = await get_sliding_chat_history(sender_id, limit=8)
            
            # Mapear estructura de chat al formato requerido por Gemini
            contents = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })
            
            # Instanciar modelo con instrucciones del sistema integradas
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=SYSTEM_PROMPT
            )
            
            # Ejecutar llamada asíncrona no bloqueante
            response = await model.generate_content_async(contents=contents)
            reply_text = response.text or "No se pudo obtener una respuesta válida."
        else:
            reply_text = f'Hola, soy el agente de Imago. He recibido tu mensaje: "{text}". (Nota: Falta configurar GEMINI_API_KEY en el servidor).'
            
        # 3. Guardar la respuesta generada en la base de datos
        await save_chat_message(sender_id, "model", reply_text)
        
        # 4. Responder al canal correspondiente
        if channel == "web":
            return reply_text
        elif channel == "whatsapp":
            config = await get_meta_config()
            if config.get("access_token") and config.get("phone_number_id"):
                await send_whatsapp_text_message(
                    access_token=config["access_token"],
                    phone_number_id=config["phone_number_id"],
                    to=sender_id,
                    text=reply_text
                )
            else:
                logger.warning(f"⚠️ Credenciales de Meta incompletas. Simulando respuesta de WhatsApp a {sender_id}:\n\"{reply_text}\"")
                
        return reply_text
        
    except Exception as e:
        logger.error(f"❌ Error en el orquestador: {str(e)}")
        return "Hubo un error procesando tu mensaje."
