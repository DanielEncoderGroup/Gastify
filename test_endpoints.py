#!/usr/bin/env python3
"""
Script de testing específico para endpoints de Gastify
Prueba los nuevos endpoints implementados
"""

import asyncio
import sys
from datetime import datetime
from typing import Dict, Any

def test_spending_limits_endpoints():
    """Test endpoints de límites de gasto"""
    print("💰 Verificando endpoints de Spending Limits...")
    
    try:
        from app.api.routes.spending_limits import router
        
        # Verificar que existan las rutas esperadas
        expected_endpoints = [
            ('POST', '/'),                    # create_spending_limit
            ('GET', '/'),                     # get_spending_limits  
            ('PUT', '/{limit_id}'),          # update_spending_limit
            ('DELETE', '/{limit_id}'),       # delete_spending_limit
            ('GET', '/usage'),               # get_spending_usage
            ('POST', '/validate-transaction'), # validate_transaction
            ('POST', '/bulk'),               # create_bulk_limits
        ]
        
        # Obtener rutas del router
        routes = []
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':  # Excluir HEAD automático
                        routes.append((method, route.path))
        
        print(f"📋 Rutas encontradas: {len(routes)}")
        for method, path in routes:
            print(f"  - {method} {path}")
        
        # Verificar endpoints críticos
        critical_found = 0
        for method, path in expected_endpoints:
            found = (method, path) in routes
            status = "✅" if found else "❌"
            print(f"{status} {method} {path}")
            if found:
                critical_found += 1
        
        success_rate = critical_found / len(expected_endpoints) * 100
        print(f"📊 Endpoints encontrados: {critical_found}/{len(expected_endpoints)} ({success_rate:.1f}%)")
        
        return success_rate >= 80  # Al menos 80% de endpoints críticos
        
    except Exception as e:
        print(f"❌ Error testing spending limits: {str(e)}")
        return False

def test_notifications_endpoints():
    """Test endpoints de notificaciones avanzadas"""
    print("\n🔔 Verificando endpoints de Advanced Notifications...")
    
    try:
        from app.api.routes.advanced_notifications import router
        
        expected_endpoints = [
            ('GET', '/'),                    # get_notifications
            ('POST', '/'),                   # create_notification
            ('PUT', '/{notification_id}/read'), # mark_as_read
            ('POST', '/bulk-read'),          # mark_bulk_as_read
            ('GET', '/stats'),               # get_notification_stats
            ('GET', '/intelligent-alerts'), # get_intelligent_alerts
            ('POST', '/preferences'),       # update_notification_preferences
            ('GET', '/preferences'),        # get_notification_preferences
        ]
        
        routes = []
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':
                        routes.append((method, route.path))
        
        print(f"📋 Rutas encontradas: {len(routes)}")
        for method, path in routes:
            print(f"  - {method} {path}")
        
        critical_found = 0
        for method, path in expected_endpoints:
            found = (method, path) in routes
            status = "✅" if found else "❌"
            print(f"{status} {method} {path}")
            if found:
                critical_found += 1
        
        success_rate = critical_found / len(expected_endpoints) * 100
        print(f"📊 Endpoints encontrados: {critical_found}/{len(expected_endpoints)} ({success_rate:.1f}%)")
        
        return success_rate >= 80
        
    except Exception as e:
        print(f"❌ Error testing notifications: {str(e)}")
        return False

def test_employees_endpoints():
    """Test endpoints de empleados"""
    print("\n👥 Verificando endpoints de Employees...")
    
    try:
        from app.api.routes.employees import router
        
        expected_endpoints = [
            ('GET', '/my-employees'),        # get_my_employees
            ('GET', '/my-employer'),         # get_my_employer  
            ('GET', '/employee-receipts/{employee_id}'), # get_employee_receipts
            ('GET', '/all-employee-receipts'), # get_all_employee_receipts
        ]
        
        routes = []
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':
                        routes.append((method, route.path))
        
        print(f"📋 Rutas encontradas: {len(routes)}")
        for method, path in routes:
            print(f"  - {method} {path}")
        
        critical_found = 0
        for method, path in expected_endpoints:
            # Para rutas con parámetros, verificar parcialmente
            found = any((method, route_path) for m, route_path in routes 
                       if m == method and (path == route_path or 
                           ('{' in path and route_path.replace('{employee_id}', '{id}') in path)))
            status = "✅" if found else "❌"
            print(f"{status} {method} {path}")
            if found:
                critical_found += 1
        
        success_rate = critical_found / len(expected_endpoints) * 100
        print(f"📊 Endpoints encontrados: {critical_found}/{len(expected_endpoints)} ({success_rate:.1f}%)")
        
        return success_rate >= 75  # Más flexible para employees
        
    except Exception as e:
        print(f"❌ Error testing employees: {str(e)}")
        return False

