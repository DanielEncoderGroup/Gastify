"""
Demostración del Sistema de Geolocalización de Gastify
=====================================================

Este script demuestra las capacidades completas del sistema de geolocalización:
- Extracción de ubicaciones de recibos
- Geocodificación de direcciones
- Análisis geográfico de gastos
- Generación de mapas de calor
- Detección de viajes de negocios
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import List

from app.services.location_extraction_service import get_location_extraction_service
from app.services.geocoding_service import get_geocoding_service
from app.services.geolocation_service import get_geolocation_service
from app.models.receipt_with_location import ReceiptWithLocationModel, LocationDataModel
from app.models.location_models import Coordinates


class GeolocationDemo:
    """Demostración del sistema de geolocalización"""
    
    def __init__(self):
        self.location_extraction = get_location_extraction_service()
        self.geocoding = get_geocoding_service()
        self.geolocation = get_geolocation_service()
    
    async def run_complete_demo(self):
        """Ejecutar demostración completa"""
        print("🗺️  DEMOSTRACIÓN DEL SISTEMA DE GEOLOCALIZACIÓN DE GASTIFY")
        print("=" * 60)
        
        # 1. Demostrar extracción de ubicaciones
        await self.demo_location_extraction()
        
        # 2. Demostrar geocodificación
        await self.demo_geocoding()
        
        # 3. Demostrar análisis geográfico
        await self.demo_geographic_analysis()
        
        # 4. Demostrar mapa de calor
        await self.demo_heatmap_generation()
        
        # 5. Demostrar detección de viajes
        await self.demo_business_trip_detection()
        
        print("\n✅ DEMOSTRACIÓN COMPLETADA")
        print("El sistema de geolocalización está listo para producción!")
    
    async def demo_location_extraction(self):
        """Demostrar extracción de ubicaciones de recibos"""
        print("\n📍 1. EXTRACCIÓN DE UBICACIONES DE RECIBOS")
        print("-" * 45)
        
        # Recibos de prueba con diferentes tipos de ubicación
        test_receipts = [
            {
                "name": "Supermercado Jumbo",
                "text": """
                JUMBO BILBAO
                Av. Providencia 1550, Providencia
                Santiago, Chile
                RUT: 81.201.000-K
                
                VERDURAS FRESCAS         $3.450
                LECHE DESCREMADA 1L      $1.190
                PAN INTEGRAL             $2.590
                
                SUBTOTAL                $7.230
                IVA 19%                 $1.374
                TOTAL                   $8.604
                
                Teléfono: +56 2 2234 5678
                Gracias por su compra
                """
            },
            {
                "name": "Estación de Servicio Copec",
                "text": """
                COPEC ESTACIÓN PROVIDENCIA
                Av. Providencia 567
                Santiago, Chile
                
                COMBUSTIBLE 95 OCTANOS
                45.2 LITROS
                PRECIO POR LITRO: $890
                
                SUBTOTAL: $40.228
                IVA: $7.643
                TOTAL: $47.871
                
                Contacto: (2) 2345-6789
                """
            },
            {
                "name": "Farmacia Cruz Verde",
                "text": """
                FARMACIA CRUZ VERDE
                Mall Plaza Norte
                Av. Américo Vespucio 1501
                Huechuraba, Santiago
                
                PARACETAMOL 500MG       $2.890
                VITAMINA C              $4.590
                ALCOHOL GEL             $1.990
                
                TOTAL                   $9.470
                
                Tel: +56 2 2678 9012
                """
            },
            {
                "name": "Restaurante McDonald's",
                "text": """
                McDONALD'S PLAZA ITALIA
                Av. Vicuña Mackenna 20
                Providencia, Santiago
                
                BIG MAC COMBO           $6.990
                PAPAS MEDIANAS          $2.490
                COCA COLA 500ML         $1.990
                
                TOTAL                  $11.470
                
                Pedido #1234
                """
            }
        ]
        
        for receipt in test_receipts:
            print(f"\n🧾 Procesando: {receipt['name']}")
            
            try:
                # Extraer información de ubicación
                extraction = await self.location_extraction.extract_location_from_receipt(receipt['text'])
                
                print(f"   📍 Direcciones encontradas: {len(extraction.addresses)}")
                for addr in extraction.addresses[:2]:  # Mostrar máximo 2
                    print(f"      • {addr}")
                
                print(f"   🏪 Marcas detectadas: {extraction.brands}")
                print(f"   📞 Teléfonos: {extraction.phone_numbers}")
                print(f"   🔍 Palabras clave: {extraction.location_keywords[:3]}")
                print(f"   📊 Confianza: {extraction.confidence:.2f}")
                print(f"   🛠️  Método: {extraction.extraction_method}")
                
                # Obtener mejor ubicación
                location = await self.location_extraction.get_best_location(extraction)
                
                if location:
                    print(f"   ✅ Ubicación determinada:")
                    print(f"      • Nombre: {location.get_display_name()}")
                    print(f"      • Tipo: {location.location_type.value}")
                    print(f"      • Fuente: {location.source.value}")
                    if location.coordinates:
                        print(f"      • Coordenadas: ({location.coordinates.latitude:.4f}, {location.coordinates.longitude:.4f})")
                else:
                    print("   ❌ No se pudo determinar ubicación")
            
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    async def demo_geocoding(self):
        """Demostrar geocodificación de direcciones"""
        print("\n🌍 2. GEOCODIFICACIÓN DE DIRECCIONES")
        print("-" * 40)
        
        # Direcciones de prueba
        test_addresses = [
            "Av. Providencia 1550, Providencia, Santiago",
            "Mall Costanera Center, Santiago",
            "Av. Kennedy 5413, Las Condes",
            "Plaza de Armas, Santiago Centro",
            "Aeropuerto Internacional Arturo Merino Benítez"
        ]
        
        for address in test_addresses:
            print(f"\n📍 Geocodificando: {address}")
            
            try:
                result = await self.geocoding.geocode(address)
                
                if result.success and result.location:
                    location = result.location
                    print(f"   ✅ Éxito (Cache: {'Sí' if result.cache_hit else 'No'})")
                    print(f"   📍 Coordenadas: ({location.coordinates.latitude:.6f}, {location.coordinates.longitude:.6f})")
                    print(f"   🏠 Dirección: {location.address.formatted_address if location.address else 'N/A'}")
                    print(f"   🏪 Lugar: {location.metadata.place_name if location.metadata else 'N/A'}")
                    print(f"   ⏱️  Tiempo: {result.processing_time_ms:.1f}ms")
                else:
                    print(f"   ❌ Error: {result.error_message}")
            
            except Exception as e:
                print(f"   ❌ Excepción: {e}")
        
        # Mostrar estadísticas del caché
        print(f"\n📊 Estadísticas del caché:")
        cache_stats = self.geocoding.get_cache_stats()
        print(f"   • Entradas totales: {cache_stats['total_entries']}")
        print(f"   • Hits totales: {cache_stats['total_hits']}")
        print(f"   • Promedio hits/entrada: {cache_stats['avg_hits_per_entry']:.1f}")
    
    async def demo_geographic_analysis(self):
        """Demostrar análisis geográfico de gastos"""
        print("\n📊 3. ANÁLISIS GEOGRÁFICO DE GASTOS")
        print("-" * 40)
        
        # Crear recibos de prueba con ubicaciones
        receipts = await self.create_sample_receipts()
        
        print(f"📋 Analizando {len(receipts)} recibos de muestra...")
        
        try:
            # Obtener análisis completo
            analytics = await self.geolocation.get_location_analytics(receipts)
            
            print(f"\n📍 Resumen geográfico:")
            print(f"   • Total ubicaciones: {analytics['total_locations']}")
            print(f"   • Gasto total: ${analytics['total_spent']:,.0f}")
            print(f"   • Categoría más frecuente: {analytics['most_frequent_category']}")
            print(f"   • % Viajes de negocios: {analytics['business_trip_percentage']:.1f}%")
            
            print(f"\n🏆 Top 5 ubicaciones por gasto:")
            for i, location in enumerate(analytics['top_locations'][:5], 1):
                print(f"   {i}. {location['location_name']}")
                print(f"      • Gasto total: ${location['total_spent']:,.0f}")
                print(f"      • Visitas: {location['visit_count']}")
                print(f"      • Promedio: ${location['avg_expense']:,.0f}")
                print(f"      • Frecuencia: {location['visit_frequency']:.1f} visitas/mes")
        
        except Exception as e:
            print(f"❌ Error en análisis: {e}")
    
    async def demo_heatmap_generation(self):
        """Demostrar generación de mapa de calor"""
        print("\n🔥 4. GENERACIÓN DE MAPA DE CALOR")
        print("-" * 40)
        
        # Crear recibos de prueba
        receipts = await self.create_sample_receipts()
        
        try:
            # Generar mapa de calor completo
            heatmap_data = await self.geolocation.generate_heatmap(receipts)
            
            print(f"🗺️  Mapa de calor generado:")
            print(f"   • Puntos de calor: {len(heatmap_data.points)}")
            print(f"   • Monto total: ${heatmap_data.total_amount:,.0f}")
            print(f"   • Límites geográficos:")
            print(f"     - Norte: {heatmap_data.bounds['north']:.4f}")
            print(f"     - Sur: {heatmap_data.bounds['south']:.4f}")
            print(f"     - Este: {heatmap_data.bounds['east']:.4f}")
            print(f"     - Oeste: {heatmap_data.bounds['west']:.4f}")
            
            print(f"\n🔥 Puntos de mayor intensidad:")
            # Ordenar puntos por intensidad
            sorted_points = sorted(heatmap_data.points, key=lambda p: p['intensity'], reverse=True)
            
            for i, point in enumerate(sorted_points[:3], 1):
                print(f"   {i}. Intensidad: {point['intensity']:.2f}")
                print(f"      • Coordenadas: ({point['lat']:.4f}, {point['lng']:.4f})")
                print(f"      • Valor: ${point['value']:,.0f}")
                print(f"      • Transacciones: {point['count']}")
            
            # Generar mapa de calor filtrado por categoría
            print(f"\n🏪 Mapa de calor filtrado (Supermercado):")
            filtered_heatmap = await self.geolocation.generate_heatmap(
                receipts, 
                {"categories": ["Supermercado"]}
            )
            print(f"   • Puntos filtrados: {len(filtered_heatmap.points)}")
            print(f"   • Monto filtrado: ${filtered_heatmap.total_amount:,.0f}")
        
        except Exception as e:
            print(f"❌ Error generando mapa de calor: {e}")
    
    async def demo_business_trip_detection(self):
        """Demostrar detección de viajes de negocios"""
        print("\n✈️  5. DETECCIÓN DE VIAJES DE NEGOCIOS")
        print("-" * 45)
        
        # Crear recibos que simulen viajes de negocios
        trip_receipts = await self.create_business_trip_receipts()
        
        print(f"🧳 Analizando {len(trip_receipts)} recibos para detectar viajes...")
        
        try:
            # Definir ubicación de casa (Santiago centro)
            home_location = Coordinates(latitude=-33.4489, longitude=-70.6693)
            
            # Detectar viajes de negocios
            business_trips = self.geolocation.analytics.detect_business_trips(
                trip_receipts, home_location
            )
            
            print(f"\n🎯 Viajes detectados: {len(business_trips)}")
            
            for i, trip in enumerate(business_trips, 1):
                print(f"\n✈️  Viaje {i}: {trip.trip_id}")
                print(f"   • Fechas: {trip.start_date.strftime('%d/%m/%Y')} - {trip.end_date.strftime('%d/%m/%Y')}")
                print(f"   • Duración: {(trip.end_date - trip.start_date).days + 1} días")
                print(f"   • Gastos totales: ${trip.total_expenses:,.0f}")
                print(f"   • Número de gastos: {trip.expense_count}")
                print(f"   • Confianza: {trip.confidence:.2f}")
                print(f"   • Estado: {'Confirmado' if trip.is_confirmed else 'Pendiente confirmación'}")
                
                print(f"   📊 Gastos por categoría:")
                for category, amount in trip.categories.items():
                    print(f"      • {category}: ${amount:,.0f}")
                
                print(f"   🗺️  Destinos:")
                for dest in trip.destinations:
                    print(f"      • {dest['name']}: ${dest['expenses']:,.0f}")
        
        except Exception as e:
            print(f"❌ Error detectando viajes: {e}")
    
    async def create_sample_receipts(self) -> List[ReceiptWithLocationModel]:
        """Crear recibos de muestra con ubicaciones"""
        receipts = []
        
        # Datos de ubicaciones de Santiago
        locations_data = [
            {
                "name": "Jumbo Providencia",
                "coords": (-33.4489, -70.6693),
                "address": "Av. Providencia 1550, Providencia",
                "type": "Supermercado",
                "brand": "jumbo"
            },
            {
                "name": "Copec Estación",
                "coords": (-33.4520, -70.6650),
                "address": "Av. Providencia 567",
                "type": "Combustible",
                "brand": "copec"
            },
            {
                "name": "Cruz Verde Farmacia",
                "coords": (-33.4100, -70.5800),
                "address": "Av. Kennedy 5413, Las Condes",
                "type": "Farmacia",
                "brand": "cruz verde"
            },
            {
                "name": "McDonald's Plaza Italia",
                "coords": (-33.4370, -70.6350),
                "address": "Av. Vicuña Mackenna 20, Providencia",
                "type": "Restaurante",
                "brand": "mcdonalds"
            },
            {
                "name": "Falabella Costanera",
                "coords": (-33.4180, -70.6070),
                "address": "Av. Andrés Bello 2425, Providencia",
                "type": "Retail",
                "brand": "falabella"
            }
        ]
        
        # Crear múltiples recibos por ubicación
        for i, loc_data in enumerate(locations_data):
            for j in range(3):  # 3 recibos por ubicación
                location_dict = {
                    "coordinates": {
                        "latitude": loc_data["coords"][0],
                        "longitude": loc_data["coords"][1]
                    },
                    "address": {
                        "formatted_address": loc_data["address"]
                    },
                    "metadata": {
                        "place_name": loc_data["name"],
                        "categories": [loc_data["brand"]]
                    },
                    "location_type": "store",
                    "source": "brand_matched",
                    "confidence": 0.9
                }
                
                receipt = ReceiptWithLocationModel(
                    user="507f1f77bcf86cd799439011",
                    companyName=loc_data["name"],
                    folioNumber=f"B{i:03d}-{j:03d}",
                    date=datetime.utcnow() - timedelta(days=(i*3 + j)),
                    description=f"Compra en {loc_data['name']}",
                    totalAmount=15000.0 + (i * 5000) + (j * 1000),
                    category=loc_data["type"],
                    locationData=LocationDataModel(
                        location=location_dict,
                        extraction_method="brand_matched",
                        confidence=0.9,
                        matched_brand=loc_data["brand"]
                    )
                )
                receipts.append(receipt)
        
        return receipts
    
    async def create_business_trip_receipts(self) -> List[ReceiptWithLocationModel]:
        """Crear recibos que simulen viajes de negocios"""
        receipts = []
        
        # Gastos en Santiago (casa)
        santiago_locations = [
            (-33.4489, -70.6693, "Santiago Centro"),
            (-33.4520, -70.6650, "Providencia")
        ]
        
        for i, (lat, lng, name) in enumerate(santiago_locations):
            location_dict = {
                "coordinates": {"latitude": lat, "longitude": lng},
                "address": {"formatted_address": f"{name}, Santiago"},
                "location_type": "store",
                "source": "geocoded"
            }
            
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName=f"Local {name}",
                folioNumber=f"HOME-{i:03d}",
                date=datetime.utcnow() - timedelta(days=15 + i),
                description="Gasto local",
                totalAmount=12000.0,
                category="Alimentación",
                locationData=LocationDataModel(
                    location=location_dict,
                    extraction_method="geocoded",
                    confidence=0.8
                )
            )
            receipts.append(receipt)
        
        # Gastos en viaje (Valparaíso - ~120km de Santiago)
        valparaiso_locations = [
            (-33.0458, -71.6197, "Hotel Valparaíso", "Hospedaje", 45000.0),
            (-33.0470, -71.6180, "Restaurante Puerto", "Alimentación", 25000.0),
            (-33.0440, -71.6210, "Taxi Valparaíso", "Transporte", 15000.0),
            (-33.0465, -71.6190, "Supermercado", "Alimentación", 18000.0)
        ]
        
        for i, (lat, lng, name, category, amount) in enumerate(valparaiso_locations):
            location_dict = {
                "coordinates": {"latitude": lat, "longitude": lng},
                "address": {"formatted_address": f"{name}, Valparaíso"},
                "location_type": "store",
                "source": "geocoded"
            }
            
            receipt = ReceiptWithLocationModel(
                user="507f1f77bcf86cd799439011",
                companyName=name,
                folioNumber=f"TRIP-{i:03d}",
                date=datetime.utcnow() - timedelta(days=10 - i),
                description=f"Gasto viaje - {name}",
                totalAmount=amount,
                category=category,
                locationData=LocationDataModel(
                    location=location_dict,
                    extraction_method="geocoded",
                    confidence=0.8
                )
            )
            receipts.append(receipt)
        
        return receipts


async def main():
    """Función principal"""
    demo = GeolocationDemo()
    await demo.run_complete_demo()


if __name__ == "__main__":
    # Ejecutar demostración
    asyncio.run(main())
