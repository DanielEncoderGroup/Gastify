"""
Script independiente para migrar usuarios CLIENT → EMPLOYEE.
No depende de la configuración del proyecto para evitar conflictos de Pydantic.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración directa de MongoDB (cambiar según tu entorno)
MONGO_URI = "mongodb://localhost:27017/encodergroup"
DB_NAME = "encodergroup"

# Roles definidos directamente
class UserRole:
    ADMIN = "admin"
    CLIENT = "client"
    EMPLOYEE = "employee"
    EMPLOYER = "employer"

async def migrate_client_to_employee():
    """
    Migra usuarios con role='client' a role='employee'
    """
    print("🚀 INICIANDO MIGRACIÓN CLIENT → EMPLOYEE")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Verificar conexión
        print("🔌 Verificando conexión a MongoDB...")
        server_info = await db.command("serverStatus")
        print(f"✅ Conexión exitosa. MongoDB v{server_info.get('version', 'unknown')}")
        
        # Contar usuarios CLIENT existentes
        client_count = await db.users.count_documents({"role": UserRole.CLIENT})
        total_users = await db.users.count_documents({})
        
        print(f"\n📊 ESTADO ACTUAL:")
        print(f"   - Total usuarios: {total_users}")
        print(f"   - Usuarios CLIENT: {client_count}")
        
        if client_count == 0:
            print("✅ No hay usuarios CLIENT para migrar")
            await show_role_distribution(db)
            return
        
        # Mostrar usuarios a migrar
        client_users = await db.users.find({"role": UserRole.CLIENT}).to_list(length=None)
        print(f"\n👥 USUARIOS A MIGRAR:")
        for user in client_users:
            email = user.get('email', 'Sin email')
            name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
            print(f"   - {email} ({name})")
        
        # Confirmar migración
        print(f"\n⚠️  ¿Migrar {client_count} usuarios CLIENT → EMPLOYEE? (y/N): ", end="")
        confirm = input().strip().lower()
        
        if confirm not in ['y', 'yes', 'si', 's']:
            print("❌ Migración cancelada por el usuario")
            return
        
        # Ejecutar migración
        print("\n🔄 Ejecutando migración...")
        result = await db.users.update_many(
            {"role": UserRole.CLIENT},
            {
                "$set": {
                    "role": UserRole.EMPLOYEE,
                    "updatedAt": datetime.utcnow(),
                    "migratedAt": datetime.utcnow(),
                    "migration_from": UserRole.CLIENT
                }
            }
        )
        
        print(f"\n✅ MIGRACIÓN COMPLETADA:")
        print(f"   - Usuarios migrados: {result.modified_count}")
        print(f"   - Usuarios encontrados: {result.matched_count}")
        
        # Verificar migración
        await show_role_distribution(db)
        
        # Log de migración
        migration_log = {
            "type": "role_migration",
            "from_role": UserRole.CLIENT,
            "to_role": UserRole.EMPLOYEE,
            "users_migrated": result.modified_count,
            "executed_at": datetime.utcnow(),
            "script_version": "1.0.0"
        }
        
        await db.migration_logs.insert_one(migration_log)
        print(f"📝 Log de migración guardado")
        
    except Exception as e:
        print(f"❌ ERROR DURANTE MIGRACIÓN: {str(e)}")
        raise
    finally:
        if 'client' in locals():
            client.close()
            print("🔚 Conexión cerrada")

async def show_role_distribution(db):
    """Mostrar distribución actual de roles"""
    print(f"\n📈 DISTRIBUCIÓN ACTUAL DE ROLES:")
    
    roles = [UserRole.ADMIN, UserRole.CLIENT, UserRole.EMPLOYEE, UserRole.EMPLOYER]
    for role in roles:
        count = await db.users.count_documents({"role": role})
        print(f"   - {role.upper()}: {count} usuarios")

async def create_test_users():
    """Crear usuarios de prueba para testing"""
    print(f"\n👥 ¿Crear usuarios de prueba? (y/N): ", end="")
    confirm = input().strip().lower()
    
    if confirm not in ['y', 'yes', 'si', 's']:
        return
    
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Usuario empleador de prueba
        employer_user = {
            "firstName": "Admin",
            "lastName": "Empleador",
            "email": "empleador@gastify.test",
            "password": "$2b$12$LQv3c1yqBwlVHpPjrp6gfOehsyVyVeBdu3ELBo/gWZZvVkJn0FRMy",  # test123
            "role": UserRole.EMPLOYER,
            "emailVerified": True,
            "company_name": "Test Company S.A.",
            "department": "Administración", 
            "position": "Gerente General",
            "createdAt": datetime.utcnow()
        }
        
        # Usuario empleado de prueba
        employee_user = {
            "firstName": "Juan",
            "lastName": "Empleado",
            "email": "empleado@gastify.test",
            "password": "$2b$12$LQv3c1yqBwlVHpPjrp6gfOehsyVyVeBdu3ELBo/gWZZvVkJn0FRMy",  # test123
            "role": UserRole.EMPLOYEE,
            "emailVerified": True,
            "company_name": "Test Company S.A.",
            "department": "Desarrollo",
            "position": "Desarrollador",
            "createdAt": datetime.utcnow()
        }
        
        # Verificar si ya existen
        existing_employer = await db.users.find_one({"email": employer_user["email"]})
        existing_employee = await db.users.find_one({"email": employee_user["email"]})
        
        if not existing_employer:
            await db.users.insert_one(employer_user)
            print(f"✅ Usuario EMPLOYER creado: {employer_user['email']}")
        else:
            print(f"⚠️  Usuario empleador ya existe: {employer_user['email']}")
            
        if not existing_employee:
            result = await db.users.insert_one(employee_user)
            # Agregar employer_id al empleado
            await db.users.update_one(
                {"_id": result.inserted_id},
                {"$set": {"employer_id": existing_employer["_id"] if existing_employer else None}}
            )
            print(f"✅ Usuario EMPLOYEE creado: {employee_user['email']}")
        else:
            print(f"⚠️  Usuario empleado ya existe: {employee_user['email']}")
        
        print(f"🔑 Contraseña para ambos usuarios: 'test123'")
        
    except Exception as e:
        print(f"❌ Error creando usuarios de prueba: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

async def verify_fixes():
    """Verificar que los fixes críticos funcionan"""
    print(f"\n🔍 VERIFICANDO FIXES CRÍTICOS...")
    
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Verificar distribución de roles
        await show_role_distribution(db)
        
        # Verificar campos multi-tenant
        users_with_company = await db.users.count_documents({"company_name": {"$exists": True, "$ne": None}})
        users_with_department = await db.users.count_documents({"department": {"$exists": True, "$ne": None}})
        
        print(f"\n🏢 CAMPOS MULTI-TENANT:")
        print(f"   - Con company_name: {users_with_company}")
        print(f"   - Con department: {users_with_department}")
        
        # Verificar empleados con empleador
        employees_with_employer = await db.users.count_documents({
            "role": UserRole.EMPLOYEE,
            "employer_id": {"$exists": True, "$ne": None}
        })
        
        print(f"   - Empleados con employer_id: {employees_with_employer}")
        
        # Resultado final
        client_remaining = await db.users.count_documents({"role": UserRole.CLIENT})
        if client_remaining == 0:
            print(f"\n🎉 TODOS LOS FIXES CRÍTICOS APLICADOS CORRECTAMENTE")
            print(f"✅ Sistema listo para nuevos usuarios EMPLOYEE")
        else:
            print(f"\n⚠️  Advertencia: {client_remaining} usuarios CLIENT restantes")
        
    except Exception as e:
        print(f"❌ Error en verificación: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("🔧 GASTIFY - MIGRACIÓN DE ROLES CLIENT → EMPLOYEE")
    print("🎯 Script independiente sin dependencias del proyecto")
    print("=" * 60)
    
    # Menu principal
    print("\n📋 OPCIONES:")
    print("1. Migrar usuarios CLIENT → EMPLOYEE")
    print("2. Crear usuarios de prueba")
    print("3. Verificar estado de fixes")
    print("4. Todo lo anterior (recomendado)")
    
    print("\nSeleccionar opción (1-4): ", end="")
    option = input().strip()
    
    if option == "1":
        asyncio.run(migrate_client_to_employee())
    elif option == "2":
        asyncio.run(create_test_users())
    elif option == "3":
        asyncio.run(verify_fixes())
    elif option == "4":
        print("\n🚀 EJECUTANDO MIGRACIÓN COMPLETA...")
        asyncio.run(migrate_client_to_employee())
        asyncio.run(create_test_users())
        asyncio.run(verify_fixes())
    else:
        print("❌ Opción inválida")
    
    print("\n🎉 Proceso completado!")
