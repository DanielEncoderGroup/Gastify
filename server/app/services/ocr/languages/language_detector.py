"""
Detector de idiomas para OCR multiidioma.
Utiliza múltiples estrategias para detectar el idioma del texto.
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from collections import Counter

try:
    from langdetect import detect, detect_langs, LangDetectException
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    logging.warning("langdetect no está disponible. Se usará detección basada en patrones.")

from .language_data import (
    LANGUAGE_MAPPINGS, 
    TESSERACT_LANGUAGES, 
    REGIONAL_LANGUAGE_COMBINATIONS,
    LANGUAGE_PATTERNS
)

logger = logging.getLogger(__name__)


class LanguageDetector:
    """
    Detector de idiomas multiestratégico para OCR.
    
    Combina detección automática con langdetect y análisis de patrones
    específicos para mejorar la precisión en textos de recibos.
    """
    
    def __init__(self):
        """Inicializa el detector de idiomas."""
        self.pattern_cache: Dict[str, List[re.Pattern]] = {}
        self._compile_patterns()
        
    def _compile_patterns(self):
        """Precompila los patrones de expresiones regulares para mejor rendimiento."""
        for lang, patterns in LANGUAGE_PATTERNS.items():
            self.pattern_cache[lang] = [
                re.compile(pattern, re.IGNORECASE | re.UNICODE) 
                for pattern in patterns
            ]
    
    def detect_language(
        self, 
        text: str, 
        fallback_language: str = "spa+eng"
    ) -> str:
        """
        Detecta el idioma del texto usando múltiples estrategias.
        
        Args:
            text: Texto a analizar
            fallback_language: Idioma por defecto si no se puede detectar
            
        Returns:
            Código de idioma para Tesseract (ej: 'spa', 'eng', 'spa+eng')
        """
        if not text or len(text.strip()) < 10:
            logger.warning("Texto muy corto para detección confiable de idioma")
            return fallback_language
        
        # Limpiar texto para análisis
        clean_text = self._clean_text(text)
        
        # Estrategia 1: Detección automática con langdetect
        langdetect_result = self._detect_with_langdetect(clean_text)
        
        # Estrategia 2: Análisis de patrones específicos
        pattern_result = self._detect_with_patterns(clean_text)
        
        # Estrategia 3: Análisis de características del texto
        feature_result = self._detect_with_features(clean_text)
        
        # Combinar resultados y decidir
        final_language = self._combine_detection_results(
            langdetect_result,
            pattern_result,
            feature_result,
            fallback_language
        )
        
        # Convertir a formato Tesseract
        tesseract_language = self._convert_to_tesseract_format(final_language)
        
        logger.info(f"Idioma detectado: {final_language} -> Tesseract: {tesseract_language}")
        return tesseract_language
    
    def _clean_text(self, text: str) -> str:
        """
        Limpia el texto para mejorar la detección de idioma.
        
        Args:
            text: Texto original
            
        Returns:
            Texto limpio
        """
        # Remover números y símbolos excesivos
        clean_text = re.sub(r'\d+', ' ', text)
        clean_text = re.sub(r'[^\w\s]', ' ', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        return clean_text.strip()
    
    def _detect_with_langdetect(self, text: str) -> Optional[str]:
        """
        Detecta idioma usando la librería langdetect.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado o None si falla
        """
        if not LANGDETECT_AVAILABLE:
            return None
        
        try:
            # Detectar idioma principal
            detected_lang = detect(text)
            
            # Obtener probabilidades de múltiples idiomas
            lang_probs = detect_langs(text)
            
            # Si hay múltiples idiomas con alta probabilidad, combinarlos
            high_prob_langs = [
                lang.lang for lang in lang_probs 
                if lang.prob > 0.3  # Umbral de probabilidad
            ]
            
            if len(high_prob_langs) > 1:
                # Múltiples idiomas detectados
                logger.info(f"Múltiples idiomas detectados: {high_prob_langs}")
                return "+".join(high_prob_langs[:3])  # Máximo 3 idiomas
            
            return detected_lang
            
        except LangDetectException as e:
            logger.warning(f"Error en detección con langdetect: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error inesperado en langdetect: {str(e)}")
            return None
    
    def _detect_with_patterns(self, text: str) -> Optional[str]:
        """
        Detecta idioma usando patrones específicos de recibos.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado o None si no hay coincidencias claras
        """
        language_scores = {}
        
        for lang, patterns in self.pattern_cache.items():
            score = 0
            for pattern in patterns:
                matches = pattern.findall(text)
                score += len(matches)
            
            if score > 0:
                language_scores[lang] = score
        
        if not language_scores:
            return None
        
        # Ordenar por puntuación
        sorted_langs = sorted(
            language_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Si el mejor resultado tiene una puntuación significativa
        if sorted_langs[0][1] >= 2:
            # Verificar si hay múltiples idiomas con puntuaciones similares
            top_score = sorted_langs[0][1]
            similar_langs = [
                lang for lang, score in sorted_langs 
                if score >= top_score * 0.7  # 70% del mejor score
            ]
            
            if len(similar_langs) > 1:
                return "+".join(similar_langs[:2])  # Combinar top 2
            
            return sorted_langs[0][0]
        
        return None
    
    def _detect_with_features(self, text: str) -> Optional[str]:
        """
        Detecta idioma usando características específicas del texto.
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código de idioma detectado basado en características
        """
        features = {
            'has_accents': bool(re.search(r'[áéíóúüñç]', text.lower())),
            'has_chinese': bool(re.search(r'[\u4e00-\u9fff]', text)),
            'has_japanese': bool(re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text)),
            'has_korean': bool(re.search(r'[\uac00-\ud7af]', text)),
            'has_arabic': bool(re.search(r'[\u0600-\u06ff]', text)),
            'has_cyrillic': bool(re.search(r'[\u0400-\u04ff]', text)),
            'has_thai': bool(re.search(r'[\u0e00-\u0e7f]', text)),
            'currency_dollar': bool(re.search(r'\$', text)),
            'currency_euro': bool(re.search(r'€', text)),
            'currency_real': bool(re.search(r'R\$', text)),
            'currency_peso': bool(re.search(r'\$.*\d+[.,]\d+', text)),
        }
        
        # Reglas basadas en características
        if features['has_chinese']:
            return 'zh'
        elif features['has_japanese']:
            return 'ja'
        elif features['has_korean']:
            return 'ko'
        elif features['has_arabic']:
            return 'ar'
        elif features['has_cyrillic']:
            return 'ru'
        elif features['has_thai']:
            return 'th'
        elif features['currency_real']:
            return 'pt'  # Probablemente portugués brasileño
        elif features['has_accents'] and features['currency_peso']:
            return 'es'  # Probablemente español
        elif features['currency_euro']:
            # Podría ser varios idiomas europeos
            if features['has_accents']:
                return 'es+fr+it'  # Idiomas latinos con euro
            else:
                return 'en+de+nl'  # Idiomas germánicos con euro
        
        return None
    
    def _combine_detection_results(
        self,
        langdetect_result: Optional[str],
        pattern_result: Optional[str],
        feature_result: Optional[str],
        fallback: str
    ) -> str:
        """
        Combina los resultados de diferentes estrategias de detección.
        
        Args:
            langdetect_result: Resultado de langdetect
            pattern_result: Resultado de análisis de patrones
            feature_result: Resultado de análisis de características
            fallback: Idioma por defecto
            
        Returns:
            Idioma final detectado
        """
        results = [
            result for result in [langdetect_result, pattern_result, feature_result]
            if result is not None
        ]
        
        if not results:
            return fallback
        
        # Si todos los métodos coinciden
        if len(set(results)) == 1:
            return results[0]
        
        # Priorizar resultados de patrones (más específicos para recibos)
        if pattern_result:
            return pattern_result
        
        # Luego características específicas
        if feature_result:
            return feature_result
        
        # Finalmente langdetect
        if langdetect_result:
            return langdetect_result
        
        return fallback
    
    def _convert_to_tesseract_format(self, language: str) -> str:
        """
        Convierte código de idioma a formato Tesseract.
        
        Args:
            language: Código de idioma detectado
            
        Returns:
            Código de idioma en formato Tesseract
        """
        # Si ya contiene '+', es una combinación
        if '+' in language:
            langs = language.split('+')
            tesseract_langs = []
            
            for lang in langs:
                if lang in LANGUAGE_MAPPINGS:
                    tesseract_lang = LANGUAGE_MAPPINGS[lang]
                    if tesseract_lang in TESSERACT_LANGUAGES:
                        tesseract_langs.append(tesseract_lang)
                elif lang in TESSERACT_LANGUAGES:
                    tesseract_langs.append(lang)
            
            if tesseract_langs:
                return '+'.join(tesseract_langs)
        
        # Idioma simple
        if language in LANGUAGE_MAPPINGS:
            tesseract_lang = LANGUAGE_MAPPINGS[language]
            if tesseract_lang in TESSERACT_LANGUAGES:
                return tesseract_lang
        elif language in TESSERACT_LANGUAGES:
            return language
        
        # Si no se encuentra, usar combinación por defecto
        return "spa+eng"
    
    def get_regional_combination(self, region: str) -> str:
        """
        Obtiene combinación de idiomas para una región específica.
        
        Args:
            region: Código de región
            
        Returns:
            Combinación de idiomas para la región
        """
        return REGIONAL_LANGUAGE_COMBINATIONS.get(region, "spa+eng")
    
    def is_language_supported(self, language: str) -> bool:
        """
        Verifica si un idioma está soportado por Tesseract.
        
        Args:
            language: Código de idioma
            
        Returns:
            True si está soportado
        """
        if '+' in language:
            langs = language.split('+')
            return all(
                lang in TESSERACT_LANGUAGES or lang in LANGUAGE_MAPPINGS
                for lang in langs
            )
        
        return (
            language in TESSERACT_LANGUAGES or 
            language in LANGUAGE_MAPPINGS
        )
