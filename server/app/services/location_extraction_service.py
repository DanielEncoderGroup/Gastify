"""
Servicio de Extracción de Ubicación de Recibos
==============================================

Este servicio extrae información de ubicación de recibos usando:
- Detección automática de direcciones en texto OCR
- Asociación de marcas conocidas con ubicaciones
- Patrones de texto específicos para Chile
"""

import re
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
import logging

from ..models.location_models import Location, LocationType, LocationSource, Coordinates
from .geocoding_service import get_geocoding_service

# Configurar logging
logger = logging.getLogger(__name__)


@dataclass
class LocationExtraction:
    """Resultado de extracción de ubicación"""
    addresses: List[str]  # Direcciones encontradas
    brands: List[str]  # Marcas detectadas
    phone_numbers: List[str]  # Teléfonos encontrados
    location_keywords: List[str]  # Palabras clave de ubicación
    confidence: float  # Confianza general
    extraction_method: str  # Método usado


class AddressPatternExtractor:
    """Extractor de direcciones usando patrones regex"""
    
    def __init__(self):
        # Patrones para direcciones chilenas
        self.patterns = [
            # Avenida/Calle + Número
            r'(?:av\.|avenida|calle|pasaje|camino)\s+([^,\n]+?)\s+(?:n[°º]?\s*)?(\d+)(?:\s*[-,]\s*([^,\n]+))?',
            
            # Dirección con comuna
            r'([^,\n]+?)\s+(\d+)(?:\s*[-,]\s*([^,\n]+))?,\s*(las\s+condes|providencia|santiago|ñuñoa|vitacura|lo\s+barnechea|maipú|puente\s+alto|san\s+miguel)',
            
            # Formato: Calle Número, Comuna
            r'([a-záéíóúñ\s]+)\s+(\d+),\s*([a-záéíóúñ\s]+)',
            
            # Mall/Centro comercial
            r'(mall|centro\s+comercial)\s+([^,\n]+)',
            
            # Dirección con código postal
            r'([^,\n]+?)\s+(\d+)(?:\s*[-,]\s*([^,\n]+))?,?\s*(\d{7})',
        ]
        
        # Comunas de Santiago
        self.santiago_communes = {
            'las condes', 'providencia', 'santiago', 'ñuñoa', 'vitacura',
            'lo barnechea', 'maipú', 'puente alto', 'san miguel', 'la reina',
            'peñalolén', 'macul', 'san joaquín', 'la florida', 'la cisterna',
            'el bosque', 'pedro aguirre cerda', 'lo espejo', 'cerro navia',
            'quinta normal', 'estación central', 'independencia', 'recoleta',
            'huechuraba', 'quilicura', 'renca', 'conchalí', 'cerrillos'
        }
        
        # Palabras clave de ubicación
        self.location_keywords = {
            'mall', 'centro comercial', 'plaza', 'paseo', 'galería',
            'terminal', 'aeropuerto', 'estación', 'metro', 'hospital',
            'clínica', 'universidad', 'colegio', 'parque', 'estadio'
        }
    
    def extract_addresses(self, text: str) -> List[str]:
        """Extraer direcciones del texto"""
        text = text.lower().strip()
        addresses = []
        
        for pattern in self.patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                address_parts = [part.strip() for part in match.groups() if part and part.strip()]
                
                if len(address_parts) >= 2:
                    # Construir dirección
                    if address_parts[1].isdigit():  # Segundo elemento es número
                        address = f"{address_parts[0].title()} {address_parts[1]}"
                        if len(address_parts) > 2:
                            address += f", {address_parts[2].title()}"
                    else:
                        address = " ".join(address_parts).title()
                    
                    # Validar que parece una dirección válida
                    if self._is_valid_address(address):
                        addresses.append(address)
        
        return list(set(addresses))  # Eliminar duplicados
    
    def extract_location_keywords(self, text: str) -> List[str]:
        """Extraer palabras clave de ubicación"""
        text = text.lower()
        found_keywords = []
        
        for keyword in self.location_keywords:
            if keyword in text:
                found_keywords.append(keyword)
        
        # Buscar comunas
        for commune in self.santiago_communes:
            if commune in text:
                found_keywords.append(commune)
        
        return found_keywords
    
    def _is_valid_address(self, address: str) -> bool:
        """Validar si parece una dirección válida"""
        # Debe tener al menos una palabra y un número
        has_number = bool(re.search(r'\d+', address))
        has_street_word = bool(re.search(r'\b(?:av|avenida|calle|pasaje|camino)\b', address.lower()))
        has_reasonable_length = 10 <= len(address) <= 100
        
        return has_number and (has_street_word or has_reasonable_length)


