import asyncio
import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Diccionario global para guardar el estado del análisis
# NOTA: Si usas múltiples instancias serverless, lo ideal será guardar esto 
# usando tu 'db_client' que vi en init_db.py
tareas_estado = {}

class QueryPayload(BaseModel):
    query: str

async def ejecutar_analisis_ia_pesado(task_id: str, query: str):
    try:
        # Aquí va tu lógica actual que llama a Gemini y busca en Google
        # Simulamos la espera de la API que tarda más de 10 segundos:
        await asyncio.sleep(12) 
        
        resultado_ia = f"Análisis estratégico completado para: {query}. Tendencias GEO/SEO validadas."
        
        # Guardamos el resultado exitoso
        tareas_estado[task_id] = {"status": "success", "data": resultado_ia}
    except Exception as e:
        tareas_estado[task_id] = {"status": "failed", "error": str(e)}

@router.post("/api/gemini/analizar")
async def analizar_tendencias(payload: QueryPayload, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tareas_estado[task_id] = {"status": "processing", "data": None}
    
    # Dispara la tarea de fondo de inmediato y libera a Vercel
    background_tasks.add_task(ejecutar_analisis_ia_pesado, task_id, payload.query)
    
    # Retorna un código 202 (Accepted) al frontend en milisegundos
    return {"status": "processing", "task_id": task_id}

@router.get("/api/gemini/status/{task_id}")
async def obtener_status_ia(task_id: str):
    estado = tareas_estado.get(task_id)
    if not estado:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return estado