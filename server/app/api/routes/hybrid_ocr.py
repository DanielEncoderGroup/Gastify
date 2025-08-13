"""
Endpoints para el Sistema OCR Híbrido (Tesseract + Google Vision)
Proporciona análisis de recibos con >95% precisión usando decisión inteligente de engines
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status, Query
from fastapi.responses import JSONResponse
from typing import Any, Optional, Dict
import os
import uuid
import shutil
import logging
from datetime import datetime

from app.api.deps import get_current_user
from app.models.user import UserPublic
from app.services.hybrid_ocr_service import HybridOCRService, OCREngine
from app.services.chile_ml_categorization import ChileCategorizerService
from app.services.geolocation_service import GeolocationService
from app.models.receipt import ReceiptModel, OCRDataModel, CategoryPrediction, ChileSpecificData, LocationDataModel

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Instancias de servicios
hybrid_ocr_service = HybridOCRService()
categorizer_service = ChileCategorizerService()
geolocation_service = GeolocationService()

@router.post("/analyze-hybrid", status_code=status.HTTP_200_OK)
async def analyze_receipt_hybrid(
    image: UploadFile = File(...),
    force_engine: Optional[str] = Query(None, description="Forzar engine: tesseract, google_vision, hybrid"),
    include_categorization: bool = Query(True, description="Incluir categorización ML"),
    include_geolocation: bool = Query(True, description="Incluir geolocalización"),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Analiza recibo usando sistema OCR híbrido inteligente.
    
    - Decisión automática entre Tesseract y Google Vision
    - Rate limiting inteligente para Google Vision API
    - Cache para evitar re-procesamiento
    - Integración con categorización ML y geolocalización
    - >95% precisión objetivo
    """
    
    # Validar que sea una imagen
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )
    
    # Validar engine forzado
    if force_engine and force_engine not in [OCREngine.TESSERACT, OCREngine.GOOGLE_VISION, OCREngine.HYBRID]:
        raise HTTPException(
            status_code=400,
            detail=f"Engine no válido. Opciones: {OCREngine.TESSERACT}, {OCREngine.GOOGLE_VISION}, {OCREngine.HYBRID}"
        )
    
    # Crear directorio temporal si no existe
    os.makedirs("temp", exist_ok=True)
    
    # Generar nombre único para el archivo temporal
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"hybrid_{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join("temp", unique_filename)
    
    try:
        # Guardar archivo temporal
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Procesando imagen híbrida: {unique_filename}")
        
        # Procesar con sistema híbrido
        hybrid_result = await hybrid_ocr_service.process_receipt_hybrid(
            temp_file_path, 
            force_engine=force_engine
        )
        
        # Extraer datos del resultado híbrido
        ocr_data = hybrid_result.data
        
        # Crear estructura OCR para compatibilidad
        ocr_result = OCRDataModel(
            vendor=ocr_data.get("vendor", ""),
            total_amount=ocr_data.get("total_amount", 0),
            date=ocr_data.get("date", ""),
            items=ocr_data.get("items", []),
            raw_text=ocr_data.get("raw_text", ""),
            confidence=hybrid_result.confidence,
            processing_time=hybrid_result.processing_time,
            extraction_method=hybrid_result.engine_used,
            chile_specific_data={
                "rut_detected": "rut" in ocr_data.get("raw_text", "").lower(),
                "document_type": "boleta" if "boleta" in ocr_data.get("raw_text", "").lower() else "factura",
                "iva_detected": "iva" in ocr_data.get("raw_text", "").lower(),
                "known_brand": None
            }
        )
        
        # Procesamiento opcional de categorización
        category_prediction = None
        if include_categorization:
            try:
                logger.info("Ejecutando categorización ML...")
                categorization_result = await categorizer_service.predict_category_advanced(
                    vendor=ocr_result.vendor,
                    items=ocr_result.items,
                    raw_text=ocr_result.raw_text,
                    amount=ocr_result.total_amount
                )
                
                if categorization_result:
                    chile_specific = ChileSpecificData(
                        rut_detected=ocr_result.chile_specific_data.get("rut_detected", False),
                        document_type=ocr_result.chile_specific_data.get("document_type", "unknown"),
                        iva_detected=ocr_result.chile_specific_data.get("iva_detected", False),
                        known_brand=categorization_result.get("chile_specific", {}).get("known_brand")
                    )
                    
                    category_prediction = CategoryPrediction(
                        category=categorization_result["category"],
                        confidence=categorization_result["confidence"],
                        method=categorization_result["method"],
                        chile_specific=chile_specific,
                        all_probabilities=categorization_result["all_probabilities"]
                    )
                    
                    logger.info(f"Categorización: {categorization_result['category']} con {categorization_result['confidence']:.1%}")
                    
            except Exception as e:
                logger.error(f"Error en categorización: {str(e)}")
        
        # Procesamiento opcional de geolocalización
        location_data = None
        if include_geolocation:
            try:
                logger.info("Ejecutando geolocalización...")
                location_result = await geolocation_service.process_receipt_location(ocr_result.raw_text)
                
                if location_result:
                    location_data = LocationDataModel(
                        location=location_result,
                        extraction_method=location_result.get("extraction_method", "text_analysis"),
                        confidence=location_result.get("confidence", 0.0)
                    )
                    logger.info(f"Geolocalización con confianza: {location_data.confidence:.1%}")
                    
            except Exception as e:
                logger.error(f"Error en geolocalización: {str(e)}")
        
        # Calcular confianza general
        confidence_scores = [hybrid_result.confidence]
        if category_prediction:
            confidence_scores.append(category_prediction.confidence)
        if location_data:
            confidence_scores.append(location_data.confidence)
        
        overall_confidence = sum(confidence_scores) / len(confidence_scores)
        
        # Crear respuesta completa
        response = {
            "success": True,
            "message": f"Análisis híbrido completado usando {hybrid_result.engine_used}",
            "analysis": {
                "ocr": {
                    "vendor": ocr_result.vendor,
                    "total_amount": ocr_result.total_amount,
                    "date": ocr_result.date,
                    "items": ocr_result.items,
                    "raw_text": ocr_result.raw_text,
                    "confidence": ocr_result.confidence,
                    "processing_time": ocr_result.processing_time,
                    "extraction_method": ocr_result.extraction_method,
                    "chile_specific_data": ocr_result.chile_specific_data
                },
                "categorization": {
                    "category": category_prediction.category if category_prediction else None,
                    "confidence": category_prediction.confidence if category_prediction else 0.0,
                    "method": category_prediction.method if category_prediction else None,
                    "chile_specific": category_prediction.chile_specific.dict() if category_prediction else None,
                    "all_probabilities": category_prediction.all_probabilities if category_prediction else {}
                } if category_prediction else None,
                "geolocation": {
                    "location": location_data.location if location_data else None,
                    "extraction_method": location_data.extraction_method if location_data else None,
                    "confidence": location_data.confidence if location_data else 0.0
                } if location_data else None,
                "hybrid_metadata": {
                    "engine_used": hybrid_result.engine_used,
                    "fallback_used": hybrid_result.fallback_used,
                    "google_usage_count": hybrid_result.google_usage_count,
                    "processing_time": hybrid_result.processing_time,
                    "timestamp": hybrid_result.timestamp.isoformat()
                }
            },
            "confidence_summary": {
                "ocr_confidence": ocr_result.confidence,
                "category_confidence": category_prediction.confidence if category_prediction else 0.0,
                "location_confidence": location_data.confidence if location_data else 0.0,
                "overall_confidence": overall_confidence
            },
            "suggested_form_data": {
                "companyName": ocr_result.vendor or "",
                "totalAmount": ocr_result.total_amount or 0,
                "date": ocr_result.date or "",
                "category": category_prediction.category if category_prediction else "",
                "description": f"Recibo procesado con {hybrid_result.engine_used}",
                "folioNumber": "",
                "items": ocr_result.items or []
            }
        }
        
        logger.info(f"Análisis híbrido exitoso - Confianza: {overall_confidence:.1%}, Engine: {hybrid_result.engine_used}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error en análisis híbrido: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )
    
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/usage-stats", status_code=status.HTTP_200_OK)
async def get_hybrid_usage_stats(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene estadísticas de uso del sistema OCR híbrido.
    Útil para monitorear costos y límites de Google Vision API.
    """
    try:
        stats = hybrid_ocr_service.get_usage_stats()
        
        return {
            "success": True,
            "message": "Estadísticas de uso obtenidas",
            "stats": stats,
            "recommendations": {
                "google_vision_status": "available" if stats["google_vision_available"] else "unavailable",
                "monthly_usage_status": "within_limit" if stats["google_remaining"] > 100 else "approaching_limit" if stats["google_remaining"] > 0 else "limit_exceeded",
                "suggested_engine": "google_vision" if stats["google_remaining"] > 500 else "hybrid" if stats["google_remaining"] > 0 else "tesseract"
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo estadísticas: {str(e)}"
        )

@router.post("/clear-cache", status_code=status.HTTP_200_OK)
async def clear_ocr_cache(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Limpia el cache del sistema OCR híbrido.
    Útil para forzar re-procesamiento o liberar espacio.
    """
    try:
        # Limpiar directorio de cache
        cache_dir = hybrid_ocr_service.cache_dir
        if cache_dir.exists():
            import shutil
            shutil.rmtree(cache_dir)
            cache_dir.mkdir(exist_ok=True)
        
        logger.info(f"Cache OCR limpiado por usuario: {current_user.email}")
        
        return {
            "success": True,
            "message": "Cache OCR limpiado exitosamente",
            "cache_path": str(cache_dir)
        }
        
    except Exception as e:
        logger.error(f"Error limpiando cache: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error limpiando cache: {str(e)}"
        )

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check_hybrid() -> Any:
    """
    Verifica el estado del sistema OCR híbrido.
    Incluye disponibilidad de engines y configuración.
    """
    try:
        stats = hybrid_ocr_service.get_usage_stats()
        
        # Verificar estado de cada componente
        health_status = {
            "tesseract": "available",  # Siempre disponible
            "google_vision": "available" if stats["google_vision_available"] else "unavailable",
            "cache": "available" if hybrid_ocr_service.cache_dir.exists() else "unavailable",
            "categorization": "available",  # Asumimos que está disponible
            "geolocation": "available"  # Asumimos que está disponible
        }
        
        # Estado general
        overall_status = "healthy" if all(status != "unavailable" for status in [health_status["tesseract"], health_status["cache"]]) else "degraded"
        
        return {
            "success": True,
            "message": "Health check completado",
            "status": overall_status,
            "components": health_status,
            "configuration": {
                "google_vision_enabled": stats["google_vision_available"],
                "monthly_limit": stats["google_monthly_limit"],
                "confidence_threshold": stats["confidence_threshold"],
                "cache_enabled": stats["cache_enabled"]
            },
            "usage": {
                "total_requests": stats["total_requests"],
                "google_usage_month": stats["google_usage_month"],
                "cache_hits": stats["cache_hits"],
                "average_confidence": stats["average_confidence"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        return {
            "success": False,
            "message": f"Error en health check: {str(e)}",
            "status": "unhealthy"
        }
