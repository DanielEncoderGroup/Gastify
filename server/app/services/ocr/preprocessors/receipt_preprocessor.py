"""
Preprocessor especializado para recibos.
Optimizado específicamente para el procesamiento de recibos y facturas.
"""

import cv2
import numpy as np
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger(__name__)


class ReceiptPreprocessor:
    """
    Preprocessor especializado para recibos y facturas.
    
    Implementa técnicas específicas para mejorar la legibilidad
    de texto en recibos, incluyendo detección de regiones de interés
    y optimizaciones para diferentes tipos de papel y impresión.
    """
    
    def __init__(self):
        """Inicializa el preprocessor de recibos."""
        self.receipt_patterns = {
            'thermal': {
                'description': 'Recibos de papel térmico',
                'characteristics': ['low_contrast', 'fading', 'noise'],
                'preprocessing': self._preprocess_thermal
            },
            'inkjet': {
                'description': 'Recibos impresos con inyección de tinta',
                'characteristics': ['good_contrast', 'sharp_text'],
                'preprocessing': self._preprocess_inkjet
            },
            'dot_matrix': {
                'description': 'Recibos de matriz de puntos',
                'characteristics': ['dotted_text', 'carbon_copy'],
                'preprocessing': self._preprocess_dot_matrix
            },
            'handwritten': {
                'description': 'Recibos manuscritos',
                'characteristics': ['irregular_text', 'variable_quality'],
                'preprocessing': self._preprocess_handwritten
            }
        }
    
    def preprocess_receipt(
        self, 
        image: np.ndarray, 
        receipt_type: Optional[str] = None,
        **kwargs
    ) -> np.ndarray:
        """
        Preprocesa un recibo usando técnicas especializadas.
        
        Args:
            image: Imagen del recibo
            receipt_type: Tipo de recibo si se conoce ('thermal', 'inkjet', etc.)
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada optimizada para OCR
        """
        try:
            # Auto-detectar tipo de recibo si no se especifica
            if receipt_type is None:
                receipt_type = self._detect_receipt_type(image)
            
            logger.info(f"Procesando recibo tipo: {receipt_type}")
            
            # Aplicar preprocesamiento específico
            if receipt_type in self.receipt_patterns:
                preprocessor = self.receipt_patterns[receipt_type]['preprocessing']
                return preprocessor(image, **kwargs)
            else:
                # Fallback a preprocesamiento general
                return self._preprocess_general(image, **kwargs)
                
        except Exception as e:
            logger.error(f"Error en preprocesamiento de recibo: {str(e)}")
            return self._preprocess_general(image, **kwargs)
    
    def _detect_receipt_type(self, image: np.ndarray) -> str:
        """
        Detecta automáticamente el tipo de recibo basado en características visuales.
        
        Args:
            image: Imagen del recibo
            
        Returns:
            Tipo de recibo detectado
        """
        try:
            # Convertir a escala de grises si es necesario
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            height, width = gray.shape
            
            # Análisis de características
            characteristics = self._analyze_receipt_characteristics(gray)
            
            # Reglas de clasificación
            if characteristics['is_thermal']:
                return 'thermal'
            elif characteristics['is_dotted']:
                return 'dot_matrix'
            elif characteristics['is_handwritten']:
                return 'handwritten'
            else:
                return 'inkjet'  # Por defecto
                
        except Exception as e:
            logger.warning(f"Error detectando tipo de recibo: {str(e)}")
            return 'inkjet'  # Fallback seguro
    
    def _analyze_receipt_characteristics(self, gray: np.ndarray) -> Dict[str, bool]:
        """
        Analiza las características visuales de un recibo.
        
        Args:
            gray: Imagen en escala de grises
            
        Returns:
            Diccionario con características detectadas
        """
        height, width = gray.shape
        
        # Calcular estadísticas básicas
        mean_intensity = np.mean(gray)
        std_intensity = np.std(gray)
        contrast = std_intensity / mean_intensity if mean_intensity > 0 else 0
        
        # Detectar bordes para análisis de nitidez
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (width * height)
        
        # Análisis de textura para detectar papel térmico
        # El papel térmico tiende a tener ruido característico
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Detectar patrones de puntos (matriz de puntos)
        # Aplicar filtro para detectar patrones regulares
        kernel = np.ones((3, 3), np.uint8)
        opening = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)
        dot_pattern_score = np.sum(np.abs(gray.astype(int) - opening.astype(int))) / (width * height)
        
        # Detectar texto manuscrito
        # El texto manuscrito tiene más variabilidad en grosor de línea
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        gradient_variance = np.var(gradient_magnitude)
        
        return {
            'is_thermal': (
                contrast < 0.4 and 
                laplacian_var < 100 and 
                mean_intensity > 180  # Papel térmico tiende a ser claro
            ),
            'is_dotted': dot_pattern_score > 5,
            'is_handwritten': gradient_variance > 1000,
            'is_low_quality': contrast < 0.3 or edge_density < 0.01,
            'is_faded': mean_intensity > 200 and contrast < 0.2,
        }
    
    def _preprocess_thermal(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Preprocesamiento específico para recibos de papel térmico.
        
        Args:
            image: Imagen del recibo térmico
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Los recibos térmicos suelen tener bajo contraste y pueden estar desvanecidos
        
        # 1. Mejorar contraste agresivamente
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4, 4))
        enhanced = clahe.apply(gray)
        
        # 2. Reducir ruido específico del papel térmico
        # Usar filtro bilateral que preserva bordes
        denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        # 3. Ajuste de gamma para mejorar texto desvanecido
        gamma = 0.7  # Oscurecer para hacer el texto más visible
        gamma_corrected = np.power(denoised / 255.0, gamma) * 255.0
        gamma_corrected = gamma_corrected.astype(np.uint8)
        
        # 4. Aplicar umbral adaptativo optimizado para papel térmico
        thresh = cv2.adaptiveThreshold(
            gamma_corrected, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 15, 8  # Parámetros ajustados para térmico
        )
        
        # 5. Operaciones morfológicas para limpiar
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return cleaned
    
    def _preprocess_inkjet(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Preprocesamiento para recibos impresos con inyección de tinta.
        
        Args:
            image: Imagen del recibo
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Los recibos inkjet suelen tener buen contraste
        
        # 1. Corrección de rotación
        gray = self._correct_rotation(gray)
        
        # 2. Mejora moderada de contraste
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # 3. Reducir ruido ligero
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        # 4. Umbral Otsu (funciona bien con buen contraste)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def _preprocess_dot_matrix(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Preprocesamiento para recibos de matriz de puntos.
        
        Args:
            image: Imagen del recibo
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Los recibos de matriz de puntos tienen texto formado por puntos
        
        # 1. Operaciones morfológicas para conectar puntos
        kernel_close = np.ones((2, 2), np.uint8)
        closed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel_close)
        
        # 2. Mejorar contraste
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6))
        enhanced = clahe.apply(closed)
        
        # 3. Filtro de mediana para suavizar puntos
        median_filtered = cv2.medianBlur(enhanced, 3)
        
        # 4. Umbral adaptativo
        thresh = cv2.adaptiveThreshold(
            median_filtered, 255, cv2.ADAPTIVE_THRESH_MEAN_C, 
            cv2.THRESH_BINARY, 11, 5
        )
        
        # 5. Dilatación ligera para fortalecer caracteres
        kernel_dilate = np.ones((1, 1), np.uint8)
        dilated = cv2.dilate(thresh, kernel_dilate, iterations=1)
        
        return dilated
    
    def _preprocess_handwritten(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Preprocesamiento para recibos manuscritos.
        
        Args:
            image: Imagen del recibo
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # El texto manuscrito requiere preprocesamiento cuidadoso
        
        # 1. Corrección de rotación más sensible
        gray = self._correct_rotation(gray, angle_threshold=0.5)
        
        # 2. Normalización de iluminación
        gray = self._normalize_illumination(gray)
        
        # 3. Mejora de contraste moderada
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(6, 6))
        enhanced = clahe.apply(gray)
        
        # 4. Filtro bilateral para preservar bordes del texto
        filtered = cv2.bilateralFilter(enhanced, 7, 50, 50)
        
        # 5. Umbral adaptativo con ventana más grande
        thresh = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 17, 4
        )
        
        return thresh
    
    def _preprocess_general(self, image: np.ndarray, **kwargs) -> np.ndarray:
        """
        Preprocesamiento general para recibos no clasificados.
        
        Args:
            image: Imagen del recibo
            **kwargs: Parámetros adicionales
            
        Returns:
            Imagen preprocesada
        """
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Preprocesamiento conservador que funciona en la mayoría de casos
        
        # 1. Corrección de rotación
        gray = self._correct_rotation(gray)
        
        # 2. Mejora de contraste moderada
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # 3. Reducir ruido
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        # 4. Umbral adaptativo
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        return thresh
    
    def _correct_rotation(self, image: np.ndarray, angle_threshold: float = 1.0) -> np.ndarray:
        """
        Corrige la rotación de la imagen detectando líneas de texto.
        
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
                        
                        rotated = cv2.warpAffine(
                            image, rotation_matrix, (width, height),
                            flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
                        )
                        
                        return rotated
            
            return image
            
        except Exception as e:
            logger.warning(f"Error en corrección de rotación: {str(e)}")
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
    
    def extract_receipt_regions(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Extrae regiones específicas de un recibo (header, items, totals).
        
        Args:
            image: Imagen preprocesada del recibo
            
        Returns:
            Diccionario con regiones extraídas
        """
        try:
            height, width = image.shape
            
            # Dividir recibo en regiones aproximadas
            regions = {
                'header': image[0:height//4, :],                    # 25% superior
                'items': image[height//4:3*height//4, :],           # 50% medio
                'totals': image[3*height//4:height, :],             # 25% inferior
                'full': image
            }
            
            return regions
            
        except Exception as e:
            logger.error(f"Error extrayendo regiones: {str(e)}")
            return {'full': image}
