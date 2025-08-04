from typing import Optional, List, Literal, Any, Dict
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field, validator
from enum import Enum

# Función para validar ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Tipo para ObjectId compatible con Pydantic v1
PyObjectId = ObjectId

# Enum con categorías específicas de Chile
class ChileCategory(str, Enum):
    SUPERMERCADO = "Supermercado"
    COMBUSTIBLE = "Combustible"
    TRANSPORTE = "Transporte"
    RETAIL = "Retail"
    RESTAURANTE = "Restaurante"
    FARMACIA = "Farmacia"
    SERVICIOS = "Servicios"
    SALUD = "Salud"
    ENVIOS = "Envíos"
    EDUCACION = "Educación"
    OTROS = "Otros"

class ChileSpecificData(BaseModel):
    rut_detected: Optional[str] = None
    document_type: Optional[str] = None
    iva_detected: bool = False
    known_brand: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True

class CategoryPrediction(BaseModel):
    category: ChileCategory
    confidence: float
    method: str
    chile_specific: ChileSpecificData
    all_probabilities: Dict[str, float]
    
    class Config:
        arbitrary_types_allowed = True

class CategoryModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    receipt_id: PyObjectId
    user_id: PyObjectId
    category: ChileCategory
    prediction: CategoryPrediction
    
    user_corrected: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        schema_extra = {
            "example": {
                "receipt_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439022",
                "category": "Combustible",
                "prediction": {
                    "category": "Combustible",
                    "confidence": 0.92,
                    "method": "ml_prediction",
                    "chile_specific": {
                        "rut_detected": "12.345.678-9",
                        "document_type": "boleta",
                        "iva_detected": True,
                        "known_brand": "Copec"
                    },
                    "all_probabilities": {
                        "Combustible": 0.92,
                        "Transporte": 0.05,
                        "Otros": 0.03
                    }
                },
                "user_corrected": False,
                "created_at": "2023-08-28T12:34:56.789Z",
                "updated_at": "2023-08-28T12:34:56.789Z"
            }
        }

class UserCategoryFeedback(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    receipt_id: PyObjectId
    user_id: PyObjectId
    original_category: ChileCategory
    corrected_category: ChileCategory
    receipt_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        schema_extra = {
            "example": {
                "receipt_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439022",
                "original_category": "Transporte",
                "corrected_category": "Combustible",
                "receipt_text": "Texto completo del recibo para entrenamiento",
                "created_at": "2023-08-28T12:34:56.789Z"
            }
        }

class CategoryResponse(BaseModel):
    id: str
    receipt_id: str
    user_id: str
    category: str
    prediction: Dict[str, Any]
    user_corrected: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "receipt_id": "507f1f77bcf86cd799439022",
                "user_id": "507f1f77bcf86cd799439033",
                "category": "Combustible",
                "prediction": {
                    "category": "Combustible",
                    "confidence": 0.92,
                    "method": "ml_prediction",
                    "chile_specific": {
                        "rut_detected": "12.345.678-9",
                        "document_type": "boleta",
                        "iva_detected": True,
                        "known_brand": "Copec"
                    },
                    "all_probabilities": {
                        "Combustible": 0.92,
                        "Transporte": 0.05,
                        "Otros": 0.03
                    }
                },
                "user_corrected": False,
                "created_at": "2023-08-28T12:34:56.789Z",
                "updated_at": "2023-08-28T12:34:56.789Z"
            }
        }

class CategoryUpdate(BaseModel):
    category: ChileCategory

    class Config:
        schema_extra = {
            "example": {
                "category": "Combustible"
            }
        }

class CategoryStats(BaseModel):
    total_categorized: int
    categories_count: Dict[str, int]
    auto_categorized: int
    user_corrected: int

    class Config:
        schema_extra = {
            "example": {
                "total_categorized": 25,
                "categories_count": {
                    "Combustible": 10,
                    "Transporte": 5,
                    "Supermercado": 7,
                    "Otros": 3
                },
                "auto_categorized": 20,
                "user_corrected": 5
            }
        }
