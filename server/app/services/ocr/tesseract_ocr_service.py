"""
Implementación del servicio OCR usando Tesseract.
Versión refactorizada con soporte multiidioma avanzado.
"""

import cv2
import numpy as np
import pytesseract
from PIL import Image
import os
import logging
from typing import Dict, List, Any, Optional, Tuple

from .base_ocr_service import BaseOCRService
from .languages.language_detector import LanguageDetector
from .preprocessors.adaptive_preprocessor import AdaptivePreprocessor

logger = logging.getLogger(__name__)


class TesseractOCRService(BaseOCRService):
    """
    Servicio OCR usando Tesseract con capacidades multiidioma avanzadas.
    
    Implementa la interfaz BaseOCRService proporcionando funcionalidades
    específicas de Tesseract con mejoras en preprocesamiento y detección
    de idiomas.
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio OCR de Tesseract.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        super().__init__(language)
        
        # Inicializar componentes
        self.language_detector = LanguageDetector()
        self.preprocessor = AdaptivePreprocessor()
        
        # Verificar instalación de Tesseract
        self._check_tesseract_installation()
        
        # Configuraciones de Tesseract
        self.tesseract_configs = {
            'receipt': '--oem 3 --psm 6',  # Para recibos generales
            'table': '--oem 3 --psm 6',   # Para datos tabulares
            'single_line': '--oem 3 --psm 7',  # Para líneas individuales
            'single_word': '--oem 3 --psm 8',  # Para palabras individuales
            'sparse': '--oem 3 --psm 11',  # Para texto disperso
        }
    
    def _get_supported_languages(self) -> List[str]:
        """
        Retorna la lista de idiomas soportados por Tesseract.
        
        Returns:
            Lista de códigos de idioma soportados
        """
        try:
            # Obtener idiomas instalados en Tesseract
            result = pytesseract.get_languages(config='')
            return list(result)
        except Exception as e:
            logger.warning(f"No se pudieron obtener idiomas de Tesseract: {str(e)}")
            # Lista básica de idiomas comunes
            return ['spa', 'eng', 'por', 'fra', 'ita', 'deu']
    
    def _check_tesseract_installation(self):
        """
        Verifica que Tesseract esté instalado y configurado correctamente.
        
        Raises:
            RuntimeError: Si Tesseract no está disponible
        """
        try:
            # En Windows, intentar detectar automáticamente Tesseract
            if os.name == 'nt':  # Windows
                common_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                ]
                for path in common_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
            
            # Verificar que Tesseract funciona
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR verificado correctamente. Versión: {version}")
            
        except Exception as e:
            error_msg = f"No se pudo inicializar Tesseract: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    def preprocess_image(self, image_path: str, **kwargs) -> np.ndarray:
        """
        Preprocesa una imagen para mejorar la calidad del OCR.
        
        Args:
            image_path: Ruta a la imagen a procesar
            **kwargs: Parámetros adicionales:
                - strategy: Estrategia de preprocesamiento ('adaptive', 'receipt', 'document')
                - enhance_contrast: Mejorar contraste (bool)
                - correct_rotation: Corregir rotación (bool)
                - denoise: Reducir ruido (bool)
                
        Returns:
            Imagen preprocesada como array numpy
            
        Raises:
            FileNotFoundError: Si la imagen no existe
            ValueError: Si la imagen no es válida
        """
        if not self.validate_image(image_path):
            raise ValueError(f"Imagen no válida: {image_path}")
        
        try:
            # Cargar imagen
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"No se pudo cargar la imagen: {image_path}")
            
            # Usar preprocessor adaptativo
            strategy = kwargs.get('strategy', 'adaptive')
            processed_image = self.preprocessor.preprocess(
                image, 
                strategy=strategy,
                **kwargs
            )
            
            return processed_image
            
        except Exception as e:
            logger.error(f"Error al preprocesar imagen {image_path}: {str(e)}")
            raise ValueError(f"Error al preprocesar imagen: {str(e)}")
    
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
        try:
            # Determinar idioma a usar
            if language is None:
                if self.language == "auto":
                    # Hacer una extracción rápida para detectar idioma
                    quick_text = pytesseract.image_to_string(
                        image, 
                        lang='spa+eng',  # Idiomas por defecto
                        config=self.tesseract_configs['receipt']
                    )
                    language = self.detect_language(quick_text)
                else:
                    language = self.language
            
            # Extraer texto con el idioma determinado
            text = pytesseract.image_to_string(
                image,
                lang=language,
                config=self.tesseract_configs['receipt']
            )
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error en extracción de texto: {str(e)}")
            raise RuntimeError(f"Error en OCR: {str(e)}")
    
    def detect_language(self, text: str) -> str:
        """
        Detecta automáticamente el idioma del texto extraído.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado en formato Tesseract
        """
        return self.language_detector.detect_language(text)
    
    def get_confidence_score(self, image: np.ndarray, text: str) -> float:
        """
        Calcula un score de confianza para el texto extraído.
        
        Args:
            image: Imagen original
            text: Texto extraído
            
        Returns:
            Score de confianza entre 0.0 y 1.0
        """
        try:
            # Obtener datos de confianza de Tesseract
            data = pytesseract.image_to_data(
                image,
                output_type=pytesseract.Output.DICT,
                config=self.tesseract_configs['receipt']
            )
            
            # Calcular confianza promedio de palabras válidas
            confidences = [
                int(conf) for conf in data['conf'] 
                if int(conf) > 0  # Filtrar valores inválidos
            ]
            
            if not confidences:
                return 0.0
            
            avg_confidence = sum(confidences) / len(confidences)
            
            # Normalizar a escala 0-1
            normalized_confidence = avg_confidence / 100.0
            
            # Aplicar factores adicionales
            text_length_factor = min(1.0, len(text.strip()) / 50.0)  # Penalizar textos muy cortos
            word_count_factor = min(1.0, len(text.split()) / 10.0)   # Penalizar muy pocas palabras
            
            final_confidence = normalized_confidence * text_length_factor * word_count_factor
            
            return max(0.0, min(1.0, final_confidence))
            
        except Exception as e:
            logger.warning(f"Error calculando confianza: {str(e)}")
            # Confianza básica basada en longitud del texto
            if len(text.strip()) > 20:
                return 0.7
            elif len(text.strip()) > 5:
                return 0.5
            else:
                return 0.3
    
    def extract_text_with_layout(self, image: np.ndarray, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Extrae texto preservando información de layout y posición.
        
        Args:
            image: Imagen preprocesada
            language: Idioma específico (opcional)
            
        Returns:
            Diccionario con texto e información de layout
        """
        try:
            # Determinar idioma
            if language is None:
                language = self.language if self.language != "auto" else "spa+eng"
            
            # Extraer datos con información de posición
            data = pytesseract.image_to_data(
                image,
                output_type=pytesseract.Output.DICT,
                lang=language,
                config=self.tesseract_configs['receipt']
            )
            
            # Organizar datos por líneas
            lines = {}
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30:  # Filtrar baja confianza
                    line_num = data['line_num'][i]
                    if line_num not in lines:
                        lines[line_num] = {
                            'text': '',
                            'words': [],
                            'bbox': [float('inf'), float('inf'), 0, 0]  # x_min, y_min, x_max, y_max
                        }
                    
                    word_text = data['text'][i].strip()
                    if word_text:
                        lines[line_num]['text'] += word_text + ' '
                        lines[line_num]['words'].append({
                            'text': word_text,
                            'confidence': int(data['conf'][i]),
                            'bbox': [
                                data['left'][i],
                                data['top'][i],
                                data['left'][i] + data['width'][i],
                                data['top'][i] + data['height'][i]
                            ]
                        })
                        
                        # Actualizar bbox de la línea
                        bbox = lines[line_num]['bbox']
                        bbox[0] = min(bbox[0], data['left'][i])
                        bbox[1] = min(bbox[1], data['top'][i])
                        bbox[2] = max(bbox[2], data['left'][i] + data['width'][i])
                        bbox[3] = max(bbox[3], data['top'][i] + data['height'][i])
            
            # Limpiar y ordenar líneas
            sorted_lines = []
            for line_num in sorted(lines.keys()):
                line_data = lines[line_num]
                line_data['text'] = line_data['text'].strip()
                if line_data['text']:
                    sorted_lines.append(line_data)
            
            return {
                'full_text': '\n'.join([line['text'] for line in sorted_lines]),
                'lines': sorted_lines,
                'language_used': language
            }
            
        except Exception as e:
            logger.error(f"Error en extracción con layout: {str(e)}")
            # Fallback a extracción simple
            text = self.extract_text(image, language)
            return {
                'full_text': text,
                'lines': [{'text': text, 'words': [], 'bbox': [0, 0, 0, 0]}],
                'language_used': language or "spa+eng"
            }
    
    def extract_text_by_config(self, image: np.ndarray, config_type: str = 'receipt') -> str:
        """
        Extrae texto usando una configuración específica de Tesseract.
        
        Args:
            image: Imagen preprocesada
            config_type: Tipo de configuración ('receipt', 'table', 'single_line', etc.)
            
        Returns:
            Texto extraído
        """
        config = self.tesseract_configs.get(config_type, self.tesseract_configs['receipt'])
        language = self.language if self.language != "auto" else "spa+eng"
        
        try:
            return pytesseract.image_to_string(
                image,
                lang=language,
                config=config
            ).strip()
        except Exception as e:
            logger.error(f"Error en extracción con config {config_type}: {str(e)}")
            return ""
