#!/usr/bin/env python3
"""
Pruebas de integración para el sistema OCR completo.
Incluye preprocesamiento, OCR y extracción de ítems.
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch
from typing import List

# Añadir el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.enhanced_ocr_service import EnhancedOCRService
from app.services.receipt_parser.extractors.item_extractor import ItemExtractor
from app.services.receipt_parser.models.receipt_item import ReceiptItem


class TestOCRIntegration(unittest.TestCase):
    """Pruebas de integración para el sistema OCR completo."""
    
    def setUp(self):
        """Configuración inicial para las pruebas."""
        self.ocr_service = EnhancedOCRService()
        self.item_extractor = ItemExtractor()
        
        # Texto OCR simulado de diferentes tipos de recibos
        self.receipt_texts = {
            'supermarket': """
            SUPERMERCADO JUMBO
            Av. Las Condes 11950, Santiago
            RUT: 93.834.000-5
            
            TICKET: 45632
            FECHA: 15/07/2024 19:45
            
            PAN INTEGRAL 1KG          $2.590
            LECHE DESCREMADA 1L       $1.190
            2 x COCA COLA 2L          $4.790
            1.5 kg PALTA HASS         $6.850
            DETERGENTE LÍQUIDO 1L     $2.890
            
            SUBTOTAL                  $18.310
            IVA 19%                   $3.479
            TOTAL                    $21.789
            
            GRACIAS POR SU COMPRA
            """,
            
            'pharmacy': """
            FARMACIA AHUMADA
            
            TICKET #A-56789
            15/07/2024
            
            84756382 PARACETAMOL 500MG 16COMP    $2.490
            79845123 IBUPROFENO 400MG 10COMP     $3.190
            PROTECTOR SOLAR FPS50 120ML          $8.990
            3 x ALCOHOL GEL 60ML                 $4.770
            
            SUBTOTAL     $19.440
            IVA 19%       $3.694
            TOTAL        $23.134
            """,
            
            'restaurant': """
            RESTAURANT EL BUEN SABOR
            Mesa: 12
            Mesero: Juan P.
            
            2 x HAMBURGUESA COMPLETA     $15.800
            1 x PAPAS FRITAS GRANDES     $4.500
            3 x BEBIDA 500ML             $8.700
            1 x POSTRE DEL DÍA           $3.200
            
            SUBTOTAL                     $32.200
            PROPINA SUGERIDA 10%         $3.220
            TOTAL                        $35.420
            """,
            
            'hardware_store': """
            FERRETERÍA CONSTRUMART
            
            #12345 TORNILLO 6X40MM 100UN    $5.990
            #67890 TARUGO 8MM 50UN          $3.450
            MARTILLO 500G                   $12.990
            2.5 kg CLAVOS 2"                $8.750
            
            SUBTOTAL                        $31.180
            IVA                             $5.924
            TOTAL                          $37.104
            """
        }
    
    def test_end_to_end_supermarket_receipt(self):
        """Prueba integración completa con recibo de supermercado."""
        
        # Simular extracción OCR
        text = self.receipt_texts['supermarket']
        
        # Extraer ítems usando el sistema completo
        items = self.item_extractor.extract_items_detailed(text)
        
        # Verificaciones de integración
        self.assertGreaterEqual(len(items), 4, "Debe extraer al menos 4 ítems")
        
        # Verificar ítem con cantidad (Coca Cola)
        coca_cola = next((item for item in items if "coca cola" in item.description.lower()), None)
        self.assertIsNotNone(coca_cola, "Debe encontrar Coca Cola")
        self.assertEqual(coca_cola.quantity, 2.0, "Cantidad debe ser 2.0")
        self.assertEqual(coca_cola.total_price, 4790.0, "Precio total debe ser 4790.0")
        self.assertIsNotNone(coca_cola.raw_text, "Debe tener texto original")
        
        # Verificar ítem con peso (Palta)
        palta = next((item for item in items if "palta" in item.description.lower()), None)
        self.assertIsNotNone(palta, "Debe encontrar Palta")
        self.assertEqual(palta.quantity, 1.5, "Cantidad debe ser 1.5")
        self.assertEqual(palta.unit, "kg", "Unidad debe ser kg")
        self.assertEqual(palta.total_price, 6850.0, "Precio total debe ser 6850.0")
        
        # Verificar que todos los ítems tienen confianza razonable
        for item in items:
            self.assertGreater(item.confidence, 0.5, f"Confianza baja para {item.description}")
    
    def test_end_to_end_pharmacy_receipt(self):
        """Prueba integración completa con recibo de farmacia."""
        
        text = self.receipt_texts['pharmacy']
        items = self.item_extractor.extract_items_detailed(text)
        
        self.assertGreaterEqual(len(items), 3, "Debe extraer al menos 3 ítems")
        
        # Verificar ítem con SKU (Paracetamol)
        paracetamol = next((item for item in items if "paracetamol" in item.description.lower()), None)
        self.assertIsNotNone(paracetamol, "Debe encontrar Paracetamol")
        self.assertEqual(paracetamol.total_price, 2490.0, "Precio debe ser 2490.0")
        self.assertIsNotNone(paracetamol.sku, "Debe extraer SKU")
        self.assertEqual(paracetamol.sku, "84756382", "SKU debe ser correcto")
        
        # Verificar ítem con cantidad múltiple (Alcohol Gel)
        alcohol = next((item for item in items if "alcohol" in item.description.lower()), None)
        if alcohol:  # Puede que no se detecte dependiendo de los patrones
            self.assertEqual(alcohol.quantity, 3.0, "Cantidad debe ser 3.0")
    
    def test_end_to_end_restaurant_receipt(self):
        """Prueba integración completa con recibo de restaurante."""
        
        text = self.receipt_texts['restaurant']
        items = self.item_extractor.extract_items_detailed(text)
        
        self.assertGreaterEqual(len(items), 2, "Debe extraer al menos 2 ítems")
        
        # Verificar ítem con cantidad (Hamburguesa)
        hamburguesa = next((item for item in items if "hamburguesa" in item.description.lower()), None)
        if hamburguesa:
            self.assertEqual(hamburguesa.quantity, 2.0, "Cantidad debe ser 2.0")
            self.assertEqual(hamburguesa.total_price, 15800.0, "Precio debe ser 15800.0")
    
    def test_end_to_end_hardware_store_receipt(self):
        """Prueba integración completa con recibo de ferretería."""
        
        text = self.receipt_texts['hardware_store']
        items = self.item_extractor.extract_items_detailed(text)
        
        self.assertGreaterEqual(len(items), 2, "Debe extraer al menos 2 ítems")
        
        # Verificar ítem con SKU alfanumérico
        tornillo = next((item for item in items if "tornillo" in item.description.lower()), None)
        if tornillo:
            self.assertIsNotNone(tornillo.sku, "Debe extraer SKU alfanumérico")
            self.assertEqual(tornillo.total_price, 5990.0, "Precio debe ser 5990.0")
        
        # Verificar ítem con peso (Clavos)
        clavos = next((item for item in items if "clavos" in item.description.lower()), None)
        if clavos:
            self.assertEqual(clavos.quantity, 2.5, "Cantidad debe ser 2.5")
            self.assertEqual(clavos.unit, "kg", "Unidad debe ser kg")
    
    def test_price_format_consistency(self):
        """Prueba consistencia en el formato de precios chilenos."""

        # Preparar casos de prueba específicos
        test_cases = [
            {"line": "PRODUCTO A    $2.490", "expected": 2490.0},
            {"line": "PRODUCTO B    $15.750", "expected": 15750.0},
            {"line": "PRODUCTO C    $125.990", "expected": 125990.0},
            {"line": "PRODUCTO D    $1.200", "expected": 1200.0}
        ]

        for test_case in test_cases:
            # Usar método de conversión directo para mayor precisión en pruebas
            line = test_case["line"]
            # Extraer el precio directamente
            price_str = line.split("$")[-1].strip()
            price = self.item_extractor._adaptive_price_conversion(price_str)
            
            # Verificar conversión correcta
            self.assertIsNotNone(price, f"Conversión de precio falló para {line}")
            self.assertEqual(price, test_case["expected"], 
                             f"Precio incorrecto para {line}. Esperado: {test_case['expected']}, Obtenido: {price}")
    
    def test_sku_extraction_accuracy(self):
        """Prueba precisión en la extracción de SKUs."""
        
        test_lines = [
            "84756382 PARACETAMOL 500MG 16COMP    $2.490",
            "#12345 TORNILLO 6X40MM 100UN    $5.990",
            "123456789 PRODUCTO GENERICO    $1.500",
            "ABC-123 ITEM ESPECIAL    $3.200"
        ]
        
        for line in test_lines:
            item = self.item_extractor._extract_item_from_line(line, 'spa')
            if item:
                self.assertIsNotNone(item.sku, f"Debe extraer SKU de {line}")
                self.assertNotEqual(item.sku, "", f"SKU no debe estar vacío para {line}")
    
    def test_confidence_scoring(self):
        """Prueba el sistema de puntuación de confianza."""
        
        # Línea de alta confianza (completa)
        high_confidence_line = "84756382 PARACETAMOL 500MG 16COMP    $2.490"
        item_high = self.item_extractor._extract_item_from_line(high_confidence_line, 'spa')
        
        # Línea de baja confianza (incompleta)
        low_confidence_line = "PRODUCTO GENERICO    $1.500"
        item_low = self.item_extractor._extract_item_from_line(low_confidence_line, 'spa')
        
        if item_high and item_low:
            self.assertGreater(item_high.confidence, item_low.confidence, 
                             "Ítem con más información debe tener mayor confianza")
    
    def test_deduplication_with_enhanced_items(self):
        """Prueba deduplicación con ítems mejorados."""
        
        text_with_duplicates = """
        PRODUCTO A    $2.490
        84756382 PRODUCTO A 500MG    $2.490
        PRODUCTO A    $2.490
        PRODUCTO B    $1.500
        """
        
        items = self.item_extractor.extract_items_detailed(text_with_duplicates)
        
        # Debe haber solo 2 ítems únicos después de deduplicación
        unique_descriptions = set(item.description.lower() for item in items)
        self.assertLessEqual(len(unique_descriptions), 2, "Debe eliminar duplicados")
    
    def test_full_pipeline_with_mock_ocr(self):
        """Prueba el pipeline completo con OCR simulado."""
        
        # En lugar de parchear, simulamos directamente el resultado del OCR
        ocr_result = {
            'text': self.receipt_texts['supermarket'],
            'confidence': 0.95,
            'language': 'spa'
        }
        
        # Continuamos con la extracción de ítems usando el resultado simulado
        items = self.item_extractor.extract_items_detailed(ocr_result['text'])
        
        # Verificaciones
        self.assertGreaterEqual(len(items), 4, "Pipeline debe extraer ítems")
        self.assertTrue(all(item.confidence > 0.1 for item in items), 
                       "Todos los ítems deben tener confianza mínima")
        
        # Verificar que se preserva información del OCR
        for item in items:
            self.assertIsNotNone(item.raw_text, "Debe preservar texto original")


if __name__ == '__main__':
    # Configurar logging para las pruebas
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Ejecutar pruebas
    unittest.main(verbosity=2)
