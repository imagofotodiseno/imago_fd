from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from db.client import db_client
from services.phone_normalizer import normalize_phone
from services.meta_service import get_meta_config, send_whatsapp_template_message

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

class CreateAppointmentSchema(BaseModel):
    phone: str
    name: str
    service: str
    starts_at: str
    ends_at: str
    defaultCountry: Optional[str] = "+57"

@router.get("")
async def get_appointments_endpoint():
    """
    Lista las citas agendadas integrando los datos del contacto asociado.
    """
    try:
        query = """
            SELECT a.*, c.name AS contact_name, c.phone AS contact_phone, c.var1, c.var2
            FROM appointments a
            LEFT JOIN contacts c ON c.id = a.contact_id
            ORDER BY a.starts_at DESC
        """
        appointments = await db_client.all(query)
        return {"appointments": appointments}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("")
async def create_appointment_endpoint(payload: CreateAppointmentSchema):
    """
    Crea una nueva cita, resolviendo o registrando el contacto y enviando el mensaje de confirmación.
    """
    # 1. Normalizar el teléfono
    norm = normalize_phone(payload.phone, payload.defaultCountry)
    if not norm["valid"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=norm["error"])
        
    clean_phone = norm["phone"]
    
    try:
        # 2. Buscar o crear el contacto
        contact = await db_client.get("SELECT * FROM contacts WHERE phone = ?", (clean_phone,))
        if not contact:
            insert_contact_res = await db_client.run(
                """
                INSERT INTO contacts (phone, name, source, created_at, updated_at)
                VALUES (?, ?, 'appointment', datetime('now'), datetime('now'))
                """,
                (clean_phone, payload.name)
            )
            contact_id = insert_contact_res["lastID"]
        else:
            contact_id = contact["id"]
            
        # 3. Insertar la cita
        insert_app_res = await db_client.run(
            """
            INSERT INTO appointments (contact_id, service, starts_at, ends_at, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'scheduled', datetime('now'), datetime('now'))
            """,
            (contact_id, payload.service, payload.starts_at, payload.ends_at)
        )
        appointment_id = insert_app_res["lastID"]
        
        # 4. Enviar notificación de confirmación por WhatsApp en segundo plano
        config = await get_meta_config()
        if config.get("access_token") and config.get("phone_number_id"):
            components = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": payload.name},
                        {"type": "text", "text": payload.service},
                        {"type": "text", "text": payload.starts_at}
                    ]
                }
            ]
            try:
                await send_whatsapp_template_message(
                    access_token=config["access_token"],
                    phone_number_id=config["phone_number_id"],
                    to=clean_phone,
                    template_name="utility_confirmation",
                    language="es",
                    components=components
                )
            except Exception as meta_err:
                print(f"Error enviando mensaje de WhatsApp: {meta_err}")
                
        return {"appointmentId": appointment_id}
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{appointment_id}/confirm")
async def confirm_appointment_endpoint(appointment_id: int):
    """
    Confirma una cita de manera manual.
    """
    try:
        await db_client.run(
            "UPDATE appointments SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?",
            (appointment_id,)
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
