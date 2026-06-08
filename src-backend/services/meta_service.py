import os
import json
import httpx
from typing import Dict, Any, List, Optional
from db.client import db_client

def is_meta_disabled() -> bool:
    """
    Comprueba si las llamadas a la API de Meta están deshabilitadas.
    """
    v = os.getenv("DISABLE_META")
    return v == "1" or str(v).lower() == "true"

async def get_meta_config() -> Dict[str, Any]:
    """
    Obtiene la configuración activa de Meta Cloud API.
    """
    row = await db_client.get("SELECT * FROM meta_config WHERE id = 1")
    return row or {}

async def save_meta_config(access_token: str, phone_number_id: str, waba_id: str) -> None:
    """
    Guarda o actualiza las credenciales de Meta.
    """
    sql = """
        INSERT INTO meta_config (id, access_token, phone_number_id, waba_id, last_ping_at)
        VALUES (1, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET 
            access_token=excluded.access_token, 
            phone_number_id=excluded.phone_number_id, 
            waba_id=excluded.waba_id, 
            last_ping_at=datetime('now')
    """
    await db_client.run(sql, (access_token, phone_number_id, waba_id))

async def ping_meta(access_token: str, phone_number_id: str) -> Dict[str, Any]:
    """
    Prueba la conexión y los permisos de las credenciales llamando al endpoint de Meta.
    """
    if is_meta_disabled():
        return {"disabled": True}
    
    url = f"https://graph.facebook.com/v17.0/{phone_number_id}"
    params = {
        "access_token": access_token,
        "fields": "quality_rating,display_phone_number,account_review_status"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()

async def sync_templates(access_token: str, waba_id: str) -> List[Dict[str, Any]]:
    """
    Sincroniza las plantillas oficiales de mensajes aprobadas en WhatsApp Business Account.
    """
    if is_meta_disabled():
        return []
        
    url = f"https://graph.facebook.com/v17.0/{waba_id}/message_templates"
    params = {
        "access_token": access_token,
        "limit": 100
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
    templates = data.get("data", [])
    
    for t in templates:
        existing = await db_client.get("SELECT id FROM templates WHERE template_id = ?", (t["id"],))
        components_json = json.dumps(t.get("components", []))
        raw_json = json.dumps(t)
        
        if existing:
            await db_client.run(
                """
                UPDATE templates 
                SET name = ?, language = ?, components_json = ?, raw_json = ?, fetched_at = datetime('now') 
                WHERE template_id = ?
                """,
                (t["name"], t["language"], components_json, raw_json, t["id"])
            )
        else:
            await db_client.run(
                """
                INSERT INTO templates (template_id, name, language, components_json, raw_json, fetched_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
                """,
                (t["id"], t["name"], t["language"], components_json, raw_json)
            )
            
    rows = await db_client.all("SELECT * FROM templates ORDER BY name")
    return rows

async def send_whatsapp_template_message(
    access_token: str,
    phone_number_id: str,
    to: str,
    template_name: str,
    language: str = "es",
    components: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Envía un mensaje de WhatsApp basado en una plantilla oficial usando HTTPX.
    """
    if is_meta_disabled():
        print(f"[meta-service] DISABLED - saltando envío de plantilla {template_name} a {to}")
        return {"disabled": True}
        
    url = f"https://graph.facebook.com/v17.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": components or []
        }
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

async def send_whatsapp_text_message(
    access_token: str,
    phone_number_id: str,
    to: str,
    text: str
) -> Dict[str, Any]:
    """
    Envía un mensaje de texto plano interactivo usando la API de Meta.
    """
    if is_meta_disabled():
        print(f"[meta-service] DISABLED - saltando envío de texto a {to}: {text}")
        return {"disabled": True}
        
    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
