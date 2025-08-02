"""
Modelos de datos para parsing de recibos.
"""

from .receipt import ReceiptData
from .receipt_item import ReceiptItem

__all__ = [
    'ReceiptData',
    'ReceiptItem'
]
