"""
Módulo de soporte multiidioma para OCR.
"""

from .language_detector import LanguageDetector
from .language_data import LANGUAGE_MAPPINGS, TESSERACT_LANGUAGES

__all__ = [
    'LanguageDetector',
    'LANGUAGE_MAPPINGS',
    'TESSERACT_LANGUAGES'
]
