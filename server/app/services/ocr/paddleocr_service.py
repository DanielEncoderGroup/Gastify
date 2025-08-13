"""
Implementación del servicio OCR usando PaddleOCR.
Optimizado para recibos chilenos con detección de layout avanzada.
"""

import cv2
import numpy as np
import logging
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image
import os

from .base_ocr_service import BaseOCRService

logger = logging.getLogger(__name__)

class PaddleOCRService(BaseOCRService):
    """
    Servicio OCR usando PaddleOCR con optimizaciones para recibos chilenos.
    
    PaddleOCR es especialmente bueno para:
    - Detección de layout de documentos
    - Texto en tablas y estructuras complejas
    - Reconocimiento de texto en múltiples idiomas
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio PaddleOCR.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        super().__init__(language)
        
        self.ocr_engine = None
        self.supported_languages = ['es', 'en']  # Español e inglés
        
        # Inicializar PaddleOCR
        self._initialize_paddleocr()
    
    def _initialize_paddleocr(self):
        """Inicializa el motor PaddleOCR."""
        try:
            from paddleocr import PaddleOCR
            
            # Crear instancia de PaddleOCR
            self.ocr_engine = PaddleOCR(
                use_angle_cls=True,  # Usar clasificador de ángulos
                lang='es',  # Idioma principal español
                use_gpu=False,  # Usar CPU para compatibilidad
                det_model_dir=None,  # Usar modelo por defecto
                rec_model_dir=None,  # Usar modelo por defecto
                cls_model_dir=None   # Usar modelo por defecto
            )
            
            logger.info("PaddleOCR inicializado correctamente")
            
        except ImportError:
            logger.warning("PaddleOCR no disponible. Instalar con: pip install paddlepaddle paddleocr")
            self.ocr_engine = None
        except Exception as e:
            logger.error(f"Error inicializando PaddleOCR: {str(e)}")
            self.ocr_engine = None
    
    def is_available(self) -> bool:
        """Verifica si PaddleOCR está disponible."""
        return self.ocr_engine is not None
    
    def preprocess_image(self, image_path: str, **kwargs) -> np.ndarray:
        """
        Preprocesa imagen para PaddleOCR.
        
        Args:
            image_path: Ruta a la imagen
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        if not self.validate_image(image_path):
            raise ValueError(f"Imagen no válida: {image_path}")
        
        try:
            # Cargar imagen
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"No se pudo cargar imagen: {image_path}")
            
            # PaddleOCR funciona bien con imágenes en color
            # Aplicar mejoras mínimas
            
            # Redimensionar si es muy grande (PaddleOCR puede ser lento)
            height, width = image.shape[:2]
            if width > 2000 or height > 2000:
                scale = min(2000/width, 2000/height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            # Mejorar contraste ligeramente
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            enhanced = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error preprocesando imagen para PaddleOCR: {str(e)}")
            raise ValueError(f"Error en preprocesamiento: {str(e)}")
    
    def extract_text(self, image: np.ndarray, language: Optional[str] = None) -> str:
        """
        Extrae texto usando PaddleOCR.
        
        Args:
            image: Imagen preprocesada
            language: Idioma específico (no usado directamente)
            
        Returns:
            Texto extraído
        """
        if not self.is_available():
            raise RuntimeError("PaddleOCR no está disponible")
        
        try:
            # PaddleOCR espera imagen en formato BGR (OpenCV)
            if len(image.shape) == 2:  # Escala de grises
                image_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            else:
                image_bgr = image
            
            # Ejecutar OCR
            results = self.ocr_engine.ocr(image_bgr, cls=True)
            
            if not results or not results[0]:
                return ""
            
            # Extraer texto ordenado por posición vertical
            text_lines = []
            for line in results[0]:
                if len(line) >= 2:
                    bbox, (text, confidence) = line
                    if confidence > 0.3:  # Filtrar texto con baja confianza
                        # Calcular posición Y promedio
                        y_avg = sum([point[1] for point in bbox]) / 4
                        text_lines.append((y_avg, text.strip()))
            
            # Ordenar por posición vertical
            text_lines.sort(key=lambda x: x[0])
            extracted_text = '\n'.join([text for _, text in text_lines])
            
            return extracted_text
            
        except Exception as e:
            logger.error(f"Error en extracción PaddleOCR: {str(e)}")
            raise RuntimeError(f"Error en PaddleOCR: {str(e)}")
    
    def extract_text_with_confidence(self, image: np.ndarray) -> Tuple[str, float]:
        """
        Extrae texto con información de confianza.
        
        Args:
            image: Imagen preprocesada
            
        Returns:
            Tuple de (texto, confianza_promedio)
        """
        if not self.is_available():
            raise RuntimeError("PaddleOCR no está disponible")
        
        try:
            # Preparar imagen
            if len(image.shape) == 2:
                image_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            else:
                image_bgr = image
            
            # Ejecutar OCR con detalles
            results = self.ocr_engine.ocr(image_bgr, cls=True)
            
            if not results or not results[0]:
                return "", 0.0
            
            # Procesar resultados
            text_lines = []
            confidences = []
            
            for line in results[0]:
                if len(line) >= 2:
                    bbox, (text, confidence) = line
                    if confidence > 0.2:  # Threshold más bajo para análisis
                        y_avg = sum([point[1] for point in bbox]) / 4
                        text_lines.append((y_avg, text.strip()))
                        confidences.append(confidence)
            
            if not text_lines:
                return "", 0.0
            
            # Ordenar y concatenar
            text_lines.sort(key=lambda x: x[0])
            final_text = '\n'.join([text for _, text in text_lines])
            
            # Calcular confianza promedio ponderada
            total_chars = sum(len(text) for _, text in text_lines)
            if total_chars == 0:
                avg_confidence = 0.0
            else:
                weighted_confidence = sum(
                    conf * len(text) for conf, (_, text) in zip(confidences, text_lines)
                )
                avg_confidence = weighted_confidence / total_chars
            
            return final_text, avg_confidence
            
        except Exception as e:
            logger.error(f"Error en extracción con confianza PaddleOCR: {str(e)}")
            return "", 0.0
    
    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """
        Extrae datos estructurados de recibo usando PaddleOCR.
        
        Args:
            image_path: Ruta a la imagen del recibo
            
        Returns:
            Diccionario con datos extraídos
        """
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Extraer texto con confianza
            raw_text, confidence = self.extract_text_with_confidence(processed_image)
            
            return {
                'raw_text': raw_text,
                'confidence': confidence,
                'engine': 'paddleocr',
                'vendor': self._extract_vendor(raw_text),
                'total_amount': self._extract_total(raw_text),
                'date': self._extract_date(raw_text),
                'items': self._extract_items(raw_text),
                'metadata': {
                    'processing_time': 0.0,
                    'image_quality': self._assess_image_quality(processed_image),
                    'text_regions': len(raw_text.split('\n')) if raw_text else 0,
                    'layout_detected': True  # PaddleOCR siempre detecta layout
                }
            }
            
        except Exception as e:
            logger.error(f"Error extrayendo datos de recibo con PaddleOCR: {str(e)}")
            return {
                'raw_text': '',
                'confidence': 0.0,
                'engine': 'paddleocr',
                'error': str(e)
            }
    
    def extract_structured_data(self, image_path: str) -> Dict[str, Any]:
        """
        Extrae datos estructurados con información de layout.
        
        Args:
            image_path: Ruta a la imagen
            
        Returns:
            Datos estructurados con información de posición
        """
        if not self.is_available():
            raise RuntimeError("PaddleOCR no está disponible")
        
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Ejecutar OCR con información de layout
            results = self.ocr_engine.ocr(processed_image, cls=True)
            
            if not results or not results[0]:
                return {'regions': [], 'confidence': 0.0}
            
            # Procesar regiones de texto
            regions = []
            total_confidence = 0.0
            
            for line in results[0]:
                if len(line) >= 2:
                    bbox, (text, confidence) = line
                    
                    # Calcular coordenadas del bounding box
                    x_coords = [point[0] for point in bbox]
                    y_coords = [point[1] for point in bbox]
                    
                    region = {
                        'text': text.strip(),
                        'confidence': confidence,
                        'bbox': {
                            'x_min': min(x_coords),
                            'y_min': min(y_coords),
                            'x_max': max(x_coords),
                            'y_max': max(y_coords)
                        },
                        'center': {
                            'x': sum(x_coords) / 4,
                            'y': sum(y_coords) / 4
                        }
                    }
                    
                    regions.append(region)
                    total_confidence += confidence
            
            avg_confidence = total_confidence / len(regions) if regions else 0.0
            
            return {
                'regions': regions,
                'confidence': avg_confidence,
                'total_regions': len(regions),
                'engine': 'paddleocr'
            }
            
        except Exception as e:
            logger.error(f"Error extrayendo datos estructurados: {str(e)}")
            return {'regions': [], 'confidence': 0.0, 'error': str(e)}
    
    def _extract_vendor(self, text: str) -> Optional[str]:
        """Extrae nombre del vendor del texto."""
        if not text:
            return None
        
        lines = text.split('\n')
        # Buscar en las primeras líneas
        for line in lines[:5]:
            line = line.strip().upper()
            if len(line) > 3:
                # Vendors chilenos comunes
                vendors = ['JUMBO', 'LIDER', 'SANTA ISABEL', 'COPEC', 'SHELL', 
                          'TOTTUS', 'UNIMARC', 'CRUZ VERDE', 'SALCOBRAND']
                for vendor in vendors:
                    if vendor in line:
                        return line
        
        return None
    
    def _extract_total(self, text: str) -> Optional[float]:
        """Extrae el total del recibo."""
        import re
        
        if not text:
            return None
        
        # Patrones para total en formato chileno
        patterns = [
            r'TOTAL[:\s]*\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)',
            r'TOTAL[:\s]*([0-9]{1,3}(?:\.[0-9]{3})*)',
            r'\$\s*([0-9]{1,3}(?:\.[0-9]{3})*)\s*$'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                try:
                    # Convertir formato chileno
                    amount_str = matches[-1].replace('.', '').replace(',', '.')
                    return float(amount_str)
                except:
                    continue
        
        return None
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extrae la fecha del recibo."""
        import re
        
        if not text:
            return None
        
        # Patrones de fecha chilenos
        date_patterns = [
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            r'(\d{1,2}\s+\w+\s+\d{2,4})',
            r'FECHA[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})'
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return matches[0]
        
        return None
    
    def _extract_items(self, text: str) -> List[Dict[str, Any]]:
        """Extrae items del recibo."""
        if not text:
            return []
        
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) < 5:
                continue
            
            # Buscar líneas que contengan precio
            import re
            price_match = re.search(r'([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)\s*$', line)
            if price_match:
                price_str = price_match.group(1)
                try:
                    # Convertir formato chileno
                    price = float(price_str.replace('.', '').replace(',', '.'))
                    if price > 10:  # Filtrar precios muy bajos
                        item_name = line[:price_match.start()].strip()
                        if item_name and len(item_name) > 2:
                            items.append({
                                'name': item_name,
                                'total_price': price,
                                'confidence': 0.8,  # PaddleOCR generalmente más confiable
                                'engine': 'paddleocr'
                            })
                except:
                    continue
        
        return items[:25]  # Limitar a 25 items
    
    def _assess_image_quality(self, image: np.ndarray) -> str:
        """Evalúa la calidad de la imagen."""
        try:
            # Convertir a escala de grises si es necesario
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Calcular varianza de Laplacian (medida de nitidez)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Calcular contraste
            contrast = gray.std()
            
            # Evaluación combinada
            if laplacian_var > 500 and contrast > 50:
                return "excellent"
            elif laplacian_var > 200 and contrast > 30:
                return "good"
            elif laplacian_var > 100 and contrast > 20:
                return "fair"
            else:
                return "poor"
                
        except:
            return "unknown"
    
    def _get_supported_languages(self) -> List[str]:
        """Retorna idiomas soportados por PaddleOCR."""
        return ['es', 'en', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']
    
    def detect_language(self, text: str) -> str:
        """Detecta idioma del texto (PaddleOCR usa configuración fija)."""
        # PaddleOCR usa configuración de idiomas fija, retornamos español por defecto
        if not text or len(text.strip()) < 10:
            return 'es'
        
        # Detección simple basada en caracteres comunes
        spanish_chars = text.count('ñ') + text.count('á') + text.count('é') + text.count('í') + text.count('ó') + text.count('ú')
        if spanish_chars > 0:
            return 'es'
        
        return 'es'  # Default para Chile
    
    def get_confidence_score(self, image: np.ndarray, text: str) -> float:
        """Calcula score de confianza basado en calidad de imagen y texto."""
        if not text or len(text.strip()) < 3:
            return 0.0
        
        # Factor de calidad de imagen
        image_quality = self._assess_image_quality(image)
        quality_scores = {
            "excellent": 1.0,
            "good": 0.8,
            "fair": 0.6,
            "poor": 0.3,
            "unknown": 0.5
        }
        
        # Factor de longitud de texto
        text_length_factor = min(len(text.strip()) / 100.0, 1.0)
        
        # Factor de caracteres válidos
        valid_chars = sum(1 for c in text if c.isalnum() or c.isspace() or c in '.,;:!?-')
        valid_char_ratio = valid_chars / len(text) if text else 0
        
        # Combinar factores
        confidence = (quality_scores.get(image_quality, 0.5) * 0.4 + 
                     text_length_factor * 0.3 + 
                     valid_char_ratio * 0.3)
        
        return min(confidence, 1.0)
    
    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """Extrae datos estructurados de un recibo usando PaddleOCR.
        
        Args:
            image_path: Ruta a la imagen del recibo
            
        Returns:
            Dict con datos extraídos del recibo
        """
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Extraer texto con PaddleOCR
            full_text = self.extract_text(processed_image)
            
            # Detectar idioma
            detected_language = self.detect_language(full_text)
            
            # Calcular confianza
            confidence = self.get_confidence_score(processed_image, full_text)
            
            # Retornar estructura compatible
            return {
                'text': full_text,
                'confidence': confidence,
                'language': detected_language,
                'lines': [],  # PaddleOCR no proporciona información de líneas directamente
                'vendor': '',  # Se extraerá en post-procesamiento
                'total': 0.0,  # Se extraerá en post-procesamiento
                'items': [],   # Se extraerán en post-procesamiento
                'raw_data': {'full_text': full_text}
            }
            
        except Exception as e:
            logger.error(f"Error en extract_receipt_data (PaddleOCR): {str(e)}")
            return {
                'text': '',
                'confidence': 0.0,
                'language': 'es',
                'lines': [],
                'vendor': '',
                'total': 0.0,
                'items': [],
                'raw_data': {}
            }
