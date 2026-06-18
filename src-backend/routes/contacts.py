from fastapi import APIRouter, HTTPException, status
from db.client import db_client

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

@router.get("")
async def get_contacts_endpoint():
    """
    Retorna el listado completo de contactos registrados en el CRM.
    Incluye campos de auditoría como el origen de importación (source) y fecha de creación.
    """
    try:
        contacts = await db_client.all(
            "SELECT id, phone, name, var1, var2, source, created_at FROM contacts ORDER BY name"
        )
        return {"contacts": contacts}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
