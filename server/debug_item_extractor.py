#!/usr/bin/env python3
"""
Script de depuración para ItemExtractor.
"""

import sys
import os

# Añadir el directorio del proyecto al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.receipt_parser.extractors.item_extractor import ItemExtractor

def debug_item_extraction():
    """Depura la extracción de ítems paso a paso."""
    
    extractor = ItemExtractor()
    
    # Texto de prueba simple
    test_receipt = """
    SUPERMERCADO JUMBO
    
    PAN INTEGRAL 1KG          $2.590
    LECHE DESCREMADA 1L       $1.190
    QUESO GOUDA 250G          $3.450
    
    TOTAL                    $7.230
    """
    
    print("=== DEPURACIÓN ITEMEXTRACTOR ===")
    print(f"Texto de entrada:\n{test_receipt}")
    print("\n" + "="*50)
    
    # Probar línea por línea
    lines = [line.strip() for line in test_receipt.split('\n') if line.strip()]
    
    print("\n1. ANÁLISIS LÍNEA POR LÍNEA:")
    for i, line in enumerate(lines):
        print(f"  Línea {i}: '{line}'")
        is_item = extractor._is_potential_item_line(line)
        print(f"    ¿Es ítem potencial? {is_item}")
        
        if is_item:
            # Probar extracción básica
            basic_item = extractor._extract_basic_item_from_line(line)
            print(f"    Extracción básica: {basic_item}")
            
            # Probar extracción avanzada con debug detallado
            print(f"    Probando extracción avanzada...")
            try:
                # Probar patrones de media confianza manualmente
                for i, pattern in enumerate(extractor.patterns['item_lines']['medium']):
                    match = pattern.search(line)
                    if match:
                        print(f"      Patrón {i} encontrado: {match.groups()}")
                        try:
                            item = extractor._create_item_from_match(match, line, 'medium')
                            print(f"      Ítem creado: {item}")
                            if item:
                                print(f"        - Descripción: {item.description}")
                                print(f"        - Cantidad: {item.quantity}")
                                print(f"        - Unidad: {item.unit}")
                                print(f"        - Precio total: {item.total_price}")
                                print(f"        - Es válido: {item.is_valid()}")
                        except Exception as e:
                            print(f"      Error creando ítem: {e}")
                            import traceback
                            traceback.print_exc()
                        break
                
                advanced_item = extractor._extract_item_from_line(line, 'spa')
                print(f"    Extracción avanzada final: {advanced_item}")
            except Exception as e:
                print(f"    Error en extracción avanzada: {e}")
                import traceback
                traceback.print_exc()
        
        print()
    
    print("\n2. EXTRACCIÓN BÁSICA COMPLETA:")
    basic_items = extractor.extract_items_basic(test_receipt)
    print(f"  Ítems extraídos: {len(basic_items)}")
    for item in basic_items:
        print(f"    - {item.description}: ${item.total_price}")
    
    print("\n3. EXTRACCIÓN DETALLADA COMPLETA:")
    print("  DEBUG: Iniciando extracción detallada...")
    
    # Ejecutar con logging detallado
    try:
        clean_text = extractor._clean_text(test_receipt)
        print(f"  DEBUG: Texto limpio:\n{clean_text}")
        
        # Analizar línea por línea manualmente para debug
        print("  DEBUG: Análisis línea por línea:")
        debug_items = []
        debug_lines = [line.strip() for line in clean_text.split('\n') if line.strip()]
        
        for i, line in enumerate(debug_lines):
            print(f"    DEBUG: Procesando línea {i}: '{line}'")
            if not extractor._is_potential_item_line(line):
                print(f"      DEBUG: No es ítem potencial, saltando")
                continue
                
            print(f"      DEBUG: Es ítem potencial, extrayendo...")
            item = extractor._extract_item_from_line(line, 'spa')
            if item:
                print(f"        DEBUG: Ítem extraído: {item.description} ${item.total_price}")
                if item.is_valid():
                    print(f"        DEBUG: Ítem válido, añadiendo")
                    debug_items.append(item)
                else:
                    print(f"        DEBUG: Ítem inválido, descartando")
            else:
                print(f"        DEBUG: No se pudo extraer ítem")
        
        print(f"  DEBUG: Ítems antes de post-procesamiento: {len(debug_items)}")
        # Intentar ahora la extracción normal
        detailed_items = extractor.extract_items_detailed(test_receipt)
        print(f"  Ítems extraídos: {len(detailed_items)}")
        for item in detailed_items:
            print(f"    - {item.description}: ${item.total_price} (conf: {item.confidence:.2f})")
    except Exception as e:
        print(f"  ERROR en extracción detallada: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n4. PRUEBA DE PATRONES INDIVIDUALES:")
    test_line = "PAN INTEGRAL 1KG          $2.590"
    print(f"  Línea de prueba: '{test_line}'")
    
    # Probar patrones de alta confianza
    print("  Patrones de alta confianza:")
    for i, pattern in enumerate(extractor.patterns['item_lines']['high']):
        match = pattern.search(test_line)
        print(f"    Patrón {i}: {match.groups() if match else 'No match'}")
    
    # Probar patrones de media confianza
    print("  Patrones de media confianza:")
    for i, pattern in enumerate(extractor.patterns['item_lines']['medium']):
        match = pattern.search(test_line)
        print(f"    Patrón {i}: {match.groups() if match else 'No match'}")

if __name__ == "__main__":
    debug_item_extraction()
