"""
Extractor especializado para fechas en recibos.
"""

import re
import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Tuple
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)


class DateExtractor(BaseExtractor):
    """
    Extractor especializado para fechas en recibos.
    
    Maneja múltiples formatos de fecha y idiomas:
    - Formatos numéricos (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
    - Formatos con nombres de meses
    - Validación de fechas lógicas
    - Detección automática de formato por región
    """
    
    def __init__(self):
        """Inicializa el extractor de fechas."""
        super().__init__()
        self._load_month_names()
        self._load_date_formats()
        
    def _compile_patterns(self):
        """Compila patrones específicos para extracción de fechas."""
        # Patrones numéricos básicos
        numeric_patterns = {
            'high': [
                # Formatos con separadores claros
                r'\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})\b',  # DD/MM/YYYY o MM/DD/YYYY
                r'\b(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})\b',  # YYYY/MM/DD
                r'\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2})\b',  # DD/MM/YY o MM/DD/YY
            ],
            'medium': [
                # Formatos con espacios
                r'\b(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b',
                r'\b(\d{4})\s+(\d{1,2})\s+(\d{1,2})\b',
            ],
            'low': [
                # Formatos sin separadores
                r'\b(\d{2})(\d{2})(\d{4})\b',
                r'\b(\d{4})(\d{2})(\d{2})\b',
            ]
        }
        
        # Patrones con nombres de meses en español
        spanish_patterns = {
            'high': [
                r'\b(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\s+(?:del?\s+)?(\d{2,4})\b',
                r'\b([a-záéíóúñ]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
            ],
            'medium': [
                r'\b(\d{1,2})[/\-\.]([a-záéíóúñ]+)[/\-\.](\d{2,4})\b',
                r'(?:fecha|date)[\s:]+(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\s+(?:del?\s+)?(\d{2,4})',
            ]
        }
        
        # Patrones con nombres de meses en inglés
        english_patterns = {
            'high': [
                r'\b([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
                r'\b(\d{1,2})\s+([a-z]+)\s+(\d{2,4})\b',
            ],
            'medium': [
                r'\b(\d{1,2})[/\-\.]([a-z]+)[/\-\.](\d{2,4})\b',
                r'(?:date)[\s:]+([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})',
            ]
        }
        
        # Patrones con nombres de meses en portugués
        portuguese_patterns = {
            'high': [
                r'\b(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôàç]+)\s+(?:de\s+)?(\d{2,4})\b',
                r'\b([a-záéíóúâêôàç]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
            ],
            'medium': [
                r'\b(\d{1,2})[/\-\.]([a-záéíóúâêôàç]+)[/\-\.](\d{2,4})\b',
                r'(?:data)[\s:]+(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôàç]+)\s+(?:de\s+)?(\d{2,4})',
            ]
        }
        
        # Compilar patrones por idioma
        self.language_patterns = {
            'spa': {
                **self._compile_pattern_dict(numeric_patterns),
                **self._compile_pattern_dict(spanish_patterns)
            },
            'eng': {
                **self._compile_pattern_dict(numeric_patterns),
                **self._compile_pattern_dict(english_patterns)
            },
            'por': {
                **self._compile_pattern_dict(numeric_patterns),
                **self._compile_pattern_dict(portuguese_patterns)
            },
            'general': self._compile_pattern_dict(numeric_patterns)
        }
    
    def _load_month_names(self):
        """Carga nombres de meses en diferentes idiomas."""
        self.month_names = {
            'spa': {
                'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
                'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
                'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
                # Abreviaciones
                'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4,
                'may': 5, 'jun': 6, 'jul': 7, 'ago': 8,
                'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12,
                'sept': 9  # Variación común
            },
            'eng': {
                'january': 1, 'february': 2, 'march': 3, 'april': 4,
                'may': 5, 'june': 6, 'july': 7, 'august': 8,
                'september': 9, 'october': 10, 'november': 11, 'december': 12,
                # Abreviaciones
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
                'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9,
                'oct': 10, 'nov': 11, 'dec': 12,
                'sept': 9  # Variación común
            },
            'por': {
                'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
                'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
                'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
                # Abreviaciones
                'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4,
                'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8,
                'set': 9, 'out': 10, 'nov': 11, 'dez': 12
            }
        }
    
    def _load_date_formats(self):
        """Carga formatos de fecha por región."""
        self.date_formats = {
            'spa': 'DD/MM/YYYY',  # Formato español/latinoamericano
            'eng': 'MM/DD/YYYY',  # Formato americano
            'por': 'DD/MM/YYYY',  # Formato brasileño
            'iso': 'YYYY-MM-DD'   # Formato ISO
        }
    
    def extract_date(self, text: str, language: str = 'spa') -> Optional[str]:
        """
        Extrae fecha (método de compatibilidad).
        
        Args:
            text: Texto completo del OCR
            language: Idioma del texto
            
        Returns:
            Fecha en formato ISO (YYYY-MM-DD) o None
        """
        result = self.extract(text, language=language)
        return result.get('value')
    
    def extract(self, text: str, **kwargs) -> Dict[str, Any]:
        """
        Extrae fecha del texto del recibo.
        
        Args:
            text: Texto del recibo
            **kwargs: Parámetros adicionales
                - language: Idioma del texto
                - preferred_format: Formato preferido de fecha
                
        Returns:
            Diccionario con fecha extraída y metadatos
        """
        language = kwargs.get('language', 'spa')
        preferred_format = kwargs.get('preferred_format', self.date_formats.get(language, 'DD/MM/YYYY'))
        
        # Configurar idioma
        self.set_language(language)
        
        # Limpiar texto
        clean_text = self._clean_text(text)
        
        # Buscar fechas usando diferentes estrategias
        candidates = []
        
        # Estrategia 1: Patrones específicos del idioma
        pattern_result = self._extract_by_patterns(clean_text, language)
        if pattern_result['value']:
            candidates.append(pattern_result)
        
        # Estrategia 2: Búsqueda de fechas numéricas
        numeric_result = self._extract_numeric_dates(clean_text, preferred_format)
        if numeric_result['value']:
            candidates.append(numeric_result)
        
        # Estrategia 3: Fechas con nombres de meses
        month_name_result = self._extract_month_name_dates(clean_text, language)
        if month_name_result['value']:
            candidates.append(month_name_result)
        
        # Seleccionar el mejor candidato
        if not candidates:
            return {
                'value': None,
                'confidence': 0.0,
                'method': 'no_date_found',
                'raw_match': None,
                'format_detected': None
            }
        
        # Ordenar por confianza y validez
        valid_candidates = []
        for candidate in candidates:
            if self._validate_date(candidate['value']):
                valid_candidates.append(candidate)
        
        if not valid_candidates:
            return {
                'value': None,
                'confidence': 0.0,
                'method': 'invalid_dates',
                'raw_match': None,
                'format_detected': None
            }
        
        # Seleccionar el de mayor confianza
        best_candidate = max(valid_candidates, key=lambda x: x['confidence'])
        
        return best_candidate
    
    def _extract_by_patterns(self, text: str, language: str) -> Dict[str, Any]:
        """Extrae fechas usando patrones específicos del idioma."""
        if not self.patterns:
            return {'value': None, 'confidence': 0.0, 'method': 'patterns', 'raw_match': None}
        
        def date_processor(match):
            groups = match.groups()
            return self._process_date_groups(groups, language)
        
        result = self._extract_with_confidence(text, self.patterns, date_processor)
        result['method'] = 'language_patterns'
        return result
    
    def _extract_numeric_dates(self, text: str, preferred_format: str) -> Dict[str, Any]:
        """Extrae fechas en formato numérico."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'numeric_extraction',
            'raw_match': None,
            'format_detected': None
        }
        
        # Patrones numéricos ordenados por probabilidad
        numeric_patterns = [
            (r'\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})\b', 'DD/MM/YYYY_or_MM/DD/YYYY'),
            (r'\b(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})\b', 'YYYY/MM/DD'),
            (r'\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2})\b', 'DD/MM/YY_or_MM/DD/YY'),
            (r'\b(\d{2})(\d{2})(\d{4})\b', 'DDMMYYYY_or_MMDDYYYY'),
            (r'\b(\d{4})(\d{2})(\d{2})\b', 'YYYYMMDD'),
        ]
        
        for pattern_str, format_hint in numeric_patterns:
            pattern = re.compile(pattern_str)
            matches = pattern.finditer(text)
            
            for match in matches:
                groups = match.groups()
                date_candidates = self._try_date_formats(groups, format_hint, preferred_format)
                
                for date_str, confidence, detected_format in date_candidates:
                    if confidence > result['confidence']:
                        result['value'] = date_str
                        result['confidence'] = confidence
                        result['raw_match'] = match.group(0)
                        result['format_detected'] = detected_format
        
        return result
    
    def _extract_month_name_dates(self, text: str, language: str) -> Dict[str, Any]:
        """Extrae fechas que contienen nombres de meses."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'month_name_extraction',
            'raw_match': None,
            'format_detected': 'month_name'
        }
        
        month_names = self.month_names.get(language, self.month_names['spa'])
        
        # Patrones para fechas con nombres de meses
        if language == 'spa':
            patterns = [
                r'\b(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\s+(?:del?\s+)?(\d{2,4})\b',
                r'\b([a-záéíóúñ]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
            ]
        elif language == 'eng':
            patterns = [
                r'\b([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
                r'\b(\d{1,2})\s+([a-z]+)\s+(\d{2,4})\b',
            ]
        elif language == 'por':
            patterns = [
                r'\b(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôàç]+)\s+(?:de\s+)?(\d{2,4})\b',
                r'\b([a-záéíóúâêôàç]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
            ]
        else:
            patterns = [
                r'\b(\d{1,2})\s+([a-z]+)\s+(\d{2,4})\b',
                r'\b([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})\b',
            ]
        
        for pattern_str in patterns:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            matches = pattern.finditer(text)
            
            for match in matches:
                groups = match.groups()
                date_str = self._process_month_name_date(groups, month_names)
                
                if date_str:
                    confidence = 0.8  # Alta confianza para fechas con nombres de meses
                    
                    if confidence > result['confidence']:
                        result['value'] = date_str
                        result['confidence'] = confidence
                        result['raw_match'] = match.group(0)
        
        return result
    
    def _process_date_groups(self, groups: Tuple[str, ...], language: str) -> Optional[str]:
        """Procesa grupos de una coincidencia de fecha."""
        if len(groups) == 3:
            # Fecha numérica
            return self._try_date_formats(groups, 'unknown', self.date_formats.get(language, 'DD/MM/YYYY'))[0][0]
        elif len(groups) == 3:
            # Fecha con nombre de mes
            month_names = self.month_names.get(language, self.month_names['spa'])
            return self._process_month_name_date(groups, month_names)
        
        return None
    
    def _try_date_formats(self, groups: Tuple[str, ...], format_hint: str, preferred_format: str) -> List[Tuple[str, float, str]]:
        """Intenta diferentes formatos de fecha para los grupos dados."""
        candidates = []
        
        if len(groups) != 3:
            return candidates
        
        g1, g2, g3 = groups
        
        # Convertir a enteros
        try:
            n1, n2, n3 = int(g1), int(g2), int(g3)
        except ValueError:
            return candidates
        
        # Determinar año
        year = None
        if n3 > 1900:
            year = n3
        elif n1 > 1900:
            year = n1
        elif n3 < 100:
            # Año de 2 dígitos
            year = 2000 + n3 if n3 < 50 else 1900 + n3
        elif n1 < 100:
            year = 2000 + n1 if n1 < 50 else 1900 + n1
        
        if not year:
            return candidates
        
        # Intentar diferentes combinaciones
        date_combinations = []
        
        if format_hint.startswith('YYYY'):
            # YYYY/MM/DD
            date_combinations.append((year, n2, n3 if year == n1 else n1, 0.9))
        elif 'DD/MM' in preferred_format:
            # DD/MM/YYYY
            if year == n3:
                date_combinations.append((year, n2, n1, 0.8))  # DD/MM/YYYY
                date_combinations.append((year, n1, n2, 0.6))  # MM/DD/YYYY
            elif year == n1:
                date_combinations.append((year, n3, n2, 0.8))  # YYYY/MM/DD
        elif 'MM/DD' in preferred_format:
            # MM/DD/YYYY
            if year == n3:
                date_combinations.append((year, n1, n2, 0.8))  # MM/DD/YYYY
                date_combinations.append((year, n2, n1, 0.6))  # DD/MM/YYYY
            elif year == n1:
                date_combinations.append((year, n2, n3, 0.8))  # YYYY/MM/DD
        else:
            # Intentar ambos formatos
            if year == n3:
                date_combinations.append((year, n2, n1, 0.7))  # DD/MM/YYYY
                date_combinations.append((year, n1, n2, 0.7))  # MM/DD/YYYY
        
        # Validar y formatear fechas
        for year, month, day, confidence in date_combinations:
            try:
                if 1 <= month <= 12 and 1 <= day <= 31:
                    date_obj = datetime(year, month, day)
                    date_str = date_obj.strftime('%Y-%m-%d')
                    
                    # Ajustar confianza basada en validez de la fecha
                    if self._is_reasonable_date(date_obj):
                        candidates.append((date_str, confidence, f"{day:02d}/{month:02d}/{year}"))
                    else:
                        candidates.append((date_str, confidence * 0.5, f"{day:02d}/{month:02d}/{year}"))
            except ValueError:
                continue
        
        return sorted(candidates, key=lambda x: x[1], reverse=True)
    
    def _process_month_name_date(self, groups: Tuple[str, ...], month_names: Dict[str, int]) -> Optional[str]:
        """Procesa una fecha que contiene nombre de mes."""
        if len(groups) != 3:
            return None
        
        # Identificar qué grupo es el mes
        month = None
        day = None
        year = None
        
        for group in groups:
            group_lower = group.lower()
            if group_lower in month_names:
                month = month_names[group_lower]
            elif group.isdigit():
                num = int(group)
                if num > 31:  # Probablemente año
                    if num < 100:
                        year = 2000 + num if num < 50 else 1900 + num
                    else:
                        year = num
                elif 1 <= num <= 31:  # Probablemente día
                    day = num
        
        # Si no encontramos mes, intentar coincidencias parciales
        if month is None:
            for group in groups:
                group_lower = group.lower()
                for month_name, month_num in month_names.items():
                    if month_name.startswith(group_lower[:3]) and len(group_lower) >= 3:
                        month = month_num
                        break
                if month:
                    break
        
        if month and day and year:
            try:
                date_obj = datetime(year, month, day)
                return date_obj.strftime('%Y-%m-%d')
            except ValueError:
                pass
        
        return None
    
    def _validate_date(self, date_str: Optional[str]) -> bool:
        """Valida que una fecha sea lógica."""
        if not date_str:
            return False
        
        try:
            date_obj = datetime.fromisoformat(date_str)
            return self._is_reasonable_date(date_obj)
        except ValueError:
            return False
    
    def _is_reasonable_date(self, date_obj: datetime) -> bool:
        """Verifica que una fecha sea razonable para un recibo."""
        current_date = datetime.now()
        
        # No puede ser fecha futura (más de 1 día)
        if date_obj > current_date + timedelta(days=1):
            return False
        
        # No puede ser muy antigua (más de 10 años)
        if date_obj < current_date - timedelta(days=365 * 10):
            return False
        
        return True
