#!/usr/bin/env python3
"""
Script de diagnóstico para engines OCR - Determina qué funciona realmente
"""

import sys
import os

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Prueba imports básicos"""
    print("🔍 DIAGNÓSTICO DE IMPORTS OCR")
    print("=" * 50)
    
    # Test 1: Tesseract
    try:
        import pytesseract
        print("✅ pytesseract: IMPORTADO")
        try:
            version = pytesseract.get_tesseract_version()
            print(f"   📋 Versión: {version}")
        except:
            print("   ⚠️ Tesseract no ejecutable")
    except ImportError as e:
        print(f"❌ pytesseract: ERROR - {e}")
    
    # Test 2: EasyOCR
    try:
        import easyocr
        print("✅ easyocr: IMPORTADO")
    except ImportError as e:
        print(f"❌ easyocr: ERROR - {e}")
    
    # Test 3: PaddleOCR
    try:
        import paddleocr
        print("✅ paddleocr: IMPORTADO")
    except ImportError as e:
        print(f"❌ paddleocr: ERROR - {e}")
    
    # Test 4: PaddlePaddle
    try:
        import paddle
        print("✅ paddle: IMPORTADO")
    except ImportError as e:
        print(f"❌ paddle: ERROR - {e}")

def test_engine_initialization():
    """Prueba inicialización de engines OCR"""
    print("\n🚀 DIAGNÓSTICO DE INICIALIZACIÓN")
    print("=" * 50)
    
    # Test Tesseract Service
    try:
        from app.services.ocr.tesseract_ocr_service import TesseractOCRService
        tesseract = TesseractOCRService()
        if tesseract.is_available():
            print("✅ TesseractOCRService: FUNCIONANDO")
        else:
            print("❌ TesseractOCRService: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ TesseractOCRService: ERROR - {e}")
    
    # Test EasyOCR Service
    try:
        from app.services.ocr.easyocr_service import EasyOCRService
        easyocr = EasyOCRService()
        if easyocr.is_available():
            print("✅ EasyOCRService: FUNCIONANDO")
        else:
            print("❌ EasyOCRService: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ EasyOCRService: ERROR - {e}")
    
    # Test PaddleOCR Service
    try:
        from app.services.ocr.paddleocr_service import PaddleOCRService
        paddleocr = PaddleOCRService()
        if paddleocr.is_available():
            print("✅ PaddleOCRService: FUNCIONANDO")
        else:
            print("❌ PaddleOCRService: NO DISPONIBLE")
    except Exception as e:
        print(f"❌ PaddleOCRService: ERROR - {e}")

def test_ultra_service():
    """Prueba FreeUltraOCRService"""
    print("\n🎯 DIAGNÓSTICO DE ULTRA SERVICE")
    print("=" * 50)
    
    try:
        from app.services.free_ultra_ocr_service import FreeUltraOCRService
        ultra = FreeUltraOCRService()
        print("✅ FreeUltraOCRService: INICIALIZADO")
        
        # Verificar cada engine en el servicio ultra
        engines = {
            "Tesseract": getattr(ultra, 'tesseract_service', None),
            "EasyOCR": getattr(ultra, 'easy_ocr_service', None),
            "PaddleOCR": getattr(ultra, 'paddle_ocr_service', None)
        }
        
        active_engines = 0
        for name, engine in engines.items():
            if engine and hasattr(engine, 'is_available') and engine.is_available():
                print(f"✅ {name}: ACTIVO en Ultra Service")
                active_engines += 1
            else:
                print(f"❌ {name}: INACTIVO en Ultra Service")
        
        print(f"📊 Engines activos: {active_engines}/3")
        
        if active_engines >= 2:
            print("🎯 SUFICIENTES ENGINES PARA CONSENSO")
        elif active_engines == 1:
            print("⚠️ SOLO 1 ENGINE - PRECISIÓN LIMITADA")
        else:
            print("❌ NO HAY ENGINES ACTIVOS")
            
    except Exception as e:
        print(f"❌ FreeUltraOCRService: ERROR - {e}")

def test_direct_ocr():
    """Prueba OCR directo con texto simple"""
    print("\n🧪 PRUEBA OCR BÁSICA")
    print("=" * 50)
    
    # Crear imagen de prueba simple con texto
    try:
        import cv2
        import numpy as np
        from PIL import Image, ImageDraw, ImageFont
        
        # Crear imagen simple con texto
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Usar fuente por defecto
        try:
            font = ImageFont.load_default()
        except:
            font = None
            
        draw.text((20, 30), "TOTAL: $12.345", fill='black', font=font)
        
        # Guardar temporalmente
        test_path = "test_simple.png"
        img.save(test_path)
        
        print(f"📄 Imagen de prueba creada: {test_path}")
        
        # Probar con Tesseract
        try:
            import pytesseract
            text = pytesseract.image_to_string(img, lang='eng')
            print(f"✅ Tesseract directo: '{text.strip()}'")
        except Exception as e:
            print(f"❌ Tesseract directo: ERROR - {e}")
        
        # Probar con EasyOCR
        try:
            import easyocr
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            results = reader.readtext(test_path)
            if results:
                text = ' '.join([result[1] for result in results])
                print(f"✅ EasyOCR directo: '{text}'")
            else:
                print("❌ EasyOCR directo: NO DETECTÓ TEXTO")
        except Exception as e:
            print(f"❌ EasyOCR directo: ERROR - {e}")
        
        # Limpiar
        if os.path.exists(test_path):
            os.remove(test_path)
            
    except Exception as e:
        print(f"❌ Prueba OCR básica: ERROR - {e}")

def main():
    """Función principal de diagnóstico"""
    print("🔬 DIAGNÓSTICO COMPLETO DE ENGINES OCR")
    print(f"📅 Fecha: {__import__('datetime').datetime.now()}")
    print("=" * 60)
    
    test_imports()
    test_engine_initialization()
    test_ultra_service()
    test_direct_ocr()
    
    print("\n" + "=" * 60)
    print("🎯 CONCLUSIONES DEL DIAGNÓSTICO")
    print("=" * 60)
    print("🔍 Revisa los resultados arriba para determinar:")
    print("   1. ¿Qué engines están realmente funcionando?")
    print("   2. ¿El problema es de import, inicialización o configuración?")
    print("   3. ¿Necesitamos Google Vision o podemos optimizar lo existente?")
    print("=" * 60)

if __name__ == "__main__":
    main()
