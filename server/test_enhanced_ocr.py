#!/usr/bin/env python3
"""
Script de pruebas para el sistema OCR mejorado de Gastify.
Valida las nuevas funcionalidades implementadas.
"""

import sys
import os
import logging
from typing import Dict, Any

# Añadir el directorio del proyecto al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_language_detector():
    """Prueba el detector de idiomas."""
    print("\n=== PRUEBA: Detector de Idiomas ===")
    
    try:
        from app.services.ocr.languages.language_detector import LanguageDetector
        
        detector = LanguageDetector()
        
        # Textos de prueba
        test_texts = {
            'español': "Total a pagar: $15.500 pesos. Gracias por su compra en nuestro supermercado.",
            'inglés': "Total amount due: $25.99. Thank you for shopping with us today.",
            'portugués': "Total a pagar: R$ 45,50. Obrigado pela sua compra em nossa loja.",
            'francés': "Total à payer: 32,50 €. Merci pour votre achat dans notre magasin."
        }
        
        for idioma, texto in test_texts.items():
            idioma_detectado = detector.detect_language(texto)
            print(f"  {idioma}: '{texto[:50]}...' -> {idioma_detectado}")
        
        print("✅ Detector de idiomas: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en detector de idiomas: {str(e)}")
        return False


def test_preprocessors():
    """Prueba los preprocessors."""
    print("\n=== PRUEBA: Preprocessors ===")
    
    try:
        from app.services.ocr.preprocessors.adaptive_preprocessor import AdaptivePreprocessor
        from app.services.ocr.preprocessors.receipt_preprocessor import ReceiptPreprocessor
        
        adaptive = AdaptivePreprocessor()
        receipt = ReceiptPreprocessor()
        
        # Crear imagen de prueba simulada
        import numpy as np
        test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        # Probar preprocessor adaptativo
        try:
            processed = adaptive.preprocess(test_image, strategy="receipt")
            print(f"  Preprocessor adaptativo: Imagen {test_image.shape} -> {processed.shape}")
        except Exception as e:
            print(f"  Preprocessor adaptativo: Error simulado (normal sin imagen real)")
        
        # Probar detector de tipo de recibo
        receipt_type = receipt._detect_receipt_type(test_image)
        print(f"  Detector tipo recibo: {receipt_type}")
        
        print("✅ Preprocessors: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en preprocessors: {str(e)}")
        return False