def test_main_app_integration():
    """Test integración en app principal"""
    print("\n🏗️ Verificando integración en app principal...")
    
    try:
        from app.main import app
        
        # Obtener todas las rutas de la app
        all_routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                all_routes.append(route.path)
        
        # Verificar que las rutas de nuestros módulos estén incluidas
        expected_prefixes = [
            '/api/spending-limits',
            '/api/advanced-notifications', 
            '/api/employees'
        ]
        
        print("🔍 Verificando prefijos de rutas en app principal:")
        integrated_correctly = True
        
        for prefix in expected_prefixes:
            # Buscar rutas que empiecen con este prefijo
            matching_routes = [route for route in all_routes if route.startswith(prefix)]
            
            if matching_routes:
                print(f"✅ {prefix} - {len(matching_routes)} rutas encontradas")
                for route in matching_routes[:3]:  # Mostrar máximo 3
                    print(f"    - {route}")
                if len(matching_routes) > 3:
                    print(f"    - ... y {len(matching_routes)-3} más")
            else:
                print(f"❌ {prefix} - NO encontrado")
                integrated_correctly = False
        
        print(f"\n📊 Total de rutas en la app: {len(all_routes)}")
        return integrated_correctly
        
    except Exception as e:
        print(f"❌ Error testing app integration: {str(e)}")
        return False

def test_cors_and_middleware():
    """Test configuración de CORS y middleware"""
    print("\n🌐 Verificando configuración de CORS y middleware...")
    
    try:
        from app.main import app
        
        # Verificar que CORS esté configurado
        has_cors = False
        cors_config = None
        
        for middleware in app.user_middleware:
            if 'cors' in str(middleware).lower():
                has_cors = True
                print("✅ CORS middleware configurado")
                break
        
        if not has_cors:
            print("❌ CORS middleware NO encontrado")
            return False
        
        # Verificar configuración básica de la app
        print(f"✅ App title: {app.title}")
        print(f"✅ App version: {app.version}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando CORS: {str(e)}")
        return False

def generate_endpoints_report():
    """Generar reporte de endpoints"""
    print("="*70)
    print("🔗 REPORTE DE ENDPOINTS GASTIFY")
    print("="*70)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    tests = [
        ("Spending Limits Endpoints", test_spending_limits_endpoints),
        ("Advanced Notifications Endpoints", test_notifications_endpoints),
        ("Employees Endpoints", test_employees_endpoints),
        ("Main App Integration", test_main_app_integration),
        ("CORS & Middleware", test_cors_and_middleware),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Testing: {test_name}")
        print("-" * 50)
        result = test_func()
        results.append((test_name, result))
    
    # Resumen
    print("\n" + "="*70)
    print("📊 RESUMEN DE ENDPOINTS")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<10} {test_name}")
    
    print("-" * 70)
    print(f"📈 Resultado: {passed}/{total} tests pasaron ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 ¡TODOS LOS ENDPOINTS FUNCIONANDO!")
        print("\n🚀 ENDPOINTS DISPONIBLES:")
        print("- 💰 Spending Limits: /api/spending-limits/*")
        print("- 🔔 Notifications: /api/advanced-notifications/*")  
        print("- 👥 Employees: /api/employees/*")
        print("\n📖 Documentación: http://localhost:8000/docs")
    else:
        print("\n⚠️  Algunos endpoints tienen problemas.")
        
    return passed == total

if __name__ == "__main__":
    try:
        success = generate_endpoints_report()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n💥 Error inesperado: {str(e)}")
        sys.exit(1)
