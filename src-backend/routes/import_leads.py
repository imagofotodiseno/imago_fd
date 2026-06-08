import os
import time
from fastapi import APIRouter, HTTPException, UploadFile, File, status, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from services.excel_import import extract_headers, preview_import, commit_import, UPLOAD_DIR

router = APIRouter(prefix="/api/import", tags=["import"])

class PreviewCommitSchema(BaseModel):
    filePath: str
    mapping: Dict[str, Any]
    defaultCountry: Optional[str] = "+57"

@router.post("/upload")
async def upload_file_endpoint(file: UploadFile = File(...)):
    """
    Recibe un archivo Excel/CSV, lo guarda de forma temporal y extrae sus encabezados.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".xlsx", ".csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Formato de archivo no soportado. Por favor use .xlsx o .csv"
        )
        
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{int(time.time())}-{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        headers = extract_headers(file_path)
        return {
            "filePath": file_path,
            "headers": headers,
            "originalname": file.filename
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/preview")
async def preview_endpoint(payload: PreviewCommitSchema):
    """
    Previsualiza los registros mapeados del archivo antes de persistirlos.
    """
    try:
        if not os.path.exists(payload.filePath):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo temporal no encontrado")
        preview = await preview_import(payload.filePath, payload.mapping, payload.defaultCountry)
        return preview
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/commit")
async def commit_endpoint(payload: PreviewCommitSchema, background_tasks: BackgroundTasks):
    """
    Confirma la importación escribiendo los registros limpios en SQLite y elimina el temporal.
    """
    try:
        if not os.path.exists(payload.filePath):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo temporal no encontrado")
            
        result = await commit_import(payload.filePath, payload.mapping, payload.defaultCountry)
        
        # Eliminar el archivo de manera asíncrona y segura
        background_tasks.add_task(os.remove, payload.filePath)
        
        return result
    except Exception as e:
        if os.path.exists(payload.filePath):
            try:
                os.remove(payload.filePath)
            except:
                pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