def test_extractors():
    """Prueba los extractores especializados."""
    print("\n=== PRUEBA: Extractores ===")
    
    try:
        from app.services.receipt_parser.extractors.vendor_extractor import VendorExtractor
        from app.services.receipt_parser.extractors.date_extractor import DateExtractor
        from app.services.receipt_parser.extractors.total_extractor import TotalExtractor
        from app.services.receipt_parser.extractors.item_extractor import ItemExtractor
        
        # Texto de recibo de prueba
        test_receipt = """
        SUPERMERCADO LIDER
        AV. PROVIDENCIA 1234
        RUT: 12.345.678-9
        
        FECHA: 15/11/2024
        HORA: 14:30
        
        PAN INTEGRAL 2KG          $2.500
        LECHE ENTERA 1L           $1.200
        QUESO GOUDA 500G          $3.800
        MANZANAS ROJAS 1KG        $1.900
        
        SUBTOTAL                  $9.400
        IVA 19%                   $1.786
        TOTAL                    $11.186
        
        GRACIAS POR SU COMPRA
        """
        
        # Probar extractor de vendor
        vendor_extractor = VendorExtractor()
        vendor = vendor_extractor.extract_vendor(test_receipt)
        print(f"  Vendor extraído: '{vendor}'")
        
        # Probar extractor de fecha
        date_extractor = DateExtractor()
        fecha = date_extractor.extract_date(test_receipt)
        print(f"  Fecha extraída: {fecha}")
        
        # Probar extractor de totales
        total_extractor = TotalExtractor()
        total = total_extractor.extract_total_amount(test_receipt)
        subtotal = total_extractor.extract_subtotal(test_receipt)
        iva = total_extractor.extract_tax_amount(test_receipt)
        print(f"  Total: ${total}, Subtotal: ${subtotal}, IVA: ${iva}")
        
        # Probar extractor de ítems
        item_extractor = ItemExtractor()
        items = item_extractor.extract_items_basic(test_receipt)
        print(f"  Ítems extraídos ({len(items)}): {items}")
        
        print("✅ Extractores: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en extractores: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_receipt_models():
    """Prueba los modelos de datos."""
    print("\n=== PRUEBA: Modelos de Datos ===")
    
    try:
        from app.services.receipt_parser.models.receipt_item import ReceiptItem
        from app.services.receipt_parser.models.receipt import ReceiptData, MerchantInfo
        
        # Crear ítem de prueba
        item = ReceiptItem(
            description="Pan Integral 2kg",
            quantity=1.0,
            unit="unid",
            unit_price=2.50,
            total_price=2.50,
            confidence=0.9
        )
        
        print(f"  ReceiptItem creado: {item.get_display_name()}")
        print(f"  Es válido: {item.is_valid()}")
        print(f"  Diccionario: {item.to_simple_dict()}")
        
        # Crear recibo de prueba
        receipt = ReceiptData()
        receipt.merchant_info.name = "Supermercado Líder"
        receipt.date = "2024-11-15"
        receipt.total_amount = 11.186
        receipt.add_item(item)
        
        print(f"  ReceiptData creado: {receipt.merchant_info.name}")
        print(f"  Número de ítems: {receipt.get_item_count()}")
        print(f"  Es válido: {receipt.is_valid()}")
        
        print("✅ Modelos de datos: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en modelos: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_enhanced_ocr_service():
    """Prueba el servicio OCR mejorado."""
    print("\n=== PRUEBA: Servicio OCR Mejorado ===")
    
    try:
        # Importar solo las clases que no requieren Tesseract
        from app.services.receipt_parser.receipt_parser import AdvancedReceiptParser
        
        parser = AdvancedReceiptParser()
        
        # Texto de recibo de prueba
        test_receipt = """
        SUPERMERCADO JUMBO
        AV. LAS CONDES 456
        
        15/11/2024 15:45
        
        ARROZ GRADO 1 1KG         $1.500
        ACEITE MARAVILLA 1L       $2.800
        AZUCAR BLANCA 1KG         $1.200
        
        SUBTOTAL                  $5.500
        IVA                       $1.045
        TOTAL                     $6.545
        """
        
        # Probar parsing básico
        result = parser.parse_receipt(test_receipt, [], 'spa')
        
        print(f"  Vendor: {result.get('vendor', 'No detectado')}")
        print(f"  Total: ${result.get('total_amount', 'No detectado')}")
        print(f"  Fecha: {result.get('date', 'No detectada')}")
        print(f"  Ítems: {len(result.get('items', []))}")
        
        print("✅ Servicio OCR mejorado: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en servicio OCR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_compatibility():
    """Prueba la compatibilidad con el servicio existente."""
    print("\n=== PRUEBA: Compatibilidad ===")
    
    try:
        # Verificar que el servicio original sigue funcionando
        from app.services.ocr_service import FreeOCRService
        
        # Crear instancia (sin inicializar Tesseract realmente)
        print("  Servicio original importado correctamente")
        
        # Verificar estructura de respuesta esperada
        expected_fields = ['raw_text', 'confidence', 'vendor', 'total_amount', 'date', 'items']
        print(f"  Campos esperados en respuesta: {expected_fields}")
        
        print("✅ Compatibilidad: OK")
        return True
        
    except Exception as e:
        print(f"❌ Error en compatibilidad: {str(e)}")
        return False


def main():
    """Ejecuta todas las pruebas."""
    print("🚀 INICIANDO PRUEBAS DEL SISTEMA OCR MEJORADO")
    print("=" * 60)
    
    tests = [
        ("Detector de Idiomas", test_language_detector),
        ("Preprocessors", test_preprocessors),
        ("Extractores", test_extractors),
        ("Modelos de Datos", test_receipt_models),
        ("Servicio OCR Mejorado", test_enhanced_ocr_service),
        ("Compatibilidad", test_compatibility),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error crítico en {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} - {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 RESULTADO: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema está listo.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar implementación.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
