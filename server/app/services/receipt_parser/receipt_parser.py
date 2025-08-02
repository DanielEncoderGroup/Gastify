"""
Parser avanzado de recibos con extracción mejorada de líneas de detalle.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from .models.receipt import ReceiptData, MerchantInfo, PaymentInfo, TaxInfo
from .models.receipt_item import ReceiptItem
from .extractors.vendor_extractor import VendorExtractor
from .extractors.date_extractor import DateExtractor
from .extractors.total_extractor import TotalExtractor
from .extractors.item_extractor import ItemExtractor

logger = logging.getLogger(__name__)


class AdvancedReceiptParser:
    """
    Parser avanzado de recibos que extrae información estructurada detallada.
    
    Utiliza múltiples extractores especializados para obtener información
    específica de diferentes partes del recibo.
    """
    
    def __init__(self):
        """Inicializa el parser avanzado."""
        # Inicializar extractores especializados
        self.vendor_extractor = VendorExtractor()
        self.date_extractor = DateExtractor()
        self.total_extractor = TotalExtractor()
        self.item_extractor = ItemExtractor()
        
        # Patrones para información adicional
        self._init_patterns()
        
        logger.info("Parser avanzado de recibos inicializado")
    
    def _init_patterns(self):
        """Inicializa patrones de expresiones regulares."""
        # Patrones para números de recibo
        self.receipt_number_patterns = [
            r'(?:recibo|receipt|factura|invoice|ticket)[\s#:]*(\w+)',
            r'(?:no|num|number|número)[\s#:]*(\w+)',
            r'#(\d+)',
            r'(\d{6,})',  # Números largos que podrían ser recibos
        ]
        
        # Patrones para métodos de pago
        self.payment_patterns = {
            'cash': r'\b(?:efectivo|cash|contado)\b',
            'card': r'\b(?:tarjeta|card|visa|mastercard|amex)\b',
            'debit': r'\b(?:débito|debit)\b',
            'credit': r'\b(?:crédito|credit)\b',
            'transfer': r'\b(?:transferencia|transfer|wire)\b',
            'check': r'\b(?:cheque|check)\b',
        }
        
        # Patrones para información fiscal
        self.tax_patterns = {
            'chile': {
                'rut': r'\b(\d{1,2}(?:\.\d{3}){2}-[\dkK])\b',
                'iva': r'\b(?:iva|i\.v\.a\.?)\s*(?::|del|de|al)?\s*(?:19|19\.0|19,0|19\.00|19,00)?\s*%',
            },
            'general': {
                'tax': r'\b(?:tax|impuesto|iva|gst|vat)\b',
                'tax_rate': r'(\d+(?:\.\d+)?)\s*%',
            }
        }
    
    def parse_receipt(
        self, 
        text: str, 
        lines: List[Dict[str, Any]], 
        language: str = "spa"
    ) -> Dict[str, Any]:
        """
        Parsea un recibo básico manteniendo compatibilidad.
        
        Args:
            text: Texto completo del OCR
            lines: Información de líneas con posiciones
            language: Idioma detectado
            
        Returns:
            Diccionario con datos básicos del recibo
        """
        try:
            # Crear objeto ReceiptData
            receipt_data = ReceiptData()
            receipt_data.raw_text = text
            receipt_data.language_detected = language
            
            # Extraer información básica
            receipt_data.merchant_info.name = self.vendor_extractor.extract_vendor(text)
            receipt_data.date = self.date_extractor.extract_date(text)
            receipt_data.total_amount = self.total_extractor.extract_total_amount(text)
            
            # Extraer ítems básicos
            basic_items = self.item_extractor.extract_items_basic(text)
            receipt_data.items = basic_items
            
            # Convertir a formato compatible
            return receipt_data.to_simple_dict()
            
        except Exception as e:
            logger.error(f"Error en parsing básico: {str(e)}")
            return {
                'vendor': '',
                'total_amount': None,
                'date': None,
                'items': [],
                'raw_text': text,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def parse_receipt_advanced(
        self,
        text: str,
        lines: List[Dict[str, Any]],
        language: str = "spa",
        extract_line_details: bool = True,
        receipt_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parsea un recibo con extracción avanzada de detalles.
        
        Args:
            text: Texto completo del OCR
            lines: Información de líneas con posiciones
            language: Idioma detectado
            extract_line_details: Si extraer detalles de líneas de ítems
            receipt_type: Tipo de recibo si se conoce
            
        Returns:
            Diccionario con datos avanzados del recibo
        """
        try:
            # Crear objeto ReceiptData
            receipt_data = ReceiptData()
            receipt_data.raw_text = text
            receipt_data.language_detected = language
            
            # Extraer información del comerciante
            self._extract_merchant_info(text, receipt_data, language)
            
            # Extraer información de fecha y hora
            self._extract_datetime_info(text, receipt_data, language)
            
            # Extraer número de recibo
            receipt_data.receipt_number = self._extract_receipt_number(text)
            
            # Extraer información financiera
            self._extract_financial_info(text, receipt_data, language)
            
            # Extraer información de pago
            self._extract_payment_info(text, receipt_data, language)
            
            # Extraer información fiscal
            self._extract_tax_info(text, receipt_data, language)
            
            # Extraer ítems detallados si se solicita
            if extract_line_details:
                self._extract_detailed_items(text, lines, receipt_data, language, receipt_type)
            else:
                # Solo ítems básicos
                receipt_data.items = self.item_extractor.extract_items_basic(text)
            
            # Calcular totales y validar
            receipt_data.calculate_totals()
            
            # Calcular confianza
            confidence = self._calculate_parsing_confidence(receipt_data)
            receipt_data.confidence = confidence
            
            # Añadir metadatos de procesamiento
            receipt_data.processing_metadata = {
                'parser_version': 'advanced_v1',
                'extraction_method': 'multi_extractor',
                'line_details_extracted': extract_line_details,
                'receipt_type': receipt_type,
                'language': language,
                'parsing_time': datetime.now().isoformat()
            }
            
            return receipt_data.to_dict()
            
        except Exception as e:
            logger.error(f"Error en parsing avanzado: {str(e)}")
            return {
                'error': str(e),
                'raw_text': text,
                'confidence': 0.0,
                'processing_metadata': {
                    'parser_version': 'advanced_v1',
                    'error': str(e),
                    'parsing_time': datetime.now().isoformat()
                }
            }
    
    def _extract_merchant_info(self, text: str, receipt_data: ReceiptData, language: str):
        """Extrae información del comerciante."""
        try:
            # Extraer nombre del comerciante
            receipt_data.merchant_info.name = self.vendor_extractor.extract_vendor(text)
            
            # Extraer dirección (primeras líneas después del nombre)
            lines = text.split('\n')
            address_lines = []
            
            # Buscar líneas que podrían ser dirección
            for i, line in enumerate(lines[:10]):  # Revisar primeras 10 líneas
                line = line.strip()
                if not line:
                    continue
                
                # Si contiene números y palabras, podría ser dirección
                if re.search(r'\d+.*[a-zA-Z]', line) and len(line) > 10:
                    address_lines.append(line)
            
            if address_lines:
                receipt_data.merchant_info.address = ' '.join(address_lines[:2])  # Máximo 2 líneas
            
            # Extraer teléfono
            phone_pattern = r'(?:tel|phone|fono|teléfono)[\s:]*([+]?[\d\s\-\(\)]+)'
            phone_match = re.search(phone_pattern, text, re.IGNORECASE)
            if phone_match:
                receipt_data.merchant_info.phone = phone_match.group(1).strip()
            
            # Extraer RUT/Tax ID (específico para Chile)
            if language.startswith('spa'):
                rut_pattern = self.tax_patterns['chile']['rut']
                rut_match = re.search(rut_pattern, text)
                if rut_match:
                    receipt_data.merchant_info.tax_id = rut_match.group(1)
            
        except Exception as e:
            logger.warning(f"Error extrayendo información del comerciante: {str(e)}")
    
    def _extract_datetime_info(self, text: str, receipt_data: ReceiptData, language: str):
        """Extrae información de fecha y hora."""
        try:
            # Extraer fecha
            receipt_data.date = self.date_extractor.extract_date(text)
            
            # Extraer hora
            time_patterns = [
                r'(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:am|pm|hrs?)?',
                r'(?:hora|time|hour)[\s:]*(\d{1,2}:\d{2}(?::\d{2})?)',
            ]
            
            for pattern in time_patterns:
                time_match = re.search(pattern, text, re.IGNORECASE)
                if time_match:
                    receipt_data.time = time_match.group(1)
                    break
                    
        except Exception as e:
            logger.warning(f"Error extrayendo fecha/hora: {str(e)}")
    
    def _extract_receipt_number(self, text: str) -> Optional[str]:
        """Extrae el número de recibo."""
        try:
            for pattern in self.receipt_number_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(1)
            return None
        except Exception as e:
            logger.warning(f"Error extrayendo número de recibo: {str(e)}")
            return None
    
    def _extract_financial_info(self, text: str, receipt_data: ReceiptData, language: str):
        """Extrae información financiera (totales, subtotales, etc.)."""
        try:
            # Extraer total
            receipt_data.total_amount = self.total_extractor.extract_total_amount(text)
            
            # Extraer subtotal
            receipt_data.subtotal = self.total_extractor.extract_subtotal(text)
            
            # Extraer descuentos
            receipt_data.discount_amount = self.total_extractor.extract_discount(text)
            
            # Extraer propina
            receipt_data.tip_amount = self.total_extractor.extract_tip(text)
            
        except Exception as e:
            logger.warning(f"Error extrayendo información financiera: {str(e)}")
    
    def _extract_payment_info(self, text: str, receipt_data: ReceiptData, language: str):
        """Extrae información de pago."""
        try:
            # Detectar método de pago
            text_lower = text.lower()
            for method, pattern in self.payment_patterns.items():
                if re.search(pattern, text_lower):
                    receipt_data.payment_info.method = method
                    break
            
            # Extraer últimos dígitos de tarjeta
            card_pattern = r'(?:xxxx|****)\s*(\d{4})'
            card_match = re.search(card_pattern, text)
            if card_match:
                receipt_data.payment_info.card_last_digits = card_match.group(1)
            
            # Extraer código de autorización
            auth_patterns = [
                r'(?:auth|authorization|autorización)[\s#:]*(\w+)',
                r'(?:aprobación|approval)[\s#:]*(\w+)',
            ]
            
            for pattern in auth_patterns:
                auth_match = re.search(pattern, text, re.IGNORECASE)
                if auth_match:
                    receipt_data.payment_info.authorization_code = auth_match.group(1)
                    break
                    
        except Exception as e:
            logger.warning(f"Error extrayendo información de pago: {str(e)}")
    
    def _extract_tax_info(self, text: str, receipt_data: ReceiptData, language: str):
        """Extrae información de impuestos."""
        try:
            # Extraer monto de impuestos
            receipt_data.tax_info.tax_amount = self.total_extractor.extract_tax_amount(text)
            
            # Extraer tasa de impuestos
            if language.startswith('spa'):
                # Para Chile, buscar IVA 19%
                iva_pattern = self.tax_patterns['chile']['iva']
                if re.search(iva_pattern, text, re.IGNORECASE):
                    receipt_data.tax_info.tax_rate = 19.0
                    receipt_data.tax_info.tax_type = 'IVA'
            else:
                # Buscar tasa general
                rate_pattern = self.tax_patterns['general']['tax_rate']
                rate_match = re.search(rate_pattern, text)
                if rate_match:
                    receipt_data.tax_info.tax_rate = float(rate_match.group(1))
                    
        except Exception as e:
            logger.warning(f"Error extrayendo información de impuestos: {str(e)}")
    
    def _extract_detailed_items(
        self, 
        text: str, 
        lines: List[Dict[str, Any]], 
        receipt_data: ReceiptData, 
        language: str,
        receipt_type: Optional[str]
    ):
        """Extrae ítems detallados del recibo."""
        try:
            # Usar extractor de ítems avanzado
            detailed_items = self.item_extractor.extract_items_detailed(
                text, 
                lines, 
                language, 
                receipt_type
            )
            
            # Añadir ítems al recibo
            for item in detailed_items:
                receipt_data.add_item(item)
                
        except Exception as e:
            logger.warning(f"Error extrayendo ítems detallados: {str(e)}")
            # Fallback a ítems básicos
            basic_items = self.item_extractor.extract_items_basic(text)
            receipt_data.items = basic_items
    
    def _calculate_parsing_confidence(self, receipt_data: ReceiptData) -> float:
        """Calcula la confianza del parsing basada en datos extraídos."""
        try:
            confidence = 0.3  # Base
            
            # Incrementar por cada campo extraído exitosamente
            if receipt_data.merchant_info.name:
                confidence += 0.15
            if receipt_data.total_amount:
                confidence += 0.20
            if receipt_data.date:
                confidence += 0.10
            if receipt_data.detailed_items:
                confidence += 0.15
            if receipt_data.receipt_number:
                confidence += 0.05
            if receipt_data.payment_info.method:
                confidence += 0.05
            
            # Bonus por información adicional
            if receipt_data.subtotal:
                confidence += 0.05
            if receipt_data.tax_info.tax_amount:
                confidence += 0.05
            if receipt_data.merchant_info.address:
                confidence += 0.05
            
            return max(0.0, min(1.0, confidence))
            
        except Exception as e:
            logger.warning(f"Error calculando confianza: {str(e)}")
            return 0.5
