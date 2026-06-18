from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from services.meta_service import get_meta_config, save_meta_config, ping_meta, sync_templates

router = APIRouter(prefix="/api/meta", tags=["meta"])

class MetaConfigSchema(BaseModel):
    access_token: str
    phone_number_id: str
    waba_id: str

@router.get("/config")
async def get_config():
    try:
        config = await get_meta_config()
        # Eliminar sensible token de las respuestas directas si es necesario,
        # pero para el panel de configuración el frontend espera las llaves (enmascaradas en UI).
        return config
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/config")
async def save_config(payload: MetaConfigSchema):
    try:
        await save_meta_config(payload.access_token, payload.phone_number_id, payload.waba_id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/ping")
async def ping_endpoint():
    try:
        config = await get_meta_config()
        if not config.get("access_token") or not config.get("phone_number_id"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meta configuration incomplete")
        result = await ping_meta(config["access_token"], config["phone_number_id"])
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/templates/sync")
async def templates_sync_endpoint():
    try:
        config = await get_meta_config()
        if not config.get("access_token") or not config.get("waba_id"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meta configuration incomplete")
        templates = await sync_templates(config["access_token"], config["waba_id"])
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
