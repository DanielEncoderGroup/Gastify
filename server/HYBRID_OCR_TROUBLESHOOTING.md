# 🔧 Sistema OCR Híbrido - Guía de Resolución de Problemas

## 📋 Tabla de Contenidos

1. [Diagnóstico Rápido](#diagnóstico-rápido)
2. [Problemas de Configuración](#problemas-de-configuración)
3. [Errores de Procesamiento](#errores-de-procesamiento)
4. [Problemas de Rendimiento](#problemas-de-rendimiento)
5. [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)

---

## 🚨 Diagnóstico Rápido

### ⚡ Verificación en 2 Minutos

```bash
# 1. Verificar estado general del sistema
curl -X GET "http://localhost:8000/api/hybrid-ocr/health" | jq

# 2. Verificar servicios críticos
curl -X GET "http://localhost:8000/api/ocr-metrics/health" | jq

# 3. Probar procesamiento básico
curl -X POST "http://localhost:8000/api/hybrid-ocr/analyze-hybrid" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@test_receipt.jpg"
```

---

## ⚙️ Problemas de Configuración

### 🔑 Variables de Entorno Faltantes

#### ❌ **Error Típico**
```
KeyError: 'GOOGLE_APPLICATION_CREDENTIALS'
ConfigurationError: Google Vision API not configured
```

#### ✅ **Solución**
```bash
# 1. Verificar variables requeridas
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_VISION_API_KEY

# 2. Configurar credenciales
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
export GOOGLE_VISION_API_KEY="your-api-key"

# 3. Verificar archivo .env
cat .env | grep -E "(GOOGLE|OCR|TESSERACT)"
```

#### 📋 **Checklist de Variables**
```env
# Requeridas
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
GOOGLE_VISION_API_KEY=your_api_key_here

# Opcionales pero recomendadas
OCR_CACHE_ENABLED=true
OCR_CACHE_TTL=3600
OCR_CONFIDENCE_THRESHOLD=0.9
TESSERACT_CMD_PATH=/usr/bin/tesseract
OCR_MAX_GOOGLE_REQUESTS_PER_MONTH=1000
```

### 🔧 Problemas de Tesseract

#### ❌ **Error Típico**
```
TesseractNotFoundError: tesseract is not installed
FileNotFoundError: [Errno 2] No such file or directory: 'tesseract'
```

#### ✅ **Solución por Sistema Operativo**

**Windows:**
```powershell
# Descargar e instalar desde GitHub
# https://github.com/UB-Mannheim/tesseract/wiki

# Verificar instalación
tesseract --version

# Configurar path en .env
TESSERACT_CMD_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-spa
tesseract --version
```

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang
tesseract --version
```

---

## 🔄 Errores de Procesamiento

### 📸 Problemas de Imagen

#### ❌ **Error: "Image format not supported"**
```python
def validate_image_format(file_path):
    """Verificar formato de imagen"""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            print(f"Formato: {img.format}")
            print(f"Modo: {img.mode}")
            print(f"Tamaño: {img.size}")
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False
```

#### ✅ **Convertir Formato**
```python
from PIL import Image

def convert_to_supported_format(input_path, output_path):
    """Convertir imagen a formato soportado"""
    with Image.open(input_path) as img:
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        img.save(output_path, 'JPEG', quality=85, optimize=True)
        print(f"Convertido: {input_path} → {output_path}")
```

### 🎯 Problemas de Confianza

#### ❌ **Confianza Siempre Baja (<70%)**

```python
def diagnose_low_confidence(image_path):
    """Diagnosticar causas de confianza baja"""
    from PIL import Image
    import numpy as np
    
    with Image.open(image_path) as img:
        img_array = np.array(img.convert('L'))
        
        contrast = img_array.std()
        brightness = img_array.mean()
        
        print(f"Análisis de Calidad:")
        print(f"- Contraste: {contrast:.2f} {'✅' if contrast > 50 else '❌'}")
        print(f"- Brillo: {brightness:.2f} {'✅' if 50 < brightness < 200 else '❌'}")
        print(f"- Resolución: {img.size} {'✅' if min(img.size) > 800 else '❌'}")
        
        if contrast < 30:
            print("🔧 Recomendación: Mejorar contraste")
        if brightness < 50:
            print("🔧 Recomendación: Más iluminación")
        if min(img.size) < 800:
            print("🔧 Recomendación: Mayor resolución")
```

---

## ⚡ Problemas de Rendimiento

### 🐌 Procesamiento Lento

#### 📊 **Medición de Performance**
```python
import time
import psutil

def measure_ocr_performance(image_path):
    """Medir rendimiento del procesamiento OCR"""
    
    start_time = time.time()
    start_memory = psutil.virtual_memory().used / 1024 / 1024
    
    # Tu procesamiento OCR aquí
    
    end_time = time.time()
    end_memory = psutil.virtual_memory().used / 1024 / 1024
    
    processing_time = end_time - start_time
    memory_used = end_memory - start_memory
    
    print(f"📊 Métricas de Rendimiento:")
    print(f"⏱️  Tiempo total: {processing_time:.2f}s")
    print(f"🧠 Memoria usada: {memory_used:.2f}MB")
    
    if processing_time > 10:
        print("⚠️ Procesamiento muy lento (>10s)")
    if memory_used > 500:
        print("⚠️ Uso de memoria alto (>500MB)")
```

### 💾 Problemas de Memoria

#### ❌ **Error: "Out of Memory"**
```python
def monitor_memory_usage():
    """Monitorear uso de memoria"""
    import gc
    
    gc.collect()
    memory = psutil.virtual_memory()
    process = psutil.Process()
    
    print(f"💾 Estado de Memoria:")
    print(f"  Total: {memory.total / 1024**3:.2f}GB")
    print(f"  Disponible: {memory.available / 1024**3:.2f}GB")
    print(f"  Uso del proceso: {process.memory_info().rss / 1024**2:.2f}MB")
    print(f"  Porcentaje usado: {memory.percent}%")
    
    if memory.percent > 85:
        print("⚠️ Memoria crítica (>85%)")
        return False
    
    return True
```

---

## 🛠️ Herramientas de Diagnóstico

### 🔍 Script de Diagnóstico Completo

```python
#!/usr/bin/env python3
"""
Script de diagnóstico completo para Sistema OCR Híbrido
Uso: python diagnose_ocr_system.py
"""

import os
import sys
import requests
import subprocess

def check_environment():
    """Verificar variables de entorno"""
    required_vars = [
        'GOOGLE_APPLICATION_CREDENTIALS',
        'GOOGLE_VISION_API_KEY',
        'OCR_CACHE_ENABLED'
    ]
    
    print("🔍 Verificando variables de entorno...")
    issues = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            issues.append(f"❌ {var} no está configurada")
        else:
            print(f"✅ {var} = {value[:20]}...")
    
    return issues

def check_tesseract():
    """Verificar instalación de Tesseract"""
    print("\n🔍 Verificando Tesseract...")
    
    try:
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"✅ Tesseract encontrado: {version}")
            return []
        else:
            return ["❌ Tesseract no responde correctamente"]
    except FileNotFoundError:
        return ["❌ Tesseract no está instalado"]

def check_api_endpoints():
    """Verificar endpoints de API"""
    print("\n🔍 Verificando endpoints de API...")
    
    base_url = "http://localhost:8000"
    endpoints = [
        "/api/hybrid-ocr/health",
        "/api/ocr-metrics/health",
        "/docs"
    ]
    
    issues = []
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {endpoint}")
            else:
                issues.append(f"❌ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            issues.append(f"❌ {endpoint} - Error: {str(e)}")
    
    return issues

def generate_report(all_issues):
    """Generar reporte de diagnóstico"""
    print("\n" + "="*50)
    print("📋 REPORTE DE DIAGNÓSTICO")
    print("="*50)
    
    if not all_issues:
        print("🎉 ¡Sistema completamente funcional!")
        return True
    
    print(f"🚨 Se encontraron {len(all_issues)} problemas:")
    for i, issue in enumerate(all_issues, 1):
        print(f"{i}. {issue}")
    
    print("\n🔧 SOLUCIONES RECOMENDADAS:")
    print("1. Revisar HYBRID_OCR_SETUP.md para configuración")
    print("2. Ejecutar: pip install -r requirements.txt")
    print("3. Configurar variables de entorno en .env")
    print("4. Verificar credenciales de Google Cloud")
    
    return False

def main():
    """Función principal de diagnóstico"""
    print("🚀 Iniciando diagnóstico del Sistema OCR Híbrido\n")
    
    all_issues = []
    all_issues.extend(check_environment())
    all_issues.extend(check_tesseract())
    all_issues.extend(check_api_endpoints())
    
    system_ok = generate_report(all_issues)
    sys.exit(0 if system_ok else 1)

if __name__ == "__main__":
    main()
```

---

## 📞 Contacto y Soporte

### 🆘 Información para Reportes

Cuando reportes un problema, incluye:

1. **Imagen problemática** (si es posible)
2. **Mensaje de error** completo
3. **Configuración utilizada**
4. **Resultado esperado vs obtenido**
5. **Timestamp del error**

### 📞 Canales de Soporte

- 📧 **Email**: ocr-support@gastify.com
- 💬 **Chat**: Disponible en la interfaz
- 📚 **Documentación**: `/docs/hybrid-ocr`
- 🐛 **Issues**: GitHub Issues para bugs

---

*📝 Última actualización: 2025-01-12*
*🔧 Guía creada por el equipo de Gastify OCR*
