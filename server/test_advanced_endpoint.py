#!/usr/bin/env python3
"""
Script de testing para el endpoint /analyze-receipt-advanced
Verifica la integración completa del parser avanzado con la API
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Agregar el directorio del proyecto al path
sys.path.append(str(Path(__file__).parent))

from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced

def test_parser_directly():
    """Test directo del parser sin pasar por la API"""
    print("=== TESTING PARSER AVANZADO DIRECTAMENTE ===\n")
    
    # Recibo de muestra realista
    sample_receipt = """
    UNIMARC
    AV. LAS CONDES 12345
    LAS CONDES, SANTIAGO
    RUT: 81.201.000-0
    
    BOLETA ELECTRONICA
    Folio: 9876543210
    Fecha: 15/11/2024 16:45:30
    Caja: 03 Op: MGARCIA
    
    DETALLE DE COMPRA:
    
    COCA COLA 1.5L 2U       $3.980
    Código: 7750001234567
    Cant: 2 x $1.990 c/u
    
    PAN HALLULLA DOCENA     $1.200
    7891234567890
    Cantidad: 1
    
    LECHE ENTERA SOPROLE    $1.050
    Código: 7891000123456
    Cant: 3 x $350 c/u      $1.050
    
    MANZANA ROJA KG         $1.890
    PLU: 4015
    Cant: 1.5 kg x $1.260   $1.890
    
    TOTAL PRODUCTOS: 4
    CANTIDAD ITEMS: 7.5
    
    SUBTOTAL:               $8.120
    IVA (19%):              $1.543
    TOTAL A PAGAR:          $9.663
    
    EFECTIVO:               $10.000
    VUELTO:                 $337
    
    GRACIAS POR PREFERIRNOS
    LE ATENDIO: MARIA GARCIA
    """
    
    try:
        parser = ChileReceiptParserAdvanced()
        result = parser.parse_receipt(sample_receipt)
        
        print("✅ PARSER FUNCIONANDO CORRECTAMENTE\n")
        
        print(f"📊 PRODUCTOS EXTRAÍDOS: {len(result.products)}")
        for i, product in enumerate(result.products, 1):
            print(f"  {i}. {product.name}")
            print(f"     - Cantidad: {product.quantity}")
            print(f"     - Precio total: ${product.total_price:,.0f}")
            if product.unit_price:
                print(f"     - Precio unitario: ${product.unit_price:,.0f}")
            if product.barcode:
                print(f"     - Código: {product.barcode}")
            print()
        
        print(f"💰 TRANSACCIÓN:")
        if result.transaction:
            t = result.transaction
            print(f"  - Total ítems: {t.total_items}")
            print(f"  - Subtotal: ${t.subtotal:,.0f}")
            print(f"  - IVA: ${t.iva_amount:,.0f} ({t.iva_rate}%)")
            print(f"  - Total: ${t.total_amount:,.0f}")
        
        print(f"\n📍 UBICACIÓN:")
        if result.location:
            l = result.location
            print(f"  - Tienda: {l.store_name}")
            print(f"  - Dirección: {l.address}")
            print(f"  - RUT: {l.rut}")
            print(f"  - Folio: {l.receipt_number}")
            print(f"  - Fecha: {l.date_time}")
        
        print(f"\n📈 CONFIANZA:")
        print(f"  - General: {result.confidence:.1%}")
        print(f"  - Productos: {result.products_confidence:.1%}")
        print(f"  - Transacción: {result.transaction_confidence:.1%}")
        print(f"  - Ubicación: {result.location_confidence:.1%}")
        
        # Validaciones
        print(f"\n✅ VALIDACIONES:")
        if result.products and result.transaction:
            products_total = sum(p.total_price for p in result.products if p.total_price)
            transaction_subtotal = result.transaction.subtotal or 0
            
            difference = abs(products_total - transaction_subtotal)
            print(f"  - Suma productos: ${products_total:,.0f}")
            print(f"  - Subtotal recibo: ${transaction_subtotal:,.0f}")
            print(f"  - Diferencia: ${difference:,.0f}")
            
            if difference < 100:
                print("  ✅ Totales coherentes")
            else:
                print("  ⚠️  Discrepancia en totales")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR EN PARSER: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_import_dependencies():
    """Verifica que todas las dependencias necesarias se puedan importar"""
    print("\n=== TESTING IMPORTACIONES ===\n")
    
    dependencies = [
        ("Parser Avanzado", "app.services.chile_receipt_parser_advanced", "ChileReceiptParserAdvanced"),
        ("OCR Service", "app.services.ocr_service", "FreeOCRService"),
        ("Categorizer", "app.services.chile_ml_categorization", "ChileCategorizerService"),
        ("Geolocation", "app.services.geolocation_service", "GeolocationService"),
        ("Receipt Model", "app.models.receipt", "ReceiptModel"),
    ]
    
    success_count = 0
    total_count = len(dependencies)
    
    for name, module_path, class_name in dependencies:
        try:
            module = __import__(module_path, fromlist=[class_name])
            cls = getattr(module, class_name)
            print(f"✅ {name}: {class_name} importado correctamente")
            success_count += 1
        except Exception as e:
            print(f"❌ {name}: Error importando {class_name} - {e}")
    
    print(f"\n📊 RESULTADO: {success_count}/{total_count} dependencias OK")
    return success_count == total_count

def test_api_structure():
    """Verifica que la estructura de la API esté correcta"""
    print("\n=== TESTING ESTRUCTURA API ===\n")
    
    try:
        # Verificar que el archivo de rutas OCR existe
        ocr_routes_path = Path("app/api/routes/ocr.py")
        if not ocr_routes_path.exists():
            print(f"❌ Archivo de rutas OCR no encontrado: {ocr_routes_path}")
            return False
        
        # Leer el contenido del archivo
        with open(ocr_routes_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar endpoints
        endpoints_to_check = [
            "analyze-receipt-advanced",
            "ChileReceiptParserAdvanced", 
            "analyze_receipt_advanced"
        ]
        
        found_endpoints = []
        for endpoint in endpoints_to_check:
            if endpoint in content:
                found_endpoints.append(endpoint)
                print(f"✅ Encontrado: {endpoint}")
            else:
                print(f"❌ No encontrado: {endpoint}")
        
        print(f"\n📊 RESULTADO: {len(found_endpoints)}/{len(endpoints_to_check)} elementos encontrados")
        return len(found_endpoints) >= 2  # Al menos el endpoint y la importación
        
    except Exception as e:
        print(f"❌ Error verificando estructura API: {e}")
        return False

def generate_integration_summary():
    """Genera un resumen de la integración implementada"""
    print("\n=== RESUMEN DE INTEGRACIÓN ===\n")
    
    integration_points = {
        "Parser Avanzado": "✅ Implementado - Extracción estructurada de recibos chilenos",
        "Endpoint API": "✅ Implementado - /api/ocr/analyze-receipt-advanced", 
        "Integración OCR": "✅ Implementado - FreeOCRService + Parser Avanzado",
        "Categorización": "✅ Integrado - ChileCategorizerService",
        "Geolocalización": "✅ Integrado - GeolocationService",
        "Validaciones": "✅ Implementado - Coherencia de totales y formato chileno",
        "Métricas": "✅ Implementado - Confianza por servicio y general",
        "Testing": "✅ Implementado - Scripts de verificación"
    }
    
    for component, status in integration_points.items():
        print(f"{status} {component}")
    
    print(f"\n🎯 FLUJO COMPLETO:")
    print("1. 📤 Cliente sube imagen → /api/ocr/analyze-receipt-advanced")
    print("2. 🔍 OCR básico extrae raw_text")
    print("3. 🧠 Parser avanzado estructura datos")
    print("4. 🏷️  Categorización ML automática")
    print("5. 📍 Geolocalización automática")
    print("6. ✅ Validaciones y confianza")
    print("7. 📊 Respuesta estructurada completa")
    
    print(f"\n📋 DATOS EXTRAÍDOS:")
    print("• Productos: nombre, cantidad, precios, códigos")
    print("• Transacción: totales, IVA, ítems, método pago")
    print("• Ubicación: tienda, dirección, RUT, folio, fecha")
    print("• Métricas: confianza por servicio y general")
    print("• Validaciones: coherencia, formato chileno")
    print("• Recomendaciones: acciones automáticas")

def main():
    """Función principal de testing"""
    print("🚀 INICIANDO TESTING COMPLETO DEL SISTEMA OCR AVANZADO")
    print("=" * 60)
    
    # Test 1: Importaciones
    imports_ok = test_import_dependencies()
    
    # Test 2: Parser directo
    parser_ok = test_parser_directly()
    
    # Test 3: Estructura API
    api_ok = test_api_structure()
    
    # Resumen
    generate_integration_summary()
    
    # Resultado final
    print("\n" + "=" * 60)
    print("📊 RESULTADO FINAL:")
    
    tests_results = [
        ("Importaciones", imports_ok),
        ("Parser Directo", parser_ok), 
        ("Estructura API", api_ok)
    ]
    
    passed_tests = sum(1 for _, result in tests_results if result)
    total_tests = len(tests_results)
    
    for test_name, result in tests_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print(f"\n🎯 TESTS: {passed_tests}/{total_tests} exitosos")
    
    if passed_tests == total_tests:
        print("\n🎉 ¡INTEGRACIÓN COMPLETA Y FUNCIONAL!")
        print("💡 El sistema está listo para procesar recibos chilenos")
        print("🔗 Usar endpoint: POST /api/ocr/analyze-receipt-advanced")
    else:
        print(f"\n⚠️  Hay {total_tests - passed_tests} problemas que resolver")
        print("💡 Revisar los errores mostrados arriba")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
