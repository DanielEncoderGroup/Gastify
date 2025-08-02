"""
Módulo de preprocesadores de imágenes para OCR.
"""

from .adaptive_preprocessor import AdaptivePreprocessor
from .receipt_preprocessor import ReceiptPreprocessor

__all__ = [
    'AdaptivePreprocessor',
    'ReceiptPreprocessor'
]
