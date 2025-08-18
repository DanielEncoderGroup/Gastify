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
# from app.services.ocr_service import FreeOCRService  # Ya no se usa, reemplazado por HybridOCRService
from app.services.intelligent_ocr_service import IntelligentOCRService
from app.services.hybrid_ocr_service import HybridOCRService
from app.services.chile_ml_categorization import ChileCategorizerService
from app.services.geolocation_service import GeolocationService
from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced
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
        hybrid_ocr = HybridOCRService()
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        
        # Procesar OCR
        logger.info(f"Iniciando análisis OCR para usuario {current_user.id}")
        # 1. OCR con Google Vision API
        hybrid_result = await hybrid_ocr.process_receipt_hybrid(temp_file_path, force_engine="google_vision")
        ocr_result = hybrid_result.data
        
        # Crear modelo OCR
        ocr_data = {
            "vendor": ocr_result.get("vendor"),
            "total_amount": ocr_result.get("total_amount"),
            "date": ocr_result.get("date"),
            "items": ocr_result.get("items", []),
            "raw_text": ocr_result.get("raw_text", ""),
            "confidence": ocr_result.get("confidence", 0.0)
        }
        
        # Categorización ML
        category_data = None
        if ocr_result.get("raw_text"):
            try:
                categorization_result = categorizer.categorize_receipt(ocr_result.get("raw_text"))
                chile_specific = categorization_result.get("chile_specific", {})
                category_data = {
                    "category": categorization_result.get("category", ""),
                    "confidence": categorization_result.get("confidence", 0.0),
                    "method": categorization_result.get("method", ""),
                    "chile_specific": {
                        "rut_detected": chile_specific.get("rut_detected", False),
                        "document_type": chile_specific.get("document_type", ""),
                        "iva_detected": chile_specific.get("iva_detected", False),
                        "known_brand": chile_specific.get("known_brand", "")
                    },
                    "all_probabilities": categorization_result.get("all_probabilities", {})
                }
                logger.info(f"Categorización: {categorization_result['category']} ({categorization_result['confidence']:.2f})")
            except Exception as e:
                logger.error(f"Error en categorización: {str(e)}")
        
        # Geolocalización
        location_data = None
        try:
            location_result = await geolocation_service.process_receipt_location(ocr_result.get("raw_text", ""))
            if location_result:
                location_data = LocationDataModel(
                    address=getattr(location_result, 'address', None),
                    city=getattr(location_result, 'city', None),
                    region=getattr(location_result, 'region', None),
                    country=getattr(location_result, 'country', None),
                    latitude=getattr(location_result, 'latitude', None),
                    longitude=getattr(location_result, 'longitude', None),
                    confidence=getattr(location_result, 'confidence', 0.0)
                )
                logger.info(f"Geolocalización exitosa: {location_data.confidence:.2f}")
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
        
        # Log del raw_text extraído por Google Vision
        raw_text = hybrid_result.data.get('raw_text', '')
        logger.info(f"📄 RAW TEXT EXTRAÍDO:\n{raw_text[:1000]}...")  # Primeros 1000 caracteres
        
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
        location_confidence = getattr(geolocation_result, 'confidence', 0.0) if geolocation_result else 0.0
        
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
                    "location": getattr(geolocation_result, 'location', None) if geolocation_result else None,
                    "extraction_method": getattr(geolocation_result, 'extraction_method', 'none') if geolocation_result else 'none',
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
                logger.info(f"Archivo temporal eliminado: {temp_file_path}")
        except Exception as e:
            logger.warning(f"No se pudo eliminar archivo temporal: {e}")


