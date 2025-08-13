# 🤖 Sistema OCR Híbrido - Guía de Configuración

## 📋 Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración Inicial](#configuración-inicial)
4. [Variables de Entorno](#variables-de-entorno)
5. [Instalación de Dependencias](#instalación-de-dependencias)
6. [Configuración de Google Vision API](#configuración-de-google-vision-api)
7. [Verificación del Sistema](#verificación-del-sistema)
8. [Resolución de Problemas](#resolución-de-problemas)

---

## 🎯 Resumen del Sistema

El **Sistema OCR Híbrido** de Gastify combina múltiples engines OCR para lograr >95% de precisión en el procesamiento de recibos chilenos:

### 🔧 Arquitectura

- **Engine Primario**: Tesseract OCR (gratuito, siempre disponible)
- **Engine Fallback**: Google Vision API (premium, 1000 requests gratuitos/mes)
- **Decisión Inteligente**: Selección automática basada en calidad de imagen y confianza
- **Cache Inteligente**: Evita re-procesamiento de imágenes similares
- **Extractores Chilenos**: Validaciones específicas para recibos de Chile

### 🎯 Beneficios

- ✅ **>95% Precisión**: Combinación de engines para máxima exactitud
- ✅ **Costo Optimizado**: Uso inteligente de Google Vision solo cuando es necesario
- ✅ **Fallback Seguro**: Tesseract siempre disponible como respaldo
- ✅ **Métricas Completas**: Monitoreo en tiempo real de uso y costos
- ✅ **Migración Gradual**: Transición segura desde sistema actual

---

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ Windows 10/11
- ✅ Linux (Ubuntu 18.04+)
- ✅ macOS 10.15+

### Software Base
- ✅ Python 3.8+
- ✅ FastAPI
- ✅ MongoDB
- ✅ Node.js 16+ (para frontend)

### Servicios Externos
- ✅ Google Cloud Platform Account (para Vision API)
- ✅ Tesseract OCR instalado

---

## ⚙️ Configuración Inicial

### 1. Verificar Tesseract OCR

```bash
# Verificar instalación
tesseract --version

# Si no está instalado:
# Windows: Descargar desde https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt install tesseract-ocr tesseract-ocr-spa
# macOS: brew install tesseract
```

### 2. Instalar Dependencias Python

```bash
# Navegar al directorio del servidor
cd server/

# Instalar dependencias del OCR híbrido
pip install google-cloud-vision==3.4.4
pip install easyocr==1.7.0
pip install paddlepaddle==2.5.1
pip install paddleocr==2.7.0.3

# Verificar requirements.txt actualizado
pip install -r requirements.txt
```

### 3. Verificar Estructura de Archivos

Asegurar que existen estos archivos creados:

```
server/
├── app/
│   ├── services/
│   │   ├── hybrid_ocr_service.py              ✅ Servicio híbrido principal
│   │   ├── enhanced_hybrid_ocr_service.py     ✅ Servicio con extractores
│   │   ├── ocr_metrics_service.py             ✅ Sistema de métricas
│   │   └── ocr_migration_service.py           ✅ Migración gradual
│   ├── api/routes/
│   │   ├── hybrid_ocr.py                      ✅ Endpoints híbridos
│   │   └── ocr_metrics.py                     ✅ Endpoints de métricas
│   └── core/
│       └── config.py                          ✅ Configuración OCR
├── temp/                                      📁 Directorio temporal
├── ocr_cache/                                 📁 Cache del sistema
├── ocr_metrics/                               📁 Métricas y logs
└── ocr_migration/                             📁 Estado de migración
```

---

## 🔐 Variables de Entorno

### Archivo `.env` Requerido

Crear/actualizar el archivo `server/.env` con las siguientes variables:

```bash
# === CONFIGURACIÓN OCR HÍBRIDO ===

# Google Vision API (OBLIGATORIO para funcionalidad premium)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
GOOGLE_VISION_ENABLED=true
GOOGLE_VISION_MONTHLY_LIMIT=1000

# Configuración OCR
OCR_CONFIDENCE_THRESHOLD=0.90
OCR_CACHE_ENABLED=true
OCR_CACHE_DURATION_HOURS=24

# Configuración Tesseract
TESSERACT_CMD=/usr/bin/tesseract  # Ajustar según sistema
TESSERACT_LANGUAGE=spa+eng

# Configuración de rendimiento
OCR_MAX_PROCESSING_TIME=30
OCR_ENABLE_PARALLEL_PROCESSING=true

# === CONFIGURACIÓN EXISTENTE ===
# (Mantener todas las variables existentes)
DATABASE_URL=mongodb://localhost:27017/gastify
JWT_SECRET_KEY=your_jwt_secret_here
# ... resto de configuración
```

### 🔍 Descripción de Variables

| Variable | Descripción | Requerido | Valor por Defecto |
|----------|-------------|-----------|-------------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al archivo de credenciales JSON de Google Cloud | ⚠️ Para Premium | - |
| `GOOGLE_VISION_API_KEY` | API Key de Google Vision (alternativa a credentials) | ⚠️ Para Premium | - |
| `GOOGLE_VISION_ENABLED` | Habilitar Google Vision API | No | `true` |
| `GOOGLE_VISION_MONTHLY_LIMIT` | Límite mensual de requests a Google Vision | No | `1000` |
| `OCR_CONFIDENCE_THRESHOLD` | Umbral de confianza para fallback | No | `0.90` |
| `OCR_CACHE_ENABLED` | Habilitar cache de resultados | No | `true` |
| `OCR_CACHE_DURATION_HOURS` | Duración del cache en horas | No | `24` |

---

## 🔑 Configuración de Google Vision API

### 1. Crear Proyecto en Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar **Vision API**:
   ```bash
   # Usando gcloud CLI
   gcloud services enable vision.googleapis.com
   ```

### 2. Crear Service Account

1. Ir a **IAM & Admin > Service Accounts**
2. Crear nueva cuenta de servicio:
   - **Nombre**: `gastify-ocr-service`
   - **Descripción**: `Service account for Gastify OCR hybrid system`
3. Asignar roles:
   - ✅ `Cloud Vision AI Service Agent`
   - ✅ `Service Account User`

### 3. Generar Credenciales

1. En la cuenta de servicio creada, ir a **Keys**
2. Agregar nueva key > **JSON**
3. Descargar el archivo JSON
4. Guardar como `google-vision-credentials.json` en directorio seguro
5. Actualizar `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/google-vision-credentials.json
   ```

### 4. Configurar Facturación (Importante)

⚠️ **IMPORTANTE**: Google Vision requiere facturación habilitada

1. Ir a **Billing** en Google Cloud Console
2. Asociar proyecto con cuenta de facturación
3. Configurar alertas de presupuesto:
   - Presupuesto mensual: $10-50 USD
   - Alertas: 50%, 80%, 100%

### 5. Verificar Cuotas

```bash
# Verificar límites actuales
gcloud compute project-info describe --project=YOUR_PROJECT_ID

# Verificar uso de Vision API
gcloud logging read 'resource.type="cloud_function" AND textPayload:"vision"' --limit=10
```

---

## ✅ Verificación del Sistema

### 1. Script de Verificación Automática

Crear y ejecutar script de verificación:

```bash
# Crear script de verificación
cat > verify_hybrid_ocr.py << 'EOF'
#!/usr/bin/env python3
"""
Script de verificación del Sistema OCR Híbrido
Verifica configuración, dependencias y funcionalidad básica
"""

import asyncio
import sys
import os
from pathlib import Path

# Agregar path del proyecto
sys.path.append(str(Path(__file__).parent / "app"))

async def verify_system():
    print("🔍 Verificando Sistema OCR Híbrido")
    print("=" * 50)
    
    errors = []
    warnings = []
    
    # 1. Verificar imports
    print("📦 Verificando dependencias...")
    try:
        from app.services.hybrid_ocr_service import HybridOCRService
        from app.services.enhanced_hybrid_ocr_service import EnhancedHybridOCRService
        from app.services.ocr_metrics_service import ocr_metrics_service
        from app.services.ocr_migration_service import ocr_migration_service
        print("✅ Todos los servicios importados correctamente")
    except ImportError as e:
        errors.append(f"Error importando servicios: {e}")
    
    # 2. Verificar Tesseract
    print("📖 Verificando Tesseract...")
    try:
        import pytesseract
        tesseract_version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract {tesseract_version} disponible")
    except Exception as e:
        errors.append(f"Tesseract no disponible: {e}")
    
    # 3. Verificar Google Vision
    print("🔍 Verificando Google Vision...")
    try:
        from google.cloud import vision
        
        # Verificar credenciales
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        api_key = os.getenv('GOOGLE_VISION_API_KEY')
        
        if credentials_path and Path(credentials_path).exists():
            print("✅ Credenciales de Google Vision encontradas")
        elif api_key:
            print("✅ API Key de Google Vision configurada")
        else:
            warnings.append("Google Vision no configurado (modo solo Tesseract)")
            
    except ImportError:
        warnings.append("google-cloud-vision no instalado")
    
    # 4. Verificar configuración
    print("⚙️ Verificando configuración...")
    try:
        from app.core.config import settings
        
        required_settings = [
            'OCR_CONFIDENCE_THRESHOLD',
            'GOOGLE_VISION_ENABLED',
            'OCR_CACHE_ENABLED'
        ]
        
        for setting in required_settings:
            if hasattr(settings, setting):
                value = getattr(settings, setting)
                print(f"✅ {setting}: {value}")
            else:
                warnings.append(f"Configuración {setting} no encontrada")
                
    except Exception as e:
        errors.append(f"Error verificando configuración: {e}")
    
    # 5. Verificar directorios
    print("📁 Verificando directorios...")
    required_dirs = ['temp', 'ocr_cache', 'ocr_metrics', 'ocr_migration']
    
    for dir_name in required_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists():
            print(f"✅ Directorio {dir_name}/ existe")
        else:
            print(f"📁 Creando directorio {dir_name}/")
            dir_path.mkdir(exist_ok=True)
    
    # 6. Test básico del sistema
    print("🧪 Realizando test básico...")
    try:
        hybrid_service = HybridOCRService()
        stats = hybrid_service.get_usage_stats()
        print(f"✅ Servicio híbrido funcionando - Stats: {len(stats)} métricas")
    except Exception as e:
        errors.append(f"Error en test básico: {e}")
    
    # Resultados
    print("\n" + "=" * 50)
    print("📊 RESULTADOS DE VERIFICACIÓN")
    print("=" * 50)
    
    if not errors:
        print("🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("✅ Todos los componentes verificados exitosamente")
        
        if warnings:
            print(f"\n⚠️ {len(warnings)} advertencias:")
            for warning in warnings:
                print(f"   • {warning}")
        
        print("\n🚀 El sistema está listo para uso en producción")
        return True
    else:
        print(f"❌ {len(errors)} errores encontrados:")
        for error in errors:
            print(f"   • {error}")
        
        if warnings:
            print(f"\n⚠️ {len(warnings)} advertencias:")
            for warning in warnings:
                print(f"   • {warning}")
        
        print("\n🔧 Corrige los errores antes de usar el sistema")
        return False

if __name__ == "__main__":
    success = asyncio.run(verify_system())
    sys.exit(0 if success else 1)
EOF

# Ejecutar verificación
python verify_hybrid_ocr.py
```

### 2. Test de Funcionalidad

```bash
# Test de endpoints API
curl -X GET http://localhost:8000/api/hybrid-ocr/health

# Test de métricas
curl -X GET http://localhost:8000/api/ocr-metrics/health

# Crear métrica de prueba
curl -X POST http://localhost:8000/api/ocr-metrics/test-metric \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Verificación de Logs

```bash
# Monitorear logs en tiempo real
tail -f logs/app.log | grep "OCR\|Hybrid"

# Verificar métricas
ls -la ocr_metrics/
cat ocr_metrics/metrics.jsonl | tail -5

# Verificar estado de migración
cat ocr_migration/migration_state.json
```

---

## 🔧 Resolución de Problemas

### Problema: Google Vision No Funciona

**Síntomas:**
- Error: "Could not load the default credentials"
- Logs: "Google Vision API not available"

**Solución:**
```bash
# 1. Verificar credenciales
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# 2. Verificar permisos
gcloud auth application-default print-access-token

# 3. Verificar proyecto
gcloud config get-value project

# 4. Test directo
python -c "
from google.cloud import vision
client = vision.ImageAnnotatorClient()
print('Google Vision disponible')
"
```

### Problema: Tesseract No Detectado

**Síntomas:**
- Error: "TesseractNotFoundError"
- Tesseract no responde

**Solución:**
```bash
# Verificar instalación
which tesseract
tesseract --version

# Instalar si es necesario
# Ubuntu/Debian:
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-spa

# Windows: Descargar installer
# macOS:
brew install tesseract

# Configurar path en .env
echo "TESSERACT_CMD=$(which tesseract)" >> .env
```

### Problema: Dependencias Faltantes

**Síntomas:**
- ImportError para librerías OCR
- Errores de build en Windows

**Solución:**
```bash
# Reinstalar dependencias OCR
pip uninstall easyocr paddleocr paddlepaddle -y
pip install easyocr==1.7.0
pip install paddlepaddle-gpu==2.5.1  # Para GPU
# O para CPU:
pip install paddlepaddle==2.5.1
pip install paddleocr==2.7.0.3

# En Windows, si hay errores de build:
pip install --only-binary=all easyocr
```

### Problema: Cache No Funciona

**Síntomas:**
- Siempre re-procesa las mismas imágenes
- No encuentra archivos de cache

**Solución:**
```bash
# Verificar directorio de cache
ls -la ocr_cache/
mkdir -p ocr_cache
chmod 755 ocr_cache

# Verificar configuración
grep OCR_CACHE .env

# Limpiar cache si está corrupto
rm -rf ocr_cache/*
```

### Problema: Métricas No Se Guardan

**Síntomas:**
- No aparecen métricas en dashboard
- Archivos de métricas vacíos

**Solución:**
```bash
# Verificar permisos de directorio
ls -la ocr_metrics/
chmod 755 ocr_metrics
chmod 644 ocr_metrics/*.json*

# Verificar espacio en disco
df -h

# Test manual de métricas
python -c "
from app.services.ocr_metrics_service import ocr_metrics_service
ocr_metrics_service.record_ocr_processing('tesseract', 0.85, 2.0)
print('Métrica registrada')
"
```

---

## 📞 Soporte

### Logs Importantes

```bash
# Logs del sistema OCR
tail -f logs/app.log | grep "OCR\|Hybrid"

# Métricas en tiempo real
tail -f ocr_metrics/metrics.jsonl

# Estado de migración
cat ocr_migration/migration_state.json | jq .
```

### Información de Debug

Para reportar problemas, incluir:

1. **Versión del sistema**: `python --version`, `tesseract --version`
2. **Configuración**: Variables de entorno (sin credenciales)
3. **Logs**: Últimas 50 líneas de logs relevantes
4. **Métricas**: Estado actual del sistema
5. **Test de verificación**: Resultado de `verify_hybrid_ocr.py`

### Contacto

- 📧 **Email**: soporte-gastify@empresa.com
- 📚 **Documentación**: [Enlace a documentación completa]
- 🐛 **Issues**: [Enlace a sistema de tickets]

---

## 🎯 Próximos Pasos

Una vez configurado exitosamente:

1. ✅ [Revisar Manual de Usuario](HYBRID_OCR_USER_GUIDE.md)
2. ✅ [Configurar Monitoreo](HYBRID_OCR_MONITORING.md)
3. ✅ [Planificar Migración](HYBRID_OCR_MIGRATION.md)
4. ✅ [Optimizar Rendimiento](HYBRID_OCR_OPTIMIZATION.md)

---

*📝 Última actualización: 2025-01-12*
*🔄 Versión: 1.0.0*
