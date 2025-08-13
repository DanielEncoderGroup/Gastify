"""
Implementación del servicio OCR usando EasyOCR.
Optimizado para recibos chilenos con alta precisión.
"""

import cv2
import numpy as np
import logging
from typing import Dict, List, Any, Optional, Tuple
import os
import tempfile

# Compatibilidad con versiones nuevas de Pillow
try:
    from PIL.Image import Resampling
    ANTIALIAS = Resampling.LANCZOS
except ImportError:
    # Fallback para versiones antiguas de Pillow
    from PIL import Image
    ANTIALIAS = Image.ANTIALIAS

from .base_ocr_service import BaseOCRService

logger = logging.getLogger(__name__)

class EasyOCRService(BaseOCRService):
    """
    Servicio OCR usando EasyOCR con optimizaciones para recibos chilenos.
    
    EasyOCR es especialmente bueno para:
    - Texto en múltiples idiomas
    - Texto con diferentes orientaciones
    - Texto con fondos complejos
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio EasyOCR.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        super().__init__(language)
        
        self.reader = None
        self.supported_languages = ['es', 'en']  # Español e inglés para Chile
        
        # Inicializar EasyOCR
        self._initialize_easyocr()
    
    def _initialize_easyocr(self):
        """Inicializa el lector EasyOCR."""
        try:
            import easyocr
            
            # Crear lector con idiomas soportados
            self.reader = easyocr.Reader(
                self.supported_languages,
                gpu=False,  # Usar CPU para compatibilidad
                verbose=False
            )
            
            logger.info("EasyOCR inicializado correctamente")
            
        except ImportError:
            logger.warning("EasyOCR no disponible. Instalar con: pip install easyocr")
            self.reader = None
        except Exception as e:
            logger.error(f"Error inicializando EasyOCR: {str(e)}")
            self.reader = None
    
    def is_available(self) -> bool:
        """Verifica si EasyOCR está disponible."""
        return self.reader is not None
    
    def preprocess_image(self, image_path: str, **kwargs) -> np.ndarray:
        """
        Preprocesa imagen para EasyOCR.
        
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
            
            # EasyOCR funciona mejor con preprocesamiento mínimo
            # Convertir a escala de grises
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Mejorar contraste ligeramente
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error preprocesando imagen para EasyOCR: {str(e)}")
            raise ValueError(f"Error en preprocesamiento: {str(e)}")
    
    def extract_text(self, image: np.ndarray, language: Optional[str] = None) -> str:
        """
        Extrae texto usando EasyOCR.
        
        Args:
            image: Imagen preprocesada
            language: Idioma específico (no usado en EasyOCR)
            
        Returns:
            Texto extraído
        """
        if not self.is_available():
            raise RuntimeError("EasyOCR no está disponible")
        
        try:
            # EasyOCR espera imagen en formato RGB
            if len(image.shape) == 2:  # Escala de grises
                image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            else:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Extraer texto con EasyOCR
            results = self.reader.readtext(
                image_rgb,
                detail=1,  # Incluir coordenadas y confianza
                paragraph=False,  # No agrupar en párrafos
                width_ths=0.7,  # Threshold para ancho de texto
                height_ths=0.7,  # Threshold para altura de texto
                decoder='greedy'  # Decodificador más rápido
            )
            
            # Extraer solo el texto, ordenado por posición vertical
            text_lines = []
            for (bbox, text, confidence) in results:
                if confidence > 0.3:  # Filtrar texto con baja confianza
                    # Calcular posición Y promedio para ordenamiento
                    y_avg = sum([point[1] for point in bbox]) / 4
                    text_lines.append((y_avg, text.strip()))
            
            # Ordenar por posición vertical y concatenar
            text_lines.sort(key=lambda x: x[0])
            extracted_text = '\n'.join([text for _, text in text_lines])
            
            return extracted_text
            
        except Exception as e:
            logger.error(f"Error en extracción EasyOCR: {str(e)}")
            raise RuntimeError(f"Error en EasyOCR: {str(e)}")
    
    def extract_text_with_confidence(self, image: np.ndarray) -> Tuple[str, float]:
        """
        Extrae texto con información de confianza.
        
        Args:
            image: Imagen preprocesada
            
        Returns:
            Tuple de (texto, confianza_promedio)
        """
        if not self.is_available():
            raise RuntimeError("EasyOCR no está disponible")
        
        try:
            # Preparar imagen
            if len(image.shape) == 2:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            else:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Extraer con detalles
            results = self.reader.readtext(
                image_rgb,
                detail=1,
                paragraph=False,
                width_ths=0.7,
                height_ths=0.7
            )
            
            if not results:
                return "", 0.0
            
            # Procesar resultados
            text_lines = []
            confidences = []
            
            for (bbox, text, confidence) in results:
                if confidence > 0.2:  # Threshold más bajo para análisis
                    y_avg = sum([point[1] for point in bbox]) / 4
                    text_lines.append((y_avg, text.strip()))
                    confidences.append(confidence)
            
            if not text_lines:
                return "", 0.0
            
            # Ordenar y concatenar
            text_lines.sort(key=lambda x: x[0])
            final_text = '\n'.join([text for _, text in text_lines])
            
            # Calcular confianza promedio ponderada por longitud
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
            logger.error(f"Error en extracción con confianza EasyOCR: {str(e)}")
            return "", 0.0
    
    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """
        Extrae datos estructurados de recibo usando EasyOCR.
        
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
                'engine': 'easyocr',
                'vendor': self._extract_vendor(raw_text),
                'total_amount': self._extract_total(raw_text),
                'date': self._extract_date(raw_text),
                'items': self._extract_items(raw_text),
                'metadata': {
                    'processing_time': 0.0,
                    'image_quality': self._assess_image_quality(processed_image),
                    'text_regions': len(raw_text.split('\n')) if raw_text else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error extrayendo datos de recibo con EasyOCR: {str(e)}")
            return {
                'raw_text': '',
                'confidence': 0.0,
                'engine': 'easyocr',
                'error': str(e)
            }
    
    def _extract_vendor(self, text: str) -> Optional[str]:
        """Extrae nombre del vendor del texto."""
        if not text:
            return None
        
        lines = text.split('\n')
        # Buscar en las primeras líneas
        for line in lines[:5]:
            line = line.strip().upper()
            if len(line) > 3 and any(keyword in line for keyword in 
                ['JUMBO', 'LIDER', 'SANTA ISABEL', 'COPEC', 'SHELL', 'TOTTUS']):
                return line
        
        return None
    
    def _extract_total(self, text: str) -> Optional[float]:
        """Extrae el total del recibo."""
        import re
        
        if not text:
            return None
        
        # Patrones para total en formato chileno
        patterns = [
            r'TOTAL[:\s]*\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*)',
            r'TOTAL[:\s]*([0-9]{1,3}(?:\.[0-9]{3})*)',
            r'\$\s*([0-9]{1,3}(?:\.[0-9]{3})*)\s*$'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                try:
                    # Convertir formato chileno (puntos como separadores de miles)
                    amount_str = matches[-1].replace('.', '')
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
            price_match = re.search(r'([0-9]{1,3}(?:\.[0-9]{3})*)\s*$', line)
            if price_match:
                price_str = price_match.group(1)
                try:
                    price = float(price_str.replace('.', ''))
                    if price > 10:  # Filtrar precios muy bajos
                        item_name = line[:price_match.start()].strip()
                        if item_name:
                            items.append({
                                'name': item_name,
                                'total_price': price,
                                'confidence': 0.7
                            })
                except:
                    continue
        
        return items[:20]  # Limitar a 20 items
    
    def _assess_image_quality(self, image: np.ndarray) -> str:
        """Evalúa la calidad de la imagen."""
        try:
            # Calcular varianza de Laplacian (medida de nitidez)
            laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
            
            if laplacian_var > 500:
                return "excellent"
            elif laplacian_var > 200:
                return "good"
            elif laplacian_var > 100:
                return "fair"
            else:
                return "poor"
                
        except:
            return "unknown"
    
    def _get_supported_languages(self) -> List[str]:
        """Retorna idiomas soportados por EasyOCR."""
        return ['es', 'en', 'fr', 'de', 'it', 'pt']
    
    def detect_language(self, text: str) -> str:
        """Detecta idioma del texto (EasyOCR usa configuración fija)."""
        # EasyOCR usa configuración de idiomas fija, retornamos español por defecto
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
        """Extrae datos estructurados de un recibo usando EasyOCR.
        
        Args:
            image_path: Ruta a la imagen del recibo
            
        Returns:
            Dict con datos extraídos del recibo
        """
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Extraer texto con EasyOCR
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
                'lines': [],  # EasyOCR no proporciona información de líneas directamente
                'vendor': '',  # Se extraerá en post-procesamiento
                'total': 0.0,  # Se extraerá en post-procesamiento
                'items': [],   # Se extraerán en post-procesamiento
                'raw_data': {'full_text': full_text}
            }
            
        except Exception as e:
            logger.error(f"Error en extract_receipt_data (EasyOCR): {str(e)}")
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
