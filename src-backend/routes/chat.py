from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from agents.orchestrator import handle_incoming_message

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatWebSchema(BaseModel):
    senderId: str
    message: str

@router.post("/web")
async def chat_web_endpoint(payload: ChatWebSchema):
    """
    Ruta para el widget de chat del sitio web.
    Devuelve la respuesta del modelo Gemini sin interactuar con WhatsApp Cloud API.
    """
    try:
        reply = await handle_incoming_message(payload.senderId, payload.message, "web")
        return {"reply": reply}
    except Exception as e:
        print(f"Error en ruta backend de chat web: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando el mensaje del chat"
        )
