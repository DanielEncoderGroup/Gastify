"""
Módulo OCR refactorizado para Gastify.
Proporciona servicios de reconocimiento óptico de caracteres multiidioma.
"""

from .base_ocr_service import BaseOCRService
from .tesseract_ocr_service import TesseractOCRService

__all__ = [
    'BaseOCRService',
    'TesseractOCRService'
]
