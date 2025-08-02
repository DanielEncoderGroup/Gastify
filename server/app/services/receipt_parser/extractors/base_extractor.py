"""
Clase base para extractores especializados.
"""

import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Pattern
from enum import Enum

logger = logging.getLogger(__name__)


class ExtractionConfidence(Enum):
    """Niveles de confianza para extracciones."""
    HIGH = 0.9
    MEDIUM = 0.7
    LOW = 0.5
    VERY_LOW = 0.3


class BaseExtractor(ABC):
    """
    Clase base abstracta para extractores especializados.
    
    Define la interfaz común y métodos utilitarios para todos los extractores
    que procesan diferentes partes de un recibo.
    """
    
    def __init__(self):
        """Inicializa el extractor base."""
        self.patterns: Dict[str, List[Pattern]] = {}
        self.language_patterns: Dict[str, Dict[str, List[Pattern]]] = {}
        self._compile_patterns()
        
    @abstractmethod
    def _compile_patterns(self):
        """
        Compila los patrones de expresiones regulares específicos del extractor.
        Debe ser implementado por cada extractor especializado.
        """
        pass
    
    def _compile_pattern_dict(self, pattern_dict: Dict[str, List[str]]) -> Dict[str, List[Pattern]]:
        """
        Compila un diccionario de patrones de strings a objetos Pattern.
        
        Args:
            pattern_dict: Diccionario con listas de patrones como strings
            
        Returns:
            Diccionario con patrones compilados
        """
        compiled = {}
        for key, patterns in pattern_dict.items():
            compiled[key] = []
            for pattern in patterns:
                try:
                    compiled[key].append(re.compile(pattern, re.IGNORECASE | re.UNICODE))
                except re.error as e:
                    logger.warning(f"Error compilando patrón '{pattern}': {str(e)}")
        return compiled
    
    def _search_patterns(
        self, 
        text: str, 
        patterns: List[Pattern], 
        return_all: bool = False
    ) -> Optional[List[re.Match]]:
        """
        Busca patrones en el texto.
        
        Args:
            text: Texto donde buscar
            patterns: Lista de patrones compilados
            return_all: Si retornar todas las coincidencias o solo la primera
            
        Returns:
            Lista de coincidencias encontradas o None
        """
        matches = []
        
        for pattern in patterns:
            if return_all:
                pattern_matches = pattern.finditer(text)
                matches.extend(pattern_matches)
            else:
                match = pattern.search(text)
                if match:
                    matches.append(match)
                    if not return_all:
                        break
        
        return matches if matches else None
    
    def _extract_with_confidence(
        self, 
        text: str, 
        pattern_groups: Dict[str, List[Pattern]],
        processor_func: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Extrae información con diferentes niveles de confianza.
        
        Args:
            text: Texto donde extraer
            pattern_groups: Grupos de patrones organizados por confianza
            processor_func: Función opcional para procesar las coincidencias
            
        Returns:
            Diccionario con resultado y confianza
        """
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'pattern_matching',
            'raw_match': None
        }
        
        # Intentar patrones en orden de confianza (high -> low)
        confidence_order = ['high', 'medium', 'low', 'very_low']
        confidence_values = {
            'high': ExtractionConfidence.HIGH.value,
            'medium': ExtractionConfidence.MEDIUM.value,
            'low': ExtractionConfidence.LOW.value,
            'very_low': ExtractionConfidence.VERY_LOW.value
        }
        
        for conf_level in confidence_order:
            if conf_level in pattern_groups:
                matches = self._search_patterns(text, pattern_groups[conf_level])
                if matches:
                    match = matches[0]  # Tomar la primera coincidencia
                    
                    if processor_func:
                        processed_value = processor_func(match)
                        if processed_value is not None:
                            result['value'] = processed_value
                            result['confidence'] = confidence_values[conf_level]
                            result['raw_match'] = match.group(0)
                            break
                    else:
                        result['value'] = match.group(1) if match.groups() else match.group(0)
                        result['confidence'] = confidence_values[conf_level]
                        result['raw_match'] = match.group(0)
                        break
        
        return result
    
    def _clean_text(self, text: str) -> str:
        """
        Limpia el texto para mejorar la extracción.
        
        Args:
            text: Texto original
            
        Returns:
            Texto limpio
        """
        # Dividir por saltos de línea para preservarlos
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Normalizar espacios en blanco dentro de cada línea
            cleaned_line = re.sub(r'\s+', ' ', line)
            # Remover caracteres de control
            cleaned_line = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned_line)
            cleaned_lines.append(cleaned_line.strip())
        
        # Unir las líneas nuevamente preservando saltos de línea
        return '\n'.join(cleaned_lines)
    
    def _normalize_amount(self, amount_str: str) -> Optional[float]:
        """
        Normaliza una cadena de monto a float.
        
        Args:
            amount_str: String con el monto
            
        Returns:
            Monto como float o None si no es válido
        """
        if not amount_str:
            return None
        
        try:
            # Remover símbolos de moneda y espacios
            cleaned = re.sub(r'[^\d.,\-]', '', amount_str)
            
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
            
            return float(cleaned)
            
        except (ValueError, AttributeError):
            return None
    
    def _extract_from_lines(
        self, 
        lines: List[Dict[str, Any]], 
        line_filter: callable,
        extractor_func: callable
    ) -> List[Any]:
        """
        Extrae información de líneas específicas basadas en un filtro.
        
        Args:
            lines: Lista de líneas con información de posición
            line_filter: Función para filtrar líneas relevantes
            extractor_func: Función para extraer información de cada línea
            
        Returns:
            Lista de elementos extraídos
        """
        results = []
        
        for line in lines:
            if line_filter(line):
                extracted = extractor_func(line)
                if extracted:
                    results.append(extracted)
        
        return results
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calcula la similitud entre dos textos.
        
        Args:
            text1: Primer texto
            text2: Segundo texto
            
        Returns:
            Score de similitud entre 0 y 1
        """
        if not text1 or not text2:
            return 0.0
        
        # Normalizar textos
        t1 = text1.lower().strip()
        t2 = text2.lower().strip()
        
        if t1 == t2:
            return 1.0
        
        # Calcular similitud basada en palabras comunes
        words1 = set(t1.split())
        words2 = set(t2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _validate_extraction(self, value: Any, validation_rules: Dict[str, Any]) -> bool:
        """
        Valida un valor extraído contra reglas específicas.
        
        Args:
            value: Valor a validar
            validation_rules: Reglas de validación
            
        Returns:
            True si el valor es válido
        """
        if value is None:
            return False
        
        # Validar tipo
        if 'type' in validation_rules:
            expected_type = validation_rules['type']
            if not isinstance(value, expected_type):
                return False
        
        # Validar rango numérico
        if isinstance(value, (int, float)):
            if 'min_value' in validation_rules and value < validation_rules['min_value']:
                return False
            if 'max_value' in validation_rules and value > validation_rules['max_value']:
                return False
        
        # Validar longitud de string
        if isinstance(value, str):
            if 'min_length' in validation_rules and len(value) < validation_rules['min_length']:
                return False
            if 'max_length' in validation_rules and len(value) > validation_rules['max_length']:
                return False
        
        return True
    
    def get_supported_languages(self) -> List[str]:
        """
        Obtiene la lista de idiomas soportados por este extractor.
        
        Returns:
            Lista de códigos de idioma soportados
        """
        return list(self.language_patterns.keys()) if self.language_patterns else ['general']
    
    def set_language(self, language: str):
        """
        Configura el idioma para la extracción.
        
        Args:
            language: Código de idioma
        """
        if language in self.language_patterns:
            self.patterns = self.language_patterns[language]
        elif 'general' in self.language_patterns:
            self.patterns = self.language_patterns['general']
        else:
            logger.warning(f"Idioma {language} no soportado por {self.__class__.__name__}")
    
    @abstractmethod
    def extract(self, text: str, **kwargs) -> Dict[str, Any]:
        """
        Método principal de extracción que debe implementar cada extractor.
        
        Args:
            text: Texto del cual extraer información
            **kwargs: Parámetros adicionales específicos del extractor
            
        Returns:
            Diccionario con información extraída y metadatos
        """
        pass
