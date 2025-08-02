"""
Servicio OCR mejorado para Gastify.
Integra todas las mejoras de OCR multiidioma y extracción avanzada de líneas de detalle.
Mantiene compatibilidad con la interfaz existente mientras añade nuevas capacidades.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from datetime import datetime

from .ocr.tesseract_ocr_service import TesseractOCRService
from .ocr.preprocessors.receipt_preprocessor import ReceiptPreprocessor
from .receipt_parser.receipt_parser import AdvancedReceiptParser

logger = logging.getLogger(__name__)


class EnhancedOCRService:
    """
    Servicio OCR mejorado que combina todas las nuevas capacidades:
    - OCR multiidioma avanzado
    - Extracción mejorada de líneas de detalle
    - Preprocesamiento adaptativo
    - Compatibilidad con la interfaz existente
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio OCR mejorado.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        self.language = language
        
        # Inicializar componentes
        self.ocr_service = TesseractOCRService(language)
        self.receipt_preprocessor = ReceiptPreprocessor()
        self.receipt_parser = AdvancedReceiptParser()
        
        logger.info("Servicio OCR mejorado inicializado correctamente")
    
    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """
        Extrae datos estructurados de un recibo (interfaz compatible).
        
        Esta función mantiene la misma interfaz que el FreeOCRService original
        pero utiliza todas las mejoras implementadas.
        
        Args:
            image_path: Ruta a la imagen del recibo
            
        Returns:
            Dict con datos estructurados del recibo
        """
        try:
            # Validar imagen
            if not self.ocr_service.validate_image(image_path):
                logger.error(f"Imagen no válida: {image_path}")
                return self._empty_result()
            
            # Preprocesar imagen con estrategia específica para recibos
            processed_image = self.ocr_service.preprocess_image(
                image_path, 
                strategy="receipt"
            )
            
            # Extraer texto con layout preservado
            ocr_result = self.ocr_service.extract_text_with_layout(processed_image)
            raw_text = ocr_result['full_text']
            
            if not raw_text.strip():
                logger.warning("No se pudo extraer texto de la imagen")
                return self._empty_result()
            
            # Parsear recibo con el nuevo parser avanzado
            parsed_data = self.receipt_parser.parse_receipt(
                raw_text, 
                ocr_result['lines'],
                language=ocr_result['language_used']
            )
            
            # Calcular confianza general
            confidence = self.ocr_service.get_confidence_score(processed_image, raw_text)
            
            # Formatear resultado para compatibilidad
            result = {
                "raw_text": raw_text,
                "confidence": confidence,
                "vendor": parsed_data.get('vendor', ''),
                "total_amount": parsed_data.get('total_amount'),
                "date": parsed_data.get('date'),
                "items": parsed_data.get('items', []),
                # Nuevos campos añadidos
                "language_detected": ocr_result['language_used'],
                "detailed_items": parsed_data.get('detailed_items', []),
                "subtotal": parsed_data.get('subtotal'),
                "tax_amount": parsed_data.get('tax_amount'),
                "discount_amount": parsed_data.get('discount_amount'),
                "payment_method": parsed_data.get('payment_method'),
                "receipt_number": parsed_data.get('receipt_number'),
                "merchant_info": parsed_data.get('merchant_info', {}),
                "line_items_count": len(parsed_data.get('detailed_items', [])),
                "processing_metadata": {
                    "preprocessing_strategy": "receipt",
                    "ocr_engine": "tesseract_enhanced",
                    "parser_version": "advanced_v1",
                    "processing_time": datetime.now().isoformat()
                }
            }
            
            logger.info(f"Extracción exitosa. Confianza: {confidence:.2f}, Idioma: {ocr_result['language_used']}")
            return result
            
        except Exception as e:
            logger.error(f"Error en extracción de datos del recibo: {str(e)}")
            return self._empty_result(error=str(e))
    
    def extract_receipt_data_advanced(
        self, 
        image_path: str,
        receipt_type: Optional[str] = None,
        extract_line_details: bool = True,
        detect_language: bool = True
    ) -> Dict[str, Any]:
        """
        Extrae datos de recibo con opciones avanzadas.
        
        Args:
            image_path: Ruta a la imagen del recibo
            receipt_type: Tipo de recibo ('thermal', 'inkjet', etc.)
            extract_line_details: Si extraer detalles de líneas de ítems
            detect_language: Si detectar automáticamente el idioma
            
        Returns:
            Dict con datos estructurados avanzados
        """
        try:
            # Validar imagen
            if not self.ocr_service.validate_image(image_path):
                logger.error(f"Imagen no válida: {image_path}")
                return self._empty_result()
            
            # Preprocesamiento especializado para recibos
            processed_image = self.receipt_preprocessor.preprocess_receipt(
                self._load_image(image_path),
                receipt_type=receipt_type
            )
            
            # Extraer texto con información de layout
            if detect_language:
                ocr_result = self.ocr_service.extract_text_with_layout(processed_image)
            else:
                # Usar idioma especificado
                ocr_result = self.ocr_service.extract_text_with_layout(
                    processed_image, 
                    language=self.language
                )
            
            raw_text = ocr_result['full_text']
            
            if not raw_text.strip():
                logger.warning("No se pudo extraer texto de la imagen")
                return self._empty_result()
            
            # Parsear con opciones avanzadas
            parsed_data = self.receipt_parser.parse_receipt_advanced(
                raw_text,
                ocr_result['lines'],
                language=ocr_result['language_used'],
                extract_line_details=extract_line_details,
                receipt_type=receipt_type
            )
            
            # Extraer regiones del recibo si se solicita
            if extract_line_details:
                receipt_regions = self.receipt_preprocessor.extract_receipt_regions(processed_image)
                parsed_data['receipt_regions'] = {
                    region: self._analyze_region(region_image)
                    for region, region_image in receipt_regions.items()
                }
            
            # Calcular múltiples métricas de confianza
            confidence_metrics = self._calculate_advanced_confidence(
                processed_image, 
                raw_text, 
                parsed_data
            )
            
            # Resultado avanzado
            result = {
                **parsed_data,
                "raw_text": raw_text,
                "confidence_metrics": confidence_metrics,
                "language_detected": ocr_result['language_used'],
                "receipt_type_detected": receipt_type or "unknown",
                "ocr_layout_info": ocr_result['lines'],
                "processing_metadata": {
                    "preprocessing_strategy": "receipt_specialized",
                    "receipt_type": receipt_type,
                    "language_detection": detect_language,
                    "line_detail_extraction": extract_line_details,
                    "ocr_engine": "tesseract_enhanced",
                    "parser_version": "advanced_v1",
                    "processing_time": datetime.now().isoformat()
                }
            }
            
            logger.info(f"Extracción avanzada exitosa. Confianza: {confidence_metrics['overall']:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Error en extracción avanzada: {str(e)}")
            return self._empty_result(error=str(e))
    
    def extract_text_only(self, image_path: str, language: Optional[str] = None) -> Tuple[str, float]:
        """
        Extrae solo el texto de una imagen con confianza.
        
        Args:
            image_path: Ruta a la imagen
            language: Idioma específico (opcional)
            
        Returns:
            Tupla con (texto, confianza)
        """
        try:
            return self.ocr_service.extract_text_with_confidence(image_path, language)
        except Exception as e:
            logger.error(f"Error extrayendo texto: {str(e)}")
            return "", 0.0
    
    def detect_language(self, text: str) -> str:
        """
        Detecta el idioma de un texto.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado
        """
        return self.ocr_service.detect_language(text)
    
    def get_supported_languages(self) -> List[str]:
        """
        Obtiene la lista de idiomas soportados.
        
        Returns:
            Lista de códigos de idioma soportados
        """
        return self.ocr_service.supported_languages
    
    def preprocess_image_only(
        self, 
        image_path: str, 
        strategy: str = "adaptive",
        save_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Solo preprocesa una imagen sin extraer texto.
        
        Args:
            image_path: Ruta a la imagen original
            strategy: Estrategia de preprocesamiento
            save_path: Ruta para guardar imagen preprocesada (opcional)
            
        Returns:
            Imagen preprocesada
        """
        try:
            processed = self.ocr_service.preprocess_image(image_path, strategy=strategy)
            
            if save_path:
                import cv2
                cv2.imwrite(save_path, processed)
                logger.info(f"Imagen preprocesada guardada en: {save_path}")
            
            return processed
            
        except Exception as e:
            logger.error(f"Error en preprocesamiento: {str(e)}")
            raise
    
    def _load_image(self, image_path: str) -> np.ndarray:
        """Carga una imagen como array numpy."""
        import cv2
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"No se pudo cargar la imagen: {image_path}")
        return image
    
    def _empty_result(self, error: Optional[str] = None) -> Dict[str, Any]:
        """Retorna un resultado vacío para casos de error."""
        result = {
            "raw_text": "",
            "confidence": 0.0,
            "vendor": "",
            "total_amount": None,
            "date": None,
            "items": [],
            "language_detected": "unknown",
            "detailed_items": [],
            "subtotal": None,
            "tax_amount": None,
            "discount_amount": None,
            "payment_method": None,
            "receipt_number": None,
            "merchant_info": {},
            "line_items_count": 0,
            "processing_metadata": {
                "preprocessing_strategy": "none",
                "ocr_engine": "tesseract_enhanced",
                "parser_version": "advanced_v1",
                "processing_time": datetime.now().isoformat(),
                "error": error
            }
        }
        
        if error:
            result["error"] = error
            
        return result
    
    def _analyze_region(self, region_image: np.ndarray) -> Dict[str, Any]:
        """Analiza una región específica del recibo."""
        try:
            # Extraer texto de la región
            text = self.ocr_service.extract_text(region_image)
            confidence = self.ocr_service.get_confidence_score(region_image, text)
            
            return {
                "text": text,
                "confidence": confidence,
                "character_count": len(text),
                "word_count": len(text.split())
            }
        except Exception as e:
            logger.warning(f"Error analizando región: {str(e)}")
            return {
                "text": "",
                "confidence": 0.0,
                "character_count": 0,
                "word_count": 0,
                "error": str(e)
            }
    
    def _calculate_advanced_confidence(
        self, 
        image: np.ndarray, 
        text: str, 
        parsed_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calcula métricas avanzadas de confianza."""
        try:
            # Confianza base del OCR
            ocr_confidence = self.ocr_service.get_confidence_score(image, text)
            
            # Confianza basada en datos extraídos
            data_confidence = 0.5  # Base
            
            if parsed_data.get('vendor'):
                data_confidence += 0.1
            if parsed_data.get('total_amount'):
                data_confidence += 0.2
            if parsed_data.get('date'):
                data_confidence += 0.1
            if parsed_data.get('detailed_items'):
                data_confidence += 0.1
            
            # Confianza basada en longitud del texto
            text_length_confidence = min(1.0, len(text.strip()) / 100.0)
            
            # Confianza general (promedio ponderado)
            overall_confidence = (
                ocr_confidence * 0.5 + 
                data_confidence * 0.3 + 
                text_length_confidence * 0.2
            )
            
            return {
                "overall": max(0.0, min(1.0, overall_confidence)),
                "ocr": ocr_confidence,
                "data_extraction": data_confidence,
                "text_length": text_length_confidence
            }
            
        except Exception as e:
            logger.warning(f"Error calculando confianza avanzada: {str(e)}")
            return {
                "overall": 0.5,
                "ocr": 0.5,
                "data_extraction": 0.5,
                "text_length": 0.5
            }


# Clase de compatibilidad para mantener la interfaz existente
class FreeOCRServiceCompatible(EnhancedOCRService):
    """
    Wrapper de compatibilidad que mantiene la interfaz del FreeOCRService original
    pero utiliza todas las mejoras del EnhancedOCRService.
    """
    
    def __init__(self, language: str = "spa+eng"):
        """
        Inicializa el servicio con compatibilidad hacia atrás.
        
        Args:
            language: Idioma(s) para Tesseract (formato original)
        """
        # Convertir formato de idioma si es necesario
        if language == "spa+eng":
            enhanced_language = "auto"  # Usar detección automática
        else:
            enhanced_language = language
            
        super().__init__(enhanced_language)
        
        logger.info(f"Servicio OCR compatible inicializado con idioma: {language}")
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Método de compatibilidad para preprocesamiento."""
        return self.ocr_service.preprocess_image(image_path, strategy="receipt")
    
    def extract_text(self, image: np.ndarray) -> str:
        """Método de compatibilidad para extracción de texto."""
        return self.ocr_service.extract_text(image)
    
    def extract_vendor(self, text: str) -> str:
        """Método de compatibilidad para extracción de proveedor."""
        parsed = self.receipt_parser.parse_receipt(text, [])
        return parsed.get('vendor', '')
    
    def extract_total_amount(self, text: str) -> Optional[float]:
        """Método de compatibilidad para extracción de total."""
        parsed = self.receipt_parser.parse_receipt(text, [])
        return parsed.get('total_amount')
    
    def extract_date(self, text: str) -> Optional[str]:
        """Método de compatibilidad para extracción de fecha."""
        parsed = self.receipt_parser.parse_receipt(text, [])
        return parsed.get('date')
    
    def extract_items(self, text: str) -> List[str]:
        """Método de compatibilidad para extracción de ítems."""
        parsed = self.receipt_parser.parse_receipt(text, [])
        # Convertir ítems detallados a formato simple para compatibilidad
        detailed_items = parsed.get('detailed_items', [])
        if detailed_items:
            return [item.get('description', '') for item in detailed_items]
        return parsed.get('items', [])
    
    def _calculate_confidence(self, data_dict: Dict[str, Any]) -> float:
        """Método de compatibilidad para cálculo de confianza."""
        confidence_metrics = self._calculate_advanced_confidence(
            np.array([]), 
            data_dict.get('raw_text', ''), 
            data_dict
        )
        return confidence_metrics['overall']
