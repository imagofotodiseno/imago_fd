import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai

router = APIRouter(prefix="/api/gemini", tags=["gemini"])

class GeminiPromptSchema(BaseModel):
    prompt: str
    system: Optional[str] = None
    useSearch: Optional[bool] = False

@router.post("")
async def generate_gemini_content(payload: GeminiPromptSchema):
    """
    Ruta Proxy que procesa peticiones directas de IA para el frontend.
    Opcionalmente activa la búsqueda integrada de Google (Google Search Grounding).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El agente no está configurado. Falta la GEMINI_API_KEY en el servidor."
        )
        
    try:
        genai.configure(api_key=api_key)
        
        # Configurar las herramientas y parámetros de generación
        tools = "google_search" if payload.useSearch else None
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=payload.system,
            tools=tools
        )
        
        # Ejecutar generación asíncrona
        response = await model.generate_content_async(contents=payload.prompt)
        return {"text": response.text or ""}
    except Exception as e:
        print(f"Error en proxy backend de Gemini: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e) or "Error interno al generar contenido"
        )
