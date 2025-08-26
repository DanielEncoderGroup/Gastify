#!/usr/bin/env python3
"""
Script de testing para validar extracción de productos del raw_text
Simula el flujo completo del endpoint /api/ocr/analyze-receipt-advanced
"""

import sys
import logging
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Agregar el directorio app al path
sys.path.append('app')

from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced

def test_product_extraction():
    """Prueba la extracción de productos con el raw_text del usuario"""
    
    # Raw text exacto del usuario
    raw_text = """2X1.000
BEN AGUA PER
$ 2.000
7803468005005 MOLD INT 630
$ 2.890
7802420010958 SUFLE QUE
$
1.000
7802215505027 GALLETA OBSE
$
1.000
7802800544325 NECTAR DURA
$
470
7802215515026 GALL.GRETEL
$
1.000"""

    print("🧪 TEST DE EXTRACCIÓN DE PRODUCTOS")
    print("=" * 50)
    print(f"📄 RAW TEXT DE ENTRADA:")
    print(raw_text)
    print("=" * 50)
    
    # Inicializar parser
    parser = ChileReceiptParserAdvanced()
    
    # Parsear recibo
    print("🔄 Parseando recibo...")
    parsed_result = parser.parse_receipt(raw_text)
    
    # Resultados
    print(f"\n📊 RESULTADOS:")
    print(f"✓ Productos encontrados: {len(parsed_result.products)}")
    print(f"✓ Confianza general: {parsed_result.confidence:.2%}")
    print(f"✓ Confianza productos: {parsed_result.products_confidence:.2%}")
    
    # Detalles de productos
    print(f"\n🛒 PRODUCTOS EXTRAÍDOS:")
    if parsed_result.products:
        for i, product in enumerate(parsed_result.products, 1):
            print(f"  {i}. {product.name}")
            print(f"     - Cantidad: {product.quantity}")
            print(f"     - Precio total: ${product.total_price:,.0f}")
            print(f"     - Precio unitario: ${product.unit_price or 0:,.0f}")
            print(f"     - Código de barras: {product.barcode or 'N/A'}")
            print(f"     - Confianza: {product.confidence:.2%}")
            print()
    else:
        print("  ❌ NO SE ENCONTRARON PRODUCTOS")
    
    # Datos de transacción
    if parsed_result.transaction:
        print(f"💰 DATOS DE TRANSACCIÓN:")
        print(f"  - Total: ${parsed_result.transaction.total_amount:,.0f}")
        print(f"  - Subtotal: ${parsed_result.transaction.subtotal:,.0f}")
        print(f"  - IVA: ${parsed_result.transaction.iva_amount:,.0f}")
        print(f"  - Items totales: {parsed_result.transaction.total_items}")
    
    # Estructura para API response
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
    
    print(f"\n🔗 ESTRUCTURA PARA API RESPONSE:")
    print(f"suggested_form_data.detailed_products = {structured_products}")
    
    # Verificar si el frontend los recibiría
    print(f"\n🎯 VERIFICACIÓN FRONTEND:")
    if structured_products:
        print(f"✅ Frontend recibiría {len(structured_products)} productos")
        print(f"✅ Campo 'detailed_products' populated: True")
        
        # Simular mapeo del frontend
        frontend_products = []
        for index, product in enumerate(structured_products):
            frontend_product = {
                'id': f'temp_{index}',
                'name': product['name'],
                'barcode': product['barcode'],
                'quantity': product['quantity'],
                'unit_price': product['unit_price'],
                'total_price': product['total_price'],
                'confidence': product['confidence'] or 0.7,
                'extraction_method': 'advanced_parser',
                'created_at': '2025-08-26T21:17:00.000Z'
            }
            frontend_products.append(frontend_product)
        
        print(f"✅ Productos mapeados para ProductList: {len(frontend_products)}")
    else:
        print(f"❌ Frontend NO recibiría productos")
        print(f"❌ Campo 'detailed_products' empty/missing")
    
    return {
        'success': len(parsed_result.products) > 0,
        'products_found': len(parsed_result.products),
        'structured_products': structured_products,
        'confidence': parsed_result.confidence,
        'raw_products': parsed_result.products
    }

def test_individual_patterns():
    """Prueba patrones individuales del parser"""
    
    print("\n🔍 TEST DE PATRONES INDIVIDUALES")
    print("=" * 50)
    
    parser = ChileReceiptParserAdvanced()
    
    # Test casos específicos del raw_text del usuario
    test_cases = [
        ("Producto con cantidad", "2X1.000\nBEN AGUA PER\n$ 2.000"),
        ("Producto con barcode", "7803468005005 MOLD INT 630\n$ 2.890"),
        ("Producto simple", "GALLETA OBSE\n$\n1.000"),
        ("Producto con formato especial", "NECTAR DURA\n$\n470")
    ]
    
    for name, text in test_cases:
        print(f"\n🧩 {name}:")
        print(f"   Texto: {repr(text)}")
        
        # Probar cada patrón relevante
        for pattern_name, pattern in parser.patterns.items():
            if 'product' in pattern_name:
                matches = pattern.findall(text)
                if matches:
                    print(f"   ✅ {pattern_name}: {matches}")

if __name__ == "__main__":
    result = test_product_extraction()
    test_individual_patterns()
    
    print(f"\n🏁 RESUMEN FINAL:")
    print(f"   - Éxito: {'✅' if result['success'] else '❌'}")
    print(f"   - Productos encontrados: {result['products_found']}")
    print(f"   - Confianza: {result['confidence']:.2%}")
    
    if not result['success']:
        print(f"\n🚨 PROBLEMA DETECTADO:")
        print(f"   - El parser NO está extrayendo productos del raw_text")
        print(f"   - Revisar patrones regex en ChileReceiptParserAdvanced")
        print(f"   - Posible problema de formato de saltos de línea")
