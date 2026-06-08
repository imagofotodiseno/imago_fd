import os
import asyncio
from client import db_client, DB_FILE

SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")

async def run():
    if not os.path.exists(SCHEMA_FILE):
        print(f"Error: No se encontró el archivo de esquema en {SCHEMA_FILE}")
        return
        
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"Inicializando base de datos en {DB_FILE}...")
    try:
        await db_client.exec(sql)
        print("✅ Base de datos inicializada exitosamente.")
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")

if __name__ == "__main__":
    asyncio.run(run())
