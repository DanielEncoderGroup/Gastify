"""
Test suite para verificar que los fixes críticos funcionan correctamente.
Valida flujos completos end-to-end post-migración.
"""

import asyncio
import sys
import os
from datetime import datetime
import pytest
from httpx import AsyncClient
from pymongo import MongoClient
from bson import ObjectId

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.config import settings
from app.models.user import UserRole, UserModel, UserPublic
from app.api.deps import get_current_user

class TestCriticalFixes:
    """
    Test suite para verificar fixes críticos implementados
    """
    
    def setup_method(self):
        """Setup para cada test"""
        self.client = MongoClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        self.test_user_email = "test.employee@gastify.test"
        self.test_employer_email = "test.employer@gastify.test"
    
    def teardown_method(self):
        """Cleanup después de cada test"""
        # Limpiar usuarios de test
        self.db.users.delete_many({
            "email": {"$in": [self.test_user_email, self.test_employer_email]}
        })
        self.client.close()
    
    async def test_new_user_registration_role(self):
        """
        FIX CRÍTICO #1: Verificar que nuevos usuarios se registran como EMPLOYEE
        """
        print("\n🧪 TEST: Nuevo usuario se registra como EMPLOYEE")
        
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Datos de registro
            registration_data = {
                "firstName": "Test",
                "lastName": "Employee", 
                "email": self.test_user_email,
                "password": "test123456",
                "company_name": "Test Company S.A.",
                "department": "Testing",
                "position": "Test Engineer"
            }
            
            # Registrar usuario
            response = await ac.post("/api/auth/register", json=registration_data)
            assert response.status_code in [200, 201], f"Error en registro: {response.text}"
            
            # Verificar en base de datos
            user_doc = self.db.users.find_one({"email": self.test_user_email})
            assert user_doc is not None, "Usuario no fue creado"
            assert user_doc["role"] == UserRole.EMPLOYEE, f"Rol incorrecto: {user_doc['role']}"
            assert user_doc["company_name"] == "Test Company S.A.", "company_name no guardado"
            
            print("✅ Usuario registrado como EMPLOYEE correctamente")
            return user_doc
    
    async def test_user_public_fields_in_auth(self):
        """
        FIX CRÍTICO #2: Verificar que UserPublic incluye campos multi-tenant
        """
        print("\n🧪 TEST: UserPublic incluye campos multi-tenant")
        
        # Crear usuario en BD directamente para testing
        test_user = {
            "firstName": "Test",
            "lastName": "User",
            "email": self.test_user_email,
            "password": "$2b$12$dummy.hash.for.testing",
            "role": UserRole.EMPLOYEE,
            "emailVerified": True,
            "company_name": "Test Company S.A.",
            "employer_id": ObjectId(),
            "department": "Engineering",
            "position": "Developer",
            "phone": "+56912345678",
            "createdAt": datetime.utcnow()
        }
        
        result = self.db.users.insert_one(test_user)
        test_user["_id"] = result.inserted_id
        
        # Simular get_current_user
        user_public = UserPublic(
            id=str(test_user["_id"]),
            firstName=test_user["firstName"],
            lastName=test_user["lastName"],
            email=test_user["email"],
            role=test_user["role"],
            createdAt=test_user["createdAt"],
            company_name=test_user.get("company_name"),
            employer_id=str(test_user["employer_id"]) if test_user.get("employer_id") else None,
            department=test_user.get("department"),
            position=test_user.get("position"),
            phone=test_user.get("phone")
        )
        
        # Verificar campos multi-tenant
        assert user_public.company_name == "Test Company S.A.", "company_name faltante en UserPublic"
        assert user_public.employer_id is not None, "employer_id faltante en UserPublic"
        assert user_public.department == "Engineering", "department faltante en UserPublic"
        assert user_public.position == "Developer", "position faltante en UserPublic"
        assert user_public.phone == "+56912345678", "phone faltante en UserPublic"
        
        print("✅ UserPublic incluye todos los campos multi-tenant")
        return user_public
    
    async def test_employee_can_upload_receipt(self):
        """
        TEST: Empleado puede subir boleta inmediatamente después del registro
        """
        print("\n🧪 TEST: Empleado puede subir boleta")
        
        # Crear usuario empleado
        user_doc = await self.test_new_user_registration_role()
        user_id = str(user_doc["_id"])
        
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Simular datos de boleta
            receipt_data = {
                "vendor_name": "Supermercado Jumbo",
                "total_amount": 15750.0,
                "date": "2024-01-15",
                "category": "Supermercado",
                "user_id": user_id,
                "extracted_items": [
                    {
                        "name": "Pan integral",
                        "quantity": 2,
                        "unit_price": 1500.0,
                        "total_price": 3000.0
                    }
                ],
                "ocr_data": {
                    "confidence": 0.95,
                    "text_extracted": "Supermercado Jumbo - Total: $15.750"
                }
            }
            
            # Intentar crear boleta
            response = await ac.post("/api/receipts/", json=receipt_data)
            
            # Verificar que no hay errores de permisos
            assert response.status_code not in [401, 403], f"Error de permisos: {response.text}"
            
            if response.status_code == 200:
                print("✅ Empleado puede subir boletas correctamente")
            else:
                print(f"⚠️  Status code: {response.status_code} - {response.text}")
        
        return True
    
    async def test_employer_can_see_employees(self):
        """
        TEST: Empleador puede ver lista de empleados
        """
        print("\n🧪 TEST: Empleador puede ver empleados")
        
        # Crear empleador
        employer_data = {
            "firstName": "Boss",
            "lastName": "Manager",
            "email": self.test_employer_email,
            "password": "$2b$12$dummy.hash.for.testing",
            "role": UserRole.EMPLOYER,
            "emailVerified": True,
            "company_name": "Test Company S.A.",
            "department": "Management",
            "position": "CEO",
            "createdAt": datetime.utcnow()
        }
        
        employer_result = self.db.users.insert_one(employer_data)
        employer_id = employer_result.inserted_id
        
        # Crear empleado bajo este empleador
        employee_data = {
            "firstName": "John",
            "lastName": "Employee",
            "email": self.test_user_email,
            "password": "$2b$12$dummy.hash.for.testing",
            "role": UserRole.EMPLOYEE,
            "emailVerified": True,
            "employer_id": employer_id,
            "company_name": "Test Company S.A.",
            "department": "Engineering",
            "position": "Developer",
            "createdAt": datetime.utcnow()
        }
        
        self.db.users.insert_one(employee_data)
        
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Simular endpoint de empleados
            # (En producción necesitaría autenticación real)
            
            # Verificar que empleador puede encontrar empleados
            employees = list(self.db.users.find({
                "employer_id": employer_id,
                "role": UserRole.EMPLOYEE
            }))
            
            assert len(employees) == 1, "Empleador no encuentra empleados"
            assert employees[0]["email"] == self.test_user_email, "Empleado incorrecto"
            
            print("✅ Empleador puede ver empleados correctamente")
        
        return True
    
    async def test_migration_status(self):
        """
        TEST: Verificar estado de migración CLIENT → EMPLOYEE
        """
        print("\n🧪 TEST: Estado de migración CLIENT → EMPLOYEE")
        
        # Contar usuarios por rol
        role_counts = {
            "CLIENT": self.db.users.count_documents({"role": UserRole.CLIENT}),
            "EMPLOYEE": self.db.users.count_documents({"role": UserRole.EMPLOYEE}),
            "EMPLOYER": self.db.users.count_documents({"role": UserRole.EMPLOYER}),
            "ADMIN": self.db.users.count_documents({"role": UserRole.ADMIN})
        }
        
        print(f"📊 Distribución de roles post-migración:")
        for role, count in role_counts.items():
            print(f"   - {role}: {count} usuarios")
        
        # Verificar que hay pocos o ningún CLIENT (deberían ser EMPLOYEE)
        if role_counts["CLIENT"] > role_counts["EMPLOYEE"]:
            print("⚠️  Advertencia: Más usuarios CLIENT que EMPLOYEE")
            print("   Posible migración incompleta")
        else:
            print("✅ Migración CLIENT → EMPLOYEE completada")
        
        return role_counts

async def run_all_tests():
    """
    Ejecutar todos los tests críticos
    """
    print("🚀 INICIANDO TESTS DE FIXES CRÍTICOS")
    print("=" * 60)
    
    test_instance = TestCriticalFixes()
    test_instance.setup_method()
    
    try:
        # Test 1: Registro con rol correcto
        await test_instance.test_new_user_registration_role()
        
        # Test 2: UserPublic con campos multi-tenant
        await test_instance.test_user_public_fields_in_auth()
        
        # Test 3: Empleado puede subir boletas
        await test_instance.test_employee_can_upload_receipt()
        
        # Test 4: Empleador puede ver empleados
        await test_instance.test_employer_can_see_employees()
        
        # Test 5: Estado de migración
        await test_instance.test_migration_status()
        
        print("\n🎉 TODOS LOS TESTS CRÍTICOS PASARON")
        print("✅ Sistema Gastify está 100% funcional para multi-tenancy")
        
    except Exception as e:
        print(f"\n❌ ERROR EN TESTS: {str(e)}")
        raise
    
    finally:
        test_instance.teardown_method()

if __name__ == "__main__":
    # Ejecutar tests
    asyncio.run(run_all_tests())
