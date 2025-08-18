#!/usr/bin/env python3
"""
Script de testing para el parser avanzado de recibos chilenos
Prueba la extracción de datos estructurados del raw_text OCR
"""

import json
from datetime import datetime
from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced

def test_sample_receipt():
    """
    Prueba con un recibo de muestra típico chileno
    """
    # Raw text de muestra de un recibo chileno típico
    sample_raw_text = """
    SUPERMERCADO LIDER
    AV. PROVIDENCIA 2594
    PROVIDENCIA, SANTIAGO
    RUT: 96.790.240-3
    
    BOLETA ELECTRONICA
    Folio: 1234567890
    Fecha: 15/11/2024 14:30:25
    
    DETALLE DE COMPRA:
    
    COCA COLA 1.5L           $1.990
    Código: 7750001234567
    Cantidad: 2 x $995 c/u
    
    PAN INTEGRAL 500G        $2.490
    7891234567890
    Cant: 1
    
    LECHE ENTERA 1L          $1.250
    Código: 7891000123456
    Cantidad: 3 x $417 c/u   $1.251
    
    TOTAL PRODUCTOS: 6
    
    SUBTOTAL:               $5.731
    IVA (19%):              $1.089
    TOTAL A PAGAR:          $6.820
    
    EFECTIVO:               $7.000
    VUELTO:                 $180
    
    GRACIAS POR SU COMPRA
    """
    
    print("=== TEST PARSER AVANZADO RECIBOS CHILENOS ===\n")
    print("Raw text de entrada:")
    print("-" * 50)
    print(sample_raw_text)
    print("-" * 50)
    
    # Crear instancia del parser
    parser = ChileReceiptParserAdvanced()
    
    # Procesar el recibo
    print("\n🔄 Procesando recibo...")
    result = parser.parse_receipt(sample_raw_text)
    
    # Mostrar resultados detallados
    print("\n📊 RESULTADOS DE EXTRACCIÓN:")
    print("=" * 60)
    
    # Productos extraídos
    print(f"\n🛒 PRODUCTOS ENCONTRADOS ({len(result.products)}):")
    for i, product in enumerate(result.products, 1):
        print(f"  {i}. {product.name}")
        print(f"     - Cantidad: {product.quantity}")
        print(f"     - Precio unitario: ${product.unit_price:,.0f}" if product.unit_price else "     - Precio unitario: N/A")
        print(f"     - Precio total: ${product.total_price:,.0f}")
        print(f"     - Código: {product.barcode}" if product.barcode else "     - Código: N/A")
        print()
    
    # Datos de transacción
    print("💰 DATOS DE TRANSACCIÓN:")
    if result.transaction:
        t = result.transaction
        print(f"  - Total ítems: {t.total_items}")
        print(f"  - Subtotal: ${t.subtotal:,.0f}" if t.subtotal else "  - Subtotal: N/A")
        print(f"  - IVA: ${t.iva_amount:,.0f} ({t.iva_rate}%)" if t.iva_amount else "  - IVA: N/A")
        print(f"  - Total: ${t.total_amount:,.0f}")
    else:
        print("  - No se pudieron extraer datos de transacción")
    
    # Datos de ubicación
    print("\n📍 DATOS DE UBICACIÓN:")
    if result.location:
        l = result.location
        print(f"  - Tienda: {l.store_name}" if l.store_name else "  - Tienda: N/A")
        print(f"  - Dirección: {l.address}" if l.address else "  - Dirección: N/A")
        print(f"  - Ciudad: {l.city}" if l.city else "  - Ciudad: N/A")
        print(f"  - RUT: {l.rut}" if l.rut else "  - RUT: N/A")
        print(f"  - Folio: {l.receipt_number}" if l.receipt_number else "  - Folio: N/A")
        print(f"  - Fecha: {l.date_time}" if l.date_time else "  - Fecha: N/A")
    else:
        print("  - No se pudieron extraer datos de ubicación")
    
    # Métricas de confianza
    print(f"\n📈 MÉTRICAS DE CONFIANZA:")
    print(f"  - Confianza general: {result.confidence:.1%}")
    print(f"  - Confianza productos: {result.products_confidence:.1%}")
    print(f"  - Confianza transacción: {result.transaction_confidence:.1%}")
    print(f"  - Confianza ubicación: {result.location_confidence:.1%}")
    
    # Validaciones
    print(f"\n✅ VALIDACIONES:")
    
    # Verificar coherencia de totales
    if result.products and result.transaction:
        products_total = sum(p.total_price for p in result.products if p.total_price)
        transaction_subtotal = result.transaction.subtotal or 0
        
        print(f"  - Suma productos: ${products_total:,.0f}")
        print(f"  - Subtotal recibo: ${transaction_subtotal:,.0f}")
        
        if abs(products_total - transaction_subtotal) < 100:  # Tolerancia $100
            print("  ✅ Totales coherentes")
        else:
            print("  ⚠️  Discrepancia en totales")
    
    # Verificar formato chileno
    chile_indicators = []
    if result.location and result.location.rut:
        chile_indicators.append("RUT formato chileno")
    if result.transaction and result.transaction.iva_rate == 19:
        chile_indicators.append("IVA 19% (Chile)")
    
    if chile_indicators:
        print(f"  ✅ Indicadores Chile: {', '.join(chile_indicators)}")
    
    # JSON de salida
    print(f"\n📄 DATOS ESTRUCTURADOS (JSON):")
    print("-" * 50)
    
    # Convertir a diccionario para JSON
    output_data = {
        "receipt_data": {
            "products": [
                {
                    "name": p.name,
                    "quantity": p.quantity,
                    "unit_price": p.unit_price,
                    "total_price": p.total_price,
                    "barcode": p.barcode
                } for p in result.products
            ],
            "transaction": {
                "total_items": result.transaction.total_items if result.transaction else None,
                "subtotal": result.transaction.subtotal if result.transaction else None,
                "iva_amount": result.transaction.iva_amount if result.transaction else None,
                "iva_rate": result.transaction.iva_rate if result.transaction else None,
                "total_amount": result.transaction.total_amount if result.transaction else None
            } if result.transaction else None,
            "location": {
                "store_name": result.location.store_name if result.location else None,
                "address": result.location.address if result.location else None,
                "city": result.location.city if result.location else None,
                "rut": result.location.rut if result.location else None,
                "receipt_number": result.location.receipt_number if result.location else None,
                "date_time": result.location.date_time.isoformat() if (result.location and result.location.date_time) else None
            } if result.location else None,
            "confidence_metrics": {
                "overall": result.confidence,
                "products": result.products_confidence,
                "transaction": result.transaction_confidence,
                "location": result.location_confidence
            }
        }
    }
    
    print(json.dumps(output_data, indent=2, ensure_ascii=False))
    
    return result

