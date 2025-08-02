"""
Modelo de datos para recibo completo.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .receipt_item import ReceiptItem


@dataclass
class MerchantInfo:
    """Información del comerciante/proveedor."""
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None  # RUT, NIT, etc.
    business_registration: Optional[str] = None


@dataclass
class PaymentInfo:
    """Información de pago."""
    method: Optional[str] = None  # efectivo, tarjeta, transferencia
    card_type: Optional[str] = None  # visa, mastercard, etc.
    card_last_digits: Optional[str] = None
    authorization_code: Optional[str] = None
    reference_number: Optional[str] = None


@dataclass
class TaxInfo:
    """Información de impuestos."""
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_exempt_amount: Optional[float] = None
    tax_type: Optional[str] = None  # IVA, GST, VAT, etc.


@dataclass
class ReceiptData:
    """
    Modelo de datos completo para un recibo.
    
    Contiene toda la información extraíble de un recibo incluyendo
    metadatos, ítems detallados, información del comerciante, etc.
    """
    
    # Información básica del recibo
    receipt_number: Optional[str] = None
    date: Optional[str] = None  # Formato ISO: YYYY-MM-DD
    time: Optional[str] = None  # Formato: HH:MM:SS
    
    # Información del comerciante
    merchant_info: MerchantInfo = field(default_factory=MerchantInfo)
    
    # Ítems del recibo
    items: List[str] = field(default_factory=list)  # Compatibilidad hacia atrás
    detailed_items: List[ReceiptItem] = field(default_factory=list)
    
    # Información financiera
    subtotal: Optional[float] = None
    tax_info: TaxInfo = field(default_factory=TaxInfo)
    discount_amount: Optional[float] = None
    tip_amount: Optional[float] = None
    total_amount: Optional[float] = None
    
    # Información de pago
    payment_info: PaymentInfo = field(default_factory=PaymentInfo)
    
    # Metadatos de procesamiento
    raw_text: str = ""
    language_detected: str = "unknown"
    confidence: float = 0.0
    processing_metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convierte el recibo a diccionario.
        
        Returns:
            Diccionario con todos los datos del recibo
        """
        return {
            'receipt_number': self.receipt_number,
            'date': self.date,
            'time': self.time,
            'merchant_info': {
                'name': self.merchant_info.name,
                'address': self.merchant_info.address,
                'phone': self.merchant_info.phone,
                'email': self.merchant_info.email,
                'website': self.merchant_info.website,
                'tax_id': self.merchant_info.tax_id,
                'business_registration': self.merchant_info.business_registration
            },
            'items': self.items,
            'detailed_items': [item.to_dict() for item in self.detailed_items],
            'subtotal': self.subtotal,
            'tax_info': {
                'tax_rate': self.tax_info.tax_rate,
                'tax_amount': self.tax_info.tax_amount,
                'tax_exempt_amount': self.tax_info.tax_exempt_amount,
                'tax_type': self.tax_info.tax_type
            },
            'discount_amount': self.discount_amount,
            'tip_amount': self.tip_amount,
            'total_amount': self.total_amount,
            'payment_info': {
                'method': self.payment_info.method,
                'card_type': self.payment_info.card_type,
                'card_last_digits': self.payment_info.card_last_digits,
                'authorization_code': self.payment_info.authorization_code,
                'reference_number': self.payment_info.reference_number
            },
            'raw_text': self.raw_text,
            'language_detected': self.language_detected,
            'confidence': self.confidence,
            'processing_metadata': self.processing_metadata
        }
    
    def to_simple_dict(self) -> Dict[str, Any]:
        """
        Convierte el recibo a diccionario simple (compatibilidad hacia atrás).
        
        Returns:
            Diccionario con campos principales para compatibilidad
        """
        return {
            'vendor': self.merchant_info.name or '',
            'total_amount': self.total_amount,
            'date': self.date,
            'items': self.items,
            'raw_text': self.raw_text,
            'confidence': self.confidence,
            # Campos adicionales
            'receipt_number': self.receipt_number,
            'subtotal': self.subtotal,
            'tax_amount': self.tax_info.tax_amount,
            'discount_amount': self.discount_amount,
            'payment_method': self.payment_info.method,
            'detailed_items': [item.to_simple_dict() for item in self.detailed_items],
            'merchant_info': {
                'name': self.merchant_info.name,
                'address': self.merchant_info.address,
                'tax_id': self.merchant_info.tax_id
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ReceiptData':
        """
        Crea un ReceiptData desde un diccionario.
        
        Args:
            data: Diccionario con datos del recibo
            
        Returns:
            Instancia de ReceiptData
        """
        # Crear información del comerciante
        merchant_data = data.get('merchant_info', {})
        merchant_info = MerchantInfo(
            name=merchant_data.get('name'),
            address=merchant_data.get('address'),
            phone=merchant_data.get('phone'),
            email=merchant_data.get('email'),
            website=merchant_data.get('website'),
            tax_id=merchant_data.get('tax_id'),
            business_registration=merchant_data.get('business_registration')
        )
        
        # Crear información de impuestos
        tax_data = data.get('tax_info', {})
        tax_info = TaxInfo(
            tax_rate=tax_data.get('tax_rate'),
            tax_amount=tax_data.get('tax_amount'),
            tax_exempt_amount=tax_data.get('tax_exempt_amount'),
            tax_type=tax_data.get('tax_type')
        )
        
        # Crear información de pago
        payment_data = data.get('payment_info', {})
        payment_info = PaymentInfo(
            method=payment_data.get('method'),
            card_type=payment_data.get('card_type'),
            card_last_digits=payment_data.get('card_last_digits'),
            authorization_code=payment_data.get('authorization_code'),
            reference_number=payment_data.get('reference_number')
        )
        
        # Crear ítems detallados
        detailed_items = []
        for item_data in data.get('detailed_items', []):
            detailed_items.append(ReceiptItem.from_dict(item_data))
        
        return cls(
            receipt_number=data.get('receipt_number'),
            date=data.get('date'),
            time=data.get('time'),
            merchant_info=merchant_info,
            items=data.get('items', []),
            detailed_items=detailed_items,
            subtotal=data.get('subtotal'),
            tax_info=tax_info,
            discount_amount=data.get('discount_amount'),
            tip_amount=data.get('tip_amount'),
            total_amount=data.get('total_amount'),
            payment_info=payment_info,
            raw_text=data.get('raw_text', ''),
            language_detected=data.get('language_detected', 'unknown'),
            confidence=data.get('confidence', 0.0),
            processing_metadata=data.get('processing_metadata', {})
        )
    
    def add_item(self, item: ReceiptItem):
        """
        Añade un ítem al recibo.
        
        Args:
            item: ReceiptItem a añadir
        """
        if item.is_valid():
            self.detailed_items.append(item)
            # Mantener compatibilidad con lista simple
            if item.description:
                self.items.append(item.description)
    
    def calculate_totals(self):
        """
        Calcula totales basado en los ítems detallados.
        Útil para validar o recalcular totales.
        """
        if not self.detailed_items:
            return
        
        # Calcular subtotal desde ítems
        calculated_subtotal = sum(
            item.total_price for item in self.detailed_items 
            if item.total_price is not None
        )
        
        if calculated_subtotal > 0:
            if self.subtotal is None:
                self.subtotal = calculated_subtotal
        
        # Calcular total si no existe
        if self.total_amount is None:
            total = calculated_subtotal
            if self.tax_info.tax_amount:
                total += self.tax_info.tax_amount
            if self.tip_amount:
                total += self.tip_amount
            if self.discount_amount:
                total -= self.discount_amount
            
            if total > 0:
                self.total_amount = total
    
    def get_item_count(self) -> int:
        """
        Obtiene el número total de ítems.
        
        Returns:
            Número de ítems en el recibo
        """
        return len(self.detailed_items)
    
    def get_total_savings(self) -> float:
        """
        Calcula el ahorro total en el recibo.
        
        Returns:
            Monto total ahorrado
        """
        item_savings = sum(
            item.calculate_savings() or 0 
            for item in self.detailed_items
        )
        
        receipt_discount = self.discount_amount or 0
        
        return item_savings + receipt_discount
    
    def validate(self) -> List[str]:
        """
        Valida la consistencia de los datos del recibo.
        
        Returns:
            Lista de errores de validación encontrados
        """
        errors = []
        
        # Validar que hay información básica
        if not self.merchant_info.name and not self.total_amount:
            errors.append("Recibo sin información básica (comerciante o total)")
        
        # Validar fechas
        if self.date:
            try:
                datetime.fromisoformat(self.date)
            except ValueError:
                errors.append(f"Fecha inválida: {self.date}")
        
        # Validar totales
        if self.total_amount is not None and self.total_amount < 0:
            errors.append("Total no puede ser negativo")
        
        if self.subtotal is not None and self.total_amount is not None:
            if self.subtotal > self.total_amount:
                errors.append("Subtotal no puede ser mayor que el total")
        
        # Validar ítems
        for i, item in enumerate(self.detailed_items):
            if not item.is_valid():
                errors.append(f"Ítem {i+1} no es válido")
        
        return errors
    
    def is_valid(self) -> bool:
        """
        Verifica si el recibo tiene información mínima válida.
        
        Returns:
            True si el recibo es válido
        """
        return len(self.validate()) == 0
