"""
Modelos de datos para geolocalización de gastos en Gastify
=========================================================

Este módulo define los modelos de datos para manejar información geográfica
asociada a recibos y gastos, incluyendo coordenadas, direcciones y metadatos.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
import json


class LocationType(Enum):
    """Tipos de ubicación para clasificación"""
    STORE = "store"  # Tienda física
    RESTAURANT = "restaurant"  # Restaurante
    GAS_STATION = "gas_station"  # Estación de servicio
    PHARMACY = "pharmacy"  # Farmacia
    MALL = "mall"  # Centro comercial
    OFFICE = "office"  # Oficina
    AIRPORT = "airport"  # Aeropuerto
    HOTEL = "hotel"  # Hotel
    ONLINE = "online"  # Compra online
    OTHER = "other"  # Otro tipo


class LocationSource(Enum):
    """Fuente de la información de ubicación"""
    MANUAL = "manual"  # Ingresado manualmente
    OCR_EXTRACTED = "ocr_extracted"  # Extraído del OCR
    BRAND_MATCHED = "brand_matched"  # Asociado por marca conocida
    GPS = "gps"  # Coordenadas GPS del dispositivo
    GEOCODED = "geocoded"  # Geocodificado desde dirección
    CACHED = "cached"  # Obtenido del caché


@dataclass
class Coordinates:
    """Coordenadas geográficas"""
    latitude: float
    longitude: float
    accuracy: Optional[float] = None  # Precisión en metros
    altitude: Optional[float] = None  # Altitud en metros
    
    def __post_init__(self):
        """Validar coordenadas"""
        if not (-90 <= self.latitude <= 90):
            raise ValueError(f"Latitud inválida: {self.latitude}")
        if not (-180 <= self.longitude <= 180):
            raise ValueError(f"Longitud inválida: {self.longitude}")
    
    def distance_to(self, other: 'Coordinates') -> float:
        """Calcular distancia a otra coordenada usando fórmula de Haversine"""
        import math
        
        # Convertir a radianes
        lat1, lon1 = math.radians(self.latitude), math.radians(self.longitude)
        lat2, lon2 = math.radians(other.latitude), math.radians(other.longitude)
        
        # Diferencias
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        # Fórmula de Haversine
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radio de la Tierra en kilómetros
        r = 6371
        
        return c * r
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "accuracy": self.accuracy,
            "altitude": self.altitude
        }


@dataclass
class Address:
    """Dirección postal estructurada"""
    street: Optional[str] = None  # Calle y número
    city: Optional[str] = None  # Ciudad
    state: Optional[str] = None  # Estado/Región
    postal_code: Optional[str] = None  # Código postal
    country: Optional[str] = None  # País
    formatted_address: Optional[str] = None  # Dirección formateada completa
    
    def is_complete(self) -> bool:
        """Verificar si la dirección está completa"""
        return all([self.street, self.city, self.country])
    
    def to_search_string(self) -> str:
        """Convertir a string para búsqueda en geocodificación"""
        parts = []
        if self.street:
            parts.append(self.street)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.country:
            parts.append(self.country)
        
        return ", ".join(parts)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "street": self.street,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "country": self.country,
            "formatted_address": self.formatted_address
        }


@dataclass
class LocationMetadata:
    """Metadatos adicionales de ubicación"""
    place_id: Optional[str] = None  # ID del lugar en servicio de mapas
    place_name: Optional[str] = None  # Nombre del lugar
    business_hours: Optional[Dict[str, str]] = None  # Horarios de atención
    phone: Optional[str] = None  # Teléfono
    website: Optional[str] = None  # Sitio web
    rating: Optional[float] = None  # Calificación (1-5)
    price_level: Optional[int] = None  # Nivel de precios (1-4)
    categories: List[str] = field(default_factory=list)  # Categorías del lugar
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "place_id": self.place_id,
            "place_name": self.place_name,
            "business_hours": self.business_hours,
            "phone": self.phone,
            "website": self.website,
            "rating": self.rating,
            "price_level": self.price_level,
            "categories": self.categories
        }


@dataclass
class Location:
    """Ubicación completa con coordenadas, dirección y metadatos"""
    id: Optional[str] = None  # ID único de la ubicación
    coordinates: Optional[Coordinates] = None  # Coordenadas GPS
    address: Optional[Address] = None  # Dirección postal
    metadata: Optional[LocationMetadata] = None  # Metadatos adicionales
    location_type: LocationType = LocationType.OTHER  # Tipo de ubicación
    source: LocationSource = LocationSource.MANUAL  # Fuente de la información
    confidence: float = 1.0  # Confianza en la ubicación (0-1)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        """Validaciones post-inicialización"""
        if not (0 <= self.confidence <= 1):
            raise ValueError(f"Confianza debe estar entre 0 y 1: {self.confidence}")
        
        if not self.coordinates and not self.address:
            raise ValueError("Debe tener al menos coordenadas o dirección")
    
    def has_coordinates(self) -> bool:
        """Verificar si tiene coordenadas"""
        return self.coordinates is not None
    
    def has_address(self) -> bool:
        """Verificar si tiene dirección"""
        return self.address is not None and self.address.is_complete()
    
    def get_display_name(self) -> str:
        """Obtener nombre para mostrar"""
        if self.metadata and self.metadata.place_name:
            return self.metadata.place_name
        elif self.address and self.address.formatted_address:
            return self.address.formatted_address
        elif self.address and self.address.street:
            return f"{self.address.street}, {self.address.city or 'Ciudad'}"
        elif self.coordinates:
            return f"({self.coordinates.latitude:.4f}, {self.coordinates.longitude:.4f})"
        else:
            return "Ubicación desconocida"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario para serialización"""
        return {
            "id": self.id,
            "coordinates": self.coordinates.to_dict() if self.coordinates else None,
            "address": self.address.to_dict() if self.address else None,
            "metadata": self.metadata.to_dict() if self.metadata else None,
            "location_type": self.location_type.value,
            "source": self.source.value,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Location':
        """Crear desde diccionario"""
        # Preparar coordenadas
        coordinates = None
        if data.get("coordinates"):
            coord_data = data["coordinates"]
            coordinates = Coordinates(
                latitude=coord_data["latitude"],
                longitude=coord_data["longitude"],
                accuracy=coord_data.get("accuracy"),
                altitude=coord_data.get("altitude")
            )
        
        # Preparar dirección
        address = None
        if data.get("address"):
            addr_data = data["address"]
            address = Address(
                street=addr_data.get("street"),
                city=addr_data.get("city"),
                state=addr_data.get("state"),
                postal_code=addr_data.get("postal_code"),
                country=addr_data.get("country"),
                formatted_address=addr_data.get("formatted_address")
            )
        
        # Preparar metadata
        metadata = None
        if data.get("metadata"):
            meta_data = data["metadata"]
            metadata = LocationMetadata(
                place_id=meta_data.get("place_id"),
                place_name=meta_data.get("place_name"),
                business_hours=meta_data.get("business_hours"),
                phone=meta_data.get("phone"),
                website=meta_data.get("website"),
                rating=meta_data.get("rating"),
                price_level=meta_data.get("price_level"),
                categories=meta_data.get("categories", [])
            )
        
        # Preparar fechas
        created_at = datetime.utcnow()
        updated_at = datetime.utcnow()
        if data.get("created_at"):
            created_at = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            updated_at = datetime.fromisoformat(data["updated_at"])
        
        # Crear instancia con todos los valores
        location = cls(
            id=data.get("id"),
            coordinates=coordinates,
            address=address,
            metadata=metadata,
            location_type=LocationType(data.get("location_type", "other")),
            source=LocationSource(data.get("source", "manual")),
            confidence=data.get("confidence", 1.0),
            created_at=created_at,
            updated_at=updated_at
        )
        
        return location


@dataclass
class LocationCache:
    """Caché de ubicaciones para optimizar consultas"""
    key: str  # Clave de búsqueda (dirección, marca, etc.)
    location: Location  # Ubicación asociada
    hits: int = 0  # Número de veces utilizada
    last_used: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None  # Fecha de expiración
    
    def is_expired(self) -> bool:
        """Verificar si el caché ha expirado"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def increment_hits(self):
        """Incrementar contador de uso"""
        self.hits += 1
        self.last_used = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "key": self.key,
            "location": self.location.to_dict(),
            "hits": self.hits,
            "last_used": self.last_used.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }


@dataclass
class GeocodingResult:
    """Resultado de geocodificación"""
    success: bool
    location: Optional[Location] = None
    error_message: Optional[str] = None
    api_calls_used: int = 0  # Número de llamadas API utilizadas
    cache_hit: bool = False  # Si se obtuvo del caché
    processing_time_ms: float = 0.0  # Tiempo de procesamiento
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "success": self.success,
            "location": self.location.to_dict() if self.location else None,
            "error_message": self.error_message,
            "api_calls_used": self.api_calls_used,
            "cache_hit": self.cache_hit,
            "processing_time_ms": self.processing_time_ms
        }


# Tipos de datos para análisis geográfico
@dataclass
class LocationStats:
    """Estadísticas de ubicación"""
    location: Location
    total_expenses: float = 0.0  # Total gastado en esta ubicación
    expense_count: int = 0  # Número de gastos
    avg_expense: float = 0.0  # Gasto promedio
    categories: Dict[str, float] = field(default_factory=dict)  # Gastos por categoría
    first_visit: Optional[datetime] = None  # Primera visita
    last_visit: Optional[datetime] = None  # Última visita
    visit_frequency: float = 0.0  # Frecuencia de visitas (visitas/mes)
    
    def calculate_averages(self):
        """Calcular promedios"""
        if self.expense_count > 0:
            self.avg_expense = self.total_expenses / self.expense_count
        
        if self.first_visit and self.last_visit:
            days_diff = (self.last_visit - self.first_visit).days
            if days_diff > 0:
                self.visit_frequency = (self.expense_count / days_diff) * 30  # visitas por mes
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "location": self.location.to_dict(),
            "total_expenses": self.total_expenses,
            "expense_count": self.expense_count,
            "avg_expense": self.avg_expense,
            "categories": self.categories,
            "first_visit": self.first_visit.isoformat() if self.first_visit else None,
            "last_visit": self.last_visit.isoformat() if self.last_visit else None,
            "visit_frequency": self.visit_frequency
        }


@dataclass
class HeatmapPoint:
    """Punto para mapa de calor"""
    coordinates: Coordinates
    intensity: float  # Intensidad del punto (0-1)
    value: float  # Valor asociado (monto gastado)
    count: int  # Número de transacciones
    radius: float = 50.0  # Radio de influencia en metros
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "lat": self.coordinates.latitude,
            "lng": self.coordinates.longitude,
            "intensity": self.intensity,
            "value": self.value,
            "count": self.count,
            "radius": self.radius
        }
