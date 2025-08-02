"""
Modelo de datos para ítems de recibo.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from decimal import Decimal


@dataclass
class ReceiptItem:
    """
    Modelo de datos para un ítem individual en un recibo.
    
    Representa una línea de detalle con toda la información extraíble
    como descripción, cantidad, precios, descuentos, etc.
    """
    
    # Información básica del ítem
    description: str
    line_number: Optional[int] = None
    
    # Información de cantidad y unidades
    quantity: Optional[float] = None
    unit: Optional[str] = None  # kg, ml, unidades, etc.
    
    # Información de precios
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    original_price: Optional[float] = None  # Precio antes de descuentos
    
    # Descuentos y promociones
    discount_amount: Optional[float] = None
    discount_percentage: Optional[float] = None
    promotion_code: Optional[str] = None
    
    # Información adicional
    sku: Optional[str] = None  # Código de producto
    barcode: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    
    # Información fiscal
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_exempt: bool = False
    
    # Metadatos de extracción
    confidence: float = 1.0
    extraction_method: str = "pattern_based"
    raw_text: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convierte el ítem a diccionario.
        
        Returns:
            Diccionario con todos los campos del ítem
        """
        return {
            'description': self.description,
            'line_number': self.line_number,
            'quantity': self.quantity,
            'unit': self.unit,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'original_price': self.original_price,
            'discount_amount': self.discount_amount,
            'discount_percentage': self.discount_percentage,
            'promotion_code': self.promotion_code,
            'sku': self.sku,
            'barcode': self.barcode,
            'category': self.category,
            'brand': self.brand,
            'tax_rate': self.tax_rate,
            'tax_amount': self.tax_amount,
            'tax_exempt': self.tax_exempt,
            'confidence': self.confidence,
            'extraction_method': self.extraction_method,
            'raw_text': self.raw_text
        }
    
    def to_simple_dict(self) -> Dict[str, Any]:
        """
        Convierte el ítem a diccionario simple (solo campos principales).
        
        Returns:
            Diccionario con campos principales del ítem
        """
        return {
            'description': self.description,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'discount_amount': self.discount_amount
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ReceiptItem':
        """
        Crea un ReceiptItem desde un diccionario.
        
        Args:
            data: Diccionario con datos del ítem
            
        Returns:
            Instancia de ReceiptItem
        """
        return cls(
            description=data.get('description', ''),
            line_number=data.get('line_number'),
            quantity=data.get('quantity'),
            unit=data.get('unit'),
            unit_price=data.get('unit_price'),
            total_price=data.get('total_price'),
            original_price=data.get('original_price'),
            discount_amount=data.get('discount_amount'),
            discount_percentage=data.get('discount_percentage'),
            promotion_code=data.get('promotion_code'),
            sku=data.get('sku'),
            barcode=data.get('barcode'),
            category=data.get('category'),
            brand=data.get('brand'),
            tax_rate=data.get('tax_rate'),
            tax_amount=data.get('tax_amount'),
            tax_exempt=data.get('tax_exempt', False),
            confidence=data.get('confidence', 1.0),
            extraction_method=data.get('extraction_method', 'pattern_based'),
            raw_text=data.get('raw_text')
        )
    
    def calculate_savings(self) -> Optional[float]:
        """
        Calcula el ahorro total en este ítem.
        
        Returns:
            Monto total ahorrado o None si no hay información suficiente
        """
        if self.original_price and self.total_price:
            return self.original_price - self.total_price
        elif self.discount_amount:
            return self.discount_amount
        return None
    
    def calculate_effective_unit_price(self) -> Optional[float]:
        """
        Calcula el precio unitario efectivo después de descuentos.
        
        Returns:
            Precio unitario efectivo o None si no hay información suficiente
        """
        if self.total_price and self.quantity and self.quantity > 0:
            return self.total_price / self.quantity
        return self.unit_price
    
    def is_valid(self) -> bool:
        """
        Verifica si el ítem tiene información mínima válida.
        
        Returns:
            True si el ítem es válido
        """
        return (
            bool(self.description and self.description.strip()) and
            (self.total_price is not None or self.unit_price is not None)
        )
    
    def get_display_name(self) -> str:
        """
        Obtiene el nombre para mostrar del ítem.
        
        Returns:
            Nombre formateado para mostrar
        """
        if self.quantity and self.unit:
            return f"{self.description} ({self.quantity} {self.unit})"
        elif self.quantity:
            return f"{self.description} (x{self.quantity})"
        else:
            return self.description
    
    def merge_with(self, other: 'ReceiptItem') -> 'ReceiptItem':
        """
        Combina este ítem con otro, manteniendo la información más completa.
        
        Args:
            other: Otro ReceiptItem para combinar
            
        Returns:
            Nuevo ReceiptItem con información combinada
        """
        # Crear nuevo ítem con información combinada
        merged = ReceiptItem(
            description=self.description or other.description,
            line_number=self.line_number or other.line_number,
            quantity=self.quantity or other.quantity,
            unit=self.unit or other.unit,
            unit_price=self.unit_price or other.unit_price,
            total_price=self.total_price or other.total_price,
            original_price=self.original_price or other.original_price,
            discount_amount=self.discount_amount or other.discount_amount,
            discount_percentage=self.discount_percentage or other.discount_percentage,
            promotion_code=self.promotion_code or other.promotion_code,
            sku=self.sku or other.sku,
            barcode=self.barcode or other.barcode,
            category=self.category or other.category,
            brand=self.brand or other.brand,
            tax_rate=self.tax_rate or other.tax_rate,
            tax_amount=self.tax_amount or other.tax_amount,
            tax_exempt=self.tax_exempt or other.tax_exempt,
            confidence=max(self.confidence, other.confidence),
            extraction_method=f"{self.extraction_method}+{other.extraction_method}",
            raw_text=f"{self.raw_text or ''}\n{other.raw_text or ''}".strip()
        )
        
        return merged
