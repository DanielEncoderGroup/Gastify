"""
Servicio Integrador de Geolocalización para Gastify
==================================================

Este servicio integra todos los componentes de geolocalización:
- Extracción de ubicación de recibos
- Geocodificación de direcciones
- Análisis geográfico de gastos
- Generación de mapas de calor
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from collections import defaultdict
import logging

from ..models.location_models import (
    Location, LocationStats, HeatmapPoint, Coordinates
)
from ..models.receipt_with_location import (
    ReceiptWithLocationModel, LocationDataModel, LocationAnalyticsModel,
    HeatmapDataModel, BusinessTripModel
)
from .location_extraction_service import get_location_extraction_service
from .geocoding_service import get_geocoding_service
from .enhanced_categorization_service import get_enhanced_categorization_service

# Configurar logging
logger = logging.getLogger(__name__)


class GeolocationAnalytics:
    """Análisis geográfico de gastos"""
    
    def __init__(self):
        self.location_extraction = get_location_extraction_service()
        self.geocoding = get_geocoding_service()
    
    def calculate_location_stats(self, receipts: List[ReceiptWithLocationModel]) -> List[LocationStats]:
        """Calcular estadísticas por ubicación"""
        location_data = defaultdict(lambda: {
            'total_expenses': 0.0,
            'expense_count': 0,
            'categories': defaultdict(float),
            'visits': []
        })
        
        # Agrupar recibos por ubicación
        for receipt in receipts:
            if not receipt.locationData or not receipt.locationData.location:
                continue
            
            location_dict = receipt.locationData.location
            location_key = self._generate_location_key(location_dict)
            
            data = location_data[location_key]
            data['total_expenses'] += receipt.totalAmount
            data['expense_count'] += 1
            data['visits'].append(receipt.date)
            
            if receipt.category:
                data['categories'][receipt.category] += receipt.totalAmount
            
            # Guardar ubicación para referencia
            if 'location_obj' not in data:
                data['location_obj'] = Location.from_dict(location_dict)
        
        # Convertir a LocationStats
        stats = []
        for location_key, data in location_data.items():
            if 'location_obj' not in data:
                continue
            
            visits = sorted(data['visits'])
            location_stats = LocationStats(
                location=data['location_obj'],
                total_expenses=data['total_expenses'],
                expense_count=data['expense_count'],
                categories=dict(data['categories']),
                first_visit=visits[0] if visits else None,
                last_visit=visits[-1] if visits else None
            )
            
            location_stats.calculate_averages()
            stats.append(location_stats)
        
        return sorted(stats, key=lambda x: x.total_expenses, reverse=True)
    
    def generate_heatmap_data(self, receipts: List[ReceiptWithLocationModel],
                            date_range: Optional[Tuple[datetime, datetime]] = None,
                            categories: Optional[List[str]] = None) -> HeatmapDataModel:
        """Generar datos para mapa de calor"""
        filtered_receipts = self._filter_receipts(receipts, date_range, categories)
        
        # Agrupar por coordenadas (con clustering)
        coordinate_clusters = self._cluster_coordinates(filtered_receipts)
        
        # Generar puntos del mapa de calor
        points = []
        total_amount = 0.0
        
        for cluster_center, cluster_receipts in coordinate_clusters.items():
            cluster_total = sum(r.totalAmount for r in cluster_receipts)
            cluster_count = len(cluster_receipts)
            
            # Calcular intensidad (normalizada)
            intensity = min(cluster_total / 50000.0, 1.0)  # Normalizar a 50k CLP
            
            point = HeatmapPoint(
                coordinates=Coordinates(latitude=cluster_center[0], longitude=cluster_center[1]),
                intensity=intensity,
                value=cluster_total,
                count=cluster_count
            )
            
            points.append(point)
            total_amount += cluster_total
        
        # Calcular límites del mapa
        bounds = self._calculate_bounds(points)
        
        # Determinar rango de fechas
        if not date_range and filtered_receipts:
            dates = [r.date for r in filtered_receipts]
            date_range = (min(dates), max(dates))
        
        return HeatmapDataModel(
            points=[point.to_dict() for point in points],
            bounds=bounds,
            total_amount=total_amount,
            date_range={
                "start": date_range[0] if date_range else datetime.utcnow(),
                "end": date_range[1] if date_range else datetime.utcnow()
            },
            categories=categories or []
        )
    
    def detect_business_trips(self, receipts: List[ReceiptWithLocationModel],
                           user_home_location: Optional[Coordinates] = None) -> List[BusinessTripModel]:
        """Detectar viajes de negocios automáticamente"""
        if not user_home_location:
            # Intentar inferir ubicación de casa desde patrones de gasto
            user_home_location = self._infer_home_location(receipts)
        
        if not user_home_location:
            return []
        
        # Agrupar gastos por fecha y ubicación
        daily_expenses = self._group_by_date_and_location(receipts)
        
        trips = []
        current_trip = None
        
        for date, locations in sorted(daily_expenses.items()):
            # Verificar si hay gastos lejos de casa
            away_from_home = any(
                self._is_away_from_home(loc_data['coordinates'], user_home_location)
                for loc_data in locations
            )
            
            if away_from_home:
                if current_trip is None:
                    # Iniciar nuevo viaje
                    current_trip = {
                        'start_date': date,
                        'end_date': date,
                        'expenses': [],
                        'locations': set()
                    }
                
                # Extender viaje actual
                current_trip['end_date'] = date
                for loc_data in locations:
                    current_trip['expenses'].extend(loc_data['receipts'])
                    if loc_data['coordinates']:
                        current_trip['locations'].add(
                            (loc_data['coordinates'].latitude, loc_data['coordinates'].longitude)
                        )
            
            else:
                # En casa - finalizar viaje si existe
                if current_trip and (date - current_trip['end_date']).days <= 1:
                    # Crear modelo de viaje
                    trip = self._create_business_trip_model(current_trip, user_home_location)
                    if trip:
                        trips.append(trip)
                    current_trip = None
        
        # Finalizar último viaje si existe
        if current_trip:
            trip = self._create_business_trip_model(current_trip, user_home_location)
            if trip:
                trips.append(trip)
        
        return trips
    
    def _generate_location_key(self, location_dict: Dict[str, Any]) -> str:
        """Generar clave única para ubicación"""
        if location_dict.get('coordinates'):
            coords = location_dict['coordinates']
            return f"{coords['latitude']:.4f},{coords['longitude']:.4f}"
        elif location_dict.get('address', {}).get('formatted_address'):
            return location_dict['address']['formatted_address']
        else:
            return "unknown_location"
    
    def _filter_receipts(self, receipts: List[ReceiptWithLocationModel],
                        date_range: Optional[Tuple[datetime, datetime]],
                        categories: Optional[List[str]]) -> List[ReceiptWithLocationModel]:
        """Filtrar recibos por fecha y categoría"""
        filtered = receipts
        
        if date_range:
            start_date, end_date = date_range
            filtered = [r for r in filtered if start_date <= r.date <= end_date]
        
        if categories:
            filtered = [r for r in filtered if r.category in categories]
        
        # Solo recibos con ubicación
        filtered = [r for r in filtered if r.locationData and r.locationData.location]
        
        return filtered
    
    def _cluster_coordinates(self, receipts: List[ReceiptWithLocationModel],
                           cluster_radius_km: float = 0.5) -> Dict[Tuple[float, float], List[ReceiptWithLocationModel]]:
        """Agrupar recibos por proximidad geográfica"""
        clusters = {}
        
        for receipt in receipts:
            if not receipt.locationData or not receipt.locationData.location:
                continue
            
            location_dict = receipt.locationData.location
            coords_dict = getattr(location_dict, 'coordinates', None)
            
            if not coords_dict:
                continue
            
            receipt_coords = Coordinates(
                latitude=coords_dict['latitude'],
                longitude=coords_dict['longitude']
            )
            
            # Buscar cluster existente cercano
            assigned_cluster = None
            for cluster_center in clusters.keys():
                cluster_coords = Coordinates(latitude=cluster_center[0], longitude=cluster_center[1])
                distance = receipt_coords.distance_to(cluster_coords)
                
                if distance <= cluster_radius_km:
                    assigned_cluster = cluster_center
                    break
            
            if assigned_cluster:
                clusters[assigned_cluster].append(receipt)
            else:
                # Crear nuevo cluster
                new_cluster = (receipt_coords.latitude, receipt_coords.longitude)
                clusters[new_cluster] = [receipt]
        
        return clusters
    
    def _calculate_bounds(self, points: List[HeatmapPoint]) -> Dict[str, float]:
        """Calcular límites geográficos"""
        if not points:
            return {"north": 0, "south": 0, "east": 0, "west": 0}
        
        lats = [p.coordinates.latitude for p in points]
        lngs = [p.coordinates.longitude for p in points]
        
        return {
            "north": max(lats),
            "south": min(lats),
            "east": max(lngs),
            "west": min(lngs)
        }
    
    def _infer_home_location(self, receipts: List[ReceiptWithLocationModel]) -> Optional[Coordinates]:
        """Inferir ubicación de casa desde patrones de gasto"""
        # Buscar ubicación más frecuente en horarios nocturnos/fines de semana
        location_frequency = defaultdict(int)
        
        for receipt in receipts:
            if not receipt.locationData or not receipt.locationData.location:
                continue
            
            # Priorizar gastos nocturnos o de fines de semana
            is_evening = receipt.date.hour >= 19 or receipt.date.hour <= 7
            is_weekend = receipt.date.weekday() >= 5
            
            if is_evening or is_weekend:
                coords_dict = getattr(receipt.locationData.location, 'coordinates', None)
                if coords_dict:
                    key = f"{coords_dict['latitude']:.3f},{coords_dict['longitude']:.3f}"
                    location_frequency[key] += 2  # Mayor peso
            
            # También contar todos los gastos con menor peso
            coords_dict = getattr(receipt.locationData.location, 'coordinates', None)
            if coords_dict:
                key = f"{coords_dict['latitude']:.3f},{coords_dict['longitude']:.3f}"
                location_frequency[key] += 1
        
        if not location_frequency:
            return None
        
        # Ubicación más frecuente
        most_frequent = max(location_frequency.items(), key=lambda x: x[1])
        lat_str, lng_str = most_frequent[0].split(',')
        
        return Coordinates(latitude=float(lat_str), longitude=float(lng_str))
    
    def _group_by_date_and_location(self, receipts: List[ReceiptWithLocationModel]) -> Dict[datetime, List[Dict]]:
        """Agrupar gastos por fecha y ubicación"""
        daily_data = defaultdict(list)
        
        for receipt in receipts:
            if not receipt.locationData or not receipt.locationData.location:
                continue
            
            date_key = receipt.date.date()
            coords_dict = getattr(receipt.locationData.location, 'coordinates', None)
            
            coordinates = None
            if coords_dict:
                coordinates = Coordinates(
                    latitude=coords_dict['latitude'],
                    longitude=coords_dict['longitude']
                )
            
            daily_data[date_key].append({
                'coordinates': coordinates,
                'receipts': [receipt]
            })
        
        return daily_data
    
    def _is_away_from_home(self, location: Optional[Coordinates], 
                          home: Coordinates, threshold_km: float = 20.0) -> bool:
        """Verificar si una ubicación está lejos de casa"""
        if not location:
            return False
        
        distance = location.distance_to(home)
        return distance > threshold_km
    
    def _create_business_trip_model(self, trip_data: Dict, home_location: Coordinates) -> Optional[BusinessTripModel]:
        """Crear modelo de viaje de negocios"""
        expenses = trip_data['expenses']
        
        if len(expenses) < 2:  # Muy pocos gastos para ser un viaje
            return None
        
        total_expenses = sum(r.totalAmount for r in expenses)
        
        # Calcular categorías
        categories = defaultdict(float)
        for receipt in expenses:
            if receipt.category:
                categories[receipt.category] += receipt.totalAmount
        
        # Calcular destinos
        destinations = []
        for lat, lng in trip_data['locations']:
            destinations.append({
                'name': f"Destino ({lat:.4f}, {lng:.4f})",
                'coordinates': {'lat': lat, 'lng': lng},
                'expenses': total_expenses / len(trip_data['locations'])  # Distribución simple
            })
        
        # Calcular confianza basada en patrones
        confidence = self._calculate_trip_confidence(trip_data, home_location)
        
        return BusinessTripModel(
            trip_id=f"trip_{trip_data['start_date'].strftime('%Y%m%d')}_{len(expenses)}",
            user_id="unknown",  # Se debe asignar externamente
            start_date=datetime.combine(trip_data['start_date'], datetime.min.time()),
            end_date=datetime.combine(trip_data['end_date'], datetime.max.time()),
            origin_location={
                'name': 'Casa',
                'coordinates': {'lat': home_location.latitude, 'lng': home_location.longitude}
            },
            destinations=destinations,
            total_expenses=total_expenses,
            expense_count=len(expenses),
            categories=dict(categories),
            confidence=confidence
        )
    
    def _calculate_trip_confidence(self, trip_data: Dict, home_location: Coordinates) -> float:
        """Calcular confianza en detección de viaje"""
        confidence = 0.0
        
        # Duración del viaje
        duration = (trip_data['end_date'] - trip_data['start_date']).days
        if 1 <= duration <= 7:
            confidence += 0.3
        elif duration > 7:
            confidence += 0.2
        
        # Número de gastos
        expense_count = len(trip_data['expenses'])
        if expense_count >= 5:
            confidence += 0.3
        elif expense_count >= 3:
            confidence += 0.2
        
        # Distancia promedio de casa
        total_distance = 0.0
        location_count = 0
        
        for lat, lng in trip_data['locations']:
            location = Coordinates(latitude=lat, longitude=lng)
            distance = location.distance_to(home_location)
            total_distance += distance
            location_count += 1
        
        if location_count > 0:
            avg_distance = total_distance / location_count
            if avg_distance > 50:  # Más de 50km de casa
                confidence += 0.4
            elif avg_distance > 20:
                confidence += 0.2
        
        return min(confidence, 1.0)


class GeolocationService:
    """Servicio principal de geolocalización"""
    
    def __init__(self):
        self.location_extraction = get_location_extraction_service()
        self.geocoding = get_geocoding_service()
        self.analytics = GeolocationAnalytics()
    
    async def process_receipt_location(self, receipt_text: str) -> Optional[LocationDataModel]:
        """Procesar ubicación de un recibo"""
        start_time = datetime.utcnow()
        
        try:
            # Extraer información de ubicación
            extraction = await self.location_extraction.extract_location_from_receipt(receipt_text)
            
            # Obtener mejor ubicación
            location = await self.location_extraction.get_best_location(extraction)
            
            if not location:
                logger.warning("No location found for receipt")
                return None
            
            # Crear datos de ubicación
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            location_data = LocationDataModel(
                location=location.to_dict(),
                extraction_method=extraction.extraction_method,
                confidence=extraction.confidence,
                extracted_address=extraction.addresses[0] if extraction.addresses else None,
                matched_brand=extraction.brands[0] if extraction.brands else None,
                geocoding_provider="integrated",
                processing_time_ms=processing_time
            )
            
            logger.info(f"Successfully processed receipt location in {processing_time:.1f}ms")
            return location_data
        
        except Exception as e:
            logger.error(f"Error processing receipt location: {e}")
            return None
    
    async def get_location_analytics(self, receipts: List[ReceiptWithLocationModel]) -> Dict[str, Any]:
        """Obtener análisis geográfico completo"""
        # Estadísticas por ubicación
        location_stats = self.analytics.calculate_location_stats(receipts)
        
        # Top ubicaciones
        top_locations = []
        for stats in location_stats[:10]:  # Top 10
            analytics_model = LocationAnalyticsModel(
                location_id=stats.location.id or "unknown",
                location_name=stats.location.get_display_name(),
                coordinates={
                    "lat": stats.location.coordinates.latitude if stats.location.coordinates else 0,
                    "lng": stats.location.coordinates.longitude if stats.location.coordinates else 0
                },
                total_spent=stats.total_expenses,
                visit_count=stats.expense_count,
                avg_expense=stats.avg_expense,
                categories=stats.categories,
                first_visit=stats.first_visit or datetime.utcnow(),
                last_visit=stats.last_visit or datetime.utcnow(),
                visit_frequency=stats.visit_frequency
            )
            top_locations.append(analytics_model)
        
        # Estadísticas generales
        total_spent = sum(r.totalAmount for r in receipts)
        total_locations = len(location_stats)
        
        # Categoría más frecuente
        category_totals = defaultdict(float)
        for receipt in receipts:
            if receipt.category:
                category_totals[receipt.category] += receipt.totalAmount
        
        most_frequent_category = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "Desconocido"
        
        # Detectar viajes de negocios
        business_trips = self.analytics.detect_business_trips(receipts)
        business_trip_percentage = (len(business_trips) / len(receipts)) * 100 if receipts else 0
        
        return {
            "total_locations": total_locations,
            "top_locations": [loc.dict() for loc in top_locations],
            "total_spent": total_spent,
            "avg_distance_from_home": 0.0,  # Calcular si se tiene ubicación de casa
            "most_frequent_category": most_frequent_category,
            "business_trip_percentage": business_trip_percentage,
            "business_trips": [trip.dict() for trip in business_trips]
        }
    
    async def generate_heatmap(self, receipts: List[ReceiptWithLocationModel],
                             filters: Optional[Dict[str, Any]] = None) -> HeatmapDataModel:
        """Generar datos de mapa de calor"""
        date_range = None
        categories = None
        
        if filters:
            if filters.get('start_date') and filters.get('end_date'):
                date_range = (filters['start_date'], filters['end_date'])
            categories = filters.get('categories')
        
        return self.analytics.generate_heatmap_data(receipts, date_range, categories)


# Instancia global del servicio
_geolocation_service: Optional[GeolocationService] = None


def get_geolocation_service() -> GeolocationService:
    """Obtener instancia del servicio de geolocalización"""
    global _geolocation_service
    
    if _geolocation_service is None:
        _geolocation_service = GeolocationService()
    
    return _geolocation_service
