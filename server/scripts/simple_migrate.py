#!/usr/bin/env python3
"""
Script de migración simple para marcar como verificados todos los correos electrónicos existentes.
Este script se conecta directamente a MongoDB, sin depender de la configuración existente.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración de la conexión a MongoDB
MONGO_URI = "mongodb://localhost:27017/encodergroup"
DB_NAME = "encodergroup"

async def migrate_existing_users():
    """
    Marca como verificados los correos electrónicos de todos los usuarios existentes.
    """
    print(f"Iniciando migración con conexión directa a MongoDB: {MONGO_URI}")
    
    try:
        # Conectar directamente a MongoDB
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Verificar la conexión
        print("Verificando conexión a MongoDB...")
        server_info = await db.command("serverStatus")
        print(f"Conexión exitosa. MongoDB versión: {server_info.get('version', 'desconocida')}")
        
        # Contar usuarios antes de la migración
        total_users = await db.users.count_documents({})
        unverified_users = await db.users.count_documents({
            "$or": [
                {"emailVerified": {"$exists": False}},
                {"emailVerified": False}
            ]
        })
        
        print(f"Total de usuarios en la base de datos: {total_users}")
        print(f"Usuarios sin verificación de correo: {unverified_users}")
        
        if unverified_users == 0:
            print("No hay usuarios que necesiten migración. Todos los usuarios ya están verificados.")
            return
        
        # Actualizar usuarios
        result = await db.users.update_many(
            {"$or": [
                {"emailVerified": {"$exists": False}},
                {"emailVerified": False}
            ]},
            {"$set": {
                "emailVerified": True,
                "migratedAt": datetime.utcnow()
            }}
        )
        
        print(f"Migración completada exitosamente:")
        print(f"- Usuarios actualizados: {result.modified_count}")
        print(f"- Usuarios encontrados: {result.matched_count}")
        
        # Verificar resultado
        still_unverified = await db.users.count_documents({
            "$or": [
                {"emailVerified": {"$exists": False}},
                {"emailVerified": False}
            ]
        })
        
        if still_unverified > 0:
            print(f"ADVERTENCIA: Aún hay {still_unverified} usuarios sin verificar.")
        else:
            print("Todos los usuarios ahora están marcados como verificados.")
        
    except Exception as e:
        print(f"Error durante la migración: {str(e)}")
        raise e
    finally:
        # Cerrar conexión
        if 'client' in locals():
            client.close()
            print("Conexión a MongoDB cerrada.")

if __name__ == "__main__":
    asyncio.run(migrate_existing_users())
    print("Proceso de migración finalizado.")