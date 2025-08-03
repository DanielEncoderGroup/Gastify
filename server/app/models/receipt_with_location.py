"""
Modelo extendido de recibos con información de geolocalización
============================================================

Este módulo extiende el modelo de recibos existente para incluir
información de ubicación geográfica y metadatos relacionados.
"""

from typing import Optional, Literal, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field

from .receipt import ReceiptModel, OCRDataModel, PyObjectId
from .location_models import Location, LocationType, LocationSource


class LocationDataModel(BaseModel):
    """Datos de ubicación para recibos"""
    location: Optional[Dict[str, Any]] = None  # Ubicación serializada
    extraction_method: Optional[str] = None  # Método de extracción
    confidence: float = 0.0  # Confianza en la ubicación
    extracted_address: Optional[str] = None  # Dirección extraída del OCR
    matched_brand: Optional[str] = None  # Marca asociada
    geocoding_provider: Optional[str] = None  # Proveedor de geocodificación
    processing_time_ms: float = 0.0  # Tiempo de procesamiento
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "location": {
                    "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
                    "address": {"street": "Av. Providencia 1234", "city": "Santiago"},
                    "metadata": {"place_name": "Jumbo Providencia"}
                },
                "extraction_method": "brand_matched",
                "confidence": 0.9,
                "extracted_address": "Av. Providencia 1234, Santiago",
                "matched_brand": "Jumbo",
                "geocoding_provider": "google_maps",
                "processing_time_ms": 150.5
            }
        }
    }


class EnhancedOCRDataModel(OCRDataModel):
    """OCR Data extendido con información de ubicación"""
    extracted_addresses: List[str] = Field(default_factory=list)  # Direcciones encontradas
    detected_brands: List[str] = Field(default_factory=list)  # Marcas detectadas
    location_keywords: List[str] = Field(default_factory=list)  # Palabras clave de ubicación
    phone_numbers: List[str] = Field(default_factory=list)  # Números de teléfono
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "vendor": "Jumbo",
                "total_amount": 25000.0,
                "date": "2024-08-03",
                "items": ["Pan", "Leche", "Huevos"],
                "raw_text": "JUMBO PROVIDENCIA\nAv. Providencia 1234...",
                "confidence": 0.85,
                "extracted_addresses": ["Av. Providencia 1234, Santiago"],
                "detected_brands": ["Jumbo"],
                "location_keywords": ["providencia", "santiago"],
                "phone_numbers": ["+56 2 2234 5678"]
            }
        }
    }


class ReceiptWithLocationModel(ReceiptModel):
    """Modelo de recibo extendido con información de ubicación"""
    locationData: Optional[LocationDataModel] = None  # Datos de ubicación
    ocrData: Optional[EnhancedOCRDataModel] = None  # OCR extendido
    category: Optional[str] = None  # Categoría automática
    categoryConfidence: Optional[float] = None  # Confianza en categorización
    tags: List[str] = Field(default_factory=list)  # Etiquetas adicionales
    
    # Campos calculados para análisis geográfico
    isBusinessTrip: bool = False  # Si es viaje de negocios
    distanceFromHome: Optional[float] = None  # Distancia desde casa (km)
    locationCluster: Optional[str] = None  # Cluster de ubicación
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        },
        "json_schema_extra": {
            "example": {
                "user": "507f1f77bcf86cd799439011",
                "companyName": "Jumbo",
                "folioNumber": "B001-123456",
                "date": "2024-08-03T14:30:00Z",
                "description": "Compra supermercado",
                "totalAmount": 25000.0,
                "imageUrl": "/uploads/receipt-123456.jpg",
                "status": "aceptada",
                "category": "Supermercado",
                "categoryConfidence": 0.95,
                "locationData": {
                    "location": {
                        "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
                        "address": {"street": "Av. Providencia 1234", "city": "Santiago"}
                    },
                    "extraction_method": "brand_matched",
                    "confidence": 0.9
                },
                "isBusinessTrip": False,
                "distanceFromHome": 5.2,
                "tags": ["supermercado", "alimentacion"]
            }
        }
    }


