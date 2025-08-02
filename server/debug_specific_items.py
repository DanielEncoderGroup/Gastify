#!/usr/bin/env python3
"""
Script de depuración específico para los casos problemáticos.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.receipt_parser.extractors.item_extractor import ItemExtractor

def debug_specific_cases():
    extractor = ItemExtractor()
    
    print("=== DEPURACIÓN CASOS ESPECÍFICOS ===\n")
    
    # Caso 1: Coca Cola con cantidad
    receipt_with_quantities = """
    SUPER LÍDER EXPRESS
    
    FECHA: 14/07/2024
    
    2 x COCA COLA 2L          $4.790
    1.5 kg PALTA HASS         $6.850
    3 x CHOCOLATE 100G        $3.450
    1 x PAPEL HIGIÉNICO 4UN   $2.990
    
    SUBTOTAL                 $18.080
    IVA                       $3.435
    TOTAL                    $21.515
    """
    
    print("1. CASO COCA COLA:")
    print("Línea: '2 x COCA COLA 2L          $4.790'")
    
    # Probar extracción línea por línea
    line = "2 x COCA COLA 2L          $4.790"
    item = extractor._extract_item_from_line(line, 'spa')  # Español
    if item:
        print(f"  - Descripción: {item.description}")
        print(f"  - Cantidad: {item.quantity}")
        print(f"  - Precio total: {item.total_price}")
        print(f"  - Precio unitario: {item.unit_price}")
    else:
        print("  - No se pudo extraer el ítem")
    
    # Probar extracción completa
    items = extractor.extract_items_detailed(receipt_with_quantities)
    coca_cola_item = next((item for item in items if "coca cola" in item.description.lower()), None)
    if coca_cola_item:
        print(f"  - Extracción completa - Precio total: {coca_cola_item.total_price}")
        print(f"  - Extracción completa - Cantidad: {coca_cola_item.quantity}")
    
    print("\n" + "="*50 + "\n")
    
    # Caso 2: Paracetamol con código
    receipt_mixed_format = """
    FARMACIA AHUMADA
    
    TICKET #A-56789
    15/07/2024
    
    84756382 PARACETAMOL 500MG 16COMP    $2.490
    79845123 IBUPROFENO 400MG 10COMP     $3.190
    PROTECTOR SOLAR FPS50 120ML          $8.990
    ALCOHOL GEL 60ML                     $1.590
    
    SUBTOTAL     $16.260
    IVA 19%       $3.089
    TOTAL        $19.349
    """
    
    print("2. CASO PARACETAMOL:")
    print("Línea: '84756382 PARACETAMOL 500MG 16COMP    $2.490'")
    
    # Probar extracción línea por línea
    line = "84756382 PARACETAMOL 500MG 16COMP    $2.490"
    item = extractor._extract_item_from_line(line, 'spa')  # Español
    if item:
        print(f"  - Descripción: {item.description}")
        print(f"  - Cantidad: {item.quantity}")
        print(f"  - Precio total: {item.total_price}")
        print(f"  - SKU: {item.sku}")
    else:
        print("  - No se pudo extraer el ítem")
    
    # Probar extracción completa
    items = extractor.extract_items_detailed(receipt_mixed_format)
    paracetamol_item = next((item for item in items if "paracetamol" in item.description.lower()), None)
    if paracetamol_item:
        print(f"  - Extracción completa - Precio total: {paracetamol_item.total_price}")
        print(f"  - Extracción completa - Descripción: {paracetamol_item.description}")
    
    print("\n" + "="*50 + "\n")
    
    # Probar conversión de precios directamente
    print("3. PRUEBA DE CONVERSIÓN DE PRECIOS:")
    test_prices = ["4.790", "2.490", "6.850"]
    for price in test_prices:
        converted = extractor._convert_to_chilean_price(price)
        parsed = extractor._parse_number(price)
        print(f"  - Precio '{price}': convert_to_chilean={converted}, parse_number={parsed}")

if __name__ == "__main__":
    debug_specific_cases()
