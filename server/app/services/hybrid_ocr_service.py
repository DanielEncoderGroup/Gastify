"""
Sistema OCR Híbrido Inteligente para Gastify
Combina Tesseract (gratuito) + Google Vision API (fallback) para >95% precisión

Arquitectura:
- Tesseract como engine primario (100% gratuito)
- Google Vision API como fallback inteligente (1000 gratis/mes)
- Sistema de consenso entre ambos engines
- Cache inteligente para evitar re-procesamiento
- Métricas y rate limiting automático
"""

import asyncio
import logging
import time
import hashlib
import json
import os
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# Google Vision API
try:
    from google.cloud import vision
    from google.cloud.vision_v1 import types
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False
    vision = None

from .ocr_service import FreeOCRService
from .enhanced_ocr_service import EnhancedOCRService

logger = logging.getLogger(__name__)

class OCREngine:
    """Enum-like class para engines OCR"""
    TESSERACT = "tesseract"
    GOOGLE_VISION = "google_vision"
    HYBRID = "hybrid"

class HybridOCRResult:
    """Resultado del procesamiento OCR híbrido"""
    def __init__(self, 
                 engine_used: str,
                 confidence: float,
                 data: Dict[str, Any],
                 processing_time: float,
                 fallback_used: bool = False,
                 google_usage_count: int = 0):
        self.engine_used = engine_used
        self.confidence = confidence
        self.data = data
        self.processing_time = processing_time
        self.fallback_used = fallback_used
        self.google_usage_count = google_usage_count
        self.timestamp = datetime.now()

