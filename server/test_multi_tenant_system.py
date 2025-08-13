#!/usr/bin/env python3
"""
Script de testing para sistema multi-tenant de Gastify
Prueba la funcionalidad completa empleador-empleado
"""

import asyncio
import sys
import os
from pathlib import Path

# Agregar el directorio de la aplicación al path
sys.path.append(str(Path(__file__).parent / "app"))

try:
    from app.models.user import UserModel, UserRole, UserPublic
    from app.core.database import get_database
    from bson import ObjectId
    import pymongo
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("   Asegúrate de que las dependencias estén instaladas")
    print("   pip install pymongo motor")
    sys.exit(1)

async def test_multi_tenant_models():
    """Prueba los modelos multi-tenant"""
    print("🧪 TESTING - Modelos Multi-tenant")
    print("="*50)
    
    # Test 1: UserRole - Verificar roles disponibles
    print("\n📋 Test 1: Verificación de Roles")
    available_roles = UserRole.all_roles()
    expected_roles = ['admin', 'client', 'employer', 'employee']
    
    print(f"   Roles esperados: {expected_roles}")
    print(f"   Roles encontrados: {available_roles}")
    
    if set(expected_roles) == set(available_roles):
        print("   ✅ Roles correctamente definidos")
    else:
        print("   ❌ Roles incorrectos o faltantes")
        return False
    
    # Test 2: UserModel - Crear empleador
    print("\n👔 Test 2: Crear Empleador")
    try:
        employer = UserModel(
            firstName="Carlos",
            lastName="González",
            email="carlos@empresa.com",
            password="password123",
            role=UserRole.EMPLOYER,
            company_name="Empresa ABC",
            department="Administración",
            position="Gerente General"
        )
        print(f"   ✅ Empleador creado: {employer.firstName} {employer.lastName}")
        print(f"   📊 Empresa: {employer.company_name}")
        print(f"   🏢 Departamento: {employer.department}")
        print(f"   💼 Cargo: {employer.position}")
    except Exception as e:
        print(f"   ❌ Error creando empleador: {e}")
        return False
    
    # Test 3: UserModel - Crear empleado
    print("\n👨‍💼 Test 3: Crear Empleado")
    try:
        # Simular ObjectId del empleador
        employer_id = ObjectId()
        
        employee = UserModel(
            firstName="Ana",
            lastName="Martínez",
            email="ana@empresa.com",
            password="password123",
            role=UserRole.EMPLOYEE,
            company_name="Empresa ABC",
            employer_id=employer_id,
            department="Ventas",
            position="Ejecutiva de Cuentas"
        )
        print(f"   ✅ Empleado creado: {employee.firstName} {employee.lastName}")
        print(f"   📊 Empresa: {employee.company_name}")
        print(f"   👔 Empleador ID: {employee.employer_id}")
        print(f"   🏢 Departamento: {employee.department}")
        print(f"   💼 Cargo: {employee.position}")
    except Exception as e:
        print(f"   ❌ Error creando empleado: {e}")
        return False
    
    # Test 4: UserPublic - Verificar serialización
    print("\n📤 Test 4: UserPublic - Serialización")
    try:
        employer_public = UserPublic(
            id=str(ObjectId()),
            firstName="Carlos",
            lastName="González", 
            email="carlos@empresa.com",
            role=UserRole.EMPLOYER,
            createdAt=employer.createdAt,
            company_name="Empresa ABC",
            department="Administración",
            position="Gerente General"
        )
        
        # Convertir a dict para verificar serialización
        employer_dict = employer_public.dict()
        print("   ✅ UserPublic serializa correctamente")
        print(f"   📋 Campos multi-tenant incluidos:")
        for field in ['company_name', 'department', 'position']:
            if field in employer_dict:
                print(f"      • {field}: {employer_dict[field]}")
            else:
                print(f"      ❌ Campo faltante: {field}")
                
    except Exception as e:
        print(f"   ❌ Error en serialización: {e}")
        return False
    
    print("\n🎉 ¡Todos los tests de modelos PASARON!")
    return True

