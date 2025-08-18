#!/usr/bin/env python3
"""
Script de verificación de integración completa para Gastify
Prueba que todos los componentes del sistema estén correctamente integrados
"""

import sys
import traceback
from datetime import datetime

def test_imports():
    """Verificar que todas las importaciones funcionen"""
    print("🔍 Verificando importaciones...")
    
    try:
        # Backend core
        from app.main import app
        print("✅ app.main importado correctamente")
        
        # Nuevos endpoints
        from app.api.routes import spending_limits, advanced_notifications, employees
        print("✅ Nuevos endpoints importados correctamente")
        
        # Modelos
        from app.models.user import UserPublic, UserRole
        print("✅ Modelos de usuario importados correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en importaciones: {str(e)}")
        traceback.print_exc()
        return False

def test_routes_registration():
    """Verificar que las rutas estén registradas"""
    print("\n🛣️ Verificando registro de rutas...")
    
    try:
        from app.main import app
        
        # Obtener todas las rutas registradas
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        # Rutas esperadas
        expected_routes = [
            '/api/spending-limits',
            '/api/advanced-notifications', 
            '/api/employees'
        ]
        
        all_registered = True
        for expected_route in expected_routes:
            # Buscar rutas que contengan el patrón
            found = any(expected_route in route for route in routes)
            if found:
                print(f"✅ Ruta {expected_route} registrada")
            else:
                print(f"❌ Ruta {expected_route} NO encontrada")
                all_registered = False
        
        return all_registered
        
    except Exception as e:
        print(f"❌ Error verificando rutas: {str(e)}")
        traceback.print_exc()
        return False

def test_database_models():
    """Verificar que los modelos de base de datos estén bien configurados"""
    print("\n💾 Verificando modelos de base de datos...")
    
    try:
        from app.models.user import UserRole
        
        # Verificar que los roles estén definidos
        expected_roles = ['ADMIN', 'CLIENT', 'EMPLOYER', 'EMPLOYEE']
        for role in expected_roles:
            if hasattr(UserRole, role):
                print(f"✅ Rol {role} definido correctamente")
            else:
                print(f"❌ Rol {role} NO definido")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando modelos: {str(e)}")
        traceback.print_exc()
        return False

def test_endpoint_structure():
    """Verificar estructura de endpoints"""
    print("\n🔗 Verificando estructura de endpoints...")
    
    try:
        # Verificar spending_limits endpoints
        from app.api.routes.spending_limits import router as spending_router
        print("✅ Router de spending_limits cargado")
        
        # Verificar advanced_notifications endpoints  
        from app.api.routes.advanced_notifications import router as notifications_router
        print("✅ Router de advanced_notifications cargado")
        
        # Verificar employees endpoints
        from app.api.routes.employees import router as employees_router
        print("✅ Router de employees cargado")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando endpoints: {str(e)}")
        traceback.print_exc()
        return False

def test_dependencies():
    """Verificar dependencias críticas"""
    print("\n📦 Verificando dependencias...")
    
    try:
        # FastAPI
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__}")
        
        # MongoDB
        from pymongo import MongoClient
        print("✅ PyMongo disponible")
        
        # Pydantic
        import pydantic
        print(f"✅ Pydantic {pydantic.__version__}")
        
        # Otros
        import bson
        print("✅ BSON disponible")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando dependencias: {str(e)}")
        return False

def generate_test_report():
    """Generar reporte completo de testing"""
    print("\n" + "="*60)
    print("🚀 REPORTE DE INTEGRACIÓN GASTIFY")
    print("="*60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏗️ Sistema: Gastify Approval Workflows v2.0.0")
    print("="*60)
    
    tests = [
        ("Importaciones", test_imports),
        ("Registro de Rutas", test_routes_registration), 
        ("Modelos de DB", test_database_models),
        ("Estructura Endpoints", test_endpoint_structure),
        ("Dependencias", test_dependencies)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Ejecutando: {test_name}")
        print("-" * 40)
        result = test_func()
        results.append((test_name, result))
    
    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN DE RESULTADOS")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<10} {test_name}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"📈 Total: {passed}/{total} tests pasaron ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ¡INTEGRACIÓN COMPLETA EXITOSA!")
        print("\n🚀 PRÓXIMOS PASOS:")
        print("1. Ejecutar: uvicorn app.main:app --reload")
        print("2. Verificar endpoints en: http://localhost:8000/docs")
        print("3. Probar frontend con nuevos servicios")
        print("4. Ejecutar tests manuales de workflows")
    else:
        print("⚠️  Algunos tests fallaron. Revisar errores arriba.")
        print("\n🔧 ACCIONES REQUERIDAS:")
        for test_name, result in results:
            if not result:
                print(f"- Corregir: {test_name}")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = generate_test_report()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error inesperado: {str(e)}")
        traceback.print_exc()
        sys.exit(1)
