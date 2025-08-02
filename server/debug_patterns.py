#!/usr/bin/env python3
"""
Script de diagnóstico detallado para depurar los patrones regex en ItemExtractor
"""

import sys
import os
import re
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.receipt_parser.extractors.item_extractor import ItemExtractor

def debug_regex_patterns():
    """Prueba patrones regex específicos contra líneas de prueba."""
    
    print("=== DIAGNÓSTICO DE PATRONES REGEX ===\n")
    
    # Líneas de prueba específicas
    test_lines = [
        "1.5 kg PALTA HASS         $6.850",
        "84756382 PARACETAMOL 500MG 16COMP    $2.490"
    ]
    
    # Prueba patrones específicos
    patterns = [
        # Para palta
        r'(\d+\.\d+)\s+(kg|g|l|ml)\s+([A-Za-záéíóúñ\s]{2,30})\s+\$\s*(\d+\.\d{3})',
        
        # Para paracetamol
        r'(\d{7,10})\s+([A-Za-záéíóúñ\s0-9]+)\s+\$\s*(\d+\.\d{3})',
        r'(\d{7,10})\s+([A-ZÁÉÍÓÚÑ]+\s+\d+MG\s+\d+COMP)\s+\$\s*(\d+\.\d{3})',
        
        # Patrones más genéricos para experimentar
        r'(\d{7,10})\s+([A-Za-záéíóúñ\s0-9]+)(?:\s+\$\s*|\s+)(\d+\.\d{3})',
        r'(\d+\.\d+)\s+(kg|g|l|ml)\s+([A-Za-záéíóúñ\s]{2,30})(?:\s+\$\s*|\s+)(\d+\.\d{3})'
    ]
    
    for i, line in enumerate(test_lines):
        print(f"LÍNEA {i+1}: '{line}'")
        
        for j, pattern in enumerate(patterns):
            regex = re.compile(pattern, re.IGNORECASE)
            match = regex.search(line)
            
            print(f"  Patrón {j+1}: {pattern}")
            if match:
                print(f"    ¡COINCIDENCIA! Grupos: {match.groups()}")
            else:
                print(f"    Sin coincidencia")
        
        print("\n" + "-"*50 + "\n")
    
    # Probar extracción completa
    print("=== PRUEBA DE EXTRACCIÓN COMPLETA ===\n")
    
    # Instanciar extractor
    extractor = ItemExtractor()
    
    # Recibos de prueba
    test_receipts = {
        "receipt_with_quantities": """
        SUPER LÍDER EXPRESS
        
        FECHA: 14/07/2024
        
        2 x COCA COLA 2L          $4.790
        1.5 kg PALTA HASS         $6.850
        3 x CHOCOLATE 100G        $3.450
        1 x PAPEL HIGIÉNICO 4UN   $2.990
        
        SUBTOTAL                 $18.080
        IVA                       $3.435
        TOTAL                    $21.515
        """,
        
        "receipt_mixed_format": """
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
    }
    
    for name, receipt in test_receipts.items():
        print(f"RECIBO: {name}")
        
        # Extraer y mostrar líneas que podrían ser ítems
        lines = [line.strip() for line in receipt.split('\n') if line.strip()]
        print("  Líneas potenciales detectadas:")
        for line in lines:
            if extractor._is_potential_item_line(line):
                print(f"    - {line}")
        
        # Extraer ítems
        items = extractor.extract_items_detailed(receipt)
        print(f"  Items extraídos ({len(items)}):")
        for item in items:
            print(f"    - {item.description}: cantidad={item.quantity}, "
                  f"unidad={item.unit}, precio_total={item.total_price}, "
                  f"precio_unitario={item.unit_price}")
        
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    debug_regex_patterns()
