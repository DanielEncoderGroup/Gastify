"""
Rutas de API para Geolocalización de Gastos
==========================================

Este módulo define las rutas de API para el sistema de geolocalización,
incluyendo análisis geográfico, mapas de calor y detección de viajes.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from ..models.receipt_with_location import (
    ReceiptWithLocationModel, LocationAnalyticsModel, HeatmapDataModel,
    BusinessTripModel, LocationStatsResponse, GeocodingResponse
)
from ..models.location_models import Location, Coordinates
from ..services.geolocation_service import get_geolocation_service
from ..services.geocoding_service import get_geocoding_service
from ..core.database import get_database
from ..api.deps import get_current_user

router = APIRouter(prefix="/geolocation", tags=["geolocation"])


@router.post("/geocode", response_model=GeocodingResponse)
async def geocode_address(
    address: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Geocodificar una dirección
    """
    try:
        geocoding_service = get_geocoding_service()
        result = await geocoding_service.geocode(address)
        
        return GeocodingResponse(
            success=result.success,
            location=result.location.to_dict() if result.location else None,
            error_message=result.error_message,
            provider="integrated",
            cache_hit=result.cache_hit,
            processing_time_ms=result.processing_time_ms
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en geocodificación: {str(e)}")


@router.post("/reverse-geocode", response_model=GeocodingResponse)
async def reverse_geocode(
    lat: float = Body(...),
    lng: float = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Geocodificación inversa desde coordenadas
    """
    try:
        geocoding_service = get_geocoding_service()
        result = await geocoding_service.reverse_geocode(lat, lng)
        
        return GeocodingResponse(
            success=result.success,
            location=result.location.to_dict() if result.location else None,
            error_message=result.error_message,
            provider="integrated",
            cache_hit=result.cache_hit,
            processing_time_ms=result.processing_time_ms
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en geocodificación inversa: {str(e)}")


@router.get("/analytics/{user_id}", response_model=LocationStatsResponse)
async def get_location_analytics(
    user_id: str,
    start_date: Optional[datetime] = Query(None, description="Fecha de inicio"),
    end_date: Optional[datetime] = Query(None, description="Fecha de fin"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener análisis geográfico de gastos de un usuario
    """
    try:
        # Verificar autorización
        if current_user["user_id"] != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Obtener recibos del usuario
        db = get_database()
        receipts_collection = db.receipts
        
        # Construir filtros
        filters = {"user": ObjectId(user_id)}
        
        if start_date:
            filters["date"] = {"$gte": start_date}
        if end_date:
            if "date" in filters:
                filters["date"]["$lte"] = end_date
            else:
                filters["date"] = {"$lte": end_date}
        
        if category:
            filters["category"] = category
        
        # Obtener recibos
        receipts_cursor = receipts_collection.find(filters)
        receipts_data = await receipts_cursor.to_list(length=None)
        
        # Convertir a modelos con ubicación (simulado por ahora)
        receipts_with_location = []
        for receipt_data in receipts_data:
            # Por ahora, crear datos de ubicación simulados
            # En producción, estos datos vendrían del procesamiento real
            receipt_model = ReceiptWithLocationModel(**receipt_data)
            receipts_with_location.append(receipt_model)
        
        # Obtener análisis
        geolocation_service = get_geolocation_service()
        analytics = await geolocation_service.get_location_analytics(receipts_with_location)
        
        return LocationStatsResponse(**analytics)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo análisis: {str(e)}")


@router.get("/heatmap/{user_id}", response_model=HeatmapDataModel)
async def get_heatmap_data(
    user_id: str,
    start_date: Optional[datetime] = Query(None, description="Fecha de inicio"),
    end_date: Optional[datetime] = Query(None, description="Fecha de fin"),
    categories: Optional[str] = Query(None, description="Categorías separadas por coma"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener datos para mapa de calor de gastos
    """
    try:
        # Verificar autorización
        if current_user["user_id"] != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Obtener recibos del usuario
        db = get_database()
        receipts_collection = db.receipts
        
        # Construir filtros
        filters = {"user": ObjectId(user_id)}
        
        if start_date:
            filters["date"] = {"$gte": start_date}
        if end_date:
            if "date" in filters:
                filters["date"]["$lte"] = end_date
            else:
                filters["date"] = {"$lte": end_date}
        
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(",")]
            filters["category"] = {"$in": category_list}
        
        # Obtener recibos
        receipts_cursor = receipts_collection.find(filters)
        receipts_data = await receipts_cursor.to_list(length=None)
        
        # Convertir a modelos con ubicación
        receipts_with_location = []
        for receipt_data in receipts_data:
            receipt_model = ReceiptWithLocationModel(**receipt_data)
            receipts_with_location.append(receipt_model)
        
        # Generar mapa de calor
        geolocation_service = get_geolocation_service()
        heatmap_filters = {
            "start_date": start_date,
            "end_date": end_date,
            "categories": category_list
        }
        
        heatmap_data = await geolocation_service.generate_heatmap(
            receipts_with_location, heatmap_filters
        )
        
        return heatmap_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando mapa de calor: {str(e)}")


@router.get("/business-trips/{user_id}", response_model=List[BusinessTripModel])
async def get_business_trips(
    user_id: str,
    start_date: Optional[datetime] = Query(None, description="Fecha de inicio"),
    end_date: Optional[datetime] = Query(None, description="Fecha de fin"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener viajes de negocios detectados automáticamente
    """
    try:
        # Verificar autorización
        if current_user["user_id"] != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Obtener recibos del usuario
        db = get_database()
        receipts_collection = db.receipts
        
        # Construir filtros
        filters = {"user": ObjectId(user_id)}
        
        if start_date:
            filters["date"] = {"$gte": start_date}
        if end_date:
            if "date" in filters:
                filters["date"]["$lte"] = end_date
            else:
                filters["date"] = {"$lte": end_date}
        
        # Obtener recibos
        receipts_cursor = receipts_collection.find(filters)
        receipts_data = await receipts_cursor.to_list(length=None)
        
        # Convertir a modelos con ubicación
        receipts_with_location = []
        for receipt_data in receipts_data:
            receipt_model = ReceiptWithLocationModel(**receipt_data)
            receipts_with_location.append(receipt_model)
        
        # Detectar viajes de negocios
        geolocation_service = get_geolocation_service()
        business_trips = geolocation_service.analytics.detect_business_trips(receipts_with_location)
        
        # Asignar user_id a los viajes
        for trip in business_trips:
            trip.user_id = user_id
        
        return business_trips
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detectando viajes: {str(e)}")


@router.post("/business-trips/{trip_id}/confirm")
async def confirm_business_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirmar un viaje de negocios detectado automáticamente
    """
    try:
        # En una implementación completa, esto actualizaría la base de datos
        # Por ahora, solo retornamos éxito
        
        return {"message": f"Viaje {trip_id} confirmado como viaje de negocios"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error confirmando viaje: {str(e)}")


@router.post("/receipts/{receipt_id}/process-location")
async def process_receipt_location(
    receipt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Procesar ubicación de un recibo específico
    """
    try:
        # Obtener recibo
        db = get_database()
        receipts_collection = db.receipts
        
        receipt_data = await receipts_collection.find_one({"_id": ObjectId(receipt_id)})
        
        if not receipt_data:
            raise HTTPException(status_code=404, detail="Recibo no encontrado")
        
        # Verificar autorización
        if str(receipt_data["user"]) != current_user["user_id"] and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Procesar ubicación
        geolocation_service = get_geolocation_service()
        
        # Obtener texto OCR del recibo
        ocr_text = ""
        if receipt_data.get("ocrData") and receipt_data["ocrData"].get("raw_text"):
            ocr_text = receipt_data["ocrData"]["raw_text"]
        else:
            # Si no hay OCR, usar datos básicos
            ocr_text = f"{receipt_data.get('companyName', '')} {receipt_data.get('description', '')}"
        
        location_data = await geolocation_service.process_receipt_location(ocr_text)
        
        if location_data:
            # Actualizar recibo con datos de ubicación
            update_data = {
                "locationData": location_data.model_dump(),
                "updatedAt": datetime.utcnow()
            }
            
            await receipts_collection.update_one(
                {"_id": ObjectId(receipt_id)},
                {"$set": update_data}
            )
            
            return {
                "message": "Ubicación procesada exitosamente",
                "location_data": location_data.model_dump()
            }
        else:
            return {
                "message": "No se pudo determinar la ubicación del recibo",
                "location_data": None
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando ubicación: {str(e)}")


@router.get("/cache/stats")
async def get_cache_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estadísticas del caché de geocodificación (solo admin)
    """
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores")
        
        geocoding_service = get_geocoding_service()
        stats = geocoding_service.get_cache_stats()
        
        return {
            "cache_stats": stats,
            "message": "Estadísticas del caché obtenidas exitosamente"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@router.post("/cache/clear")
async def clear_cache(
    current_user: dict = Depends(get_current_user)
):
    """
    Limpiar caché de geocodificación (solo admin)
    """
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores")
        
        geocoding_service = get_geocoding_service()
        geocoding_service.clear_cache()
        
        return {"message": "Caché limpiado exitosamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando caché: {str(e)}")


@router.get("/nearby-locations")
async def get_nearby_locations(
    lat: float = Query(..., description="Latitud"),
    lng: float = Query(..., description="Longitud"),
    radius_km: float = Query(1.0, description="Radio en kilómetros"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener ubicaciones cercanas a unas coordenadas
    """
    try:
        # En una implementación completa, esto buscaría en una base de datos espacial
        # Por ahora, retornamos ubicaciones simuladas
        
        nearby_locations = [
            {
                "id": "loc_1",
                "name": "Jumbo Providencia",
                "category": "Supermercado",
                "coordinates": {"lat": lat + 0.001, "lng": lng + 0.001},
                "distance_km": 0.15,
                "address": "Av. Providencia 1550"
            },
            {
                "id": "loc_2", 
                "name": "Copec Estación",
                "category": "Combustible",
                "coordinates": {"lat": lat - 0.002, "lng": lng + 0.001},
                "distance_km": 0.25,
                "address": "Av. Providencia 567"
            }
        ]
        
        # Filtrar por categoría si se especifica
        if category:
            nearby_locations = [loc for loc in nearby_locations if loc["category"].lower() == category.lower()]
        
        return {
            "locations": nearby_locations,
            "search_center": {"lat": lat, "lng": lng},
            "search_radius_km": radius_km,
            "total_found": len(nearby_locations)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error buscando ubicaciones: {str(e)}")
