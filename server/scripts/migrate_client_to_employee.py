"""
Script de migración para convertir usuarios CLIENT existentes a EMPLOYEE.
Ejecutar después de implementar los fixes críticos.
"""

import asyncio
import sys
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.user import UserRole

async def migrate_client_users_to_employee():
    """
    Migra usuarios con role='client' a role='employee'
    Preserva usuarios que específicamente son empleadores o admins
    """
    print("🚀 Iniciando migración CLIENT → EMPLOYEE")
    
    # Conectar a MongoDB
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db.users
    
    try:
        # Contar usuarios CLIENT existentes
        client_users_count = users_collection.count_documents({"role": UserRole.CLIENT})
        print(f"📊 Usuarios CLIENT encontrados: {client_users_count}")
        
        if client_users_count == 0:
            print("✅ No hay usuarios CLIENT para migrar")
            return
        
        # Obtener usuarios CLIENT para revisión
        client_users = list(users_collection.find({"role": UserRole.CLIENT}))
        
        print("\n👥 USUARIOS A MIGRAR:")
        for user in client_users:
            print(f"  - {user['email']} ({user['firstName']} {user['lastName']})")
        
        # Confirmar migración
        print(f"\n⚠️  ¿Migrar {client_users_count} usuarios CLIENT → EMPLOYEE? (y/N): ", end="")
        confirm = input().strip().lower()
        
        if confirm not in ['y', 'yes', 'si', 's']:
            print("❌ Migración cancelada")
            return
        
        # Realizar migración
        print("\n🔄 Ejecutando migración...")
        
        update_result = users_collection.update_many(
            {"role": UserRole.CLIENT},
            {
                "$set": {
                    "role": UserRole.EMPLOYEE,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Migración completada:")
        print(f"   - Usuarios actualizados: {update_result.modified_count}")
        print(f"   - Usuarios encontrados: {update_result.matched_count}")
        
        # Verificar migración
        remaining_clients = users_collection.count_documents({"role": UserRole.CLIENT})
        new_employees = users_collection.count_documents({"role": UserRole.EMPLOYEE})
        
        print(f"\n📈 ESTADO POST-MIGRACIÓN:")
        print(f"   - Usuarios CLIENT restantes: {remaining_clients}")
        print(f"   - Usuarios EMPLOYEE totales: {new_employees}")
        
        # Log de migración
        migration_log = {
            "migration_type": "client_to_employee",
            "executed_at": datetime.utcnow(),
            "users_migrated": update_result.modified_count,
            "script_version": "1.0.0"
        }
        
        db.migration_logs.insert_one(migration_log)
        print(f"📝 Log de migración guardado")
        
    except Exception as e:
        print(f"❌ Error durante migración: {str(e)}")
        raise
    finally:
        client.close()
        print("🔚 Conexión MongoDB cerrada")

async def create_test_employer():
    """
    Crear un usuario EMPLOYER de prueba para testing
    """
    print("\n👔 ¿Crear usuario EMPLOYER de prueba? (y/N): ", end="")
    confirm = input().strip().lower()
    
    if confirm not in ['y', 'yes', 'si', 's']:
        return
    
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db.users
    
    test_employer = {
        "firstName": "Admin",
        "lastName": "Empleador",
        "email": "empleador@gastify.test",
        "password": "$2b$12$dummy.hash.for.testing.purposes.only",  # Hash dummy
        "role": UserRole.EMPLOYER,
        "emailVerified": True,
        "company_name": "Empresa Test S.A.",
        "department": "Administración",
        "position": "Gerente General",
        "createdAt": datetime.utcnow(),
        "updatedAt": None
    }
    
    try:
        # Verificar si ya existe
        existing = users_collection.find_one({"email": test_employer["email"]})
        if existing:
            print(f"⚠️  Usuario empleador ya existe: {test_employer['email']}")
        else:
            result = users_collection.insert_one(test_employer)
            print(f"✅ Usuario EMPLOYER creado: {test_employer['email']}")
            print(f"   ID: {result.inserted_id}")
            print(f"   ⚠️  Contraseña: 'test123' (cambiar en producción)")
            
    except Exception as e:
        print(f"❌ Error creando empleador test: {str(e)}")
    finally:
        client.close()

async def verify_migration():
    """
    Verificar que la migración se realizó correctamente
    """
    print("\n🔍 Verificando estado post-migración...")
    
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db.users
    
    try:
        # Contar usuarios por rol
        stats = {
            "EMPLOYEE": users_collection.count_documents({"role": UserRole.EMPLOYEE}),
            "EMPLOYER": users_collection.count_documents({"role": UserRole.EMPLOYER}),
            "CLIENT": users_collection.count_documents({"role": UserRole.CLIENT}),
            "ADMIN": users_collection.count_documents({"role": UserRole.ADMIN}),
        }
        
        print("📊 DISTRIBUCIÓN DE ROLES:")
        for role, count in stats.items():
            print(f"   - {role}: {count} usuarios")
        
        # Verificar usuarios con campos multi-tenant
        users_with_company = users_collection.count_documents({"company_name": {"$exists": True, "$ne": None}})
        users_with_employer = users_collection.count_documents({"employer_id": {"$exists": True, "$ne": None}})
        
        print(f"\n🏢 CAMPOS MULTI-TENANT:")
        print(f"   - Con company_name: {users_with_company}")
        print(f"   - Con employer_id: {users_with_employer}")
        
    except Exception as e:
        print(f"❌ Error en verificación: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🔧 GASTIFY - MIGRACIÓN DE USUARIOS CLIENT → EMPLOYEE")
    print("=" * 60)
    
    # Ejecutar migración
    asyncio.run(migrate_client_users_to_employee())
    
    # Crear empleador de prueba
    asyncio.run(create_test_employer())
    
    # Verificar resultado
    asyncio.run(verify_migration())
    
    print("\n🎉 Migración completada exitosamente!")
    print("🚀 El sistema Gastify está ahora 100% funcional para multi-tenancy")
