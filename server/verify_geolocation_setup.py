#!/usr/bin/env python3
"""
Script de Verificación - Sistema de Geolocalización
==================================================

Este script verifica que el sistema de geolocalización esté correctamente
configurado e integrado en el proyecto Gastify.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def check_environment_variables():
    """Verificar variables de entorno requeridas"""
    logger.info("🔍 Verificando variables de entorno...")
    
    required_vars = {
        'GOOGLE_MAPS_API_KEY': 'API Key de Google Maps (requerido para geocodificación)',
        'GEOCODING_CACHE_SIZE': 'Tamaño del caché de geocodificación (opcional, default: 1000)',
        'GEOCODING_CACHE_TTL_HOURS': 'TTL del caché en horas (opcional, default: 24)'
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        value = os.getenv(var)
        if var == 'GOOGLE_MAPS_API_KEY' and not value:
            missing_vars.append(f"  ❌ {var}: {description}")
        elif value:
            logger.info(f"  ✅ {var}: {'*' * 20} (configurado)")
        else:
            logger.info(f"  ⚠️  {var}: usando valor por defecto")
    
    if missing_vars:
        logger.error("Variables de entorno faltantes:")
        for var in missing_vars:
            logger.error(var)
        return False
    
    logger.info("✅ Variables de entorno verificadas correctamente")
    return True

def check_dependencies():
    """Verificar dependencias instaladas"""
    logger.info("📦 Verificando dependencias...")
    
    required_packages = {
        'aiohttp': 'HTTP requests asíncronos',
        'geopy': 'Cálculos geoespaciales',
        'haversine': 'Distancias entre coordenadas',
        'langdetect': 'Detección de idioma (OCR multiidioma)'
    }
    
    missing_packages = []
    for package, description in required_packages.items():
        try:
            __import__(package)
            logger.info(f"  ✅ {package}: instalado")
        except ImportError:
            missing_packages.append(f"  ❌ {package}: {description}")
    
    if missing_packages:
        logger.error("Dependencias faltantes:")
        for package in missing_packages:
            logger.error(package)
        logger.error("Ejecutar: pip install aiohttp geopy haversine langdetect")
        return False
    
    logger.info("✅ Dependencias verificadas correctamente")
    return True

def check_file_structure():
    """Verificar estructura de archivos"""
    logger.info("📁 Verificando estructura de archivos...")
    
    required_files = [
        'app/services/geolocation_service.py',
        'app/services/location_extraction_service.py',
        'app/services/geocoding_service.py',
        'app/models/location_models.py',
        'app/models/receipt_with_location.py',
        'app/routers/geolocation.py',
        'tests/test_geolocation.py',
        'demo_geolocation.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if Path(file_path).exists():
            logger.info(f"  ✅ {file_path}")
        else:
            missing_files.append(f"  ❌ {file_path}")
    
    if missing_files:
        logger.error("Archivos faltantes:")
        for file in missing_files:
            logger.error(file)
        return False
    
    logger.info("✅ Estructura de archivos verificada correctamente")
    return True

def check_imports():
    """Verificar que las importaciones funcionen"""
    logger.info("🔗 Verificando importaciones...")
    
    try:
        # Importaciones principales
        from app.services.geolocation_service import GeolocationService
        from app.services.location_extraction_service import LocationExtractionService
        from app.services.geocoding_service import GeocodingService
        from app.models.location_models import Location, Coordinates, Address
        from app.models.receipt_with_location import ReceiptWithLocationModel
        
        logger.info("  ✅ Servicios de geolocalización")
        logger.info("  ✅ Modelos de ubicación")
        logger.info("  ✅ Modelo de recibo con ubicación")
        
        # Verificar que las clases se puedan instanciar
        geo_service = GeolocationService()
        logger.info("  ✅ GeolocationService instanciado")
        
        extraction_service = LocationExtractionService()
        logger.info("  ✅ LocationExtractionService instanciado")
        
        geocoding_service = GeocodingService()
        logger.info("  ✅ GeocodingService instanciado")
        
    except ImportError as e:
        logger.error(f"  ❌ Error de importación: {e}")
        return False
    except Exception as e:
        logger.error(f"  ❌ Error al instanciar servicios: {e}")
        return False
    
    logger.info("✅ Importaciones verificadas correctamente")
    return True

def check_integration():
    """Verificar integración con pipeline de recibos"""
    logger.info("🔄 Verificando integración con pipeline...")
    
    try:
        # Verificar que el router esté registrado en main.py
        with open('app/main.py', 'r', encoding='utf-8') as f:
            main_content = f.read()
            
        if 'from app.routers import geolocation' in main_content:
            logger.info("  ✅ Router de geolocalización importado en main.py")
        else:
            logger.error("  ❌ Router de geolocalización no importado en main.py")
            return False
            
        if 'app.include_router(geolocation.router' in main_content:
            logger.info("  ✅ Router de geolocalización registrado en main.py")
        else:
            logger.error("  ❌ Router de geolocalización no registrado en main.py")
            return False
        
        # Verificar integración en receipts.py
        with open('app/api/routes/receipts.py', 'r', encoding='utf-8') as f:
            receipts_content = f.read()
            
        if 'from app.services.geolocation_service import GeolocationService' in receipts_content:
            logger.info("  ✅ GeolocationService importado en receipts.py")
        else:
            logger.error("  ❌ GeolocationService no importado en receipts.py")
            return False
            
        if 'location_data' in receipts_content:
            logger.info("  ✅ Procesamiento de ubicación integrado en create_receipt")
        else:
            logger.error("  ❌ Procesamiento de ubicación no integrado")
            return False
            
    except FileNotFoundError as e:
        logger.error(f"  ❌ Archivo no encontrado: {e}")
        return False
    except Exception as e:
        logger.error(f"  ❌ Error verificando integración: {e}")
        return False
    
    logger.info("✅ Integración verificada correctamente")
    return True

async def check_functionality():
    """Verificar funcionalidad básica"""
    logger.info("⚡ Verificando funcionalidad básica...")
    
    try:
        from app.services.location_extraction_service import LocationExtractionService
        
        # Crear servicio
        service = LocationExtractionService()
        
        # Texto de prueba
        test_text = """
        JUMBO BILBAO
        Av. Providencia 1550, Providencia
        Santiago, Chile
        
        VERDURAS FRESCAS         $3.450
        TOTAL                   $3.450
        """
        
        # Extraer ubicación
        extraction = await service.extract_location_from_receipt(test_text)
        
        if extraction.brands:
            logger.info(f"  ✅ Marca detectada: {extraction.brands[0]}")
        else:
            logger.warning("  ⚠️  No se detectaron marcas")
            
        if extraction.addresses:
            logger.info(f"  ✅ Dirección extraída: {extraction.addresses[0]}")
        else:
            logger.warning("  ⚠️  No se extrajeron direcciones")
            
        logger.info(f"  ✅ Confianza: {extraction.confidence:.2f}")
        
    except Exception as e:
        logger.error(f"  ❌ Error en funcionalidad: {e}")
        return False
    
    logger.info("✅ Funcionalidad básica verificada")
    return True

async def run_tests():
    """Ejecutar pruebas del sistema"""
    logger.info("🧪 Ejecutando pruebas del sistema...")
    
    try:
        import subprocess
        import sys
        
        # Ejecutar pruebas de geolocalización
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'tests/test_geolocation.py', 
            '-v', '--asyncio-mode=auto', '--tb=short'
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Contar pruebas pasadas
            output_lines = result.stdout.split('\n')
            passed_line = [line for line in output_lines if 'passed' in line and '=' in line]
            if passed_line:
                logger.info(f"  ✅ {passed_line[-1].strip()}")
            else:
                logger.info("  ✅ Todas las pruebas pasaron")
        else:
            logger.error("  ❌ Algunas pruebas fallaron:")
            logger.error(result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("  ❌ Timeout ejecutando pruebas")
        return False
    except Exception as e:
        logger.error(f"  ❌ Error ejecutando pruebas: {e}")
        return False
    
    logger.info("✅ Pruebas ejecutadas correctamente")
    return True

def print_summary(checks_passed: int, total_checks: int):
    """Imprimir resumen final"""
    logger.info("\n" + "="*60)
    logger.info("📊 RESUMEN DE VERIFICACIÓN")
    logger.info("="*60)
    
    if checks_passed == total_checks:
        logger.info("🎉 ¡SISTEMA DE GEOLOCALIZACIÓN CONFIGURADO CORRECTAMENTE!")
        logger.info(f"✅ {checks_passed}/{total_checks} verificaciones pasaron")
        logger.info("\n📚 Próximos pasos:")
        logger.info("  1. Ejecutar el servidor: uvicorn app.main:app --reload")
        logger.info("  2. Probar endpoints: http://localhost:8000/docs")
        logger.info("  3. Ejecutar demo: python demo_geolocation.py")
        logger.info("  4. Ver documentación: docs/GEOLOCATION_README.md")
    else:
        logger.error("❌ CONFIGURACIÓN INCOMPLETA")
        logger.error(f"❌ {checks_passed}/{total_checks} verificaciones pasaron")
        logger.error(f"⚠️  {total_checks - checks_passed} verificaciones fallaron")
        logger.error("\n🔧 Acciones requeridas:")
        logger.error("  1. Revisar los errores mostrados arriba")
        logger.error("  2. Instalar dependencias faltantes")
        logger.error("  3. Configurar variables de entorno")
        logger.error("  4. Ejecutar este script nuevamente")

async def main():
    """Función principal"""
    logger.info("🚀 VERIFICACIÓN DEL SISTEMA DE GEOLOCALIZACIÓN")
    logger.info("="*60)
    
    checks = [
        ("Variables de Entorno", check_environment_variables),
        ("Dependencias", check_dependencies),
        ("Estructura de Archivos", check_file_structure),
        ("Importaciones", check_imports),
        ("Integración", check_integration),
        ("Funcionalidad", check_functionality),
        ("Pruebas", run_tests)
    ]
    
    checks_passed = 0
    total_checks = len(checks)
    
    for check_name, check_func in checks:
        logger.info(f"\n📋 {check_name}")
        logger.info("-" * 40)
        
        try:
            if asyncio.iscoroutinefunction(check_func):
                result = await check_func()
            else:
                result = check_func()
                
            if result:
                checks_passed += 1
                logger.info(f"✅ {check_name}: PASÓ")
            else:
                logger.error(f"❌ {check_name}: FALLÓ")
                
        except Exception as e:
            logger.error(f"❌ {check_name}: ERROR - {e}")
    
    print_summary(checks_passed, total_checks)
    
    # Código de salida
    sys.exit(0 if checks_passed == total_checks else 1)

if __name__ == "__main__":
    # Cambiar al directorio del proyecto
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Ejecutar verificación
    asyncio.run(main())
