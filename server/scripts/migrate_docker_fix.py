"""
Script de migración que funciona tanto en local como en Docker.
Detecta automáticamente el entorno y usa la URL correcta de MongoDB.
"""

import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración automática de MongoDB según entorno
def get_mongo_uri():
    """Detectar y retornar la URI correcta de MongoDB"""
    # Si está en Docker (variable de entorno o archivo /.dockerenv existe)
    if os.path.exists('/.dockerenv') or os.getenv('DOCKER_ENV'):
        return "mongodb://mongo:27017/gastify"
    # Si hay variable de entorno específica
    elif os.getenv('MONGO_URI'):
        return os.getenv('MONGO_URI')
    # Local por defecto
    else:
        return "mongodb://localhost:27017/encodergroup"

MONGO_URI = get_mongo_uri()
DB_NAME = "gastify" if "gastify" in MONGO_URI else "encodergroup"

# Roles definidos
class UserRole:
    ADMIN = "admin"
    CLIENT = "client"
    EMPLOYEE = "employee"
    EMPLOYER = "employer"

async def test_connection():
    """Probar conexión a MongoDB"""
    print(f"🔌 Probando conexión a: {MONGO_URI}")
    print(f"📂 Base de datos: {DB_NAME}")
    
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        
        # Probar conexión simple
        await client.admin.command('ping')
        
        # Obtener info del servidor
        db = client[DB_NAME]
        collections = await db.list_collection_names()
        
        print(f"✅ Conexión exitosa")
        print(f"📊 Colecciones encontradas: {len(collections)}")
        print(f"   Colecciones: {', '.join(collections[:5])}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        return False

async def execute_migration():
    """Ejecutar migración CLIENT → EMPLOYEE"""
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Contar usuarios antes
        total_users = await db.users.count_documents({})
        client_count = await db.users.count_documents({"role": UserRole.CLIENT})
        
        print(f"\n📊 ESTADO ACTUAL:")
        print(f"   - Total usuarios: {total_users}")
        print(f"   - Usuarios CLIENT: {client_count}")
        
        if client_count == 0:
            print("✅ No hay usuarios CLIENT para migrar")
            await show_distribution(db)
            return True
        
        # Mostrar usuarios que se van a migrar
        print(f"\n👥 USUARIOS A MIGRAR DE CLIENT → EMPLOYEE:")
        client_users = await db.users.find({"role": UserRole.CLIENT}).to_list(length=None)
        for user in client_users[:10]:  # Mostrar solo primeros 10
            email = user.get('email', 'Sin email')
            name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
            print(f"   - {email} ({name})")
        
        if len(client_users) > 10:
            print(f"   ... y {len(client_users) - 10} usuarios más")
        
        # Ejecutar migración automáticamente (ya estamos en Docker, es seguro)
        print(f"\n🔄 Ejecutando migración automática...")
        
        result = await db.users.update_many(
            {"role": UserRole.CLIENT},
            {
                "$set": {
                    "role": UserRole.EMPLOYEE,
                    "updatedAt": datetime.utcnow(),
                    "migratedAt": datetime.utcnow(),
                    "migration_source": "docker_auto_migration"
                }
            }
        )
        
        print(f"\n✅ MIGRACIÓN COMPLETADA:")
        print(f"   - Usuarios migrados: {result.modified_count}")
        print(f"   - Total encontrados: {result.matched_count}")
        
        # Mostrar distribución final
        await show_distribution(db)
        
        # Log de migración
        await db.migration_logs.insert_one({
            "type": "client_to_employee_migration",
            "environment": "docker" if "mongo" in MONGO_URI else "local",
            "users_migrated": result.modified_count,
            "executed_at": datetime.utcnow(),
            "script_version": "docker_fix_1.0.0"
        })
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en migración: {str(e)}")
        return False

async def show_distribution(db):
    """Mostrar distribución de roles"""
    print(f"\n📈 DISTRIBUCIÓN FINAL DE ROLES:")
    
    roles = [UserRole.ADMIN, UserRole.CLIENT, UserRole.EMPLOYEE, UserRole.EMPLOYER]
    for role in roles:
        count = await db.users.count_documents({"role": role})
        status = "✅" if role != UserRole.CLIENT or count == 0 else "⚠️"
        print(f"   {status} {role.upper()}: {count} usuarios")

async def create_test_data():
    """Crear datos de prueba si no existen"""
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Verificar si ya hay un empleador
        employer_exists = await db.users.find_one({"role": UserRole.EMPLOYER})
        
        if not employer_exists:
            print(f"\n👔 Creando usuario EMPLOYER de prueba...")
            
            employer = {
                "firstName": "Admin",
                "lastName": "Empleador",
                "email": "empleador@gastify.test",
                "password": "$2b$12$LQv3c1yqBwlVHpPjrp6gfOehsyVyVeBdu3ELBo/gWZZvVkJn0FRMy",
                "role": UserRole.EMPLOYER,
                "emailVerified": True,
                "company_name": "Gastify Test S.A.",
                "department": "Administración",
                "position": "Gerente General",
                "createdAt": datetime.utcnow()
            }
            
            await db.users.insert_one(employer)
            print(f"✅ Usuario empleador creado: empleador@gastify.test")
            print(f"🔑 Contraseña: test123")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creando datos de prueba: {str(e)}")
        return False

async def main():
    """Función principal"""
    print("🔧 GASTIFY - MIGRACIÓN AUTOMÁTICA DOCKER")
    print("🎯 Detecta entorno automáticamente")
    print("=" * 50)
    
    # Paso 1: Probar conexión
    if not await test_connection():
        print("\n❌ No se puede conectar a MongoDB")
        print("💡 Asegúrate de que docker-compose esté ejecutándose")
        return False
    
    # Paso 2: Ejecutar migración
    print(f"\n🚀 INICIANDO MIGRACIÓN...")
    if not await execute_migration():
        return False
    
    # Paso 3: Crear datos de prueba
    await create_test_data()
    
    print(f"\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
    print(f"✅ Sistema Gastify listo para testing")
    print(f"🌐 Frontend: http://localhost:80")
    print(f"🔧 API: http://localhost:8000")
    print(f"📊 Docs: http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    result = asyncio.run(main())
    if result:
        print("\n✨ ¡Listo para testing!")
    else:
        print("\n❌ Migración falló")
        exit(1)
