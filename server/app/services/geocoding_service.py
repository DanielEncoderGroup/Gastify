"""
Servicio de Geocodificación para Gastify
========================================

Este servicio maneja la geocodificación de direcciones usando múltiples proveedores
(Google Maps, OpenStreetMap) con caché local para optimizar rendimiento y costos.
"""

import os
import json
import time
import hashlib
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from abc import ABC, abstractmethod
import logging

from ..models.location_models import (
    Location, Coordinates, Address, LocationMetadata,
    LocationType, LocationSource, GeocodingResult, LocationCache
)

# Configurar logging
logger = logging.getLogger(__name__)


class BaseGeocodingProvider(ABC):
    """Clase base abstracta para proveedores de geocodificación"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.name = self.__class__.__name__.replace("Provider", "").lower()
    
    @abstractmethod
    async def geocode_address(self, address: str) -> Optional[Location]:
        """Geocodificar una dirección"""
        pass
    
    @abstractmethod
    async def reverse_geocode(self, lat: float, lng: float) -> Optional[Location]:
        """Geocodificación inversa desde coordenadas"""
        pass
    
    @abstractmethod
    def get_rate_limit(self) -> Dict[str, int]:
        """Obtener límites de tasa del proveedor"""
        pass


class GoogleMapsProvider(BaseGeocodingProvider):
    """Proveedor de geocodificación usando Google Maps API"""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        self.places_url = "https://maps.googleapis.com/maps/api/place"
    
    async def geocode_address(self, address: str) -> Optional[Location]:
        """Geocodificar dirección usando Google Maps"""
        try:
            params = {
                "address": address,
                "key": self.api_key,
                "region": "cl",  # Priorizar resultados de Chile
                "language": "es"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Google Maps API error: {response.status}")
                        return None
                    
                    data = await response.json()
                    
                    if data["status"] != "OK" or not data.get("results"):
                        logger.warning(f"No results for address: {address}")
                        return None
                    
                    result = data["results"][0]
                    return self._parse_google_result(result)
        
        except Exception as e:
            logger.error(f"Error geocoding with Google Maps: {e}")
            return None
    
    async def reverse_geocode(self, lat: float, lng: float) -> Optional[Location]:
        """Geocodificación inversa usando Google Maps"""
        try:
            params = {
                "latlng": f"{lat},{lng}",
                "key": self.api_key,
                "language": "es"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status != 200:
                        return None
                    
                    data = await response.json()
                    
                    if data["status"] != "OK" or not data.get("results"):
                        return None
                    
                    result = data["results"][0]
                    return self._parse_google_result(result)
        
        except Exception as e:
            logger.error(f"Error reverse geocoding with Google Maps: {e}")
            return None
    
    def _parse_google_result(self, result: Dict[str, Any]) -> Location:
        """Parsear resultado de Google Maps a objeto Location"""
        # Extraer coordenadas
        geometry = result.get("geometry", {})
        location_data = geometry.get("location", {})
        coordinates = Coordinates(
            latitude=location_data.get("lat", 0.0),
            longitude=location_data.get("lng", 0.0)
        )
        
        # Extraer dirección
        address_components = result.get("address_components", [])
        formatted_address = result.get("formatted_address", "")
        
        address = self._parse_address_components(address_components, formatted_address)
        
        # Extraer metadatos
        metadata = LocationMetadata(
            place_id=result.get("place_id"),
            place_name=self._extract_place_name(result),
            categories=result.get("types", [])
        )
        
        # Determinar tipo de ubicación
        location_type = self._determine_location_type(result.get("types", []))
        
        return Location(
            coordinates=coordinates,
            address=address,
            metadata=metadata,
            location_type=location_type,
            source=LocationSource.GEOCODED,
            confidence=0.9  # Alta confianza para Google Maps
        )
    
    def _parse_address_components(self, components: List[Dict], formatted: str) -> Address:
        """Parsear componentes de dirección de Google"""
        address_data = {
            "street": None,
            "city": None,
            "state": None,
            "postal_code": None,
            "country": None
        }
        
        for component in components:
            types = component.get("types", [])
            long_name = component.get("long_name", "")
            
            if "street_number" in types or "route" in types:
                if not address_data["street"]:
                    address_data["street"] = long_name
                else:
                    address_data["street"] = f"{address_data['street']} {long_name}"
            elif "locality" in types or "administrative_area_level_2" in types:
                address_data["city"] = long_name
            elif "administrative_area_level_1" in types:
                address_data["state"] = long_name
            elif "postal_code" in types:
                address_data["postal_code"] = long_name
            elif "country" in types:
                address_data["country"] = long_name
        
        return Address(
            street=address_data["street"],
            city=address_data["city"],
            state=address_data["state"],
            postal_code=address_data["postal_code"],
            country=address_data["country"],
            formatted_address=formatted
        )
    
    def _extract_place_name(self, result: Dict[str, Any]) -> Optional[str]:
        """Extraer nombre del lugar"""
        # Priorizar nombre de establecimiento
        types = result.get("types", [])
        if "establishment" in types or "point_of_interest" in types:
            return result.get("name") or result.get("formatted_address", "").split(",")[0]
        return None
    
    def _determine_location_type(self, types: List[str]) -> LocationType:
        """Determinar tipo de ubicación basado en tipos de Google"""
        type_mapping = {
            "gas_station": LocationType.GAS_STATION,
            "restaurant": LocationType.RESTAURANT,
            "pharmacy": LocationType.PHARMACY,
            "shopping_mall": LocationType.MALL,
            "store": LocationType.STORE,
            "establishment": LocationType.STORE,
            "lodging": LocationType.HOTEL,
            "airport": LocationType.AIRPORT
        }
        
        for google_type in types:
            if google_type in type_mapping:
                return type_mapping[google_type]
        
        return LocationType.OTHER
    
    def get_rate_limit(self) -> Dict[str, int]:
        """Límites de Google Maps API"""
        return {
            "requests_per_second": 50,
            "requests_per_day": 40000
        }


class OpenStreetMapProvider(BaseGeocodingProvider):
    """Proveedor de geocodificación usando OpenStreetMap/Nominatim"""
    
    def __init__(self, user_agent: str = "Gastify/1.0"):
        super().__init__(None)  # OSM no requiere API key
        self.base_url = "https://nominatim.openstreetmap.org"
        self.user_agent = user_agent
    
    async def geocode_address(self, address: str) -> Optional[Location]:
        """Geocodificar dirección usando Nominatim"""
        try:
            params = {
                "q": address,
                "format": "json",
                "addressdetails": 1,
                "limit": 1,
                "countrycodes": "cl",  # Priorizar Chile
                "accept-language": "es"
            }
            
            headers = {"User-Agent": self.user_agent}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/search",
                    params=params,
                    headers=headers
                ) as response:
                    if response.status != 200:
                        return None
                    
                    data = await response.json()
                    
                    if not data:
                        return None
                    
                    result = data[0]
                    return self._parse_osm_result(result)
        
        except Exception as e:
            logger.error(f"Error geocoding with OSM: {e}")
            return None
    
    async def reverse_geocode(self, lat: float, lng: float) -> Optional[Location]:
        """Geocodificación inversa usando Nominatim"""
        try:
            params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "accept-language": "es"
            }
            
            headers = {"User-Agent": self.user_agent}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/reverse",
                    params=params,
                    headers=headers
                ) as response:
                    if response.status != 200:
                        return None
                    
                    data = await response.json()
                    return self._parse_osm_result(data)
        
        except Exception as e:
            logger.error(f"Error reverse geocoding with OSM: {e}")
            return None
    
    def _parse_osm_result(self, result: Dict[str, Any]) -> Location:
        """Parsear resultado de OSM a objeto Location"""
        # Coordenadas
        coordinates = Coordinates(
            latitude=float(result.get("lat", 0.0)),
            longitude=float(result.get("lon", 0.0))
        )
        
        # Dirección
        address_data = result.get("address", {})
        address = Address(
            street=self._build_street_address(address_data),
            city=address_data.get("city") or address_data.get("town") or address_data.get("village"),
            state=address_data.get("state"),
            postal_code=address_data.get("postcode"),
            country=address_data.get("country"),
            formatted_address=result.get("display_name")
        )
        
        # Metadatos
        metadata = LocationMetadata(
            place_name=result.get("name"),
            categories=[result.get("type", "unknown")]
        )
        
        # Tipo de ubicación
        location_type = self._determine_osm_location_type(result.get("type", ""))
        
        return Location(
            coordinates=coordinates,
            address=address,
            metadata=metadata,
            location_type=location_type,
            source=LocationSource.GEOCODED,
            confidence=0.8  # Confianza media para OSM
        )
    
    def _build_street_address(self, address_data: Dict[str, Any]) -> Optional[str]:
        """Construir dirección de calle desde datos de OSM"""
        parts = []
        
        if address_data.get("house_number"):
            parts.append(address_data["house_number"])
        if address_data.get("road"):
            parts.append(address_data["road"])
        
        return " ".join(parts) if parts else None
    
    def _determine_osm_location_type(self, osm_type: str) -> LocationType:
        """Determinar tipo de ubicación basado en tipo de OSM"""
        type_mapping = {
            "fuel": LocationType.GAS_STATION,
            "restaurant": LocationType.RESTAURANT,
            "pharmacy": LocationType.PHARMACY,
            "shop": LocationType.STORE,
            "mall": LocationType.MALL,
            "hotel": LocationType.HOTEL,
            "airport": LocationType.AIRPORT
        }
        
        return type_mapping.get(osm_type, LocationType.OTHER)
    
    def get_rate_limit(self) -> Dict[str, int]:
        """Límites de Nominatim"""
        return {
            "requests_per_second": 1,  # Muy conservador
            "requests_per_day": 10000
        }


class GeocodingCache:
    """Caché local para resultados de geocodificación"""
    
    def __init__(self, cache_file: str = "geocoding_cache.json", max_size: int = 1000):
        self.cache_file = cache_file
        self.max_size = max_size
        self.cache: Dict[str, LocationCache] = {}
        self.load_cache()
    
    def _generate_key(self, query: str) -> str:
        """Generar clave de caché"""
        return hashlib.md5(query.lower().strip().encode()).hexdigest()
    
    def get(self, query: str) -> Optional[Location]:
        """Obtener ubicación del caché"""
        key = self._generate_key(query)
        
        if key not in self.cache:
            return None
        
        cache_entry = self.cache[key]
        
        # Verificar si ha expirado
        if cache_entry.is_expired():
            del self.cache[key]
            return None
        
        # Incrementar contador de uso
        cache_entry.increment_hits()
        
        logger.info(f"Cache hit for query: {query}")
        return cache_entry.location
    
    def set(self, query: str, location: Location, ttl_hours: int = 24):
        """Guardar ubicación en caché"""
        key = self._generate_key(query)
        
        # Limpiar caché si está lleno
        if len(self.cache) >= self.max_size:
            self._cleanup_cache()
        
        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
        
        cache_entry = LocationCache(
            key=key,
            location=location,
            expires_at=expires_at
        )
        
        self.cache[key] = cache_entry
        self.save_cache()
        
        logger.info(f"Cached location for query: {query}")
    
    def _cleanup_cache(self):
        """Limpiar caché eliminando entradas menos usadas"""
        # Ordenar por número de hits (ascendente) y eliminar el 20%
        sorted_entries = sorted(
            self.cache.items(),
            key=lambda x: (x[1].hits, x[1].last_used)
        )
        
        to_remove = int(len(sorted_entries) * 0.2)
        
        for key, _ in sorted_entries[:to_remove]:
            del self.cache[key]
        
        logger.info(f"Cleaned up {to_remove} cache entries")
    
    def load_cache(self):
        """Cargar caché desde archivo"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                for key, cache_data in data.items():
                    try:
                        location = Location.from_dict(cache_data["location"])
                        cache_entry = LocationCache(
                            key=key,
                            location=location,
                            hits=cache_data.get("hits", 0),
                            last_used=datetime.fromisoformat(cache_data["last_used"]),
                            expires_at=datetime.fromisoformat(cache_data["expires_at"]) if cache_data.get("expires_at") else None
                        )
                        
                        # Solo cargar si no ha expirado
                        if not cache_entry.is_expired():
                            self.cache[key] = cache_entry
                    
                    except Exception as e:
                        logger.warning(f"Error loading cache entry {key}: {e}")
                
                logger.info(f"Loaded {len(self.cache)} entries from cache")
        
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
    
    def save_cache(self):
        """Guardar caché a archivo"""
        try:
            cache_data = {}
            for key, cache_entry in self.cache.items():
                cache_data[key] = cache_entry.to_dict()
            
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
        
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del caché"""
        total_hits = sum(entry.hits for entry in self.cache.values())
        
        return {
            "total_entries": len(self.cache),
            "total_hits": total_hits,
            "avg_hits_per_entry": total_hits / len(self.cache) if self.cache else 0,
            "cache_file_size": os.path.getsize(self.cache_file) if os.path.exists(self.cache_file) else 0
        }


class GeocodingService:
    """Servicio principal de geocodificación"""
    
    def __init__(self, google_api_key: Optional[str] = None):
        self.providers = []
        self.cache = GeocodingCache()
        
        # Configurar proveedores
        if google_api_key:
            self.providers.append(GoogleMapsProvider(google_api_key))
        
        # OSM como fallback gratuito
        self.providers.append(OpenStreetMapProvider())
        
        logger.info(f"Initialized geocoding service with {len(self.providers)} providers")
    
    async def geocode(self, address: str, use_cache: bool = True) -> GeocodingResult:
        """Geocodificar una dirección"""
        start_time = time.time()
        
        # Intentar obtener del caché primero
        if use_cache:
            cached_location = self.cache.get(address)
            if cached_location:
                return GeocodingResult(
                    success=True,
                    location=cached_location,
                    cache_hit=True,
                    processing_time_ms=(time.time() - start_time) * 1000
                )
        
        # Intentar con cada proveedor
        for provider in self.providers:
            try:
                location = await provider.geocode_address(address)
                
                if location:
                    # Guardar en caché
                    if use_cache:
                        self.cache.set(address, location)
                    
                    return GeocodingResult(
                        success=True,
                        location=location,
                        api_calls_used=1,
                        processing_time_ms=(time.time() - start_time) * 1000
                    )
            
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed: {e}")
                continue
        
        # No se pudo geocodificar
        return GeocodingResult(
            success=False,
            error_message="No se pudo geocodificar la dirección",
            processing_time_ms=(time.time() - start_time) * 1000
        )
    
    async def reverse_geocode(self, lat: float, lng: float, use_cache: bool = True) -> GeocodingResult:
        """Geocodificación inversa"""
        start_time = time.time()
        query = f"{lat},{lng}"
        
        # Intentar obtener del caché
        if use_cache:
            cached_location = self.cache.get(query)
            if cached_location:
                return GeocodingResult(
                    success=True,
                    location=cached_location,
                    cache_hit=True,
                    processing_time_ms=(time.time() - start_time) * 1000
                )
        
        # Intentar con cada proveedor
        for provider in self.providers:
            try:
                location = await provider.reverse_geocode(lat, lng)
                
                if location:
                    # Guardar en caché
                    if use_cache:
                        self.cache.set(query, location)
                    
                    return GeocodingResult(
                        success=True,
                        location=location,
                        api_calls_used=1,
                        processing_time_ms=(time.time() - start_time) * 1000
                    )
            
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed: {e}")
                continue
        
        return GeocodingResult(
            success=False,
            error_message="No se pudo realizar geocodificación inversa",
            processing_time_ms=(time.time() - start_time) * 1000
        )
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del caché"""
        return self.cache.get_stats()
    
    def clear_cache(self):
        """Limpiar caché"""
        self.cache.cache.clear()
        self.cache.save_cache()
        logger.info("Cache cleared")


# Instancia global del servicio
_geocoding_service: Optional[GeocodingService] = None


def get_geocoding_service() -> GeocodingService:
    """Obtener instancia del servicio de geocodificación"""
    global _geocoding_service
    
    if _geocoding_service is None:
        google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        _geocoding_service = GeocodingService(google_api_key)
    
    return _geocoding_service
