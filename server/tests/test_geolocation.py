"""
Pruebas para el Sistema de Geolocalización de Gastify
====================================================

Este módulo contiene pruebas unitarias e integración para el sistema
de geolocalización, incluyendo extracción de ubicaciones, geocodificación
y análisis geográfico.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from app.models.location_models import (
    Location, Coordinates, Address, LocationMetadata,
    LocationType, LocationSource
)
from app.services.location_extraction_service import (
    LocationExtractionService, AddressPatternExtractor,
    PhoneNumberExtractor, BrandLocationMatcher
)
from app.services.geocoding_service import GeocodingService, GeocodingCache
from app.services.geolocation_service import GeolocationService, GeolocationAnalytics
from app.models.receipt_with_location import ReceiptWithLocationModel, LocationDataModel


class TestAddressPatternExtractor:
    """Pruebas para extractor de direcciones"""
    
    def setup_method(self):
        self.extractor = AddressPatternExtractor()
    
    def test_extract_basic_address(self):
        """Prueba extracción de dirección básica"""
        text = "JUMBO BILBAO\nAv. Providencia 1550\nProvidencia, Santiago"
        addresses = self.extractor.extract_addresses(text)
        
        assert len(addresses) > 0
        assert any("Providencia" in addr for addr in addresses)
        assert any("1550" in addr for addr in addresses)
    
    def test_extract_address_with_commune(self):
        """Prueba extracción con comuna"""
        text = "Compra en Av. Kennedy 5413, Las Condes"
        addresses = self.extractor.extract_addresses(text)
        
        assert len(addresses) > 0
        assert any("Kennedy" in addr and "5413" in addr for addr in addresses)
    
    def test_extract_mall_address(self):
        """Prueba extracción de mall"""
        text = "Mall Costanera Center\nAv. Andrés Bello 2425"
        addresses = self.extractor.extract_addresses(text)
        
        assert len(addresses) > 0
    
    def test_extract_location_keywords(self):
        """Prueba extracción de palabras clave"""
        text = "Compra en Mall Plaza Norte, Huechuraba"
        keywords = self.extractor.extract_location_keywords(text)
        
        assert "mall" in keywords
        assert "huechuraba" in keywords or any("huechuraba" in k for k in keywords)
    
    def test_no_false_positives(self):
        """Prueba que no extraiga direcciones falsas"""
        text = "Total: $15.000\nFecha: 15/08/2024\nGracias por su compra"
        addresses = self.extractor.extract_addresses(text)
        
        # No debería extraer direcciones de este texto
        assert len(addresses) == 0


class TestPhoneNumberExtractor:
    """Pruebas para extractor de teléfonos"""
    
    def setup_method(self):
        self.extractor = PhoneNumberExtractor()
    
    def test_extract_chilean_phone_formats(self):
        """Prueba extracción de diferentes formatos chilenos"""
        test_cases = [
            "+56 2 1234 5678",
            "(+56) 2 1234 5678", 
            "56 2 1234 5678",
            "2 1234 5678",
            "212345678",
            "(2) 1234-5678"
        ]
        
        for phone_text in test_cases:
            text = f"Contacto: {phone_text}"
            phones = self.extractor.extract_phone_numbers(text)
            
            assert len(phones) > 0, f"No se extrajo teléfono de: {phone_text}"
            assert phones[0].startswith("+56"), f"Formato incorrecto: {phones[0]}"
    
    def test_normalize_phone_format(self):
        """Prueba normalización de formato"""
        phone = "2 1234 5678"
        normalized = self.extractor._normalize_phone(phone)
        
        assert normalized == "+56212345678"
    
    def test_invalid_phone_rejection(self):
        """Prueba rechazo de teléfonos inválidos"""
        invalid_phones = [
            "123",
            "1 234 5678",  # No empieza con 2-9
            "+56 1 234 5678",  # Primer dígito inválido
            "abcd efgh"
        ]
        
        for invalid_phone in invalid_phones:
            text = f"Contacto: {invalid_phone}"
            phones = self.extractor.extract_phone_numbers(text)
            
            # No debería extraer teléfonos inválidos
            assert len(phones) == 0, f"Extrajo teléfono inválido: {invalid_phone}"


class TestBrandLocationMatcher:
    """Pruebas para asociador de marcas"""
    
    def setup_method(self):
        self.matcher = BrandLocationMatcher()
    
    def test_detect_known_brands(self):
        """Prueba detección de marcas conocidas"""
        text = "JUMBO BILBAO\nAv. Providencia 1550"
        brands = self.matcher.detect_brands(text)
        
        assert "jumbo" in brands
    
    def test_detect_multiple_brands(self):
        """Prueba detección de múltiples marcas"""
        text = "Cerca de Jumbo y Copec"
        brands = self.matcher.detect_brands(text)
        
        assert len(brands) >= 2
        assert "jumbo" in brands
        assert "copec" in brands
    
    def test_get_brand_locations(self):
        """Prueba obtención de ubicaciones de marca"""
        locations = self.matcher.get_brand_locations("jumbo")
        
        assert len(locations) > 0
        assert all("name" in loc and "address" in loc and "coords" in loc for loc in locations)
    
    def test_get_brand_type(self):
        """Prueba obtención de tipo de marca"""
        assert self.matcher.get_brand_type("jumbo") == LocationType.STORE
        assert self.matcher.get_brand_type("copec") == LocationType.GAS_STATION
        assert self.matcher.get_brand_type("cruz verde") == LocationType.PHARMACY
        assert self.matcher.get_brand_type("mcdonalds") == LocationType.RESTAURANT
    
    @pytest.mark.asyncio
    async def test_find_best_location_for_brand(self):
        """Prueba búsqueda de mejor ubicación para marca"""
        location = await self.matcher.find_best_location_for_brand("jumbo")
        
        assert location is not None
        assert location.location_type == LocationType.STORE
        assert location.source == LocationSource.BRAND_MATCHED
        assert location.coordinates is not None


class TestLocationExtractionService:
    """Pruebas para servicio de extracción de ubicación"""
    
    def setup_method(self):
        self.service = LocationExtractionService()
    
    @pytest.mark.asyncio
    async def test_extract_from_supermarket_receipt(self):
        """Prueba extracción de recibo de supermercado"""
        receipt_text = """
        JUMBO BILBAO
        Av. Providencia 1550, Providencia
        Santiago, Chile
        
        VERDURAS FRESCAS         $3.450
        LECHE DESCREMADA 1L      $1.190
        PAN INTEGRAL             $2.590
        
        TOTAL                   $7.230
        
        Teléfono: +56 2 2234 5678
        """
        
        extraction = await self.service.extract_location_from_receipt(receipt_text)
        
        assert len(extraction.addresses) > 0
        assert "jumbo" in extraction.brands
        assert len(extraction.phone_numbers) > 0
        assert extraction.confidence > 0.5
        assert extraction.extraction_method in ["brand_and_address", "brand_matched"]
    
    @pytest.mark.asyncio
    async def test_extract_from_gas_station_receipt(self):
        """Prueba extracción de recibo de estación de servicio"""
        receipt_text = """
        COPEC ESTACIÓN PROVIDENCIA
        Av. Providencia 567
        
        COMBUSTIBLE 95 OCTANOS
        45.2 LITROS
        PRECIO POR LITRO: $890
        
        TOTAL: $40.228
        """
        
        extraction = await self.service.extract_location_from_receipt(receipt_text)
        
        assert "copec" in extraction.brands
        assert len(extraction.addresses) > 0
        assert extraction.confidence > 0.4
    
    @pytest.mark.asyncio
    async def test_get_best_location_with_brand(self):
        """Prueba obtención de mejor ubicación con marca"""
        extraction = Mock()
        extraction.brands = ["jumbo"]
        extraction.addresses = ["Av. Providencia 1550"]
        extraction.phone_numbers = []
        extraction.location_keywords = []
        
        location = await self.service.get_best_location(extraction)
        
        assert location is not None
        assert location.location_type == LocationType.STORE
        assert location.source == LocationSource.BRAND_MATCHED
    
    @pytest.mark.asyncio
    async def test_get_best_location_address_only(self):
        """Prueba obtención de ubicación solo con dirección"""
        extraction = Mock()
        extraction.brands = []
        extraction.addresses = ["Av. Providencia 1234, Santiago"]
        extraction.phone_numbers = []
        extraction.location_keywords = []
        
        # Mock del servicio de geocodificación
        with patch('app.services.location_extraction_service.get_geocoding_service') as mock_geo:
            mock_result = Mock()
            mock_result.success = True
            mock_result.location = Location(
                coordinates=Coordinates(latitude=-33.4489, longitude=-70.6693),
                address=Address(formatted_address="Av. Providencia 1234, Santiago"),
                location_type=LocationType.OTHER,
                source=LocationSource.GEOCODED
            )
            
            mock_geo.return_value.geocode = AsyncMock(return_value=mock_result)
            
            location = await self.service.get_best_location(extraction)
            
            assert location is not None
            assert location.source == LocationSource.OCR_EXTRACTED


class TestGeocodingCache:
    """Pruebas para caché de geocodificación"""
    
    def setup_method(self):
        self.cache = GeocodingCache(cache_file="test_cache.json", max_size=10)
    
    def test_cache_set_and_get(self):
        """Prueba guardar y obtener del caché"""
        location = Location(
            coordinates=Coordinates(latitude=-33.4489, longitude=-70.6693),
            address=Address(formatted_address="Av. Providencia 1234"),
            location_type=LocationType.STORE,
            source=LocationSource.GEOCODED
        )
        
        query = "Av. Providencia 1234, Santiago"
        
        # Guardar en caché
        self.cache.set(query, location)
        
        # Obtener del caché
        cached_location = self.cache.get(query)
        
        assert cached_location is not None
        assert cached_location.coordinates.latitude == location.coordinates.latitude
        assert cached_location.address.formatted_address == location.address.formatted_address
    
    def test_cache_miss(self):
        """Prueba fallo de caché"""
        result = self.cache.get("dirección inexistente")
        assert result is None
    
    def test_cache_expiration(self):
        """Prueba expiración de caché"""
        location = Location(
            coordinates=Coordinates(latitude=-33.4489, longitude=-70.6693),
            location_type=LocationType.STORE,
            source=LocationSource.GEOCODED
        )
        
        query = "test query"
        
        # Guardar con TTL muy corto
        self.cache.set(query, location, ttl_hours=0.001)  # ~3.6 segundos
        
        # Debería estar disponible inmediatamente
        assert self.cache.get(query) is not None
        
        # Simular expiración modificando directamente
        cache_entry = self.cache.cache[self.cache._generate_key(query)]
        cache_entry.expires_at = datetime.utcnow() - timedelta(hours=1)
        
        # Ahora debería haber expirado
        assert self.cache.get(query) is None


class TestGeolocationAnalytics:
    """Pruebas para análisis geográfico"""
    
    def setup_method(self):
        self.analytics = GeolocationAnalytics()
    
    def test_calculate_location_stats(self):
        """Prueba cálculo de estadísticas por ubicación"""
        # Crear recibos de prueba
        receipts = []
        
        # Ubicación 1: Jumbo Providencia
        location_data_1 = {
            "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
            "address": {"formatted_address": "Av. Providencia 1550"},
            "metadata": {"place_name": "Jumbo Providencia"}
        }
        
        for i in range(3):
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName="Jumbo",
                folioNumber=f"B001-{i}",
                date=datetime.utcnow() - timedelta(days=i),
                description="Compra supermercado",
                totalAmount=15000.0 + (i * 1000),
                category="Supermercado",
                locationData=LocationDataModel(
                    location=location_data_1,
                    extraction_method="brand_matched",
                    confidence=0.9
                )
            )
            receipts.append(receipt)
        
        # Calcular estadísticas
        stats = self.analytics.calculate_location_stats(receipts)
        
        assert len(stats) == 1
        assert stats[0].expense_count == 3
        assert stats[0].total_expenses == 48000.0  # 15000 + 16000 + 17000
        assert stats[0].avg_expense == 16000.0
        assert "Supermercado" in stats[0].categories
    
    def test_generate_heatmap_data(self):
        """Prueba generación de datos de mapa de calor"""
        # Crear recibos con diferentes ubicaciones
        receipts = []
        
        locations = [
            (-33.4489, -70.6693, 25000.0),  # Providencia
            (-33.4520, -70.6650, 15000.0),  # Cerca de Providencia
            (-33.4100, -70.5800, 30000.0),  # Las Condes
        ]
        
        for i, (lat, lng, amount) in enumerate(locations):
            location_data = {
                "coordinates": {"latitude": lat, "longitude": lng},
                "address": {"formatted_address": f"Dirección {i+1}"}
            }
            
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName=f"Tienda {i+1}",
                folioNumber=f"B001-{i}",
                date=datetime.utcnow(),
                description="Compra",
                totalAmount=amount,
                category="Retail",
                locationData=LocationDataModel(
                    location=location_data,
                    extraction_method="geocoded",
                    confidence=0.8
                )
            )
            receipts.append(receipt)
        
        # Generar mapa de calor
        heatmap_data = self.analytics.generate_heatmap_data(receipts)
        
        assert len(heatmap_data.points) > 0
        assert heatmap_data.total_amount == 70000.0
        assert heatmap_data.bounds["north"] > heatmap_data.bounds["south"]
        assert heatmap_data.bounds["east"] > heatmap_data.bounds["west"]
    
    def test_detect_business_trips(self):
        """Prueba detección de viajes de negocios"""
        home_location = Coordinates(latitude=-33.4489, longitude=-70.6693)  # Santiago
        
        # Crear recibos simulando un viaje
        receipts = []
        
        # Gastos en casa (Santiago)
        for i in range(2):
            location_data = {
                "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
                "address": {"formatted_address": "Santiago"}
            }
            
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName="Local Santiago",
                folioNumber=f"HOME-{i}",
                date=datetime.utcnow() - timedelta(days=10-i),
                description="Gasto local",
                totalAmount=10000.0,
                category="Alimentación",
                locationData=LocationDataModel(
                    location=location_data,
                    extraction_method="geocoded",
                    confidence=0.8
                )
            )
            receipts.append(receipt)
        
        # Gastos en viaje (Valparaíso - ~120km de Santiago)
        for i in range(3):
            location_data = {
                "coordinates": {"latitude": -33.0458, "longitude": -71.6197},  # Valparaíso
                "address": {"formatted_address": "Valparaíso"}
            }
            
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName="Hotel Valparaíso",
                folioNumber=f"TRIP-{i}",
                date=datetime.utcnow() - timedelta(days=7-i),
                description="Gasto viaje",
                totalAmount=25000.0,
                category="Hospedaje",
                locationData=LocationDataModel(
                    location=location_data,
                    extraction_method="geocoded",
                    confidence=0.8
                )
            )
            receipts.append(receipt)
        
        # Detectar viajes
        trips = self.analytics.detect_business_trips(receipts, home_location)
        
        assert len(trips) > 0
        assert trips[0].total_expenses == 75000.0  # 3 gastos de 25k cada uno
        assert trips[0].expense_count == 3
        assert len(trips[0].destinations) > 0
        assert trips[0].confidence > 0.5


class TestGeolocationService:
    """Pruebas de integración para servicio principal"""
    
    def setup_method(self):
        self.service = GeolocationService()
    
    @pytest.mark.asyncio
    async def test_process_receipt_location_integration(self):
        """Prueba procesamiento completo de ubicación de recibo"""
        receipt_text = """
        JUMBO BILBAO
        Av. Providencia 1550, Providencia
        Santiago, Chile
        
        VERDURAS FRESCAS         $3.450
        TOTAL                   $3.450
        """
        
        location_data = await self.service.process_receipt_location(receipt_text)
        
        assert location_data is not None
        assert location_data.confidence > 0.5
        assert location_data.extraction_method in ["brand_and_address", "brand_matched"]
        assert location_data.location is not None
        assert "jumbo" in (location_data.matched_brand or "").lower()
    
    @pytest.mark.asyncio
    async def test_get_location_analytics_integration(self):
        """Prueba análisis geográfico completo"""
        # Crear recibos de prueba
        receipts = []
        
        location_data = {
            "coordinates": {"latitude": -33.4489, "longitude": -70.6693},
            "address": {"formatted_address": "Av. Providencia 1550"},
            "metadata": {"place_name": "Jumbo Providencia"}
        }
        
        for i in range(5):
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName="Jumbo",
                folioNumber=f"B001-{i}",
                date=datetime.utcnow() - timedelta(days=i),
                description="Compra supermercado",
                totalAmount=15000.0,
                category="Supermercado",
                locationData=LocationDataModel(
                    location=location_data,
                    extraction_method="brand_matched",
                    confidence=0.9
                )
            )
            receipts.append(receipt)
        
        # Obtener análisis
        analytics = await self.service.get_location_analytics(receipts)
        
        assert analytics["total_locations"] > 0
        assert len(analytics["top_locations"]) > 0
        assert analytics["total_spent"] == 75000.0
        assert analytics["most_frequent_category"] == "Supermercado"


if __name__ == "__main__":
    # Ejecutar pruebas específicas
    pytest.main([__file__, "-v"])
