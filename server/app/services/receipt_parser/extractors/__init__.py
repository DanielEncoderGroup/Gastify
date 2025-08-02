"""
Módulo de extractores especializados para parsing de recibos.
"""

from .base_extractor import BaseExtractor
from .vendor_extractor import VendorExtractor
from .date_extractor import DateExtractor
from .total_extractor import TotalExtractor
from .item_extractor import ItemExtractor

__all__ = [
    'BaseExtractor',
    'VendorExtractor',
    'DateExtractor',
    'TotalExtractor',
    'ItemExtractor'
]
