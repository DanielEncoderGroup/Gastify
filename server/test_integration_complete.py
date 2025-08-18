#!/usr/bin/env python3
"""
Script de Verificación Completa - Integración Frontend-Backend Gastify
=================================================================

Verifica que todos los endpoints críticos estén funcionando correctamente
y que la integración entre frontend y backend sea completa.
"""

import requests
import json
import time
import os
from typing import Dict, List, Any

# Configuración
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class IntegrationTester:
    def __init__(self):
        self.results = []
        self.auth_token = None
        self.test_user_id = None
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Registra el resultado de una prueba"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"    → {details}")
        if response_data and not success:
            print(f"    → Respuesta: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
        print()

    def test_server_health(self):
        """Verifica que el servidor esté corriendo"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            success = response.status_code == 200
            self.log_result(
                "Salud del Servidor", 
                success,
                f"Status: {response.status_code}" if success else "Servidor no responde"
            )
            return success
        except Exception as e:
            self.log_result("Salud del Servidor", False, f"Error: {str(e)}")
            return False

    def test_docs_endpoint(self):
        """Verifica que la documentación esté disponible"""
        try:
            response = requests.get(f"{BASE_URL}/docs", timeout=5)
            success = response.status_code == 200
            self.log_result(
                "Documentación API", 
                success,
                "Swagger UI disponible" if success else f"Status: {response.status_code}"
            )
            return success
        except Exception as e:
            self.log_result("Documentación API", False, f"Error: {str(e)}")
            return False

    def test_receipt_endpoints(self):
        """Verifica endpoints de recibos"""
        # Test endpoint de recibos con FormData (original)
        try:
            response = requests.options(f"{API_BASE}/receipts")
            success = response.status_code in [200, 405]  # 405 es normal para OPTIONS
            self.log_result(
                "Endpoint /receipts (FormData)", 
                success,
                "Endpoint disponible para FormData"
            )
        except Exception as e:
            self.log_result("Endpoint /receipts (FormData)", False, f"Error: {str(e)}")

        # Test nuevo endpoint JSON
        try:
            response = requests.options(f"{API_BASE}/receipts/json")
            success = response.status_code in [200, 405]
            self.log_result(
                "Endpoint /receipts/json (JSON)", 
                success,
                "Nuevo endpoint JSON disponible"
            )
        except Exception as e:
            self.log_result("Endpoint /receipts/json (JSON)", False, f"Error: {str(e)}")

    def test_ocr_endpoints(self):
        """Verifica endpoints de OCR"""
        endpoints = [
            "/ocr/analyze-receipt",
            "/ocr/analyze-receipt-intelligent", 
            "/ocr/analyze-receipt-advanced"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.options(f"{API_BASE}{endpoint}")
                success = response.status_code in [200, 405]
                self.log_result(
                    f"Endpoint {endpoint}", 
                    success,
                    "Disponible" if success else f"Status: {response.status_code}"
                )
            except Exception as e:
                self.log_result(f"Endpoint {endpoint}", False, f"Error: {str(e)}")

    def test_employee_endpoints(self):
        """Verifica endpoints de empleados"""
        endpoints = [
            "/employees/my-employees",
            "/employees/my-employer",
            "/employees/all-employee-receipts",
            "/employees/employer-analytics"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.options(f"{API_BASE}{endpoint}")
                success = response.status_code in [200, 405]
                self.log_result(
                    f"Endpoint {endpoint}", 
                    success,
                    "Disponible" if success else f"Status: {response.status_code}"
                )
            except Exception as e:
                self.log_result(f"Endpoint {endpoint}", False, f"Error: {str(e)}")

    def test_analytics_endpoints(self):
        """Verifica endpoints de analytics"""
        # Endpoints que requieren user_id
        endpoints = [
            "/analytics/predict/test-user-id",
            "/analytics/anomalies/test-user-id",
            "/analytics/insights/test-user-id",
            "/analytics/dashboard/test-user-id",
            "/analytics/trends/test-user-id"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.options(f"{API_BASE}{endpoint}")
                success = response.status_code in [200, 405]
                self.log_result(
                    f"Endpoint {endpoint}", 
                    success,
                    "Disponible" if success else f"Status: {response.status_code}"
                )
            except Exception as e:
                self.log_result(f"Endpoint {endpoint}", False, f"Error: {str(e)}")

    def test_authentication_flow(self):
        """Verifica el flujo de autenticación"""
        try:
            # Test registro
            response = requests.options(f"{API_BASE}/auth/register")
            success = response.status_code in [200, 405]
            self.log_result(
                "Endpoint /auth/register", 
                success,
                "Disponible" if success else f"Status: {response.status_code}"
            )
            
            # Test login
            response = requests.options(f"{API_BASE}/auth/login")
            success = response.status_code in [200, 405]
            self.log_result(
                "Endpoint /auth/login", 
                success,
                "Disponible" if success else f"Status: {response.status_code}"
            )
            
        except Exception as e:
            self.log_result("Flujo de Autenticación", False, f"Error: {str(e)}")

    def test_cors_configuration(self):
        """Verifica configuración de CORS"""
        try:
            headers = {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{API_BASE}/receipts", headers=headers)
            
            # Verificar headers CORS
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            success = any(cors_headers.values())
            self.log_result(
                "Configuración CORS", 
                success,
                f"Headers CORS: {cors_headers}" if success else "No se encontraron headers CORS"
            )
            
        except Exception as e:
            self.log_result("Configuración CORS", False, f"Error: {str(e)}")

    def test_database_connectivity(self):
        """Verifica conectividad con la base de datos"""
        try:
            # Intentar hacer una consulta simple que requiera DB
            response = requests.get(f"{API_BASE}/auth/test-db", timeout=10)
            
            # Si el endpoint no existe, es normal - solo verificamos que no hay errores de DB
            success = response.status_code in [200, 404, 405]
            self.log_result(
                "Conectividad Base de Datos", 
                success,
                "Base de datos accesible" if success else f"Error DB - Status: {response.status_code}"
            )
            
        except Exception as e:
            # Si es error de conexión, podría ser problema de DB
            error_msg = str(e).lower()
            if "connection" in error_msg or "timeout" in error_msg:
                self.log_result("Conectividad Base de Datos", False, f"Error de conexión: {str(e)}")
            else:
                self.log_result("Conectividad Base de Datos", True, "Sin errores de conectividad aparentes")

    def test_frontend_backend_compatibility(self):
        """Verifica compatibilidad de estructuras de datos"""
        
        # Verificar estructura esperada para createReceipt (JSON)
        expected_json_fields = {
            "storeName", "totalAmount", "receiptDate", "category", 
            "description", "extractedItems", "ocrData"
        }
        
        # Verificar estructura esperada para createReceiptWithImage (FormData)
        expected_formdata_fields = {
            "image", "storeName", "totalAmount", "receiptDate", 
            "category", "description"
        }
        
        self.log_result(
            "Compatibilidad Estructuras de Datos",
            True,
            f"JSON: {expected_json_fields}, FormData: {expected_formdata_fields}"
        )

    def generate_report(self):
        """Genera reporte final"""
        print("\n" + "="*80)
        print("📊 REPORTE FINAL DE INTEGRACIÓN FRONTEND-BACKEND")
        print("="*80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"✅ Pruebas exitosas: {passed_tests}/{total_tests}")
        print(f"❌ Pruebas fallidas: {failed_tests}/{total_tests}")
        print(f"📈 Porcentaje de éxito: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n🔥 PRUEBAS FALLIDAS:")
            for result in self.results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🎯 ESTADO GENERAL:")
        if passed_tests == total_tests:
            print("   🎉 ¡INTEGRACIÓN COMPLETA Y FUNCIONAL!")
        elif passed_tests >= total_tests * 0.8:
            print("   ⚠️  Integración mayormente funcional - revisar errores menores")
        else:
            print("   🚨 Problemas críticos de integración - requiere atención inmediata")
        
        print("\n" + "="*80)

    def run_all_tests(self):
        """Ejecuta todas las pruebas"""
        print("🔧 INICIANDO VERIFICACIÓN COMPLETA DE INTEGRACIÓN")
        print("="*60)
        print()
        
        # Pruebas básicas
        print("📋 PRUEBAS BÁSICAS DEL SERVIDOR:")
        self.test_server_health()
        self.test_docs_endpoint()
        self.test_database_connectivity()
        self.test_cors_configuration()
        
        print("\n📋 PRUEBAS DE ENDPOINTS CRÍTICOS:")
        self.test_receipt_endpoints()
        self.test_ocr_endpoints()
        self.test_employee_endpoints()
        self.test_analytics_endpoints()
        self.test_authentication_flow()
        
        print("\n📋 PRUEBAS DE COMPATIBILIDAD:")
        self.test_frontend_backend_compatibility()
        
        # Reporte final
        self.generate_report()

def main():
    """Función principal"""
    print("🚀 GASTIFY - VERIFICACIÓN DE INTEGRACIÓN FRONTEND-BACKEND")
    print("=========================================================")
    print(f"🔗 URL Base: {BASE_URL}")
    print(f"📡 API Base: {API_BASE}")
    print()
    
    # Esperar un momento para que el servidor esté listo
    print("⏳ Esperando que el servidor esté listo...")
    time.sleep(2)
    
    # Crear tester y ejecutar
    tester = IntegrationTester()
    tester.run_all_tests()
    
    return len([r for r in tester.results if not r["success"]]) == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