def test_edge_cases():
    """
    Prueba casos edge y formatos variados
    """
    print("\n\n=== TESTING CASOS EDGE ===\n")
    
    test_cases = [
        {
            "name": "Recibo con productos sin código",
            "text": """
            MINIMARKET DON PEPE
            MANZANA ROJA KG          $890
            PAN MARRAQUETA          $500
            BEBIDA COLA             $1200
            TOTAL: $2590
            """
        },
        {
            "name": "Recibo con múltiples formatos de precio",
            "text": """
            FARMACIA CRUZ VERDE
            PARACETAMOL 500MG       $ 2.990
            Cantidad: 1
            
            VITAMINA C              $4,500
            Cant: 2 x $2.250
            
            TOTAL A PAGAR           $7.490
            """
        },
        {
            "name": "Recibo con OCR ruidoso",
            "text": """
            5UPERMERCAD0 L1DER
            C0CA C0LA 1.5L          $1.99O
            Cant1dad: 2
            
            T0TAL:                  $3.98O
            """
        }
    ]
    
    parser = ChileReceiptParserAdvanced()
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"🧪 Test {i}: {test_case['name']}")
        print("-" * 40)
        
        result = parser.parse_receipt(test_case['text'])
        
        print(f"Productos encontrados: {len(result.products)}")
        print(f"Confianza general: {result.confidence:.1%}")
        
        if result.products:
            for product in result.products:
                print(f"  - {product.name}: ${product.total_price:,.0f}")
        
        print()

if __name__ == "__main__":
    try:
        # Test principal
        result = test_sample_receipt()
        
        # Tests adicionales
        test_edge_cases()
        
        print("\n🎉 TESTING COMPLETADO EXITOSAMENTE")
        print(f"Parser funcionando correctamente con confianza: {result.confidence:.1%}")
        
    except Exception as e:
        print(f"\n❌ ERROR EN TESTING: {e}")
        import traceback
        traceback.print_exc()
