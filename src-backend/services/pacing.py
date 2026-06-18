import json
import asyncio
import logging
from typing import List, Dict, Any
from db.client import db_client
from services.meta_service import get_meta_config, send_whatsapp_template_message

logger = logging.getLogger(__name__)

is_processing = False
DEFAULT_BATCH_SIZE = 10
DEFAULT_INTERVAL_SECONDS = 5.0

async def send_pending_batch() -> None:
    """
    Recupera los mensajes pendientes e intenta enviarlos asíncronamente respetando el pacing.
    """
    global is_processing
    if is_processing:
        return
        
    is_processing = True
    try:
        # 1. Recuperar mensajes pendientes
        messages = await db_client.all(
            "SELECT * FROM messages WHERE status = 'pending' ORDER BY created_at LIMIT ?",
            (DEFAULT_BATCH_SIZE,)
        )
        if not messages:
            return
            
        # 2. Cargar credenciales de Meta
        config = await get_meta_config()
        if not config.get("access_token") or not config.get("phone_number_id"):
            logger.warning("Pacing: Configuración de Meta incompleta. Saltando lote de envío.")
            return

        async def send_single_message(message: Dict[str, Any]):
            try:
                template_components = []
                if message.get("vars_json"):
                    vars_dict = json.loads(message["vars_json"])
                    parameters = [{"type": "text", "text": val} for val in vars_dict.values()]
                    template_components.append({
                        "type": "body",
                        "parameters": parameters
                    })
                
                template_name = message.get("body") or "default_template"
                
                result = await send_whatsapp_template_message(
                    access_token=config["access_token"],
                    phone_number_id=config["phone_number_id"],
                    to=message["phone"],
                    template_name=template_name,
                    components=template_components
                )
                
                meta_id = None
                if result and "messages" in result and len(result["messages"]) > 0:
                    meta_id = result["messages"][0].get("id")
                    
                await db_client.run(
                    """
                    UPDATE messages 
                    SET status = 'sent', meta_message_id = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime('now') 
                    WHERE id = ?
                    """,
                    (meta_id, message["id"])
                )
            except Exception as err:
                logger.error(f"Error enviando mensaje {message['id']} en pacing: {err}")
                await db_client.run(
                    """
                    UPDATE messages 
                    SET status = 'failed', error_text = ?, attempt_count = attempt_count + 1, last_attempt_at = datetime('now') 
                    WHERE id = ?
                    """,
                    (str(err), message["id"])
                )

        # 3. Disparar los envíos en paralelo de forma asíncrona
        await asyncio.gather(*(send_single_message(m) for m in messages))
        
    except Exception as e:
        logger.error(f"Error en procesador de lotes de pacing: {e}")
    finally:
        is_processing = False

async def pacing_worker_loop():
    """
    Bucle infinito en segundo plano que corre de forma no bloqueante.
    """
    logger.info("Cola de pacing iniciada exitosamente.")
    while True:
        try:
            await send_pending_batch()
        except Exception as e:
            logger.error(f"Excepción en bucle pacing_worker_loop: {e}")
        await asyncio.sleep(DEFAULT_INTERVAL_SECONDS)

def start_queue_processor():
    """
    Arranca la tarea en segundo plano no bloqueante para el procesador de envíos masivos.
    """
    asyncio.create_task(pacing_worker_loop())