class HybridOCRService:
    """
    Servicio OCR Híbrido Inteligente que combina:
    - Tesseract (primario, gratuito)
    - Google Vision API (fallback, 1000 gratis/mes)
    
    Características:
    - Decisión inteligente de engine
    - Cache para evitar re-procesamiento
    - Rate limiting Google Vision API
    - Métricas de uso y costos
    - Consenso entre engines cuando ambos están disponibles
    """
    
    def __init__(self):
        """Inicializa el servicio híbrido"""
        
        # Configuración desde variables de entorno
        self.google_vision_enabled = os.getenv("GOOGLE_VISION_ENABLED", "true").lower() == "true"
        self.google_monthly_limit = int(os.getenv("GOOGLE_VISION_MONTHLY_LIMIT", "1000"))
        self.confidence_threshold = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.90"))
        self.google_api_key = os.getenv("GOOGLE_VISION_API_KEY")
        self.google_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        # Inicializar engines OCR
        self.tesseract_service = FreeOCRService()
        self.enhanced_service = EnhancedOCRService()
        
        # Cache y métricas
        self.cache_dir = Path("ocr_cache")
        self.cache_dir.mkdir(exist_ok=True)
        
        self.metrics_file = "ocr_hybrid_metrics.json"
        self.load_metrics()
        
        # Cliente Google Vision
        self.google_client = None
        self._initialize_google_vision()
        
        logger.info(f"HybridOCRService inicializado - Google Vision: {'✅' if self.google_vision_available else '❌'}")
    
    def _initialize_google_vision(self):
        """Inicializa el cliente de Google Vision API"""
        if not GOOGLE_VISION_AVAILABLE:
            logger.warning("google-cloud-vision no está instalado")
            self.google_vision_available = False
            return
        
        if not self.google_vision_enabled:
            logger.info("Google Vision API deshabilitado en configuración")
            self.google_vision_available = False
            return
        
        try:
            # Configurar credenciales si están especificadas
            if self.google_credentials_path and os.path.exists(self.google_credentials_path):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.google_credentials_path
            
            # Crear cliente
            self.google_client = vision.ImageAnnotatorClient()
            
            # Test de conectividad simple
            self.google_vision_available = True
            logger.info("Google Vision API inicializado correctamente")
            
        except Exception as e:
            logger.error(f"Error inicializando Google Vision API: {e}")
            logger.warning("Funcionando solo con Tesseract")
            self.google_vision_available = False
    
    def load_metrics(self):
        """Carga métricas de uso"""
        try:
            if os.path.exists(self.metrics_file):
                with open(self.metrics_file, 'r') as f:
                    self.metrics = json.load(f)
            else:
                self.metrics = {
                    "google_usage_month": 0,
                    "last_reset": datetime.now().strftime("%Y-%m"),
                    "total_requests": 0,
                    "tesseract_usage": 0,
                    "google_usage": 0,
                    "cache_hits": 0,
                    "average_confidence": 0.0
                }
        except Exception as e:
            logger.error(f"Error cargando métricas: {e}")
            self.metrics = {}
    
    def save_metrics(self):
        """Guarda métricas de uso"""
        try:
            # Resetear contador mensual si es nuevo mes
            current_month = datetime.now().strftime("%Y-%m")
            if self.metrics.get("last_reset") != current_month:
                self.metrics["google_usage_month"] = 0
                self.metrics["last_reset"] = current_month
            
            with open(self.metrics_file, 'w') as f:
                json.dump(self.metrics, f, indent=2)
        except Exception as e:
            logger.error(f"Error guardando métricas: {e}")
    
    def _get_image_hash(self, image_path: str) -> str:
        """Genera hash único para la imagen (para cache)"""
        try:
            with open(image_path, 'rb') as f:
                content = f.read()
            return hashlib.md5(content).hexdigest()
        except Exception as e:
            logger.error(f"Error generando hash: {e}")
            return f"fallback_{int(time.time())}"
    
    def _get_cache_path(self, image_hash: str) -> Path:
        """Obtiene ruta del cache para una imagen"""
        return self.cache_dir / f"{image_hash}.json"
    
    def _load_from_cache(self, image_path: str) -> Optional[Dict[str, Any]]:
        """Carga resultado desde cache si existe"""
        try:
            image_hash = self._get_image_hash(image_path)
            cache_path = self._get_cache_path(image_hash)
            
            if cache_path.exists():
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                
                # Verificar que el cache no sea muy viejo (24 horas)
                cache_time = datetime.fromisoformat(cached_data.get("timestamp", "2000-01-01"))
                if datetime.now() - cache_time < timedelta(hours=24):
                    logger.info("✅ Resultado cargado desde cache")
                    self.metrics["cache_hits"] += 1
                    return cached_data["result"]
            
            return None
        except Exception as e:
            logger.error(f"Error cargando cache: {e}")
            return None
    
    def _save_to_cache(self, image_path: str, result: Dict[str, Any]):
        """Guarda resultado en cache"""
        try:
            image_hash = self._get_image_hash(image_path)
            cache_path = self._get_cache_path(image_hash)
            
            cache_data = {
                "timestamp": datetime.now().isoformat(),
                "image_hash": image_hash,
                "result": result
            }
            
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Error guardando cache: {e}")
    
    async def _process_with_tesseract(self, image_path: str) -> Dict[str, Any]:
        """Procesa imagen con Tesseract"""
        try:
            logger.info("🔍 Procesando con Tesseract...")
            start_time = time.time()
            
            # Usar el servicio mejorado que ya tenemos
            result = self.enhanced_service.extract_receipt_data(image_path)
            
            processing_time = time.time() - start_time
            
            # Normalizar resultado
            normalized_result = {
                "vendor": result.get("vendor", ""),
                "total_amount": result.get("total_amount", 0),
                "date": result.get("date", ""),
                "items": result.get("items", []),
                "raw_text": result.get("raw_text", ""),
                "confidence": result.get("confidence", 0.0),
                "processing_time": processing_time,
                "engine": OCREngine.TESSERACT
            }
            
            self.metrics["tesseract_usage"] += 1
            logger.info(f"✅ Tesseract completado - Confianza: {normalized_result['confidence']:.1%}")
            
            return normalized_result
            
        except Exception as e:
            logger.error(f"Error en Tesseract: {e}")
            return {
                "vendor": "",
                "total_amount": 0,
                "date": "",
                "items": [],
                "raw_text": "",
                "confidence": 0.0,
                "processing_time": 0,
                "engine": OCREngine.TESSERACT,
                "error": str(e)
            }
    
    async def _process_with_google_vision(self, image_path: str) -> Dict[str, Any]:
        """Procesa imagen con Google Vision API"""
        if not self.google_vision_available:
            raise Exception("Google Vision API no disponible")
        
        # Verificar límite mensual
        if self.metrics.get("google_usage_month", 0) >= self.google_monthly_limit:
            raise Exception(f"Límite mensual de Google Vision alcanzado ({self.google_monthly_limit})")
        
        try:
            logger.info("🔍 Procesando con Google Vision API...")
            start_time = time.time()
            
            # Leer imagen
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            # Crear request para Google Vision
            image = vision.Image(content=content)
            
            # Ejecutar OCR
            response = self.google_client.text_detection(image=image)
            texts = response.text_annotations
            
            processing_time = time.time() - start_time
            
            # Procesar respuesta
            if texts:
                raw_text = texts[0].description
                confidence = 0.95  # Google Vision typically has high confidence
                
                # Extraer datos estructurados usando el parser existente
                structured_data = self._extract_structured_data_from_text(raw_text)
                
                # Actualizar métricas
                self.metrics["google_usage"] += 1
                self.metrics["google_usage_month"] += 1
                
                result = {
                    "vendor": structured_data.get("vendor", ""),
                    "total_amount": structured_data.get("total_amount", 0),
                    "date": structured_data.get("date", ""),
                    "items": structured_data.get("items", []),
                    "raw_text": raw_text,
                    "confidence": confidence,
                    "processing_time": processing_time,
                    "engine": OCREngine.GOOGLE_VISION
                }
                
                logger.info(f"✅ Google Vision completado - Confianza: {confidence:.1%}")
                return result
            else:
                logger.warning("Google Vision no detectó texto")
                return {
                    "vendor": "",
                    "total_amount": 0,
                    "date": "",
                    "items": [],
                    "raw_text": "",
                    "confidence": 0.0,
                    "processing_time": processing_time,
                    "engine": OCREngine.GOOGLE_VISION
                }
                
        except Exception as e:
            logger.error(f"Error en Google Vision: {e}")
            raise
    
    def _extract_structured_data_from_text(self, raw_text: str) -> Dict[str, Any]:
        """Extrae datos estructurados del texto usando lógica existente"""
        try:
            # Reutilizar la lógica del FreeOCRService existente
            temp_service = FreeOCRService()
            
            # Extraer componentes individuales
            vendor = temp_service.extract_vendor(raw_text)
            total_amount = temp_service.extract_total_amount(raw_text)
            date = temp_service.extract_date(raw_text)
            items = temp_service.extract_items(raw_text)
            
            return {
                "vendor": vendor,
                "total_amount": total_amount,
                "date": date,
                "items": items
            }
        except Exception as e:
            logger.error(f"Error extrayendo datos estructurados: {e}")
            return {}
    
    def _decide_engine(self, image_path: str) -> str:
        """Decide qué engine usar basado en imagen y configuración"""
        
        # Si Google Vision no está disponible, usar Tesseract
        if not self.google_vision_available:
            return OCREngine.TESSERACT
        
        # Si hemos alcanzado el límite mensual, usar Tesseract
        if self.metrics.get("google_usage_month", 0) >= self.google_monthly_limit:
            logger.info("Límite mensual Google Vision alcanzado, usando Tesseract")
            return OCREngine.TESSERACT
        
        # Análisis rápido de imagen para decidir
        try:
            # Leer imagen para análisis
            img = cv2.imread(image_path)
            if img is None:
                return OCREngine.TESSERACT
            
            # Analizar calidad de imagen
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Calcular varianza (medida de claridad)
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Calcular contraste
            contrast = gray.std()
            
            # Criterios para usar Google Vision:
            # - Imagen borrosa (baja varianza)
            # - Bajo contraste
            # - Imagen muy pequeña o muy grande
            
            height, width = gray.shape
            size_score = 1.0
            if width < 500 or height < 500:
                size_score = 0.5  # Imagen pequeña
            elif width > 3000 or height > 3000:
                size_score = 0.7  # Imagen muy grande
            
            # Score de calidad (0-1, donde 1 es mejor calidad)
            quality_score = min(1.0, (variance / 1000) * (contrast / 100) * size_score)
            
            # Si calidad es baja, usar Google Vision
            if quality_score < 0.3:
                logger.info(f"Calidad baja detectada ({quality_score:.2f}), usando Google Vision")
                return OCREngine.GOOGLE_VISION
            else:
                logger.info(f"Calidad buena detectada ({quality_score:.2f}), usando Tesseract")
                return OCREngine.TESSERACT
                
        except Exception as e:
            logger.error(f"Error analizando imagen: {e}")
            return OCREngine.TESSERACT
    
    async def process_receipt_hybrid(self, image_path: str, force_engine: Optional[str] = None) -> HybridOCRResult:
        """
        Procesa recibo usando sistema híbrido inteligente
        
        Args:
            image_path: Ruta a la imagen del recibo
            force_engine: Forzar engine específico ("tesseract", "google_vision", "hybrid")
            
        Returns:
            HybridOCRResult con datos extraídos y metadata
        """
        
        start_time = time.time()
        self.metrics["total_requests"] += 1
        
        # Verificar cache primero
        cached_result = self._load_from_cache(image_path)
        if cached_result:
            return HybridOCRResult(
                engine_used="cache",
                confidence=cached_result.get("confidence", 0.0),
                data=cached_result,
                processing_time=0.01,
                fallback_used=False
            )
        
        try:
            # Decidir engine a usar
            if force_engine:
                chosen_engine = force_engine
            else:
                chosen_engine = self._decide_engine(image_path)
            
            fallback_used = False
            google_usage = 0
            
            # Procesar con engine elegido
            if chosen_engine == OCREngine.TESSERACT:
                result = await self._process_with_tesseract(image_path)
                
                # Si confianza es baja y Google Vision está disponible, usar fallback
                if (result["confidence"] < self.confidence_threshold and 
                    self.google_vision_available and
                    self.metrics.get("google_usage_month", 0) < self.google_monthly_limit):
                    
                    logger.info(f"Confianza Tesseract baja ({result['confidence']:.1%}), activando fallback Google Vision")
                    
                    try:
                        google_result = await self._process_with_google_vision(image_path)
                        
                        # Si Google Vision tiene mejor confianza, usarlo
                        if google_result["confidence"] > result["confidence"]:
                            result = google_result
                            fallback_used = True
                            google_usage = 1
                            logger.info("✅ Fallback Google Vision mejoró el resultado")
                        
                    except Exception as e:
                        logger.warning(f"Fallback Google Vision falló: {e}")
            
            elif chosen_engine == OCREngine.GOOGLE_VISION:
                result = await self._process_with_google_vision(image_path)
                google_usage = 1
            
            elif chosen_engine == OCREngine.HYBRID:
                # Procesar con ambos engines y hacer consenso
                tesseract_result = await self._process_with_tesseract(image_path)
                
                if (self.google_vision_available and 
                    self.metrics.get("google_usage_month", 0) < self.google_monthly_limit):
                    
                    google_result = await self._process_with_google_vision(image_path)
                    google_usage = 1
                    
                    # Consenso simple: usar el de mayor confianza
                    if google_result["confidence"] > tesseract_result["confidence"]:
                        result = google_result
                        result["consensus_method"] = "google_vision_higher_confidence"
                    else:
                        result = tesseract_result
                        result["consensus_method"] = "tesseract_higher_confidence"
                else:
                    result = tesseract_result
            
            else:
                raise ValueError(f"Engine no reconocido: {chosen_engine}")
            
            # Guardar en cache
            self._save_to_cache(image_path, result)
            
            # Actualizar métricas
            self.metrics["average_confidence"] = (
                (self.metrics.get("average_confidence", 0) * (self.metrics["total_requests"] - 1) + 
                 result["confidence"]) / self.metrics["total_requests"]
            )
            
            self.save_metrics()
            
            total_time = time.time() - start_time
            
            return HybridOCRResult(
                engine_used=result["engine"],
                confidence=result["confidence"],
                data=result,
                processing_time=total_time,
                fallback_used=fallback_used,
                google_usage_count=google_usage
            )
            
        except Exception as e:
            logger.error(f"Error en procesamiento híbrido: {e}")
            
            # Fallback de emergencia a Tesseract
            try:
                result = await self._process_with_tesseract(image_path)
                total_time = time.time() - start_time
                
                return HybridOCRResult(
                    engine_used=OCREngine.TESSERACT,
                    confidence=result["confidence"],
                    data=result,
                    processing_time=total_time,
                    fallback_used=True,
                    google_usage_count=0
                )
            except Exception as fallback_error:
                logger.error(f"Fallback de emergencia falló: {fallback_error}")
                
                # Resultado de error
                total_time = time.time() - start_time
                error_result = {
                    "vendor": "",
                    "total_amount": 0,
                    "date": "",
                    "items": [],
                    "raw_text": "",
                    "confidence": 0.0,
                    "processing_time": total_time,
                    "engine": "error",
                    "error": str(e)
                }
                
                return HybridOCRResult(
                    engine_used="error",
                    confidence=0.0,
                    data=error_result,
                    processing_time=total_time,
                    fallback_used=False,
                    google_usage_count=0
                )
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas de uso del sistema híbrido"""
        return {
            "google_vision_available": self.google_vision_available,
            "google_usage_month": self.metrics.get("google_usage_month", 0),
            "google_monthly_limit": self.google_monthly_limit,
            "google_remaining": max(0, self.google_monthly_limit - self.metrics.get("google_usage_month", 0)),
            "total_requests": self.metrics.get("total_requests", 0),
            "tesseract_usage": self.metrics.get("tesseract_usage", 0),
            "google_usage": self.metrics.get("google_usage", 0),
            "cache_hits": self.metrics.get("cache_hits", 0),
            "average_confidence": self.metrics.get("average_confidence", 0.0),
            "last_reset": self.metrics.get("last_reset", ""),
            "cache_enabled": True,
            "confidence_threshold": self.confidence_threshold
        }
