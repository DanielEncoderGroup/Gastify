#!/usr/bin/env python3
"""
Script de testing específico para debugging de extracción de productos
Simula el flujo completo del endpoint /api/ocr/analyze-receipt-advanced
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced

def test_product_extraction():
    """
    Prueba la extracción de productos con el raw_text exacto del usuario
    """
    print("🧪 TESTING: Product Extraction Debug")
    print("=" * 60)
    
    # Raw text exacto del usuario 
    raw_text = """2X1.000
BEN AGUA PER
$ 2.000
1X1.500
PAN IDEAL
$ 1.500
1X2.000
LECHE COLUN
$ 2.000
SUBTOTAL $ 5.500
IVA $ 1.045
TOTAL $ 6.545"""

    print(f"📝 Raw Text a procesar:")
    print(f"'{raw_text}'")
    print("-" * 40)
    
    # Inicializar parser
    parser = ChileReceiptParserAdvanced()
    
    # Procesar con parser avanzado
    print("🔍 Ejecutando ChileReceiptParserAdvanced...")
    parsed_result = parser.parse(raw_text)
    
    # Verificar productos extraídos
    print(f"\n📊 RESULTADOS:")
    print(f"Productos encontrados: {len(parsed_result.products)}")
    
    if parsed_result.products:
        print("\n🛒 PRODUCTOS DETALLADOS:")
        for i, product in enumerate(parsed_result.products, 1):
            print(f"  {i}. {product.name}")
            print(f"     Cantidad: {product.quantity}")
            print(f"     Precio Unit: ${product.unit_price:,.0f}")
            print(f"     Total: ${product.total_price:,.0f}")
            print(f"     Confianza: {product.confidence:.1%}")
            print(f"     Raw Line: '{product.raw_line}'")
            print()
    else:
        print("❌ NO se encontraron productos")
        
    # Verificar totales
    if parsed_result.transaction:
        print(f"💰 TRANSACCIÓN:")
        print(f"  Subtotal: ${parsed_result.transaction.subtotal or 0:,.0f}")
        print(f"  IVA: ${parsed_result.transaction.iva_amount or 0:,.0f}")  
        print(f"  Total: ${parsed_result.transaction.total_amount or 0:,.0f}")
        
    # Simular mapeo del endpoint (líneas 467-487 en ocr.py)
    print(f"\n🔄 SIMULANDO MAPEO BACKEND:")
    structured_products = []
    for product in parsed_result.products:
        structured_products.append({
            "name": product.name,
            "quantity": product.quantity,
            "unit_price": product.unit_price,
            "total_price": product.total_price,
            "barcode": product.barcode,
            "sku": product.sku,
            "confidence": product.confidence
        })
    
    print(f"Productos mapeados: {len(structured_products)}")
    for i, product in enumerate(structured_products, 1):
        print(f"  {i}. {product}")
    
    # Simular suggested_form_data (línea 483)
    suggested_form_data = {
        "detailed_products": structured_products
    }
    
    print(f"\n📤 RESPUESTA SIMULADA AL FRONTEND:")
    print(f"suggested_form_data.detailed_products: {len(suggested_form_data['detailed_products'])} productos")
    
    if suggested_form_data['detailed_products']:
        print("✅ SUCCESS: Productos serían enviados al frontend")
        return True
    else:
        print("❌ FAIL: No hay productos en respuesta")
        return False

def test_regex_patterns():
    """
    Prueba los patrones regex específicos con el raw_text del usuario
    """
    print("\n🔧 TESTING: Regex Patterns")
    print("=" * 60)
    
    parser = ChileReceiptParserAdvanced()
    raw_text = """2X1.000
BEN AGUA PER
$ 2.000"""
    
    print(f"Texto de prueba: '{raw_text}'")
    print("\n🔍 Patterns disponibles:")
    for pattern_name, pattern in parser.patterns.items():
        print(f"  - {pattern_name}: {pattern.pattern}")
        
        matches = list(pattern.finditer(raw_text))
        if matches:
            print(f"    ✅ {len(matches)} matches encontrados")
            for match in matches:
                print(f"       Groups: {match.groups()}")
        else:
            print(f"    ❌ Sin matches")
    
if __name__ == "__main__":
    # Test principal
    success = test_product_extraction()
    
    # Test regex detallado
    test_regex_patterns()
    
    print(f"\n🎯 RESULTADO FINAL:")
    if success:
        print("✅ Extracción funcionando correctamente")
        print("💡 Si frontend no muestra productos, verificar:")
        print("   1. Conexión de red al backend")
        print("   2. Logs de consola del frontend")
        print("   3. Response del endpoint real")
    else:
        print("❌ Problema en extracción de productos")
        print("💡 Revisar patrones regex o implementar fallback")
