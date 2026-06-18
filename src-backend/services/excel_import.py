import os
import json
import datetime
import pandas as pd
from typing import List, Dict, Any, Tuple
from db.client import db_client
from services.phone_normalizer import normalize_phone, sanitize_string

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def extract_headers(file_path: str) -> List[str]:
    """
    Lee solo los encabezados del archivo Excel o CSV de forma rápida.
    """
    try:
        if file_path.lower().endswith(".csv"):
            df = pd.read_csv(file_path, nrows=0)
        else:
            df = pd.read_excel(file_path, nrows=0)
        
        headers = [sanitize_string(col) for col in df.columns]
        return [h for h in headers if h]
    except Exception as e:
        raise Exception(f"Error leyendo encabezados del archivo: {str(e)}")

def parse_row_with_mapping(row: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extrae campos mapeados de una fila de datos según el mapeo de columnas.
    """
    phone_col = mapping.get("phoneColumn")
    name_col = mapping.get("nameColumn")
    
    phone = str(row.get(phone_col)) if row.get(phone_col) is not None else ""
    name = sanitize_string(row.get(name_col)) if name_col and row.get(name_col) is not None else ""
    
    merge_tags = {}
    merge_tags_mapping = mapping.get("mergeTags", {})
    if isinstance(merge_tags_mapping, dict):
        for tag_name, col_name in merge_tags_mapping.items():
            val = row.get(col_name)
            merge_tags[sanitize_string(tag_name)] = sanitize_string(val) if val is not None else ""
            
    return {
        "phone": phone,
        "name": name,
        "merge_tags": merge_tags
    }

async def preview_import(file_path: str, mapping: Dict[str, Any], default_country: str = "+57") -> Dict[str, Any]:
    """
    Previsualiza una importación de contactos validando números de teléfono y duplicados en fragmentos.
    """
    valid_records = []
    error_logs = []
    seen = set()
    total_rows = 0
    row_index = 0
    
    is_csv = file_path.lower().endswith(".csv")
    
    # Procesar en fragmentos de 1000 filas para evitar picos de memoria RAM (OOM protection)
    chunk_iterator = pd.read_csv(file_path, chunksize=1000) if is_csv else pd.read_excel(file_path, chunksize=1000)
    
    for chunk in chunk_iterator:
        # Convertir NaNs de Pandas a None para procesar cadenas sin errores
        chunk = chunk.where(pd.notnull(chunk), None)
        
        for _, row in chunk.iterrows():
            row_index += 1
            row_dict = row.to_dict()
            
            # Ignorar filas totalmente vacías
            if not any(v is not None and str(v).strip() != "" for v in row_dict.values()):
                continue
            
            total_rows += 1
            record = parse_row_with_mapping(row_dict, mapping)
            norm = normalize_phone(record["phone"], default_country)
            
            if not norm["valid"]:
                error_logs.append({
                    "row": row_index + 1,  # Fila 1 es el encabezado
                    "originalPhone": record["phone"],
                    "originalRaw": norm.get("originalRaw", ""),
                    "name": record["name"],
                    "error": norm["error"]
                })
                continue
                
            norm_phone = norm["phone"]
            if norm_phone in seen:
                error_logs.append({
                    "row": row_index + 1,
                    "originalPhone": record["phone"],
                    "originalRaw": norm.get("originalRaw", ""),
                    "name": record["name"],
                    "error": "Número duplicado en este archivo"
                })
                continue
                
            seen.add(norm_phone)
            valid_records.append({
                "rowIndex": row_index + 1,
                "normalizedPhone": norm_phone,
                "name": record["name"],
                "mergeTags": record["merge_tags"]
            })
            
    return {
        "validRecords": valid_records,
        "errorLogs": error_logs,
        "totalRows": total_rows
    }

async def commit_import(file_path: str, mapping: Dict[str, Any], default_country: str = "+57", source: str = "excel") -> Dict[str, Any]:
    """
    Confirma la importación escribiendo los contactos válidos en lote dentro de SQLite.
    """
    # Agregar columna custom_vars_json de manera segura si no existía (Migración Aditiva)
    try:
        await db_client.run("ALTER TABLE contacts ADD COLUMN custom_vars_json TEXT")
    except Exception:
        pass # Columna ya existente
        
    # Obtener leads validados
    preview = await preview_import(file_path, mapping, default_country)
    valid_records = preview["validRecords"]
    error_logs = preview["errorLogs"]
    total_rows = preview["totalRows"]

    insert_sql = """
        INSERT OR IGNORE INTO contacts
        (phone, country_code, name, var1, var2, custom_vars_json, source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """

    # Generar tuplas de inserción por lotes
    params_list = []
    for r in valid_records:
        tags = r.get("mergeTags", {})
        var1 = tags.get("var1") or tags.get("empresa") or ""
        var2 = tags.get("var2") or tags.get("ciudad") or ""
        custom_vars_json = json.dumps(tags)
        params_list.append((
            r["normalizedPhone"],
            default_country,
            r["name"],
            var1,
            var2,
            custom_vars_json,
            source
        ))

    # Inserción en lote (Batch Write) no bloqueante
    if params_list:
        await db_client.executemany(insert_sql, params_list)

    # Registrar el Import Job
    job_sql = """
        INSERT INTO import_jobs
        (filename, mapping_json, rows_total, rows_valid, rows_invalid, duplicates_count, errors_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """
    filename = os.path.basename(file_path)
    duplicates_count = sum(1 for e in error_logs if "duplicado" in e.get("error", "").lower())
    
    await db_client.run(job_sql, (
        filename,
        json.dumps(mapping),
        total_rows,
        len(valid_records),
        len(error_logs),
        duplicates_count,
        json.dumps(error_logs)
    ))

    return {
        "totalRows": total_rows,
        "imported": len(valid_records),
        "rejected": len(error_logs),
        "errorLogs": error_logs
    }
