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

class DetailedProductItem(BaseModel):
    """Item de producto estructurado para boletas chilenas"""
    name: str
    quantity: float = 1.0
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    barcode: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    confidence: float = 0.7
    raw_line: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "AGUA BENEDICTINO",
                "quantity": 2.0,
                "unit_price": 1000.0,
                "total_price": 2000.0,
                "barcode": "7802820454208",
                "confidence": 0.8,
                "raw_line": "2X1.000 BEN AGUA PER $ 2.000"
            }
        }

class ChileReceiptMetadata(BaseModel):
    """Metadatos específicos de recibos chilenos"""
    rut_emisor: Optional[str] = None
    folio: Optional[str] = None
    subtotal: Optional[float] = None
    iva_amount: Optional[float] = None
    iva_percentage: Optional[float] = 19.0
    currency: str = "CLP"
    
    # Datos de reconciliación
    reconciliation_needed: bool = False
    reconciliation_applied: bool = False
    items_total_calculated: Optional[float] = None
    difference: Optional[float] = None
    
    # Confianza del parsing
    parsing_confidence: Optional[float] = None
    parsing_method: str = "basic_ocr"

class OCRDataModel(BaseModel):
    vendor: Optional[str] = None
    total_amount: Optional[float] = None
    date: Optional[str] = None
    items: List[str] = []
    raw_text: str
    confidence: float
    
    # ======================================
    # CAMPOS EXPANDIDOS PARA PARSING DETALLADO
    # ======================================
    detailed_items: List[DetailedProductItem] = []
    total_items_count: int = 0
    chile_metadata: Optional[ChileReceiptMetadata] = None
    
    # Información de procesamiento
    ocr_engine_used: str = "tesseract"
    processing_time: Optional[float] = None
    language_detected: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "vendor": "SUPERMERCADO LIDER",
                "total_amount": 8360.0,
                "date": "2025-08-10",
                "items": ["2X1.000 BEN AGUA PER $ 2.000", "GALLETAS OBSE $ 1.000"],
                "raw_text": "texto completo OCR...",
                "confidence": 0.85,
                "detailed_items": [
                    {
                        "name": "AGUA BENEDICTINO",
                        "quantity": 2.0,
                        "unit_price": 1000.0,
                        "total_price": 2000.0,
                        "barcode": "7802820454208",
                        "confidence": 0.8
                    }
                ],
                "total_items_count": 7,
                "chile_metadata": {
                    "rut_emisor": "96.790.240-3",
                    "folio": "002426936168",
                    "subtotal": 7025.0,
                    "iva_amount": 1335.0,
                    "parsing_confidence": 0.9
                }
            }
        }

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
    category: Optional[str] = None
    # Campos adicionales para productos y análisis detallado
    products: Optional[List[DetailedProductItem]] = None
    analysisData: Optional[Dict[str, Any]] = None
    
    @validator('products', pre=True)
    def validate_products(cls, v):
        print(f"🔍 PYDANTIC VALIDATOR - Raw products received: {v}")
        print(f"🔍 PYDANTIC VALIDATOR - Products type: {type(v)}")
        if v is None:
            return []
        if isinstance(v, list):
            print(f"🔍 PYDANTIC VALIDATOR - Products count: {len(v)}")
            for i, product in enumerate(v):
                print(f"🔍 PYDANTIC VALIDATOR - Product {i}: {product}")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "companyName": "Empresa ABC",
                "folioNumber": "F001-123456",
                "date": "2023-08-28T12:34:56.789Z",
                "description": "Gastos de transporte",
                "totalAmount": 150.50,
                "category": "Transporte",
                "products": [],
                "analysisData": {}
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
                    "confidence": 0.85,
                    "detailed_items": [
                        {
                            "name": "PRODUCTO EJEMPLO",
                            "quantity": 1.0,
                            "total_price": 150.50,
                            "confidence": 0.8
                        }
                    ]
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
