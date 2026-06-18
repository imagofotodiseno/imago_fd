import os
import aiosqlite
from typing import List, Dict, Any, Optional

# Ruta absoluta al archivo de la base de datos
DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "database.sqlite"))

class AsyncDatabase:
    """
    Cliente asíncrono para interactuar con SQLite mediante aiosqlite.
    Proporciona métodos similares a la abstracción de openDatabase en JS.
    """
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path

    async def run(self, sql: str, params: tuple = ()) -> Dict[str, Any]:
        """
        Ejecuta consultas de modificación (INSERT, UPDATE, DELETE) y confirma.
        Devuelve el ID generado (lastID) y los cambios efectuados (changes).
        """
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(sql, params) as cursor:
                await db.commit()
                return {
                    "lastID": cursor.lastrowid,
                    "changes": db.total_changes
                }

    async def get(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """
        Recupera un único registro como diccionario.
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(sql, params) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else None

    async def all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """
        Recupera múltiples registros como lista de diccionarios.
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(sql, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def exec(self, sql: str) -> None:
        """
        Ejecuta un script SQL completo (util para inicializar tablas).
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(sql)
            await db.commit()

    async def executemany(self, sql: str, params_list: List[tuple]) -> None:
        """
        Ejecuta operaciones masivas eficientemente bajo una transacción implícita.
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.executemany(sql, params_list)
            await db.commit()

# Instancia singleton para compartir en el backend
db_client = AsyncDatabase()
