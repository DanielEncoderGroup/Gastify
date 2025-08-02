#!/usr/bin/env python3
"""
Pruebas específicas para ItemExtractor.
Valida las funcionalidades avanzadas de extracción de ítems en recibos.
"""

import sys
import os
import unittest
from typing import List, Dict, Any

# Añadir el directorio del proyecto al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.receipt_parser.extractors.item_extractor import ItemExtractor
from app.services.receipt_parser.models.receipt_item import ReceiptItem


class TestItemExtractor(unittest.TestCase):
    """Pruebas para el extractor de ítems avanzado."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        self.extractor = ItemExtractor()
        
        # Recibo de prueba formato estándar
        self.receipt_standard = """
        SUPERMERCADO JUMBO
        Av. Las Condes 11950, Santiago
        RUT: 93.834.000-5
        
        TICKET: 45632
        FECHA: 15/07/2024 19:45
        
        PAN INTEGRAL 1KG          $2.590
        LECHE DESCREMADA 1L       $1.190
        QUESO GOUDA 250G          $3.450
        MANZANAS VERDES 1KG       $1.990
        DETERGENTE LÍQUIDO 1L     $2.890
        
        SUBTOTAL                  $12.110
        IVA 19%                   $2.301
        TOTAL                    $14.411
        
        GRACIAS POR SU COMPRA
        """
        
        # Recibo con cantidades y unidades
        self.receipt_with_quantities = """
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
        
        # Recibo con diferentes formatos de línea
        self.receipt_mixed_format = """
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
        
        # Recibo con descuentos
        self.receipt_with_discounts = """
        TIENDA FALABELLA
        
        FECHA: 15/07/2024
        
        CAMISA MANGA LARGA       $24.990
          DESCUENTO 20%         -$4.998
        
        PANTALÓN GABARDINA       $19.990
          DESCUENTO 15%         -$2.999
        
        SUBTOTAL                 $36.983
        IVA 19%                   $7.027
        TOTAL                    $44.010
        """

    def test_basic_extraction(self):
        """Prueba la extracción básica de ítems."""
        items = self.extractor.extract_items_basic(self.receipt_standard)
        
        # Verificar que se extraen los ítems básicos correctamente
        self.assertGreaterEqual(len(items), 4)
        self.assertIn("Pan Integral", items[0].description)
        self.assertEqual(items[0].total_price, 2590.0)

    def test_detailed_extraction(self):
        """Prueba la extracción detallada de ítems."""
        items = self.extractor.extract_items_detailed(self.receipt_standard)
        
        # Verificar que extrae ítems detallados
        self.assertGreaterEqual(len(items), 4)
        
        # Verificar que los ítems tienen los campos correctos
        for item in items:
            self.assertTrue(hasattr(item, 'description'))
            self.assertTrue(hasattr(item, 'quantity'))
            self.assertTrue(hasattr(item, 'total_price'))
            self.assertTrue(item.is_valid())

    def test_extraction_with_quantities(self):
        """Prueba la extracción de ítems con cantidades explícitas."""
        items = self.extractor.extract_items_detailed(self.receipt_with_quantities)
        
        # Verificar que extrae cantidades correctamente
        self.assertGreaterEqual(len(items), 3)
        
        # Buscar el ítem de Coca Cola
        coca_cola_item = next((item for item in items if "coca cola" in item.description.lower()), None)
        self.assertIsNotNone(coca_cola_item)
        self.assertEqual(coca_cola_item.quantity, 2.0)
        self.assertEqual(coca_cola_item.total_price, 4790.0)
        
        # Buscar el ítem de palta
        palta_item = next((item for item in items if "palta" in item.description.lower()), None)
        self.assertIsNotNone(palta_item)
        self.assertEqual(palta_item.quantity, 1.5)
        self.assertEqual(palta_item.unit, "kg")

    def test_mixed_format_extraction(self):
        """Prueba la extracción de ítems con diferentes formatos."""
        items = self.extractor.extract_items_detailed(self.receipt_mixed_format)
        
        # Verificar que extrae ítems con diferentes formatos
        self.assertGreaterEqual(len(items), 3)
        
        # Buscar ítem con código de producto
        coded_item = next((item for item in items if "paracetamol" in item.description.lower()), None)
        self.assertIsNotNone(coded_item)
        self.assertEqual(coded_item.total_price, 2490.0)
        
        # Buscar ítem sin código pero con descripción larga
        sunscreen = next((item for item in items if "protector" in item.description.lower()), None)
        self.assertIsNotNone(sunscreen)
        self.assertEqual(sunscreen.total_price, 8990.0)

    def test_discount_extraction(self):
        """Prueba la extracción de ítems con descuentos."""
        items = self.extractor.extract_items_detailed(self.receipt_with_discounts)
        
        # Verificar que extrae ítems con descuentos
        self.assertGreaterEqual(len(items), 2)
        
        # Buscar el ítem con descuento
        shirt_item = next((item for item in items if "camisa" in item.description.lower()), None)
        self.assertIsNotNone(shirt_item)
        
        # Verificar que el precio es correcto (precio antes del descuento)
        self.assertEqual(shirt_item.total_price, 24990.0)

    def test_confidence_calculation(self):
        """Prueba el cálculo de confianza de los ítems."""
        items = self.extractor.extract_items_detailed(self.receipt_standard)
        
        # Verificar que todos los ítems tienen un valor de confianza
        for item in items:
            self.assertGreaterEqual(item.confidence, 0.0)
            self.assertLessEqual(item.confidence, 1.0)
        
        # Verificar confianza general de la extracción
        confidence = self.extractor._calculate_extraction_confidence(items)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)

    def test_item_deduplication(self):
        """Prueba la deduplicación de ítems similares."""
        # Crear ítems con descripciones similares
        items = [
            ReceiptItem(description="Pan Integral", quantity=1.0, unit_price=2500, total_price=2500, confidence=0.8),
            ReceiptItem(description="Pan Integral 1KG", quantity=1.0, unit_price=2500, total_price=2500, confidence=0.9),
            ReceiptItem(description="Leche", quantity=1.0, unit_price=1200, total_price=1200, confidence=0.7),
            ReceiptItem(description="Leche Descremada", quantity=1.0, unit_price=1200, total_price=1200, confidence=0.6),
        ]
        
        # Deduplicar
        unique_items = self.extractor._deduplicate_items(items)
        
        # Verificar que se eliminaron los duplicados
        self.assertEqual(len(unique_items), 2)
        
        # Verificar que se mantuvieron los ítems con mayor confianza
        self.assertEqual(unique_items[0].description, "Pan Integral 1KG")
        self.assertEqual(unique_items[0].confidence, 0.9)

    def test_line_categorization(self):
        """Prueba la identificación de líneas que son ítems."""
        # Líneas que deberían identificarse como ítems
        item_lines = [
            "Pan Integral 1KG          $2.590",
            "2 x COCA COLA 2L          $4.790",
            "84756382 PARACETAMOL 500MG 16COMP    $2.490"
        ]
        
        # Líneas que no son ítems
        non_item_lines = [
            "SUBTOTAL                  $12.110",
            "IVA 19%                   $2.301",
            "TOTAL                    $14.411",
            "GRACIAS POR SU COMPRA",
            "FECHA: 15/07/2024 19:45"
        ]
        
        # Verificar líneas de ítems
        for line in item_lines:
            self.assertTrue(self.extractor._is_potential_item_line(line), 
                           f"La línea debería ser un ítem: {line}")
        
        # Verificar líneas que no son ítems
        for line in non_item_lines:
            self.assertFalse(self.extractor._is_potential_item_line(line), 
                            f"La línea no debería ser un ítem: {line}")

    def test_extract_interface(self):
        """Prueba la interfaz principal de extracción."""
        result = self.extractor.extract(self.receipt_standard)
        
        # Verificar estructura de la respuesta
        self.assertIn('items', result)
        self.assertIn('item_count', result)
        self.assertIn('confidence', result)
        self.assertIn('extraction_method', result)
        self.assertIn('language', result)
        
        # Verificar que hay ítems extraídos
        self.assertGreaterEqual(result['item_count'], 4)
        self.assertEqual(len(result['items']), result['item_count'])


if __name__ == "__main__":
    unittest.main()
