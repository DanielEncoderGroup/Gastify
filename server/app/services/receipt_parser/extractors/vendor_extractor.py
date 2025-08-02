"""
Extractor especializado para nombres de proveedores/comerciantes.
"""

import re
import logging
from typing import Dict, List, Any, Optional
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)


class VendorExtractor(BaseExtractor):
    """
    Extractor especializado para identificar nombres de proveedores en recibos.
    
    Utiliza múltiples estrategias para detectar el nombre del comerciante:
    - Análisis de posición (primeras líneas)
    - Patrones específicos por idioma
    - Base de datos de marcas conocidas
    - Análisis de formato de texto
    """
    
    def __init__(self):
        """Inicializa el extractor de proveedores."""
        super().__init__()
        self._load_known_vendors()
        
    def _compile_patterns(self):
        """Compila patrones específicos para extracción de proveedores."""
        # Patrones por idioma
        spanish_patterns = {
            'high': [
                r'^([A-ZÁÉÍÓÚÑ\s]{3,30})\s*$',  # Líneas en mayúsculas al inicio
                r'(?:empresa|comercial|tienda|restaurante|café|supermercado)\s+([A-Za-záéíóúñ\s]{2,25})',
                r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,25})\s+(?:ltda|s\.a\.|spa|eirl)',
            ],
            'medium': [
                r'^([A-Za-záéíóúñ\s]{4,25})\s*(?:rut|nit)',
                r'bienvenido\s+a\s+([A-Za-záéíóúñ\s]{2,25})',
                r'([A-Za-záéíóúñ\s]{3,25})\s+(?:sucursal|local)',
            ],
            'low': [
                r'^([A-Za-záéíóúñ\s]{5,30})$',  # Cualquier texto al inicio
            ]
        }
        
        english_patterns = {
            'high': [
                r'^([A-Z\s]{3,30})\s*$',  # Líneas en mayúsculas al inicio
                r'(?:store|shop|restaurant|cafe|market|company)\s+([A-Za-z\s]{2,25})',
                r'([A-Z][a-z\s]{2,25})\s+(?:inc|llc|corp|ltd)',
            ],
            'medium': [
                r'^([A-Za-z\s]{4,25})\s*(?:tax|id)',
                r'welcome\s+to\s+([A-Za-z\s]{2,25})',
                r'([A-Za-z\s]{3,25})\s+(?:branch|location)',
            ],
            'low': [
                r'^([A-Za-z\s]{5,30})$',
            ]
        }
        
        portuguese_patterns = {
            'high': [
                r'^([A-ZÁÉÍÓÚÂÊÔÀÇ\s]{3,30})\s*$',
                r'(?:empresa|loja|restaurante|café|supermercado)\s+([A-Za-záéíóúâêôàç\s]{2,25})',
                r'([A-ZÁÉÍÓÚÂÊÔÀÇ][a-záéíóúâêôàç\s]{2,25})\s+(?:ltda|s\.a\.|eireli)',
            ],
            'medium': [
                r'^([A-Za-záéíóúâêôàç\s]{4,25})\s*(?:cnpj|cpf)',
                r'bem-vindo\s+(?:ao|à)\s+([A-Za-záéíóúâêôàç\s]{2,25})',
            ],
            'low': [
                r'^([A-Za-záéíóúâêôàç\s]{5,30})$',
            ]
        }
        
        # Compilar patrones por idioma
        self.language_patterns = {
            'spa': self._compile_pattern_dict(spanish_patterns),
            'eng': self._compile_pattern_dict(english_patterns),
            'por': self._compile_pattern_dict(portuguese_patterns),
            'general': self._compile_pattern_dict(spanish_patterns)  # Default
        }
        
        # Patrones generales (independientes del idioma)
        general_patterns = {
            'known_brands': [],  # Se llenarán dinámicamente
            'format_indicators': [
                re.compile(r'^([A-Z\s]{3,30})$', re.UNICODE),  # Texto en mayúsculas
                re.compile(r'^([A-Za-z\s&\-\.]{5,40})\s*(?:\n|$)', re.UNICODE | re.MULTILINE),
            ]
        }
        
        self.general_patterns = general_patterns
    
    def _load_known_vendors(self):
        """Carga base de datos de proveedores conocidos."""
        # Marcas conocidas por categoría y región
        self.known_vendors = {
            'chile': {
                'supermercados': [
                    'lider', 'jumbo', 'santa isabel', 'unimarc', 'tottus',
                    'acuenta', 'mayorista 10', 'alvi', 'ekono', 'ok market'
                ],
                'retail': [
                    'falabella', 'ripley', 'paris', 'hites', 'la polar',
                    'corona', 'abcdin', 'easy', 'sodimac', 'homecenter'
                ],
                'combustible': [
                    'copec', 'shell', 'petrobras', 'terpel', 'esso'
                ],
                'restaurantes': [
                    'mcdonalds', 'burger king', 'subway', 'dominos', 'pizza hut',
                    'doggis', 'juan maestro', 'telepizza'
                ],
                'farmacias': [
                    'cruz verde', 'salcobrand', 'ahumada', 'dr simi'
                ]
            },
            'global': {
                'fast_food': [
                    'mcdonalds', 'burger king', 'kfc', 'subway', 'pizza hut',
                    'dominos', 'taco bell', 'wendys', 'starbucks'
                ],
                'retail': [
                    'walmart', 'target', 'costco', 'amazon', 'best buy',
                    'home depot', 'lowes', 'ikea', 'zara', 'h&m'
                ],
                'gas_stations': [
                    'shell', 'exxon', 'bp', 'chevron', 'mobil', 'texaco'
                ]
            }
        }
        
        # Crear patrones para marcas conocidas
        all_brands = []
        for region in self.known_vendors.values():
            for category in region.values():
                all_brands.extend(category)
        
        # Compilar patrones para marcas conocidas
        brand_patterns = []
        for brand in set(all_brands):
            # Patrón flexible para marcas
            pattern = rf'\b({re.escape(brand)})\b'
            try:
                brand_patterns.append(re.compile(pattern, re.IGNORECASE | re.UNICODE))
            except re.error:
                continue
        
        self.general_patterns['known_brands'] = brand_patterns
    
    def extract_vendor(self, text: str, language: str = 'spa') -> str:
        """
        Extrae el nombre del proveedor (método de compatibilidad).
        
        Args:
            text: Texto completo del OCR
            language: Idioma del texto
            
        Returns:
            Nombre del proveedor
        """
        result = self.extract(text, language=language)
        return result.get('value', '')
    
    def extract(self, text: str, **kwargs) -> Dict[str, Any]:
        """
        Extrae el nombre del proveedor del texto.
        
        Args:
            text: Texto del recibo
            **kwargs: Parámetros adicionales
                - language: Idioma del texto
                - lines: Información de líneas con posiciones
                
        Returns:
            Diccionario con nombre del proveedor y metadatos
        """
        language = kwargs.get('language', 'spa')
        lines = kwargs.get('lines', [])
        
        # Configurar idioma
        self.set_language(language)
        
        # Limpiar texto
        clean_text = self._clean_text(text)
        
        # Estrategia 1: Buscar marcas conocidas
        known_brand_result = self._extract_known_brand(clean_text)
        if known_brand_result['confidence'] > 0.8:
            return known_brand_result
        
        # Estrategia 2: Análisis de posición (primeras líneas)
        position_result = self._extract_by_position(clean_text, lines)
        
        # Estrategia 3: Patrones específicos del idioma
        pattern_result = self._extract_by_patterns(clean_text)
        
        # Estrategia 4: Análisis de formato
        format_result = self._extract_by_format(clean_text)
        
        # Seleccionar el mejor resultado
        candidates = [known_brand_result, position_result, pattern_result, format_result]
        best_result = max(candidates, key=lambda x: x['confidence'])
        
        # Si la confianza es muy baja, intentar combinación de estrategias
        if best_result['confidence'] < 0.5:
            combined_result = self._combine_strategies(candidates, clean_text)
            if combined_result['confidence'] > best_result['confidence']:
                best_result = combined_result
        
        return best_result
    
    def _extract_known_brand(self, text: str) -> Dict[str, Any]:
        """Extrae marcas conocidas del texto."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'known_brand',
            'raw_match': None
        }
        
        text_lower = text.lower()
        
        # Buscar marcas conocidas
        for pattern in self.general_patterns['known_brands']:
            match = pattern.search(text_lower)
            if match:
                brand_name = match.group(1)
                
                # Verificar contexto (no debe estar en medio de otra palabra)
                start, end = match.span()
                context_valid = True
                
                if start > 0 and text_lower[start-1].isalnum():
                    context_valid = False
                if end < len(text_lower) and text_lower[end].isalnum():
                    context_valid = False
                
                if context_valid:
                    result['value'] = brand_name.title()
                    result['confidence'] = 0.9
                    result['raw_match'] = match.group(0)
                    break
        
        return result
    
    def _extract_by_position(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrae proveedor basado en posición en el recibo."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'position_based',
            'raw_match': None
        }
        
        # Si tenemos información de líneas, usar esa
        if lines:
            return self._extract_from_lines_info(lines)
        
        # Fallback: usar líneas de texto simple
        text_lines = text.split('\n')
        
        # Analizar las primeras 5 líneas
        for i, line in enumerate(text_lines[:5]):
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            # Calcular score basado en posición y características
            position_score = 1.0 - (i * 0.15)  # Primeras líneas tienen mayor score
            
            # Características que aumentan la probabilidad
            char_score = 0.0
            
            # Texto en mayúsculas (común en nombres de empresas)
            if line.isupper() and len(line) > 3:
                char_score += 0.3
            
            # Longitud apropiada para nombre de empresa
            if 5 <= len(line) <= 30:
                char_score += 0.2
            
            # No contiene números (menos probable que sea nombre)
            if not re.search(r'\d', line):
                char_score += 0.1
            
            # No contiene símbolos de moneda
            if not re.search(r'[$€£¥₹]', line):
                char_score += 0.1
            
            total_score = position_score * char_score
            
            if total_score > result['confidence']:
                result['value'] = line.title() if not line.isupper() else line
                result['confidence'] = min(0.8, total_score)
                result['raw_match'] = line
        
        return result
    
    def _extract_from_lines_info(self, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrae proveedor usando información detallada de líneas."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'lines_analysis',
            'raw_match': None
        }
        
        # Ordenar líneas por posición vertical (top)
        sorted_lines = sorted(lines, key=lambda x: x.get('bbox', [0, 0, 0, 0])[1])
        
        for i, line_info in enumerate(sorted_lines[:5]):
            line_text = line_info.get('text', '').strip()
            if not line_text or len(line_text) < 3:
                continue
            
            # Score basado en posición
            position_score = 1.0 - (i * 0.2)
            
            # Score basado en confianza del OCR
            ocr_confidence = 0.7  # Default si no hay info
            if 'words' in line_info:
                confidences = [word.get('confidence', 70) for word in line_info['words']]
                if confidences:
                    ocr_confidence = sum(confidences) / len(confidences) / 100.0
            
            # Score basado en características del texto
            text_score = self._calculate_vendor_text_score(line_text)
            
            # Score combinado
            combined_score = position_score * 0.4 + ocr_confidence * 0.3 + text_score * 0.3
            
            if combined_score > result['confidence']:
                result['value'] = self._format_vendor_name(line_text)
                result['confidence'] = min(0.85, combined_score)
                result['raw_match'] = line_text
        
        return result
    
    def _extract_by_patterns(self, text: str) -> Dict[str, Any]:
        """Extrae proveedor usando patrones específicos del idioma."""
        if not self.patterns:
            return {'value': None, 'confidence': 0.0, 'method': 'patterns', 'raw_match': None}
        
        return self._extract_with_confidence(text, self.patterns)
    
    def _extract_by_format(self, text: str) -> Dict[str, Any]:
        """Extrae proveedor basado en formato del texto."""
        result = {
            'value': None,
            'confidence': 0.0,
            'method': 'format_analysis',
            'raw_match': None
        }
        
        lines = text.split('\n')
        
        for i, line in enumerate(lines[:5]):
            line = line.strip()
            if not line:
                continue
            
            # Buscar líneas que parecen nombres de empresa
            format_score = self._calculate_vendor_text_score(line)
            position_bonus = 1.0 - (i * 0.1)
            
            total_score = format_score * position_bonus
            
            if total_score > result['confidence'] and total_score > 0.4:
                result['value'] = self._format_vendor_name(line)
                result['confidence'] = min(0.7, total_score)
                result['raw_match'] = line
        
        return result
    
    def _calculate_vendor_text_score(self, text: str) -> float:
        """Calcula score de probabilidad de que un texto sea nombre de proveedor."""
        if not text or len(text) < 3:
            return 0.0
        
        score = 0.0
        
        # Longitud apropiada
        if 5 <= len(text) <= 40:
            score += 0.3
        elif 3 <= len(text) <= 50:
            score += 0.1
        
        # Formato de mayúsculas (común en nombres de empresa)
        if text.isupper():
            score += 0.2
        elif text.istitle():
            score += 0.15
        
        # No contiene números (menos probable)
        if not re.search(r'\d', text):
            score += 0.15
        
        # No contiene símbolos de precio
        if not re.search(r'[$€£¥₹]', text):
            score += 0.1
        
        # Contiene palabras típicas de empresas
        business_words = ['store', 'shop', 'market', 'restaurant', 'cafe', 'company',
                         'tienda', 'restaurante', 'café', 'empresa', 'comercial',
                         'loja', 'empresa', 'restaurante']
        
        for word in business_words:
            if word.lower() in text.lower():
                score += 0.1
                break
        
        # Penalizar si contiene palabras que no son nombres
        non_vendor_words = ['total', 'subtotal', 'tax', 'iva', 'receipt', 'recibo',
                           'date', 'fecha', 'time', 'hora', 'thank', 'gracias']
        
        for word in non_vendor_words:
            if word.lower() in text.lower():
                score -= 0.2
                break
        
        return max(0.0, min(1.0, score))
    
    def _format_vendor_name(self, name: str) -> str:
        """Formatea el nombre del proveedor."""
        if not name:
            return ''
        
        # Limpiar espacios extra
        formatted = re.sub(r'\s+', ' ', name.strip())
        
        # Si está todo en mayúsculas y es largo, convertir a title case
        if formatted.isupper() and len(formatted) > 10:
            formatted = formatted.title()
        
        # Capitalizar primera letra si no está
        if formatted and not formatted[0].isupper():
            formatted = formatted[0].upper() + formatted[1:]
        
        return formatted
    
    def _combine_strategies(self, candidates: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        """Combina resultados de múltiples estrategias."""
        # Filtrar candidatos válidos
        valid_candidates = [c for c in candidates if c['value'] and c['confidence'] > 0.2]
        
        if not valid_candidates:
            return {'value': None, 'confidence': 0.0, 'method': 'combined', 'raw_match': None}
        
        # Si hay consenso entre estrategias, aumentar confianza
        values = [c['value'].lower() for c in valid_candidates]
        most_common = max(set(values), key=values.count) if values else None
        
        if most_common and values.count(most_common) > 1:
            # Hay consenso, usar el resultado con mayor confianza de ese valor
            consensus_candidates = [c for c in valid_candidates if c['value'].lower() == most_common]
            best = max(consensus_candidates, key=lambda x: x['confidence'])
            
            # Aumentar confianza por consenso
            best['confidence'] = min(0.9, best['confidence'] + 0.1)
            best['method'] = 'combined_consensus'
            return best
        
        # Sin consenso, usar el de mayor confianza
        best = max(valid_candidates, key=lambda x: x['confidence'])
        best['method'] = 'combined_best'
        return best
