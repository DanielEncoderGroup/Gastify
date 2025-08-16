from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Any, Optional
import os
import uuid
import shutil
import logging
from datetime import datetime

from app.api.deps import get_current_user
from app.models.user import UserPublic
from app.services.ocr_service import FreeOCRService
from app.services.intelligent_ocr_service import IntelligentOCRService
from app.services.hybrid_ocr_service import HybridOCRService
from app.services.chile_ml_categorization import ChileCategorizerService
from app.services.geolocation_service import GeolocationService
from app.models.receipt import ReceiptModel, OCRDataModel, CategoryPrediction, ChileSpecificData, LocationDataModel

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/analyze-receipt", status_code=status.HTTP_200_OK)
async def analyze_receipt(
    image: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Analiza automáticamente un recibo usando OCR, categorización ML y geolocalización.
    Retorna todos los datos extraídos sin guardar el recibo.
    """
    
    # Validar que sea una imagen
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )
    
    # Crear directorio temporal si no existe
    os.makedirs("temp", exist_ok=True)
    
    # Generar nombre único para el archivo temporal
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"temp_{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join("temp", unique_filename)
    
    try:
        # Guardar archivo temporal
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Inicializar servicios
        ocr_service = FreeOCRService()
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        
        # Procesar OCR
        logger.info(f"Iniciando análisis OCR para usuario {current_user.id}")
        extracted_data = ocr_service.extract_receipt_data(temp_file_path)
        
        # Crear modelo OCR
        ocr_data = {
            "vendor": extracted_data.get("vendor"),
            "total_amount": extracted_data.get("total_amount"),
            "date": extracted_data.get("date"),
            "items": extracted_data.get("items", []),
            "raw_text": extracted_data.get("raw_text", ""),
            "confidence": extracted_data.get("confidence", 0.0)
        }
        
        # Categorización ML
        category_data = None
        if extracted_data.get("raw_text"):
            try:
                categorization_result = categorizer.categorize_receipt(extracted_data.get("raw_text"))
                category_data = {
                    "category": categorization_result["category"],
                    "confidence": categorization_result["confidence"],
                    "method": categorization_result["method"],
                    "chile_specific": {
                        "rut_detected": categorization_result["chile_specific"]["rut_detected"],
                        "document_type": categorization_result["chile_specific"]["document_type"],
                        "iva_detected": categorization_result["chile_specific"]["iva_detected"],
                        "known_brand": categorization_result["chile_specific"]["known_brand"]
                    },
                    "all_probabilities": categorization_result["all_probabilities"]
                }
                logger.info(f"Categorización: {categorization_result['category']} ({categorization_result['confidence']:.2f})")
            except Exception as e:
                logger.error(f"Error en categorización: {str(e)}")
        
        # Geolocalización
        location_data = None
        try:
            location_result = await geolocation_service.process_receipt_location(extracted_data.get("raw_text", ""))
            if location_result:
                location_data = {
                    "location": location_result,
                    "extraction_method": location_result.get("extraction_method", "unknown"),
                    "confidence": location_result.get("confidence", 0.0)
                }
                logger.info(f"Geolocalización exitosa: {location_data['confidence']:.2f}")
        except Exception as e:
            logger.error(f"Error en geolocalización: {str(e)}")
        
        # Generar datos sugeridos para el formulario
        suggested_data = {
            "companyName": ocr_data.get("vendor", ""),
            "totalAmount": ocr_data.get("total_amount", 0.0),
            "date": ocr_data.get("date", ""),
            "category": category_data.get("category", "") if category_data else "",
            "description": f"Compra en {ocr_data.get('vendor', 'establecimiento')}" if ocr_data.get('vendor') else "",
            "folioNumber": "",  # Intentar extraer del texto
            "items": ocr_data.get("items", [])
        }
        
        # Intentar extraer número de folio del texto
        if ocr_data.get("raw_text"):
            import re
            folio_patterns = [
                r'(?:folio|boleta|factura|n[oº°]?\.?\s*):?\s*(\d+)',
                r'(?:doc|documento)\s*n[oº°]?\.?\s*:?\s*(\d+)',
                r'(\d{6,})',  # Números largos que podrían ser folios
            ]
            
            for pattern in folio_patterns:
                match = re.search(pattern, ocr_data["raw_text"], re.IGNORECASE)
                if match:
                    suggested_data["folioNumber"] = match.group(1)
                    break
        
        # Respuesta completa
        response = {
            "success": True,
            "message": "Análisis completado exitosamente",
            "analysis": {
                "ocr": ocr_data,
                "categorization": category_data,
                "geolocation": location_data,
                "suggested_form_data": suggested_data
            },
            "confidence_summary": {
                "ocr_confidence": ocr_data.get("confidence", 0.0),
                "category_confidence": category_data.get("confidence", 0.0) if category_data else 0.0,
                "location_confidence": location_data.get("confidence", 0.0) if location_data else 0.0,
                "overall_confidence": (
                    ocr_data.get("confidence", 0.0) + 
                    (category_data.get("confidence", 0.0) if category_data else 0.0) + 
                    (location_data.get("confidence", 0.0) if location_data else 0.0)
                ) / 3
            }
        }
        
        logger.info(f"Análisis completado para usuario {current_user.id} con confianza general: {response['confidence_summary']['overall_confidence']:.2f}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error en análisis de recibo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando el recibo: {str(e)}"
        )
    
    finally:
        # Limpiar archivo temporal
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception as e:
            logger.warning(f"No se pudo eliminar archivo temporal: {str(e)}")

@router.post("/analyze-receipt-intelligent", status_code=status.HTTP_200_OK)
async def analyze_receipt_intelligent(
    image: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Análisis inteligente 100% automatizado usando multi-engine OCR.
    Objetivo: >95% precisión sin intervención manual.
    """
    
    # Validar que sea una imagen
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )
    
    # Crear directorio temporal si no existe
    os.makedirs("temp", exist_ok=True)
    
    # Generar nombre único para el archivo temporal
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"intelligent_{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join("temp", unique_filename)
    
    try:
        # Guardar archivo temporal
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Iniciando análisis con Google Vision API (primario) para: {unique_filename}")
        
        # Usar Google Vision API directamente como engine primario
        hybrid_ocr = HybridOCRService()
        hybrid_result = await hybrid_ocr.process_receipt_hybrid(temp_file_path, force_engine="google_vision")
        
        # Extraer datos del resultado híbrido
        ocr_result = hybrid_result.data
        ocr_result['engine_used'] = hybrid_result.engine_used
        ocr_result['processing_time'] = hybrid_result.processing_time
        ocr_result['fallback_used'] = hybrid_result.fallback_used
        
        # Servicios adicionales (categorización y geolocalización)
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        
        # Categorización automática (si no se hizo en OCR)
        categorization_result = None
        if not ocr_result.get('category_prediction'):
            try:
                raw_text = ocr_result.get('raw_text', '')
                if raw_text:
                    categorization_result = categorizer.categorize_receipt(raw_text)
            except Exception as e:
                logger.warning(f"Error en categorización: {e}")
        
        # Geolocalización automática
        geolocation_result = None
        try:
            vendor = ocr_result.get('vendor', '')
            raw_text = ocr_result.get('raw_text', '')
            if vendor or raw_text:
                geolocation_result = geolocation_service.extract_location_from_text(raw_text)
        except Exception as e:
            logger.warning(f"Error en geolocalización: {e}")
        
        # Calcular confianza general
        ocr_confidence = ocr_result.get('confidence', 0.0)
        category_confidence = (
            ocr_result.get('category_prediction', {}).get('confidence', 0.0) or
            (categorization_result.get('confidence', 0.0) if categorization_result else 0.0)
        )
        location_confidence = geolocation_result.get('confidence', 0.0) if geolocation_result else 0.0
        
        overall_confidence = (
            ocr_confidence * 0.6 +
            category_confidence * 0.25 +
            location_confidence * 0.15
        )
        
        # Preparar datos sugeridos para el formulario
        suggested_form_data = {
            "companyName": ocr_result.get('vendor', '') or 'Empresa no identificada',
            "totalAmount": ocr_result.get('total_amount', 0),
            "date": ocr_result.get('date', ''),
            "category": (
                ocr_result.get('category_prediction', {}).get('category') or
                (categorization_result.get('category') if categorization_result else 'Otros')
            ),
            "description": ocr_result.get('description', f"Recibo procesado automáticamente - {len(ocr_result.get('items', []))} productos"),
            "folioNumber": ocr_result.get('folio_number', ''),
            "location": ocr_result.get('location', ''),
            "items": ocr_result.get('items', [])
        }
        
        # Respuesta completa
        response = {
            "success": True,
            "message": f"Análisis inteligente completado con {overall_confidence:.1%} de confianza",
            "analysis": {
                "ocr": {
                    "vendor": ocr_result.get('vendor'),
                    "total_amount": ocr_result.get('total_amount'),
                    "date": ocr_result.get('date'),
                    "items": ocr_result.get('extracted_items', []),
                    "raw_text": ocr_result.get('raw_text', ''),
                    "confidence": ocr_confidence,
                    "processing_metadata": ocr_result.get('processing_metadata', {}),
                    "extraction_quality": ocr_result.get('extraction_quality', 'unknown'),
                    "fully_automated": ocr_result.get('fully_automated', False)
                },
                "categorization": {
                    "category": suggested_form_data["category"],
                    "confidence": category_confidence,
                    "method": (
                        ocr_result.get('category_prediction', {}).get('method') or
                        (categorization_result.get('method') if categorization_result else 'unknown')
                    ),
                    "chile_specific": (
                        ocr_result.get('category_prediction', {}).get('chile_specific') or
                        (categorization_result.get('chile_specific') if categorization_result else {})
                    )
                } if categorization_result or ocr_result.get('category_prediction') else None,
                "geolocation": {
                    "location": geolocation_result.get('location') if geolocation_result else None,
                    "extraction_method": geolocation_result.get('extraction_method', 'none') if geolocation_result else 'none',
                    "confidence": location_confidence
                } if geolocation_result else None,
                "suggested_form_data": suggested_form_data
            },
            "confidence_summary": {
                "ocr_confidence": ocr_confidence,
                "category_confidence": category_confidence,
                "location_confidence": location_confidence,
                "overall_confidence": overall_confidence,
                "fully_automated": overall_confidence >= 0.95,
                "requires_manual_review": overall_confidence < 0.85
            }
        }
        
        logger.info(f"Análisis inteligente completado: {overall_confidence:.1%} confianza, {len(ocr_result.get('extracted_items', []))} productos")
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error en análisis inteligente: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )
    
    finally:
        # Limpiar archivo temporal
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except:
            pass

@router.post("/health-check", status_code=status.HTTP_200_OK)
async def health_check() -> Any:
    """
    Verifica el estado de los servicios OCR
    """
    try:
        # Inicializar servicios
        ocr_service = FreeOCRService()
        intelligent_ocr = IntelligentOCRService()
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        
        return {
            "status": "healthy",
            "services": {
                "ocr_basic": "operational",
                "ocr_intelligent": "operational",
                "categorization": "operational",
                "geolocation": "operational"
            },
            "engines_available": {
                "tesseract": True,
                "easyocr": "easyocr" in str(intelligent_ocr.engines.keys()),
                "paddleocr": "paddleocr" in str(intelligent_ocr.engines.keys())
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en servicios: {str(e)}"
        )
