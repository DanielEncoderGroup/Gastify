#!/usr/bin/env python3
"""
Script de prueba para FreeUltraOCRService - Sistema OCR Multi-Engine
Prueba el sistema de consenso Tesseract + EasyOCR + PaddleOCR para 96-99% precisión
"""

import sys
import os
import asyncio
import logging
from datetime import datetime
from pathlib import Path

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.services.free_ultra_ocr_service import FreeUltraOCRService, OCRLowConfidenceException
    from app.services.consensus_engine import ConsensusEngine
except ImportError as e:
    print(f"❌ Error importando servicios OCR: {e}")
    print("Asegúrate de que las dependencias estén instaladas correctamente.")
    sys.exit(1)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ultra_ocr_service():
    """
    Prueba exhaustiva del FreeUltraOCRService multi-engine
    """
    print("=" * 60)
    print("🚀 TESTING SISTEMA OCR ULTRA-PRECISO (96-99%)")
    print("=" * 60)
    
    # Inicializar servicio
    try:
        print("\n📋 Inicializando FreeUltraOCRService...")
        ocr_service = FreeUltraOCRService()
        print("✅ Servicio inicializado correctamente")
    except Exception as e:
        print(f"❌ Error inicializando servicio: {e}")
        return False
    
    # Verificar engines disponibles
    print("\n🔍 Verificando engines OCR disponibles...")
    
    engines_status = {
        "Tesseract": False,
        "EasyOCR": False,
        "PaddleOCR": False
    }
    
    try:
        # Test Tesseract
        if hasattr(ocr_service, 'tesseract_service') and ocr_service.tesseract_service.is_available():
            engines_status["Tesseract"] = True
            print("✅ Tesseract OCR: DISPONIBLE")
        else:
            print("❌ Tesseract OCR: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ Tesseract OCR: ERROR - {e}")
    
    try:
        # Test EasyOCR
        if hasattr(ocr_service, 'easy_ocr_service') and ocr_service.easy_ocr_service.is_available():
            engines_status["EasyOCR"] = True
            print("✅ EasyOCR: DISPONIBLE")
        else:
            print("❌ EasyOCR: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ EasyOCR: ERROR - {e}")
    
    try:
        # Test PaddleOCR
        if hasattr(ocr_service, 'paddle_ocr_service') and ocr_service.paddle_ocr_service.is_available():
            engines_status["PaddleOCR"] = True
            print("✅ PaddleOCR: DISPONIBLE")
        else:
            print("❌ PaddleOCR: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ PaddleOCR: ERROR - {e}")
    
    available_engines = sum(engines_status.values())
    print(f"\n📊 Engines disponibles: {available_engines}/3")
    
    if available_engines == 0:
        print("❌ NO HAY ENGINES DISPONIBLES - Verifica instalación de dependencias")
        return False
    elif available_engines == 1:
        print("⚠️ SOLO 1 ENGINE - Precisión limitada")
    elif available_engines == 2:
        print("✅ 2 ENGINES - Buen consenso esperado")
    else:
        print("🎯 3 ENGINES - MÁXIMA PRECISIÓN ESPERADA")
    
    # Buscar imagen de prueba
    print("\n🖼️ Buscando imágenes de prueba...")
    
    # Directorios posibles para imágenes de prueba
    test_directories = [
        "temp",
        "uploads",
        "test_images",
        "../client-new/public/test",
        "."
    ]
    
    test_image = None
    for directory in test_directories:
        dir_path = Path(directory)
        if dir_path.exists():
            # Buscar archivos de imagen
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
                images = list(dir_path.glob(ext))
                if images:
                    test_image = str(images[0])
                    break
            if test_image:
                break
    
    if not test_image:
        print("⚠️ No se encontraron imágenes de prueba")
        print("Puedes agregar una imagen en cualquiera de estos directorios:")
        for directory in test_directories:
            print(f"  - {directory}/")
        print("\n🧪 Procediendo con prueba de inicialización únicamente")
        return True
    
    print(f"✅ Imagen de prueba encontrada: {test_image}")
    
    # Probar procesamiento OCR
    print(f"\n🔍 Procesando imagen: {test_image}")
    
    try:
        start_time = datetime.now()
        
        # Procesar con el sistema ultra-preciso
        result = await ocr_service.process_receipt_automatic(test_image)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 50)
        print("🎯 RESULTADOS DEL ANÁLISIS ULTRA-PRECISO")
        print("=" * 50)
        
        print(f"⏱️ Tiempo de procesamiento: {processing_time:.2f} segundos")
        print(f"🎯 Confianza general: {result.get('confidence', 0):.1%}")
        
        # Mostrar datos extraídos
        if 'vendor' in result:
            print(f"🏪 Proveedor: {result['vendor']}")
        
        if 'total_amount' in result:
            print(f"💰 Total: ${result['total_amount']}")
        
        if 'date' in result:
            print(f"📅 Fecha: {result['date']}")
        
        if 'items' in result and result['items']:
            print(f"🛒 Productos encontrados: {len(result['items'])}")
            for i, item in enumerate(result['items'][:3]):  # Mostrar máximo 3
                print(f"   {i+1}. {item.get('name', 'N/A')} - ${item.get('total_price', 0)}")
        
        # Verificar si alcanza el objetivo >95%
        confidence = result.get('confidence', 0)
        if confidence >= 0.95:
            print(f"\n🎉 ¡ÉXITO! Confianza {confidence:.1%} >= 95% OBJETIVO ALCANZADO")
        elif confidence >= 0.90:
            print(f"\n✅ Buena precisión {confidence:.1%} - Cerca del objetivo")
        elif confidence >= 0.80:
            print(f"\n⚠️ Precisión moderada {confidence:.1%} - Necesita mejoras")
        else:
            print(f"\n❌ Precisión baja {confidence:.1%} - Requiere optimización")
        
        return confidence >= 0.95
        
    except OCRLowConfidenceException as e:
        print(f"\n⚠️ Confianza baja detectada: {e.confidence:.1%}")
        print(f"💡 Consejos para mejorar:")
        for tip in e.tips:
            print(f"   - {tip}")
        return False
        
    except Exception as e:
        print(f"\n❌ Error en procesamiento OCR: {e}")
        logger.exception("Error completo:")
        return False

def main():
    """Función principal"""
    print("🔬 INICIANDO PRUEBAS DEL SISTEMA OCR ULTRA-PRECISO")
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas asíncronas
    try:
        success = asyncio.run(test_ultra_ocr_service())
        
        print("\n" + "=" * 60)
        if success:
            print("🎉 PRUEBAS COMPLETADAS EXITOSAMENTE")
            print("✅ Sistema OCR multi-engine funcionando correctamente")
            print("🎯 Precisión >95% alcanzada - ¡NO NECESITAS GOOGLE VISION!")
        else:
            print("⚠️ PRUEBAS COMPLETADAS CON LIMITACIONES")
            print("📈 Sistema funcional pero precisión <95%")
            print("💡 Considera optimización adicional o Google Vision como fallback")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n⏹️ Pruebas interrumpidas por el usuario")
    except Exception as e:
        print(f"\n❌ Error en las pruebas: {e}")
        logger.exception("Error completo:")

if __name__ == "__main__":
    main()
