from typing import Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field, validator

# Función para validar ObjectId (reutilizada de receipt.py)
def validate_object_id(v):
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Tipo para ObjectId en Pydantic v1
PyObjectId = str | ObjectId

class ReceiptProductModel(BaseModel):
    """Modelo para productos individuales extraídos de recibos"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    receipt_id: PyObjectId  # Referencia al recibo padre
    user_id: PyObjectId     # Usuario propietario (para consultas rápidas)
    
    # Datos del producto extraído por OCR
    name: str
    barcode: Optional[str] = None
    sku: Optional[str] = None
    quantity: float = 1.0
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    category: Optional[str] = None
    
    # Metadatos de extracción
    confidence: float = 0.0
    raw_line: Optional[str] = None  # Línea original del OCR
    extraction_method: str = "advanced_parser"  # advanced_parser, manual_entry, corrected
    
    # Auditoría
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Validadores para ObjectId
    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return None
        return validate_object_id(v)
    
    @validator('receipt_id', pre=True, always=True) 
    def validate_receipt_id(cls, v):
        return validate_object_id(v)
        
    @validator('user_id', pre=True, always=True)
    def validate_user_id(cls, v):
        return validate_object_id(v)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        schema_extra = {
            "example": {
                "receipt_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439022", 
                "name": "AGUA BENEDICTINO 600ML",
                "barcode": "7802820454208",
                "quantity": 2.0,
                "unit_price": 1000.0,
                "total_price": 2000.0,
                "confidence": 0.85,
                "raw_line": "2X1.000 BEN AGUA PER $ 2.000"
            }
        }

class ReceiptProductResponse(BaseModel):
    """Respuesta de productos para APIs"""
    id: str
    receipt_id: str
    name: str
    barcode: Optional[str]
    quantity: float
    unit_price: Optional[float] 
    total_price: Optional[float]
    confidence: float
    extraction_method: str
    created_at: datetime
    
class ReceiptProductsStats(BaseModel):
    """Estadísticas de productos por recibo"""
    total_products: int
    total_value: float
    average_confidence: float
    extraction_methods: dict  # {"advanced_parser": 5, "manual_entry": 2}
    categories_found: list
