"""
Preprocessor adaptativo de imágenes para OCR.
Selecciona automáticamente la mejor estrategia de preprocesamiento.
"""

import cv2
import numpy as np
import logging
from typing import Dict, Any, Tuple, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class PreprocessingStrategy(Enum):
    """Estrategias de preprocesamiento disponibles."""
    ADAPTIVE = "adaptive"
    RECEIPT = "receipt"
    DOCUMENT = "document"
    PHOTO = "photo"
    LOW_QUALITY = "low_quality"


class AdaptivePreprocessor:
    """
    Preprocessor adaptativo que selecciona automáticamente la mejor
    estrategia de preprocesamiento basada en las características de la imagen.
    """
    
    def __init__(self):
        """Inicializa el preprocessor adaptativo."""
        self.strategies = {
            PreprocessingStrategy.ADAPTIVE: self._adaptive_strategy,
            PreprocessingStrategy.RECEIPT: self._receipt_strategy,
            PreprocessingStrategy.DOCUMENT: self._document_strategy,
            PreprocessingStrategy.PHOTO: self._photo_strategy,
            PreprocessingStrategy.LOW_QUALITY: self._low_quality_strategy,
        }
    
    def preprocess(
        self, 
        image: np.ndarray, 
        strategy: str = "adaptive",
        **kwargs
    ) -> np.ndarray:
        """
        Preprocesa una imagen usando la estrategia especificada.
        
        Args:
            image: Imagen original como array numpy
            strategy: Estrategia de preprocesamiento
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        try:
            # Convertir string a enum
            if isinstance(strategy, str):
                strategy = PreprocessingStrategy(strategy)
            
            # Aplicar estrategia
            if strategy == PreprocessingStrategy.ADAPTIVE:
                return self._adaptive_strategy(image, **kwargs)
            elif strategy in self.strategies:
                return self.strategies[strategy](image, **kwargs)
            else:
                logger.warning(f"Estrategia desconocida: {strategy}. Usando adaptive.")
                return self._adaptive_strategy(image, **kwargs)
                
        except Exception as e:
            logger.error(f"Error en preprocesamiento: {str(e)}")
            # Fallback a preprocesamiento básico
            return self._basic_preprocessing(image)
    
    def _adaptive_strategy(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Estrategia adaptativa que analiza la imagen y selecciona
        el mejor método de preprocesamiento.
        
        Args:
            image: Imagen original
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Analizar características de la imagen
        characteristics = self._analyze_image_characteristics(image)
        
        # Seleccionar estrategia basada en características
        if characteristics['is_low_quality']:
            logger.info("Usando estrategia para baja calidad")
            return self._low_quality_strategy(image, **kwargs)
        elif characteristics['is_receipt_like']:
            logger.info("Usando estrategia para recibos")
            return self._receipt_strategy(image, **kwargs)
        elif characteristics['is_photo']:
            logger.info("Usando estrategia para fotos")
            return self._photo_strategy(image, **kwargs)
        else:
            logger.info("Usando estrategia para documentos")
            return self._document_strategy(image, **kwargs)
    
    def _analyze_image_characteristics(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Analiza las características de una imagen para determinar
        la mejor estrategia de preprocesamiento.
        
        Args:
            image: Imagen a analizar
            
        Returns:
            Diccionario con características detectadas
        """
        try:
            height, width = image.shape[:2]
            
            # Convertir a escala de grises para análisis
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Calcular estadísticas básicas
            mean_brightness = np.mean(gray)
            std_brightness = np.std(gray)
            
            # Detectar bordes para análisis de nitidez
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (width * height)
            
            # Calcular contraste
            contrast = std_brightness / mean_brightness if mean_brightness > 0 else 0
            
            # Detectar líneas (común en recibos)
            lines = cv2.HoughLinesP(
                edges, 1, np.pi/180, threshold=50, 
                minLineLength=width//10, maxLineGap=10
            )
            has_lines = lines is not None and len(lines) > 5
            
            # Análisis de resolución y calidad
            total_pixels = width * height
            is_high_res = total_pixels > 1000000  # > 1MP
            is_low_res = total_pixels < 100000    # < 0.1MP
            
            # Detectar si es una foto (vs documento escaneado)
            # Las fotos tienden a tener más variación de color y menos estructura
            if len(image.shape) == 3:
                color_variance = np.var(image, axis=(0, 1))
                is_colorful = np.mean(color_variance) > 500
            else:
                is_colorful = False
            
            return {
                'width': width,
                'height': height,
                'mean_brightness': mean_brightness,
                'contrast': contrast,
                'edge_density': edge_density,
                'has_lines': has_lines,
                'is_high_res': is_high_res,
                'is_low_res': is_low_res,
                'is_colorful': is_colorful,
                'is_low_quality': (
                    contrast < 0.3 or 
                    edge_density < 0.01 or 
                    mean_brightness < 50 or 
                    mean_brightness > 200
                ),
                'is_receipt_like': (
                    has_lines and 
                    not is_colorful and 
                    height > width  # Formato vertical típico de recibos
                ),
                'is_photo': (
                    is_colorful and 
                    not has_lines and 
                    edge_density > 0.05
                ),
            }
            
        except Exception as e:
            logger.error(f"Error analizando características: {str(e)}")
            return {
                'is_low_quality': False,
                'is_receipt_like': True,  # Asumir recibo por defecto
                'is_photo': False,
            }
    
    def _receipt_strategy(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Estrategia optimizada para recibos y documentos similares.
        
        Args:
            image: Imagen original
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Corregir rotación si se solicita
        if kwargs.get('correct_rotation', True):
            gray = self._correct_rotation(gray)
        
        # Mejorar contraste
        if kwargs.get('enhance_contrast', True):
            gray = self._enhance_contrast(gray)
        
        # Aplicar umbral adaptativo
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Reducir ruido
        if kwargs.get('denoise', True):
            thresh = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        # Operaciones morfológicas para limpiar
        kernel = np.ones((1, 1), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return thresh
    
    def _document_strategy(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Estrategia para documentos escaneados generales.
        
        Args:
            image: Imagen original
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Corregir rotación
        if kwargs.get('correct_rotation', True):
            gray = self._correct_rotation(gray)
        
        # Normalizar iluminación
        gray = self._normalize_illumination(gray)
        
        # Aplicar umbral Otsu
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def _photo_strategy(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Estrategia para fotos tomadas con cámara.
        
        Args:
            image: Imagen original
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Corregir rotación (más agresivo para fotos)
        if kwargs.get('correct_rotation', True):
            gray = self._correct_rotation(gray, angle_threshold=0.5)
        
        # Corrección de perspectiva básica
        gray = self._correct_perspective(gray)
        
        # Mejorar contraste agresivamente
        gray = self._enhance_contrast_aggressive(gray)
        
        # Reducir ruido antes del umbral
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Umbral adaptativo con ventana más grande
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 15, 3
        )
        
        return thresh
    
    def _low_quality_strategy(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Estrategia para imágenes de baja calidad.
        
        Args:
            image: Imagen original
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Redimensionar si es muy pequeña
        height, width = gray.shape
        if height < 300 or width < 300:
            scale_factor = max(300 / height, 300 / width)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Reducir ruido agresivamente
        gray = cv2.fastNlMeansDenoising(gray, None, 15, 7, 21)
        
        # Mejorar contraste
        gray = self._enhance_contrast_aggressive(gray)
        
        # Aplicar filtro de nitidez
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        gray = cv2.filter2D(gray, -1, kernel)
        
        # Umbral adaptativo con parámetros ajustados
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, 
            cv2.THRESH_BINARY, 21, 10
        )
        
        return thresh
    
    def _basic_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocesamiento básico como fallback.
        
        Args:
            image: Imagen original
            
        Returns:
            Imagen preprocesada básica
        """
        try:
            # Convertir a escala de grises
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Umbral simple
            _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            
            return thresh
            
        except Exception as e:
            logger.error(f"Error en preprocesamiento básico: {str(e)}")
            return image
    
    def _correct_rotation(self, image: np.ndarray, angle_threshold: float = 1.0) -> np.ndarray:
        """
        Corrige la rotación de la imagen detectando líneas.
        
        Args:
            image: Imagen en escala de grises
            angle_threshold: Umbral mínimo de ángulo para corrección
            
        Returns:
            Imagen con rotación corregida
        """
        try:
            # Detectar bordes
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            
            # Detectar líneas
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            
            if lines is not None and len(lines) > 0:
                # Calcular ángulos de las líneas
                angles = []
                for rho, theta in lines[:, 0]:
                    angle = np.degrees(theta) - 90
                    if abs(angle) < 45:  # Solo considerar ángulos razonables
                        angles.append(angle)
                
                if angles:
                    # Usar la mediana de los ángulos
                    rotation_angle = np.median(angles)
                    
                    if abs(rotation_angle) > angle_threshold:
                        # Rotar imagen
                        height, width = image.shape
                        center = (width // 2, height // 2)
                        rotation_matrix = cv2.getRotationMatrix2D(center, rotation_angle, 1.0)
                        
                        # Calcular nuevas dimensiones
                        cos_angle = abs(rotation_matrix[0, 0])
                        sin_angle = abs(rotation_matrix[0, 1])
                        new_width = int((height * sin_angle) + (width * cos_angle))
                        new_height = int((height * cos_angle) + (width * sin_angle))
                        
                        # Ajustar matriz de rotación
                        rotation_matrix[0, 2] += (new_width / 2) - center[0]
                        rotation_matrix[1, 2] += (new_height / 2) - center[1]
                        
                        # Aplicar rotación
                        rotated = cv2.warpAffine(
                            image, rotation_matrix, (new_width, new_height),
                            flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
                        )
                        
                        return rotated
            
            return image
            
        except Exception as e:
            logger.warning(f"Error en corrección de rotación: {str(e)}")
            return image
    
    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """
        Mejora el contraste de la imagen.
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Imagen con contraste mejorado
        """
        try:
            # CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(image)
            return enhanced
        except Exception as e:
            logger.warning(f"Error mejorando contraste: {str(e)}")
            return image
    
    def _enhance_contrast_aggressive(self, image: np.ndarray) -> np.ndarray:
        """
        Mejora el contraste de forma más agresiva.
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Imagen con contraste mejorado agresivamente
        """
        try:
            # CLAHE más agresivo
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
            enhanced = clahe.apply(image)
            
            # Ajuste adicional de gamma
            gamma = 1.2
            enhanced = np.power(enhanced / 255.0, gamma) * 255.0
            enhanced = enhanced.astype(np.uint8)
            
            return enhanced
        except Exception as e:
            logger.warning(f"Error en mejora agresiva de contraste: {str(e)}")
            return image
    
    def _normalize_illumination(self, image: np.ndarray) -> np.ndarray:
        """
        Normaliza la iluminación de la imagen.
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Imagen con iluminación normalizada
        """
        try:
            # Crear kernel para filtro morfológico
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
            
            # Estimar fondo con apertura morfológica
            background = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
            
            # Sustraer fondo
            normalized = cv2.subtract(image, background)
            
            # Normalizar valores
            normalized = cv2.normalize(normalized, None, 0, 255, cv2.NORM_MINMAX)
            
            return normalized
        except Exception as e:
            logger.warning(f"Error normalizando iluminación: {str(e)}")
            return image
    
    def _correct_perspective(self, image: np.ndarray) -> np.ndarray:
        """
        Corrección básica de perspectiva.
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Imagen con perspectiva corregida
        """
        try:
            # Esta es una implementación básica
            # En una versión más avanzada, se detectarían los bordes del documento
            # y se aplicaría una transformación de perspectiva completa
            
            # Por ahora, solo aplicamos un filtro de nitidez
            kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
            sharpened = cv2.filter2D(image, -1, kernel)
            
            return sharpened
        except Exception as e:
            logger.warning(f"Error en corrección de perspectiva: {str(e)}")
            return image