class PhoneNumberExtractor:
    """Extractor de números telefónicos chilenos"""
    
    def __init__(self):
        # Patrones para teléfonos chilenos
        self.patterns = [
            r'\+56\s*[2-9]\s*\d{4}\s*\d{4}',  # +56 2 1234 5678
            r'\(\+56\)\s*[2-9]\s*\d{4}\s*\d{4}',  # (+56) 2 1234 5678
            r'56\s*[2-9]\s*\d{4}\s*\d{4}',  # 56 2 1234 5678
            r'[2-9]\s*\d{4}\s*\d{4}',  # 2 1234 5678
            r'[2-9]\d{8}',  # 212345678
            r'\(\d{1,2}\)\s*\d{4}[-\s]?\d{4}',  # (2) 1234-5678
        ]
    
    def extract_phone_numbers(self, text: str) -> List[str]:
        """Extraer números de teléfono"""
        phones = []
        
        for pattern in self.patterns:
            matches = re.findall(pattern, text)
            phones.extend(matches)
        
        # Normalizar formato
        normalized_phones = []
        for phone in phones:
            normalized = self._normalize_phone(phone)
            if normalized and self._is_valid_chilean_phone(normalized):
                normalized_phones.append(normalized)
        
        return list(set(normalized_phones))
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalizar formato de teléfono"""
        # Remover espacios, paréntesis, guiones
        clean = re.sub(r'[\s\(\)\-]', '', phone)
        
        # Si empieza con +56, mantenerlo
        if clean.startswith('+56'):
            return clean
        elif clean.startswith('56') and len(clean) == 11:
            return f"+{clean}"
        elif len(clean) == 9 and clean[0] in '23456789':
            return f"+56{clean}"
        
        return clean
    
    def _is_valid_chilean_phone(self, phone: str) -> bool:
        """Validar si es un teléfono chileno válido"""
        # Debe empezar con +56 y tener 12 caracteres total
        if phone.startswith('+56') and len(phone) == 12:
            number_part = phone[3:]
            # Primer dígito debe ser 2-9
            return number_part[0] in '23456789' and number_part.isdigit()
        
        return False


class BrandLocationMatcher:
    """Asociador de marcas con ubicaciones conocidas"""
    
    def __init__(self):
        # Base de datos de marcas y sus ubicaciones típicas
        self.brand_locations = {
            # Supermercados
            'jumbo': {
                'type': LocationType.STORE,
                'locations': [
                    {'name': 'Jumbo Bilbao', 'address': 'Av. Providencia 1550, Providencia', 'coords': (-33.4489, -70.6693)},
                    {'name': 'Jumbo Kennedy', 'address': 'Av. Kennedy 9001, Las Condes', 'coords': (-33.3950, -70.5475)},
                    {'name': 'Jumbo La Dehesa', 'address': 'Av. La Dehesa 1445, Lo Barnechea', 'coords': (-33.3500, -70.5100)},
                ]
            },
            'lider': {
                'type': LocationType.STORE,
                'locations': [
                    {'name': 'Líder Providencia', 'address': 'Av. Providencia 2124, Providencia', 'coords': (-33.4520, -70.6650)},
                    {'name': 'Líder Maipú', 'address': 'Av. Pajaritos 1744, Maipú', 'coords': (-33.5100, -70.7600)},
                ]
            },
            'santa isabel': {
                'type': LocationType.STORE,
                'locations': [
                    {'name': 'Santa Isabel Ñuñoa', 'address': 'Av. Irarrázaval 2861, Ñuñoa', 'coords': (-33.4560, -70.6050)},
                ]
            },
            
            # Estaciones de servicio
            'copec': {
                'type': LocationType.GAS_STATION,
                'locations': [
                    {'name': 'Copec Providencia', 'address': 'Av. Providencia 567, Providencia', 'coords': (-33.4489, -70.6693)},
                    {'name': 'Copec Las Condes', 'address': 'Av. Apoquindo 3000, Las Condes', 'coords': (-33.4100, -70.5800)},
                ]
            },
            'shell': {
                'type': LocationType.GAS_STATION,
                'locations': [
                    {'name': 'Shell Santiago', 'address': 'Av. Libertador Bernardo O\'Higgins 1234, Santiago', 'coords': (-33.4450, -70.6500)},
                ]
            },
            'petrobras': {
                'type': LocationType.GAS_STATION,
                'locations': [
                    {'name': 'Petrobras Maipú', 'address': 'Av. Pajaritos 2000, Maipú', 'coords': (-33.5100, -70.7600)},
                ]
            },
            
            # Farmacias
            'cruz verde': {
                'type': LocationType.PHARMACY,
                'locations': [
                    {'name': 'Farmacia Cruz Verde Providencia', 'address': 'Av. Providencia 1234, Providencia', 'coords': (-33.4489, -70.6693)},
                    {'name': 'Farmacia Cruz Verde Las Condes', 'address': 'Av. Apoquindo 4500, Las Condes', 'coords': (-33.4100, -70.5600)},
                ]
            },
            'salcobrand': {
                'type': LocationType.PHARMACY,
                'locations': [
                    {'name': 'Salcobrand Santiago Centro', 'address': 'Paseo Ahumada 123, Santiago', 'coords': (-33.4372, -70.6506)},
                ]
            },
            'ahumada': {
                'type': LocationType.PHARMACY,
                'locations': [
                    {'name': 'Farmacia Ahumada Ñuñoa', 'address': 'Av. Irarrázaval 3000, Ñuñoa', 'coords': (-33.4560, -70.6050)},
                ]
            },
            
            # Retail
            'falabella': {
                'type': LocationType.STORE,
                'locations': [
                    {'name': 'Falabella Costanera Center', 'address': 'Av. Andrés Bello 2425, Providencia', 'coords': (-33.4180, -70.6070)},
                    {'name': 'Falabella Parque Arauco', 'address': 'Av. Kennedy 5413, Las Condes', 'coords': (-33.4050, -70.5500)},
                ]
            },
            'ripley': {
                'type': LocationType.STORE,
                'locations': [
                    {'name': 'Ripley Santiago Centro', 'address': 'Huérfanos 1055, Santiago', 'coords': (-33.4372, -70.6506)},
                ]
            },
            
            # Restaurantes
            'mcdonalds': {
                'type': LocationType.RESTAURANT,
                'locations': [
                    {'name': 'McDonald\'s Providencia', 'address': 'Av. Providencia 1000, Providencia', 'coords': (-33.4489, -70.6693)},
                    {'name': 'McDonald\'s Plaza Italia', 'address': 'Av. Vicuña Mackenna 20, Providencia', 'coords': (-33.4370, -70.6350)},
                ]
            },
            'burger king': {
                'type': LocationType.RESTAURANT,
                'locations': [
                    {'name': 'Burger King Las Condes', 'address': 'Av. Apoquindo 3000, Las Condes', 'coords': (-33.4100, -70.5800)},
                ]
            },
            'subway': {
                'type': LocationType.RESTAURANT,
                'locations': [
                    {'name': 'Subway Providencia', 'address': 'Av. Providencia 1500, Providencia', 'coords': (-33.4489, -70.6693)},
                ]
            }
        }
    
    def detect_brands(self, text: str) -> List[str]:
        """Detectar marcas en el texto"""
        text = text.lower()
        detected_brands = []
        
        for brand in self.brand_locations.keys():
            if brand in text:
                detected_brands.append(brand)
        
        return detected_brands
    
    def get_brand_locations(self, brand: str) -> List[Dict[str, Any]]:
        """Obtener ubicaciones conocidas de una marca"""
        brand = brand.lower()
        if brand in self.brand_locations:
            return self.brand_locations[brand]['locations']
        return []
    
    def get_brand_type(self, brand: str) -> LocationType:
        """Obtener tipo de ubicación de una marca"""
        brand = brand.lower()
        if brand in self.brand_locations:
            return self.brand_locations[brand]['type']
        return LocationType.OTHER
    
    async def find_best_location_for_brand(self, brand: str, extracted_address: Optional[str] = None) -> Optional[Location]:
        """Encontrar la mejor ubicación para una marca"""
        locations = self.get_brand_locations(brand)
        
        if not locations:
            return None
        
        # Si tenemos una dirección extraída, buscar la más cercana
        if extracted_address:
            geocoding_service = get_geocoding_service()
            result = await geocoding_service.geocode(extracted_address)
            
            if result.success and result.location and result.location.coordinates:
                # Encontrar la ubicación de marca más cercana
                min_distance = float('inf')
                best_location = None
                
                for loc_data in locations:
                    lat, lng = loc_data['coords']
                    distance = result.location.coordinates.distance_to(
                        Coordinates(latitude=lat, longitude=lng)
                    )
                    
                    if distance < min_distance:
                        min_distance = distance
                        best_location = loc_data
                
                if best_location and min_distance < 5.0:  # Dentro de 5km
                    return self._create_location_from_brand_data(brand, best_location)
        
        # Si no hay dirección o no se encontró cercana, usar la primera
        if locations:
            return self._create_location_from_brand_data(brand, locations[0])
        
        return None
    
    def _create_location_from_brand_data(self, brand: str, location_data: Dict[str, Any]) -> Location:
        """Crear objeto Location desde datos de marca"""
        from ..models.location_models import Coordinates, Address, LocationMetadata
        
        lat, lng = location_data['coords']
        
        return Location(
            coordinates=Coordinates(latitude=lat, longitude=lng),
            address=Address(formatted_address=location_data['address']),
            metadata=LocationMetadata(
                place_name=location_data['name'],
                categories=[brand]
            ),
            location_type=self.get_brand_type(brand),
            source=LocationSource.BRAND_MATCHED,
            confidence=0.8
        )


class LocationExtractionService:
    """Servicio principal de extracción de ubicación"""
    
    def __init__(self):
        self.address_extractor = AddressPatternExtractor()
        self.phone_extractor = PhoneNumberExtractor()
        self.brand_matcher = BrandLocationMatcher()
    
    async def extract_location_from_receipt(self, ocr_text: str) -> LocationExtraction:
        """Extraer información de ubicación de un recibo"""
        logger.info("Extracting location from receipt text")
        
        # Extraer componentes
        addresses = self.address_extractor.extract_addresses(ocr_text)
        brands = self.brand_matcher.detect_brands(ocr_text)
        phone_numbers = self.phone_extractor.extract_phone_numbers(ocr_text)
        location_keywords = self.address_extractor.extract_location_keywords(ocr_text)
        
        # Calcular confianza
        confidence = self._calculate_confidence(addresses, brands, phone_numbers, location_keywords)
        
        # Determinar método de extracción
        extraction_method = self._determine_extraction_method(addresses, brands, phone_numbers)
        
        logger.info(f"Extracted: {len(addresses)} addresses, {len(brands)} brands, {len(phone_numbers)} phones")
        
        return LocationExtraction(
            addresses=addresses,
            brands=brands,
            phone_numbers=phone_numbers,
            location_keywords=location_keywords,
            confidence=confidence,
            extraction_method=extraction_method
        )
    
    async def get_best_location(self, extraction: LocationExtraction) -> Optional[Location]:
        """Obtener la mejor ubicación basada en la extracción"""
        # Prioridad 1: Marca conocida con dirección
        if extraction.brands and extraction.addresses:
            for brand in extraction.brands:
                location = await self.brand_matcher.find_best_location_for_brand(
                    brand, extraction.addresses[0]
                )
                if location:
                    return location
        
        # Prioridad 2: Solo marca conocida
        if extraction.brands:
            for brand in extraction.brands:
                location = await self.brand_matcher.find_best_location_for_brand(brand)
                if location:
                    return location
        
        # Prioridad 3: Geocodificar dirección extraída
        if extraction.addresses:
            geocoding_service = get_geocoding_service()
            result = await geocoding_service.geocode(extraction.addresses[0])
            
            if result.success and result.location:
                result.location.source = LocationSource.OCR_EXTRACTED
                return result.location
        
        return None
    
    def _calculate_confidence(self, addresses: List[str], brands: List[str], 
                            phones: List[str], keywords: List[str]) -> float:
        """Calcular confianza en la extracción"""
        confidence = 0.0
        
        # Direcciones encontradas
        if addresses:
            confidence += 0.4 * min(len(addresses) / 2, 1.0)
        
        # Marcas conocidas
        if brands:
            confidence += 0.3 * min(len(brands) / 2, 1.0)
        
        # Teléfonos
        if phones:
            confidence += 0.2 * min(len(phones) / 2, 1.0)
        
        # Palabras clave de ubicación
        if keywords:
            confidence += 0.1 * min(len(keywords) / 3, 1.0)
        
        return min(confidence, 1.0)
    
    def _determine_extraction_method(self, addresses: List[str], brands: List[str], 
                                   phones: List[str]) -> str:
        """Determinar método de extracción principal"""
        if brands and addresses:
            return "brand_and_address"
        elif brands:
            return "brand_matched"
        elif addresses:
            return "address_extracted"
        elif phones:
            return "phone_based"
        else:
            return "keyword_based"


# Instancia global del servicio
_location_extraction_service: Optional[LocationExtractionService] = None


def get_location_extraction_service() -> LocationExtractionService:
    """Obtener instancia del servicio de extracción de ubicación"""
    global _location_extraction_service
    
    if _location_extraction_service is None:
        _location_extraction_service = LocationExtractionService()
    
    return _location_extraction_service
