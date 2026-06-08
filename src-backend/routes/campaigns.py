import json
import asyncio
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from db.client import db_client

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

class CreateCampaignSchema(BaseModel):
    name: str
    templateId: str
    meta_template_id: Optional[str] = None

class ScheduleCampaignSchema(BaseModel):
    messageBody: str
    contactIds: List[int]

@router.post("")
async def create_campaign_endpoint(payload: CreateCampaignSchema):
    """
    Crea un borrador de campaña publicitaria.
    """
    try:
        sql = """
            INSERT INTO campaigns (name, template_id, meta_template_id, status, created_at)
            VALUES (?, ?, ?, 'draft', datetime('now'))
        """
        result = await db_client.run(sql, (payload.name, payload.templateId, payload.meta_template_id))
        return {"campaignId": result["lastID"]}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{campaign_id}/schedule")
async def schedule_campaign_endpoint(campaign_id: int, payload: ScheduleCampaignSchema):
    """
    Programa y encola los mensajes masivos de la campaña para envío con pacing.
    """
    try:
        # 1. Validar la campaña
        campaign = await db_client.get("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaña no encontrada")
            
        if not payload.contactIds:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe seleccionar al menos un contacto")
            
        # 2. Actualizar estado de campaña a en curso (running)
        await db_client.run(
            "UPDATE campaigns SET status = 'running', scheduled_at = datetime('now') WHERE id = ?", 
            (campaign_id,)
        )
        
        # 3. Obtener contactos seleccionados
        placeholders = ",".join("?" for _ in payload.contactIds)
        contacts_query = f"SELECT id, phone, var1, var2 FROM contacts WHERE id IN ({placeholders})"
        contacts = await db_client.all(contacts_query, tuple(payload.contactIds))
        
        # 4. Insertar mensajes pendientes en lote
        insert_msg_sql = """
            INSERT INTO messages (campaign_id, contact_id, phone, body, vars_json, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
        """
        
        batch_params = []
        for contact in contacts:
            vars_dict = {
                "var1": contact.get("var1") or "",
                "var2": contact.get("var2") or ""
            }
            batch_params.append((
                campaign_id,
                contact["id"],
                contact["phone"],
                payload.messageBody,
                json.dumps(vars_dict)
            ))
            
        if batch_params:
            await db_client.executemany(insert_msg_sql, batch_params)
            
        # 5. Ejecutar procesador de envíos de forma no bloqueante (asyncio task)
        from services.pacing import send_pending_batch
        asyncio.create_task(send_pending_batch())
        
        return {"ok": True, "queued": len(contacts)}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{campaign_id}/status")
async def get_campaign_status_endpoint(campaign_id: int):
    """
    Retorna métricas de entrega de los mensajes vinculados a la campaña.
    """
    try:
        status_counts = await db_client.all(
            "SELECT status, COUNT(*) as count FROM messages WHERE campaign_id = ? GROUP BY status",
            (campaign_id,)
        )
        return {"status": status_counts}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
