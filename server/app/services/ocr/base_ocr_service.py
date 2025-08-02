"""
Clase base abstracta para servicios OCR.
Define la interfaz común para todos los servicios de reconocimiento óptico de caracteres.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import logging

logger = logging.getLogger(__name__)


class BaseOCRService(ABC):
    """
    Clase base abstracta para servicios OCR.
    
    Define la interfaz común que deben implementar todos los servicios de OCR,
    siguiendo el principio de inversión de dependencias y permitiendo
    intercambiar implementaciones fácilmente.
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio OCR base.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        self.language = language
        self.supported_languages = self._get_supported_languages()
        
    @abstractmethod
    def _get_supported_languages(self) -> List[str]:
        """
        Retorna la lista de idiomas soportados por esta implementación.
        
        Returns:
            Lista de códigos de idioma soportados
        """
        pass
    
    @abstractmethod
    def preprocess_image(self, image_path: str, **kwargs) -> np.ndarray:
        """
        Preprocesa una imagen para mejorar la calidad del OCR.
        
        Args:
            image_path: Ruta a la imagen a procesar
            **kwargs: Parámetros adicionales específicos de la implementación
            
        Returns:
            Imagen preprocesada como array numpy
            
        Raises:
            FileNotFoundError: Si la imagen no existe
            ValueError: Si la imagen no es válida
        """
        pass
    
    @abstractmethod
    def extract_text(self, image: np.ndarray, language: Optional[str] = None) -> str:
        """
        Extrae texto de una imagen preprocesada.
        
        Args:
            image: Imagen preprocesada como array numpy
            language: Idioma específico para esta extracción (opcional)
            
        Returns:
            Texto extraído de la imagen
            
        Raises:
            RuntimeError: Si el OCR falla
        """
        pass
    
    @abstractmethod
    def detect_language(self, text: str) -> str:
        """
        Detecta automáticamente el idioma del texto extraído.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado
        """
        pass
    
    @abstractmethod
    def get_confidence_score(self, image: np.ndarray, text: str) -> float:
        """
        Calcula un score de confianza para el texto extraído.
        
        Args:
            image: Imagen original
            text: Texto extraído
            
        Returns:
            Score de confianza entre 0.0 y 1.0
        """
        pass
    
    def extract_text_with_confidence(
        self, 
        image_path: str, 
        language: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Extrae texto de una imagen y calcula su confianza.
        
        Args:
            image_path: Ruta a la imagen
            language: Idioma específico (opcional)
            
        Returns:
            Tupla con (texto_extraído, confianza)
        """
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Extraer texto
            text = self.extract_text(processed_image, language)
            
            # Calcular confianza
            confidence = self.get_confidence_score(processed_image, text)
            
            return text, confidence
            
        except Exception as e:
            logger.error(f"Error en extracción de texto: {str(e)}")
            return "", 0.0
    
    def is_language_supported(self, language: str) -> bool:
        """
        Verifica si un idioma está soportado.
        
        Args:
            language: Código de idioma a verificar
            
        Returns:
            True si el idioma está soportado
        """
        return language in self.supported_languages or language == "auto"
    
    def validate_image(self, image_path: str) -> bool:
        """
        Valida que una imagen sea procesable.
        
        Args:
            image_path: Ruta a la imagen
            
        Returns:
            True si la imagen es válida
        """
        try:
            import os
            from PIL import Image
            
            # Verificar que el archivo existe
            if not os.path.exists(image_path):
                return False
            
            # Verificar que es una imagen válida
            with Image.open(image_path) as img:
                img.verify()
            
            return True
            
        except Exception:
            return False
