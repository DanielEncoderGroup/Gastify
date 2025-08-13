from typing import Optional, Literal, Any, List, Dict, Union
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field, validator

# Función para validar ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Tipo para ObjectId en Pydantic v1
PyObjectId = Union[str, ObjectId]

class OCRDataModel(BaseModel):
    vendor: Optional[str] = None
    total_amount: Optional[float] = None
    date: Optional[str] = None
    items: List[str] = []
    raw_text: str
    confidence: float

class ReceiptModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user: PyObjectId
    companyName: str
    folioNumber: str
    date: datetime
    description: str
    totalAmount: float
    imageUrl: Optional[str] = None
    status: Literal["en_revision", "aceptada", "rechazada"] = "en_revision"
    ocrData: Optional[OCRDataModel] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    # Validadores para ObjectId en Pydantic v1
    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return None
        return validate_object_id(v)
        
    @validator('user', pre=True, always=True)
    def validate_user(cls, v):
        return validate_object_id(v)

    # Configurar serialización de ObjectId
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        schema_extra = {
            "example": {
                "user": "507f1f77bcf86cd799439011",
                "companyName": "Empresa ABC",
                "folioNumber": "F001-123456",
                "date": "2023-08-28T12:34:56.789Z",
                "description": "Gastos de transporte",
                "totalAmount": 150.50,
                "status": "en_revision"
            }
        }

class ReceiptCreate(BaseModel):
    companyName: str
    folioNumber: str
    date: datetime
    description: str
    totalAmount: float
    
    class Config:
        schema_extra = {
            "example": {
                "companyName": "Empresa ABC",
                "folioNumber": "F001-123456",
                "date": "2023-08-28T12:34:56.789Z",
                "description": "Gastos de transporte",
                "totalAmount": 150.50
            }
        }

class ReceiptUpdate(BaseModel):
    companyName: Optional[str] = None
    folioNumber: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    totalAmount: Optional[float] = None
    
    class Config:
        schema_extra = {
            "example": {
                "companyName": "Empresa XYZ",
                "totalAmount": 175.25
            }
        }
        
class ReceiptStatusUpdate(BaseModel):
    status: Literal["en_revision", "aceptada", "rechazada"]
    
    class Config:
        schema_extra = {
            "example": {
                "status": "aceptada"
            }
        }

class ReceiptResponse(BaseModel):
    id: str
    user: str
    companyName: str
    folioNumber: str
    date: datetime
    description: str
    totalAmount: float
    imageUrl: Optional[str] = None
    status: str
    ocrData: Optional[OCRDataModel] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user": "507f1f77bcf86cd799439022",
                "companyName": "Empresa ABC",
                "folioNumber": "F001-123456",
                "date": "2023-08-28T12:34:56.789Z",
                "description": "Gastos de transporte",
                "totalAmount": 150.50,
                "imageUrl": "/uploads/receipt-123456.jpg",
                "status": "en_revision",
                "ocrData": {
                    "vendor": "Empresa ABC",
                    "total_amount": 150.50,
                    "date": "2023-08-28",
                    "items": ["Item 1", "Item 2"],
                    "raw_text": "texto completo extraído",
                    "confidence": 0.85
                },
                "createdAt": "2023-08-28T12:34:56.789Z",
                "updatedAt": "2023-08-28T12:34:56.789Z"
            }
        }

class ReceiptStats(BaseModel):
    totalReceipts: int
    enRevision: int
    aceptadas: int
    rechazadas: int
    totalAmount: float

    class Config:
        schema_extra = {
            "example": {
                "totalReceipts": 10,
                "enRevision": 3,
                "aceptadas": 5,
                "rechazadas": 2,
                "totalAmount": 750.25
            }
        }

# ======================================
# MODELOS PARA SISTEMA OCR HÍBRIDO
# ======================================

class CategoryPrediction(BaseModel):
    """Predicción de categoría ML para recibos"""
    category: str
    confidence: float
    subcategory: Optional[str] = None
    vendor_detected: Optional[str] = None
    method: str = "ml_prediction"  # ml_prediction, vendor_match, keyword_match

class ChileSpecificData(BaseModel):
    """Datos específicos de recibos chilenos"""
    rut: Optional[str] = None
    iva: Optional[float] = None
    folio: Optional[str] = None
    vendor_type: Optional[str] = None
    tax_percentage: Optional[float] = None
    currency: str = "CLP"

class LocationDataModel(BaseModel):
    """Datos de geolocalización para recibos"""
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: Optional[float] = None