@router.post("/analyze-receipt-advanced", status_code=status.HTTP_200_OK)
async def analyze_receipt_advanced(
    image: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
{{ ... }}
    Análisis avanzado de recibos usando el parser estructurado chileno.
    Extrae productos, transacciones y ubicación con máxima precisión.
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
    unique_filename = f"advanced_{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join("temp", unique_filename)
    
    try:
        # Guardar archivo temporal
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Iniciando análisis avanzado con parser chileno para: {unique_filename}")
        
        # Paso 1: OCR con Google Vision API para obtener raw_text
        hybrid_ocr = HybridOCRService()
        hybrid_result = await hybrid_ocr.process_receipt_hybrid(temp_file_path, force_engine="google_vision")
        raw_text = hybrid_result.data.get("raw_text", "")
        basic_ocr_result = hybrid_result.data
        
        if not raw_text:
            raise HTTPException(
                status_code=400,
                detail="No se pudo extraer texto de la imagen"
            )
        
        # Paso 2: Parser Avanzado Chileno
        parser = ChileReceiptParserAdvanced()
        parsed_result = parser.parse_receipt(raw_text)
        
        # Paso 3: Servicios adicionales
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        
        # Categorización inteligente
        category_data = None
        try:
            categorization_result = categorizer.categorize_receipt(raw_text)
            category_data = {
                "category": categorization_result["category"],
                "confidence": categorization_result["confidence"],
                "method": categorization_result["method"],
                "chile_specific": categorization_result["chile_specific"],
                "all_probabilities": categorization_result["all_probabilities"]
            }
        except Exception as e:
            logger.warning(f"Error en categorización: {e}")
        
        # Geolocalización avanzada
        location_data = None
        try:
            if parsed_result.location and parsed_result.location.store_name:
                location_text = f"{parsed_result.location.store_name} {parsed_result.location.address or ''}"
            else:
                location_text = raw_text
            
            location_result = await geolocation_service.process_receipt_location(location_text)
            if location_result:
                location_data = {
                    "location": location_result,
                    "extraction_method": location_result.get("extraction_method", "parser"),
                    "confidence": location_result.get("confidence", 0.0)
                }
        except Exception as e:
            logger.warning(f"Error en geolocalización: {e}")
        
        # Convertir productos del parser a formato API
        structured_products = []
        for product in parsed_result.products:
            structured_products.append({
                "name": product.name,
                "quantity": product.quantity,
                "unit_price": product.unit_price,
                "total_price": product.total_price,
                "barcode": product.barcode,
                "sku": product.sku,
                "confidence": product.confidence
            })
        
        # Datos de transacción estructurados con manejo seguro
        transaction_data = None
        if parsed_result.transaction:
            transaction_data = {
                "total_amount": getattr(parsed_result.transaction, 'total_amount', None),
                "subtotal": getattr(parsed_result.transaction, 'subtotal', None),
                "iva_amount": getattr(parsed_result.transaction, 'iva_amount', None),
                "iva_rate": getattr(parsed_result.transaction, 'iva_rate', None),
                "total_items": getattr(parsed_result.transaction, 'total_items', None),
                "payment_method": getattr(parsed_result.transaction, 'payment_method', None),
                "change_amount": getattr(parsed_result.transaction, 'change_amount', None),
                "confidence": getattr(parsed_result.transaction, 'confidence', 0.0)
            }
        
        # Datos de ubicación estructurados con manejo seguro
        location_parsed_data = None
        if parsed_result.location:
            location_parsed_data = {
                "store_name": getattr(parsed_result.location, 'store_name', None),
                "address": getattr(parsed_result.location, 'address', None),
                "city": getattr(parsed_result.location, 'city', None),
                "receipt_number": getattr(parsed_result.location, 'receipt_number', None),
                "transaction_date": getattr(parsed_result.location, 'transaction_date', None),
                "transaction_time": getattr(parsed_result.location, 'transaction_time', None),
                "register": getattr(parsed_result.location, 'register', None),
                "confidence": getattr(parsed_result.location, 'confidence', 0.0)
            }
        
        # Generar datos sugeridos para formulario con manejo seguro de atributos
        suggested_form_data = {
            "companyName": getattr(parsed_result.location, 'store_name', '') if parsed_result.location else "",
            "totalAmount": getattr(parsed_result.transaction, 'total_amount', 0.0) if parsed_result.transaction else 0.0,
            "date": getattr(parsed_result.location, 'transaction_date', '') if parsed_result.location else "",
            "category": category_data.get("category", "") if category_data else "",
            "description": f"Compra con {len(structured_products)} productos" if structured_products else "Compra procesada automáticamente",
            "folioNumber": getattr(parsed_result.location, 'receipt_number', '') if parsed_result.location else "",
            "detailed_products": structured_products,
            "transaction_data": transaction_data,
            "location_data": location_parsed_data,
            "chile_metadata": {
                "rut_emisor": getattr(parsed_result.location, 'rut', None) if parsed_result.location else None,
                "folio": getattr(parsed_result.location, 'receipt_number', None) if parsed_result.location else None,
                "subtotal": getattr(parsed_result.transaction, 'subtotal', None) if parsed_result.transaction else None,
                "iva_amount": getattr(parsed_result.transaction, 'iva_amount', None) if parsed_result.transaction else None,
                "currency": "CLP"
            }
        }
        
        # Calcular métricas de confianza con manejo seguro
        parser_confidence = getattr(parsed_result, 'confidence', 0.0)
        products_confidence = getattr(parsed_result, 'products_confidence', 0.0)
        transaction_confidence = getattr(parsed_result, 'transaction_confidence', 0.0)
        location_confidence = getattr(parsed_result, 'location_confidence', 0.0)
        
        confidence_summary = {
            "ocr_confidence": parser_confidence,
            "products_confidence": products_confidence,
            "transaction_confidence": transaction_confidence,
            "location_confidence": location_confidence,
            "parsing_confidence": parser_confidence,
            "category_confidence": category_data.get("confidence", 0.0) if category_data else 0.0,
            "overall_confidence": (
                parser_confidence * 0.4 +
                (category_data.get("confidence", 0.0) if category_data else 0.0) * 0.3 +
                (location_data.get("confidence", 0.0) if location_data else 0.0) * 0.3
            ),
            "fully_automated": parser_confidence >= 0.95,
            "requires_manual_review": parser_confidence < 0.80
        }
        
        # Validaciones automáticas
        validations = {
            "products_found": len(structured_products) > 0,
            "total_coherence": False,
            "chile_format": False,
            "rut_detected": False,
            "iva_detected": False
        }
        
        # Verificar coherencia de totales
        if structured_products and transaction_data:
            products_total = sum(p["total_price"] for p in structured_products if p["total_price"])
            transaction_total = transaction_data.get("subtotal") or transaction_data.get("total_amount", 0)
            if transaction_total > 0:
                difference_percentage = abs(products_total - transaction_total) / transaction_total
                validations["total_coherence"] = difference_percentage < 0.05  # 5% tolerance
        
        # Verificar indicadores chilenos
        if parsed_result.location and parsed_result.location.store_name:
            validations["chile_format"] = True
        if category_data and category_data.get("chile_specific", {}).get("rut_detected"):
            validations["rut_detected"] = True
        if transaction_data and transaction_data.get("iva_rate") == 19:
            validations["iva_detected"] = True
        
        # Respuesta completa estructurada
        response = {
            "success": True,
            "message": f"Análisis avanzado completado con {confidence_summary['overall_confidence']:.1%} de confianza",
            "analysis": {
                "parser_results": {
                    "products": structured_products,
                    "transaction": transaction_data,
                    "location": location_parsed_data,
                    "raw_text": raw_text,
                    "extraction_metadata": {
                        "products_found": len(structured_products),
                        "parser_version": "chile_advanced_v1.0",
                        "processing_date": datetime.now().isoformat()
                    }
                },
                "categorization": category_data,
                "geolocation": location_data,
                "suggested_form_data": suggested_form_data
            },
            "confidence_summary": confidence_summary,
            "validations": validations,
            "recommendations": {
                "action": "auto_save" if confidence_summary["fully_automated"] else "manual_review",
                "confidence_level": "high" if confidence_summary["overall_confidence"] >= 0.8 else "medium" if confidence_summary["overall_confidence"] >= 0.6 else "low",
                "next_steps": [
                    "Revisar productos extraídos" if not validations["products_found"] else None,
                    "Verificar totales" if not validations["total_coherence"] else None,
                    "Confirmar datos de empresa" if not validations["chile_format"] else None
                ]
            }
        }
        
        # Filtrar recomendaciones None
        response["recommendations"]["next_steps"] = [
            step for step in response["recommendations"]["next_steps"] if step is not None
        ]
        
        logger.info(f"Análisis avanzado completado: {len(structured_products)} productos, {confidence_summary['overall_confidence']:.1%} confianza")
        
        return JSONResponse(content=response)
        
    except Exception as e:
        import traceback
        logger.error(f"Error en análisis avanzado: {e}")
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando recibo avanzado: {str(e)}"
        )
    
    finally:
        # Limpiar archivo temporal
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception as e:
            logger.warning(f"No se pudo eliminar archivo temporal: {e}")

@router.post("/test-ocr")
async def test_ocr(status_code=status.HTTP_200_OK):
    """
    Verifica el estado de los servicios OCR
    """
    try:
        # Inicializar servicios
        hybrid_ocr = HybridOCRService()
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
