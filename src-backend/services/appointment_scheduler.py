import asyncio
import logging
from db.client import db_client
from services.meta_service import get_meta_config, send_whatsapp_template_message

logger = logging.getLogger(__name__)

async def run_reminder_checks() -> None:
    """
    Busca citas programadas dentro de las próximas 24 horas y envía un recordatorio por WhatsApp.
    """
    try:
        # 1. Buscar citas aptas para recordatorio
        query = """
            SELECT a.id, a.starts_at, a.status, a.service, a.contact_id, c.name, c.phone
            FROM appointments a
            JOIN contacts c ON c.id = a.contact_id
            WHERE a.status = 'scheduled'
              AND a.starts_at > datetime('now')
              AND a.starts_at <= datetime('now', '+24 hours')
              AND (a.reminder_sent_at IS NULL OR a.reminder_sent_at < datetime('now', '-1 hour'))
        """
        appointments = await db_client.all(query)
        if not appointments:
            return
            
        # 2. Obtener credenciales de Meta
        config = await get_meta_config()
        if not config.get("access_token") or not config.get("phone_number_id"):
            logger.warning("Scheduler: Configuración de Meta incompleta. Saltando recordatorios.")
            return

        for appt in appointments:
            try:
                components = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": appt["name"] or ""},
                            {"type": "text", "text": appt["service"] or ""},
                            {"type": "text", "text": appt["starts_at"] or ""}
                        ]
                    }
                ]
                
                await send_whatsapp_template_message(
                    access_token=config["access_token"],
                    phone_number_id=config["phone_number_id"],
                    to=appt["phone"],
                    template_name="utility_reminder",
                    language="es",
                    components=components
                )
                
                # Registrar el envío del recordatorio
                await db_client.run(
                    "UPDATE appointments SET reminder_sent_at = datetime('now') WHERE id = ?",
                    (appt["id"],)
                )
                logger.info(f"✅ Recordatorio enviado para cita ID {appt['id']} del contacto {appt['phone']}")
            except Exception as appt_err:
                logger.error(f"Error enviando recordatorio para cita ID {appt['id']}: {appt_err}")
                
    except Exception as e:
        logger.error(f"Error en chequeo de recordatorios de citas: {e}")

async def scheduler_loop():
    """
    Bucle asíncronamente recurrente que verifica la agenda cada 5 minutos.
    """
    logger.info("Scheduler de recordatorios activo.")
    await asyncio.sleep(10) # Pequeño retardo inicial
    while True:
        try:
            await run_reminder_checks()
        except Exception as e:
            logger.error(f"Excepción en scheduler_loop: {e}")
        await asyncio.sleep(300) # Chequear cada 5 minutos

def schedule_reminders():
    """
    Inicia la tarea en segundo plano no bloqueante para el scheduler.
    """
    asyncio.create_task(scheduler_loop())
