"""
Extractor especializado para montos y totales en recibos.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)


class TotalExtractor(BaseExtractor):
    """
    Extractor especializado para montos financieros en recibos.
    
    Extrae diferentes tipos de montos:
    - Total general
    - Subtotal
    - Impuestos (IVA, tax, etc.)
    - Descuentos
    - Propinas
    - Cambio devuelto
    """
    
    def __init__(self):
        """Inicializa el extractor de totales."""
        super().__init__()
        self._load_currency_symbols()
        
    def _compile_patterns(self):
        """Compila patrones específicos para extracción de montos."""
        # Patrones para total en español
        spanish_patterns = {
            'total': {
                'high': [
                    r'(?:total|importe|monto)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:total\s+a\s+pagar|total\s+general)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:^|\n)\s*total\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'(?:suma|monto)\s*total\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'\$\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|final)',
                ],
                'low': [
                    r'([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|pesos|clp)',
                ]
            },
            'subtotal': {
                'high': [
                    r'(?:subtotal|sub-total|sub\s+total)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:neto|base)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'(?:antes\s+de\s+)?(?:impuestos|iva)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ]
            },
            'tax': {
                'high': [
                    r'(?:iva|i\.v\.a\.?)\s*(?:19%?)?\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:impuesto|tax)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'19%\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ]
            },
            'discount': {
                'high': [
                    r'(?:descuento|desc\.?|rebaja)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:ahorro|promoción)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'-\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:desc|descuento)',
                ]
            }
        }
        
        # Patrones para total en inglés
        english_patterns = {
            'total': {
                'high': [
                    r'(?:total|amount|grand\s+total)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:total\s+due|amount\s+due)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:^|\n)\s*total\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'\$\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|final)',
                ],
                'low': [
                    r'([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|usd)',
                ]
            },
            'subtotal': {
                'high': [
                    r'(?:subtotal|sub-total|sub\s+total)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:net|base)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'(?:before\s+)?(?:tax|taxes)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ]
            },
            'tax': {
                'high': [
                    r'(?:tax|vat|gst)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:sales\s+tax)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'([0-9]+(?:\.[0-9]+)?)%\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ]
            },
            'discount': {
                'high': [
                    r'(?:discount|savings|promo)\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'-\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:disc|discount)',
                ]
            }
        }
        
        # Patrones para total en portugués
        portuguese_patterns = {
            'total': {
                'high': [
                    r'(?:total|valor|montante)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:total\s+geral|valor\s+total)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
                'medium': [
                    r'R?\$\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|final)',
                ],
                'low': [
                    r'([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:total|reais)',
                ]
            },
            'subtotal': {
                'high': [
                    r'(?:subtotal|sub-total)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                    r'(?:líquido|base)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
            },
            'tax': {
                'high': [
                    r'(?:imposto|icms|iss)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
            },
            'discount': {
                'high': [
                    r'(?:desconto|promoção)\s*:?\s*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)',
                ],
            }
        }
        
        # Compilar patrones por idioma
        self.language_patterns = {
            'spa': self._compile_amount_patterns(spanish_patterns),
            'eng': self._compile_amount_patterns(english_patterns),
            'por': self._compile_amount_patterns(portuguese_patterns),
            'general': self._compile_amount_patterns(spanish_patterns)  # Default
        }
    
    def _compile_amount_patterns(self, patterns_dict: Dict[str, Dict[str, List[str]]]) -> Dict[str, Dict[str, List]]:
        """Compila patrones de montos."""
        compiled = {}
        for amount_type, confidence_patterns in patterns_dict.items():
            compiled[amount_type] = self._compile_pattern_dict(confidence_patterns)
        return compiled
    
    def _load_currency_symbols(self):
        """Carga símbolos de moneda por región."""
        self.currency_symbols = {
            'spa': ['$', 'CLP', 'pesos'],
            'eng': ['$', 'USD', 'dollars'],
            'por': ['R$', 'BRL', 'reais'],
            'eur': ['€', 'EUR', 'euros'],
        }
    
    def extract_total_amount(self, text: str, language: str = 'spa') -> Optional[float]:
        """
        Extrae el monto total (método de compatibilidad).
        
        Args:
            text: Texto completo del OCR
            language: Idioma del texto
            
        Returns:
            Monto total como float o None
        """
        result = self.extract(text, language=language, amount_type='total')
        return result.get('value')
    
    def extract_subtotal(self, text: str, language: str = 'spa') -> Optional[float]:
        """Extrae el subtotal."""
        result = self.extract(text, language=language, amount_type='subtotal')
        return result.get('value')
    
    def extract_tax_amount(self, text: str, language: str = 'spa') -> Optional[float]:
        """Extrae el monto de impuestos."""
        result = self.extract(text, language=language, amount_type='tax')
        return result.get('value')
    
    def extract_discount(self, text: str, language: str = 'spa') -> Optional[float]:
        """Extrae el monto de descuento."""
        result = self.extract(text, language=language, amount_type='discount')
        return result.get('value')
    
    def extract_tip(self, text: str, language: str = 'spa') -> Optional[float]:
        """Extrae el monto de propina."""
        result = self.extract(text, language=language, amount_type='tip')
        return result.get('value')
    
    def extract(self, text: str, **kwargs) -> Dict[str, Any]:
        """
        Extrae montos del texto del recibo.
        
        Args:
            text: Texto del recibo
            **kwargs: Parámetros adicionales
                - language: Idioma del texto
                - amount_type: Tipo de monto ('total', 'subtotal', 'tax', 'discount', 'tip')
                
        Returns:
            Diccionario con monto extraído y metadatos
        """
        language = kwargs.get('language', 'spa')
        amount_type = kwargs.get('amount_type', 'total')
        
        # Configurar idioma
        self.set_language(language)
        
        # Limpiar texto
        clean_text = self._clean_text(text)
        
        # Obtener patrones para el tipo de monto
        if amount_type not in self.patterns:
            return {
                'value': None,
                'confidence': 0.0,
                'method': f'{amount_type}_extraction',
                'raw_match': None,
                'amount_type': amount_type
            }
        
        # Extraer usando patrones específicos
        result = self._extract_with_confidence(
            clean_text, 
            self.patterns[amount_type], 
            self._process_amount
        )
        
        result['amount_type'] = amount_type
        result['method'] = f'{amount_type}_extraction'
        
        # Si no encontramos con patrones específicos, intentar búsqueda general
        if not result['value'] and amount_type == 'total':
            general_result = self._extract_general_total(clean_text)
            if general_result['confidence'] > result['confidence']:
                result = general_result
                result['amount_type'] = amount_type
        
        return result
    
    def _process_amount(self, match) -> Optional[float]:
        """Procesa una coincidencia de monto y la convierte a float."""
        if not match.groups():
            return None
        
        amount_str = match.group(1)
        return self._normalize_amount(amount_str)
    
    def _extract_general_total(self, text: str) -> Dict[str, Any]:
        """Extrae total usando búsqueda general cuando fallan los patrones específicos."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'general_total_search',
            'raw_match': None
        }
        
        lines = text.split('\n')
        
        # Buscar en las últimas líneas (donde suele estar el total)
        for i, line in enumerate(reversed(lines[-10:])):  # Últimas 10 líneas
            line = line.strip().lower()
            if not line:
                continue
            
            # Buscar líneas que contengan "total" y un monto
            if 'total' in line:
                # Buscar montos en la línea
                amount_pattern = r'\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)'
                amounts = re.findall(amount_pattern, line)
                
                if amounts:
                    # Tomar el último monto de la línea (suele ser el total)
                    amount_str = amounts[-1]
                    amount = self._normalize_amount(amount_str)
                    
                    if amount and amount > 0:
                        # Calcular confianza basada en posición y contexto
                        position_score = 1.0 - (i * 0.1)  # Líneas más abajo tienen mayor score
                        context_score = 0.5
                        
                        # Aumentar score si la línea contiene palabras clave
                        if any(word in line for word in ['total', 'pagar', 'due', 'amount']):
                            context_score += 0.3
                        
                        total_score = position_score * context_score
                        
                        if total_score > result['confidence']:
                            result['value'] = amount
                            result['confidence'] = min(0.7, total_score)
                            result['raw_match'] = line
        
        return result
    
    def extract_all_amounts(self, text: str, language: str = 'spa') -> Dict[str, Any]:
        """
        Extrae todos los tipos de montos del recibo.
        
        Args:
            text: Texto del recibo
            language: Idioma del texto
            
        Returns:
            Diccionario con todos los montos extraídos
        """
        amounts = {}
        amount_types = ['total', 'subtotal', 'tax', 'discount', 'tip']
        
        for amount_type in amount_types:
            result = self.extract(text, language=language, amount_type=amount_type)
            amounts[amount_type] = {
                'value': result.get('value'),
                'confidence': result.get('confidence', 0.0),
                'raw_match': result.get('raw_match')
            }
        
        # Validar consistencia entre montos
        amounts = self._validate_amount_consistency(amounts)
        
        return amounts
    
    def _validate_amount_consistency(self, amounts: Dict[str, Any]) -> Dict[str, Any]:
        """Valida la consistencia entre diferentes montos extraídos."""
        total = amounts.get('total', {}).get('value')
        subtotal = amounts.get('subtotal', {}).get('value')
        tax = amounts.get('tax', {}).get('value')
        discount = amounts.get('discount', {}).get('value')
        
        # Validar que total = subtotal + tax - discount (aproximadamente)
        if total and subtotal:
            expected_total = subtotal
            if tax:
                expected_total += tax
            if discount:
                expected_total -= discount
            
            # Permitir diferencia de hasta 5%
            if abs(total - expected_total) / total > 0.05:
                # Hay inconsistencia, reducir confianza
                amounts['total']['confidence'] *= 0.8
                amounts['subtotal']['confidence'] *= 0.8
        
        # Validar que subtotal <= total
        if total and subtotal and subtotal > total:
            # Inconsistencia, reducir confianza del subtotal
            amounts['subtotal']['confidence'] *= 0.5
        
        # Validar que descuento no sea mayor que subtotal
        if subtotal and discount and discount > subtotal:
            amounts['discount']['confidence'] *= 0.5
        
        return amounts
    
    def _normalize_amount(self, amount_str: str) -> Optional[float]:
        """
        Normaliza una cadena de monto a float (override del método base).
        Versión especializada para montos de recibos.
        """
        if not amount_str:
            return None
        
        try:
            # Remover símbolos de moneda y espacios
            cleaned = re.sub(r'[^\d.,\-]', '', amount_str)
            
            if not cleaned:
                return None
            
            # Manejar signos negativos
            is_negative = cleaned.startswith('-')
            if is_negative:
                cleaned = cleaned[1:]
            
            # Manejar diferentes formatos de decimales
            if ',' in cleaned and '.' in cleaned:
                # Formato: 1,234.56 o 1.234,56
                if cleaned.rfind(',') > cleaned.rfind('.'):
                    # Formato europeo: 1.234,56
                    cleaned = cleaned.replace('.', '').replace(',', '.')
                else:
                    # Formato americano: 1,234.56
                    cleaned = cleaned.replace(',', '')
            elif ',' in cleaned:
                # Solo comas - podría ser decimal o separador de miles
                parts = cleaned.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # Probablemente decimal: 123,45
                    cleaned = cleaned.replace(',', '.')
                else:
                    # Probablemente separador de miles: 1,234
                    cleaned = cleaned.replace(',', '')
            
            amount = float(cleaned)
            
            # Aplicar signo negativo si corresponde
            if is_negative:
                amount = -amount
            
            # Validar que el monto sea razonable para un recibo
            if abs(amount) > 1000000:  # Más de 1 millón
                return None
            
            return amount
            
        except (ValueError, AttributeError):
            return None
