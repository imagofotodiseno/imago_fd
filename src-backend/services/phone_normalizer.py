import re
from typing import List, Dict, Any

def sanitize_string(value: Any, max_length: int = 500) -> str:
    """
    Sanitiza una cadena proveniente de Excel.
    Remueve caracteres de control Unicode, espacios no divisibles y recorta.
    """
    if value is None:
        return ""
    # Convertir a cadena y reemplazar espacios no divisibles y caracteres de control
    s = str(value)
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[\x00-\x1f\x7f]", "", s)
    s = s.strip()
    return s[:max_length] if len(s) > max_length else s

def normalize_phone(raw: Any, default_country: str = "+57") -> Dict[str, Any]:
    """
    Normaliza un número telefónico al formato internacional E.164.
    """
    if raw is None or raw == "":
        return {
            "valid": False,
            "originalRaw": str(raw) if raw is not None else "",
            "error": "Teléfono vacío"
        }
    
    original_raw = str(raw).strip()
    original = original_raw
    
    # Remover puntos de formato
    cleaned = original_raw.replace(".", "")
    # Conservar solo dígitos y signo +
    cleaned = re.sub(r"[^\d+]", "", cleaned)
    
    # Manejar el prefijo internacional '00'
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
        
    # Aplicar el código de país por defecto si no empieza por +
    if not cleaned.startswith("+"):
        stripped = cleaned.lstrip("0")
        cleaned = f"{default_country}{stripped}"
        
    # Validar formato E.164: +[1-9][7-14 dígitos]
    if not re.match(r"^\+[1-9]\d{7,14}$", cleaned):
        return {
            "valid": False,
            "originalRaw": original_raw,
            "error": f'Formato inválido ("{original_raw}"). Use E.164, ej. +57300...'
        }
        
    return {
        "valid": True,
        "phone": cleaned,
        "original": original,
        "originalRaw": original_raw
    }

def normalize_batch(rows: List[Dict[str, Any]], default_country: str = "+57") -> List[Dict[str, Any]]:
    """
    Normaliza una lista de filas, detectando duplicados locales en la sesión.
    """
    seen = set()
    result = []
    for index, row in enumerate(rows):
        res = normalize_phone(row.get("phone"), default_country)
        duplicate = False
        if res["valid"]:
            phone_num = res["phone"]
            if phone_num in seen:
                duplicate = True
            else:
                seen.add(phone_num)
        
        result_row = {
            "rowIndex": index + 1,
            **row,
            "normalizedPhone": res.get("phone"),
            "valid": res["valid"],
            "error": res.get("error"),
            "originalRaw": res.get("originalRaw"),
            "duplicate": duplicate
        }
        result.append(result_row)
    return result