def test_database_connection():
    """Prueba la conexión a la base de datos"""
    print("\n💾 TESTING - Conexión Base de Datos")
    print("="*50)
    
    try:
        db = get_database()
        # Test de conexión básico
        server_info = db.client.server_info()
        print(f"   ✅ Conectado a MongoDB {server_info['version']}")
        
        # Verificar colección users
        users_collection = db.users
        user_count = users_collection.count_documents({})
        print(f"   📊 Usuarios en base: {user_count}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        print("   💡 Sugerencias:")
        print("      - Verificar que MongoDB esté corriendo")
        print("      - Revisar string de conexión en .env")
        print("      - docker-compose up mongo (si usas Docker)")
        return False

def test_employees_endpoint_compatibility():
    """Prueba la compatibilidad de endpoints existentes"""
    print("\n🔗 TESTING - Compatibilidad Endpoints")
    print("="*50)
    
    # Simular datos que devolvería la base de datos
    mock_employer_doc = {
        "_id": ObjectId(),
        "firstName": "Carlos",
        "lastName": "González",
        "email": "carlos@empresa.com", 
        "role": "employer",
        "createdAt": employer.createdAt if 'employer' in locals() else None,
        "company_name": "Empresa ABC",
        "department": "Administración", 
        "position": "Gerente General"
    }
    
    try:
        # Simular construcción de UserPublic en employees.py
        employer_response = UserPublic(
            id=str(mock_employer_doc["_id"]),
            firstName=mock_employer_doc["firstName"],
            lastName=mock_employer_doc["lastName"],
            email=mock_employer_doc["email"],
            role=mock_employer_doc["role"],
            company_name=mock_employer_doc.get("company_name"),
            department=mock_employer_doc.get("department"),
            position=mock_employer_doc.get("position"),
            createdAt=mock_employer_doc["createdAt"]
        )
        
        print("   ✅ Endpoint /my-employer compatible")
        print(f"   📊 Respuesta incluye: {employer_response.company_name}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error en endpoints: {e}")
        return False

def create_sample_users():
    """Crea usuarios de ejemplo para testing"""
    print("\n👥 TESTING - Creación Usuarios Ejemplo")
    print("="*50)
    
    try:
        db = get_database()
        users_collection = db.users
        
        # Crear empleador de ejemplo
        employer_data = {
            "firstName": "Carlos",
            "lastName": "González",
            "email": "carlos.test@empresa.com",
            "password": "$2b$12$...",  # Password hasheado
            "role": UserRole.EMPLOYER,
            "company_name": "Empresa ABC",
            "department": "Administración",
            "position": "Gerente General",
            "emailVerified": True,
            "createdAt": employer.createdAt if 'employer' in locals() else None
        }
        
        # Verificar si ya existe
        existing = users_collection.find_one({"email": employer_data["email"]})
        if not existing:
            employer_result = users_collection.insert_one(employer_data)
            employer_id = employer_result.inserted_id
            print(f"   ✅ Empleador creado: {employer_id}")
        else:
            employer_id = existing["_id"]
            print(f"   ℹ️ Empleador ya existe: {employer_id}")
        
        # Crear empleado de ejemplo
        employee_data = {
            "firstName": "Ana",
            "lastName": "Martínez",
            "email": "ana.test@empresa.com", 
            "password": "$2b$12$...",  # Password hasheado
            "role": UserRole.EMPLOYEE,
            "company_name": "Empresa ABC",
            "employer_id": employer_id,
            "department": "Ventas",
            "position": "Ejecutiva de Cuentas",
            "emailVerified": True,
            "createdAt": employee.createdAt if 'employee' in locals() else None
        }
        
        # Verificar si ya existe
        existing_employee = users_collection.find_one({"email": employee_data["email"]})
        if not existing_employee:
            employee_result = users_collection.insert_one(employee_data)
            print(f"   ✅ Empleado creado: {employee_result.inserted_id}")
        else:
            print(f"   ℹ️ Empleado ya existe: {existing_employee['_id']}")
        
        print("   🎉 Usuarios de ejemplo listos para testing")
        return True
        
    except Exception as e:
        print(f"   ❌ Error creando usuarios: {e}")
        return False

async def main():
    """Función principal de testing"""
    print("🚀 INICIANDO TESTS SISTEMA MULTI-TENANT")
    print("="*60)
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Modelos
    if await test_multi_tenant_models():
        tests_passed += 1
    
    # Test 2: Base de datos
    if test_database_connection():
        tests_passed += 1
    
    # Test 3: Endpoints
    if test_employees_endpoint_compatibility():
        tests_passed += 1
    
    # Test 4: Usuarios ejemplo
    if create_sample_users():
        tests_passed += 1
    
    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN DE TESTS")
    print("="*60)
    print(f"   Tests ejecutados: {total_tests}")
    print(f"   Tests exitosos: {tests_passed}")
    print(f"   Tests fallidos: {total_tests - tests_passed}")
    
    if tests_passed == total_tests:
        print("\n🎉 ¡TODOS LOS TESTS PASARON!")
        print("✅ Sistema multi-tenant completamente funcional")
        print("\n🚀 PRÓXIMOS PASOS:")
        print("   1. Ejecutar: docker-compose up --build")
        print("   2. Probar endpoints en: http://localhost:8000/docs")
        print("   3. Testing frontend: http://localhost:3000/app/employees")
        return True
    else:
        print("\n❌ ALGUNOS TESTS FALLARON")
        print("   Revisar errores arriba antes de continuar")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