class LocationAnalyticsModel(BaseModel):
    """Modelo para análisis de ubicaciones"""
    location_id: str
    location_name: str
    coordinates: Dict[str, float]  # lat, lng
    total_spent: float
    visit_count: int
    avg_expense: float
    categories: Dict[str, float]  # categoría -> monto total
    first_visit: datetime
    last_visit: datetime
    visit_frequency: float  # visitas por mes
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "location_id": "loc_123456",
                "location_name": "Jumbo Providencia",
                "coordinates": {"lat": -33.4489, "lng": -70.6693},
                "total_spent": 150000.0,
                "visit_count": 12,
                "avg_expense": 12500.0,
                "categories": {
                    "Supermercado": 120000.0,
                    "Farmacia": 30000.0
                },
                "first_visit": "2024-01-15T10:30:00Z",
                "last_visit": "2024-08-03T14:30:00Z",
                "visit_frequency": 2.4
            }
        }
    }


class HeatmapDataModel(BaseModel):
    """Modelo para datos de mapa de calor"""
    points: List[Dict[str, Any]]  # Puntos del mapa de calor
    bounds: Dict[str, float]  # Límites del mapa (north, south, east, west)
    total_amount: float  # Monto total representado
    date_range: Dict[str, datetime]  # Rango de fechas
    categories: List[str]  # Categorías incluidas
    
    model_config = {
        "json_encoders": {
            datetime: lambda dt: dt.isoformat()
        },
        "json_schema_extra": {
            "example": {
                "points": [
                    {"lat": -33.4489, "lng": -70.6693, "intensity": 0.8, "value": 25000.0},
                    {"lat": -33.4520, "lng": -70.6650, "intensity": 0.6, "value": 15000.0}
                ],
                "bounds": {
                    "north": -33.4400,
                    "south": -33.4600,
                    "east": -70.6600,
                    "west": -70.6800
                },
                "total_amount": 40000.0,
                "date_range": {
                    "start": "2024-07-01T00:00:00Z",
                    "end": "2024-08-03T23:59:59Z"
                },
                "categories": ["Supermercado", "Restaurante"]
            }
        }
    }


class BusinessTripModel(BaseModel):
    """Modelo para detección de viajes de negocios"""
    trip_id: str
    user_id: str
    start_date: datetime
    end_date: datetime
    origin_location: Dict[str, Any]  # Ubicación de origen
    destinations: List[Dict[str, Any]]  # Destinos visitados
    total_expenses: float
    expense_count: int
    categories: Dict[str, float]
    is_confirmed: bool = False  # Si fue confirmado por el usuario
    confidence: float = 0.0  # Confianza en la detección automática
    
    model_config = {
        "json_encoders": {
            datetime: lambda dt: dt.isoformat()
        },
        "json_schema_extra": {
            "example": {
                "trip_id": "trip_123456",
                "user_id": "507f1f77bcf86cd799439011",
                "start_date": "2024-08-01T08:00:00Z",
                "end_date": "2024-08-03T18:00:00Z",
                "origin_location": {
                    "name": "Santiago",
                    "coordinates": {"lat": -33.4489, "lng": -70.6693}
                },
                "destinations": [
                    {
                        "name": "Valparaíso",
                        "coordinates": {"lat": -33.0458, "lng": -71.6197},
                        "expenses": 45000.0
                    }
                ],
                "total_expenses": 75000.0,
                "expense_count": 8,
                "categories": {
                    "Transporte": 30000.0,
                    "Alimentación": 25000.0,
                    "Hospedaje": 20000.0
                },
                "is_confirmed": False,
                "confidence": 0.85
            }
        }
    }


# Modelos para respuestas de API
class LocationStatsResponse(BaseModel):
    """Respuesta con estadísticas de ubicación"""
    total_locations: int
    top_locations: List[LocationAnalyticsModel]
    total_spent: float
    avg_distance_from_home: float
    most_frequent_category: str
    business_trip_percentage: float
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_locations": 25,
                "top_locations": [],  # Lista de LocationAnalyticsModel
                "total_spent": 500000.0,
                "avg_distance_from_home": 8.5,
                "most_frequent_category": "Supermercado",
                "business_trip_percentage": 15.2
            }
        }
    }


class GeocodingResponse(BaseModel):
    """Respuesta de geocodificación"""
    success: bool
    location: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    provider: Optional[str] = None
    cache_hit: bool = False
    processing_time_ms: float = 0.0
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "location": {
                    "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
                    "address": {"street": "Av. Providencia 1234", "city": "Santiago"}
                },
                "provider": "google_maps",
                "cache_hit": False,
                "processing_time_ms": 245.7
            }
        }
    }
