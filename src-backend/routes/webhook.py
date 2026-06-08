import os
import json
import logging
from fastapi import APIRouter, Request, Response, BackgroundTasks, HTTPException, status
from db.client import db_client
from agents.orchestrator import handle_incoming_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])

VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "change_me")

def normalize_response_text(text: str) -> str:
    """
    Normaliza el texto del mensaje para simplificar la comparación de palabras clave.
    """
    if not text:
        return ""
    s = text.strip().upper()
    return "".join(c for c in s if c.isalnum() or c == " ")

async def process_webhook_payload(body: dict):
    """
    Procesador del Webhook en segundo plano (Background Task).
    Garantiza respuestas de baja latencia a Meta y previene problemas de timeout.
    """
    try:
        # 1. Guardar evento de webhook
        await db_client.run(
            "INSERT INTO webhook_events (raw_json, type, received_at) VALUES (?, 'meta_webhook', datetime('now'))",
            (json.dumps(body),)
        )
        
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                for message in messages:
                    sender_id = message.get("from")
                    
                    # Extraer el texto
                    text = (
                        message.get("text", {}).get("body", "") or 
                        message.get("button", {}).get("text", "") or 
                        message.get("interactive", {}).get("button_reply", {}).get("title", "") or 
                        message.get("interactive", {}).get("list_reply", {}).get("title", "")
                    )
                    
                    message_status = message.get("status")
                    message_id = message.get("id")
                    
                    # Manejar reportes de estado (entregado, leído, etc.)
                    if message_status and message_id:
                        await db_client.run(
                            "UPDATE messages SET status = ?, last_attempt_at = datetime('now') WHERE meta_message_id = ?",
                            (message_status, message_id)
                        )
                        continue
                        
                    # Procesar nuevo mensaje recibido del cliente
                    if text and not message_status:
                        # Iniciar orquestador de bot asíncronamente
                        await handle_incoming_message(sender_id, text, "whatsapp")
                        
                        # Validar palabras de confirmación de cita
                        normalized = normalize_response_text(text)
                        confirmation_keywords = ["SI", "SÍ", "CONFIRMAR", "ACEPTAR"]
                        if any(kw in normalized for kw in confirmation_keywords):
                            contact = await db_client.get("SELECT id FROM contacts WHERE phone = ?", (sender_id,))
                            if contact:
                                await db_client.run(
                                    """
                                    UPDATE appointments 
                                    SET status = 'confirmed', updated_at = datetime('now') 
                                    WHERE contact_id = ? AND status = 'scheduled'
                                    """,
                                    (contact["id"],)
                                )
    except Exception as e:
        logger.error(f"Error procesando webhook de Meta en segundo plano: {e}")

@router.get("")
async def verify_webhook(request: Request):
    """
    Endpoint de verificación GET requerido por Meta para validar el webhook.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    if mode and token:
        if mode == "subscribe" and token == VERIFY_TOKEN:
            logger.info("✅ Webhook verificado correctamente por Meta")
            return Response(content=challenge, media_type="text/plain")
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verificación fallida")
            
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solicitud incorrecta")

@router.post("")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receptor de eventos del webhook de Meta (POST).
    Retorna 200 OK inmediatamente y delega el procesamiento a BackgroundTasks.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="JSON no válido")
        
    # Encolar la tarea en segundo plano no bloqueante
    background_tasks.add_task(process_webhook_payload, body)
    return {"status": "ok"}
