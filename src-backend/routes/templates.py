from fastapi import APIRouter, HTTPException, status
from db.client import db_client
from services.meta_service import get_meta_config, sync_templates

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.get("")
async def get_templates_endpoint():
    """
    Retorna todas las plantillas locales de mensajes.
    """
    try:
        templates = await db_client.all("SELECT * FROM templates ORDER BY name")
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/sync")
async def sync_templates_endpoint():
    """
    Sincroniza y descarga las plantillas directamente desde Meta.
    """
    try:
        config = await get_meta_config()
        if not config or not config.get("access_token") or not config.get("waba_id"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meta configuration not found or incomplete")
        templates = await sync_templates(config["access_token"], config["waba_id"])
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
