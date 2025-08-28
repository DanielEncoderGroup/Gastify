from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form
from typing import List, Optional, Any, Dict
from bson import ObjectId
from app.models.receipt import ReceiptCreate, ReceiptUpdate, ReceiptStatusUpdate, ReceiptResponse, ReceiptStats, OCRDataModel, CategoryPrediction, ChileSpecificData
from app.models.user import UserPublic
from app.api.deps import get_current_user, get_database
from app.services.hybrid_ocr_service import HybridOCRService
from app.services.chile_ml_categorization import ChileCategorizerService
from app.services.geolocation_service import GeolocationService
from app.services.workflow_service import WorkflowService
from app.models.location_models import Location
from app.models.workflow import ApprovalStatus
from app.services.receipt_products_service import ReceiptProductsService
import logging
from datetime import datetime
import os
import uuid
import shutil

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=dict)
async def get_user_receipts(
    current_user: UserPublic = Depends(get_current_user),
    db = Depends(get_database)
):
    """Obtener todos los recibos del usuario actual"""
    try:
        # Buscar recibos del usuario
        receipts_cursor = db.receipts.find({"user": ObjectId(current_user.id)})
        receipts = await receipts_cursor.to_list(length=None)
        
        # Convertir ObjectId a string y formatear respuesta
        formatted_receipts = []
        for receipt in receipts:
            receipt["id"] = str(receipt["_id"])
            del receipt["_id"]
            # Convertir user a string si es ObjectId
            if hasattr(receipt.get("user"), "generation_time"):
                receipt["user"] = str(receipt["user"])
            
            # Debug products field
            print(f"🔍 BACKEND DEBUG - Receipt {receipt['id']} raw products field exists: {'products' in receipt}")
            print(f"🔍 BACKEND DEBUG - Receipt {receipt['id']} products value: {receipt.get('products', 'MISSING')}")
            print(f"🔍 BACKEND DEBUG - Receipt {receipt['id']} products type: {type(receipt.get('products'))}")
            print(f"🔍 BACKEND DEBUG - Receipt {receipt['id']} products length: {len(receipt.get('products', []))}")
            
            # Asegurar que los productos están incluidos en la respuesta
            if "products" not in receipt or receipt["products"] is None:
                receipt["products"] = []
                print(f"🔍 BACKEND DEBUG - Receipt {receipt['id']} - PRODUCTS FIELD WAS MISSING OR NULL, SET TO EMPTY")
            formatted_receipts.append(receipt)
        
        # Calcular estadísticas
        total_receipts = len(formatted_receipts)
        total_amount = sum(r.get("total_amount", 0) for r in formatted_receipts)
        pending_count = sum(1 for r in formatted_receipts if r.get("approval_status") == "en_revision")
        approved_count = sum(1 for r in formatted_receipts if r.get("approval_status") == "aceptada") 
        rejected_count = sum(1 for r in formatted_receipts if r.get("approval_status") == "rechazada")
        
        # Debug: Verificar productos antes de la respuesta final
        print(f"🔍 FINAL RESPONSE DEBUG - Total receipts: {total_receipts}")
        if formatted_receipts:
            first_receipt = formatted_receipts[0]
            print(f"🔍 FINAL RESPONSE DEBUG - First receipt products: {first_receipt.get('products', 'MISSING')}")
            print(f"🔍 FINAL RESPONSE DEBUG - First receipt products length: {len(first_receipt.get('products', []))}")

        return {
            "success": True,
            "count": total_receipts,
            "data": formatted_receipts,
            "stats": {
                "totalReceipts": total_receipts,
                "totalAmount": total_amount,
                "enRevision": pending_count,
                "aceptadas": approved_count,
                "rechazadas": rejected_count
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo recibos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/json", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_receipt_json(
    receipt_data: ReceiptCreate,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Create new receipt from JSON data (without image)
    """
    db = get_database()
    
    # Inicializar servicios
    categorizer = ChileCategorizerService()
    geolocation_service = GeolocationService()
    workflow_service = WorkflowService(db)
    
    try:
        # Categorización automática basada en companyName
        category_data = None
        try:
            # Usar el nombre de la empresa para categorización
            categorization_result = categorizer.categorize_receipt(receipt_data.companyName + " " + receipt_data.description)
            category_data = CategoryPrediction(
                category=categorization_result["category"],
                confidence=categorization_result["confidence"],
                method=categorization_result["method"],
                chile_specific=ChileSpecificData(
                    rut_detected=categorization_result["chile_specific"]["rut_detected"],
                    document_type=categorization_result["chile_specific"]["document_type"],
                    iva_detected=categorization_result["chile_specific"]["iva_detected"],
                    known_brand=categorization_result["chile_specific"]["known_brand"]
                ),
                all_probabilities=categorization_result["all_probabilities"]
            )
        except Exception as e:
            logger.warning(f"Error en categorización automática: {e}")
        
        # Geolocalización automática
        location_data = None
        try:
            location_result = await geolocation_service.process_receipt_location(receipt_data.companyName)
            if location_result:
                # location_result ya es un Location, no un diccionario
                if isinstance(location_result, Location):
                    location_data = location_result
                else:
                    location_data = Location(**location_result) if isinstance(location_result, dict) else location_result
        except Exception as e:
            logger.warning(f"Error en geolocalización automática: {e}")
        
        # Crear objeto de recibo
        print(f"🔍 BACKEND DEBUG - Received products: {len(receipt_data.products or [])}")
        print(f"🔍 BACKEND DEBUG - Received analysisData: {receipt_data.analysisData is not None}")
        print(f"🔍 BACKEND DEBUG - Products data: {receipt_data.products}")
        print(f"🔍 BACKEND DEBUG - Analysis data: {receipt_data.analysisData}")
        
        processed_products = [product.dict() if hasattr(product, 'dict') else product for product in (receipt_data.products or [])]
        print(f"🔍 BACKEND DEBUG - Processed products: {len(processed_products)}")
        
        receipt_obj = {
            "user": ObjectId(current_user.id),
            "company_name": receipt_data.companyName,
            "folio_number": receipt_data.folioNumber,
            "date": receipt_data.date,
            "description": receipt_data.description,
            "total_amount": receipt_data.totalAmount,
            "category": getattr(receipt_data, 'category', None) or (category_data.category if category_data else "Otros"),
            "ocr_data": None,  # No hay imagen procesada
            "category_prediction": category_data.dict() if category_data else None,
            "location_data": location_data.dict() if location_data else None,
            # Guardar productos y análisis detallado
            "products": processed_products,
            "analysis_data": receipt_data.analysisData,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "approval_status": ApprovalStatus.PENDING.value,
            "workflow_evaluation": None
        }
        
        # Evaluar workflow automáticamente
        workflow_evaluation = None
        try:
            # Crear modelo de recibo para evaluación - convertir campos a camelCase
            from app.models.receipt import ReceiptModel
            receipt_model_data = {
                "user": receipt_obj["user"],
                "companyName": receipt_obj["company_name"],
                "folioNumber": receipt_obj["folio_number"], 
                "date": receipt_obj["date"],
                "description": receipt_obj["description"],
                "totalAmount": receipt_obj["total_amount"],
                "imageUrl": receipt_obj.get("image_url"),
                "status": receipt_obj.get("approval_status", "en_revision"),
                "createdAt": receipt_obj["created_at"],
                "updatedAt": receipt_obj["updated_at"]
            }
            receipt_model = ReceiptModel(**receipt_model_data)
            company_id = "default_company"  # Placeholder
            workflow_evaluation = await workflow_service.evaluate_receipt_approval(receipt_model, current_user, company_id)
            receipt_obj["workflow_evaluation"] = workflow_evaluation.dict() if workflow_evaluation else None
            receipt_obj["approval_status"] = ApprovalStatus.APPROVED.value if workflow_evaluation and workflow_evaluation.action == "approve" else ApprovalStatus.PENDING.value
        except Exception as e:
            logger.warning(f"Error en evaluación de workflow: {e}")
            receipt_obj["workflow_evaluation"] = None
            receipt_obj["approval_status"] = ApprovalStatus.PENDING.value
        
        # Insertar recibo en la base de datos
        print(f"🔍 BACKEND DEBUG - About to save receipt_obj with {len(receipt_obj.get('products', []))} products")
        print(f"🔍 BACKEND DEBUG - Receipt obj keys: {list(receipt_obj.keys())}")
        result = await db.receipts.insert_one(receipt_obj)
        receipt_id = str(result.inserted_id)
        print(f"🔍 BACKEND DEBUG - Receipt saved with ID: {receipt_id}")
        
        # Preparar respuesta
        receipt_response = {
            "id": str(result.inserted_id),
            "companyName": receipt_obj["company_name"],
            "folioNumber": receipt_obj["folio_number"],
            "date": receipt_obj["date"],
            "description": receipt_obj["description"],
            "totalAmount": receipt_obj["total_amount"],
            "category": receipt_obj["category"],
            "userId": str(current_user.id),
            "createdAt": receipt_obj["created_at"].isoformat(),
            "updatedAt": receipt_obj["updated_at"].isoformat(),
            "approvalStatus": receipt_obj["approval_status"],
            "products": processed_products,
            "analysis_data": receipt_obj.get("analysis_data"),
            "ocr_data": receipt_obj.get("ocr_data"),
            "location_data": receipt_obj.get("location_data")
        }
        
        logger.info(f"Recibo creado exitosamente desde JSON: {result.inserted_id}")
        
        return {
            "success": True,
            "message": "Recibo creado exitosamente",
            "receipt": receipt_response,
            "analysis": {
                "categorization": category_data.dict() if category_data else None,
                "geolocation": location_data.dict() if location_data else None,
                "workflow": workflow_evaluation.dict() if workflow_evaluation else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error creando recibo desde JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/create-receipt-with-image", status_code=status.HTTP_201_CREATED)
async def create_receipt_with_image(
    image: UploadFile = File(...),
    companyName: str = Form(...),
    folioNumber: str = Form(...),
    date: str = Form(...),
    description: str = Form(...),
    totalAmount: float = Form(...),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Crea un recibo con imagen, extrae datos OCR y guarda productos individuales
    """
    
    # Validar que sea una imagen
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )
    
    try:
        # Inicializar servicios
        hybrid_ocr = HybridOCRService()
        categorizer = ChileCategorizerService()
        geolocation_service = GeolocationService()
        workflow_service = WorkflowService()
        products_service = ReceiptProductsService()
        
        # Crear directorio de uploads si no existe
        os.makedirs("uploads", exist_ok=True)
        
        # Generar nombre único para la imagen
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"receipt_{uuid.uuid4()}{file_extension}"
        image_path = os.path.join("uploads", unique_filename)
        
        # Guardar imagen
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Procesar OCR con análisis avanzado
        logger.info(f"Procesando OCR avanzado para recibo de {current_user.email}")
        hybrid_result = await hybrid_ocr.process_receipt_hybrid(image_path, force_engine="google_vision")
        ocr_result = hybrid_result.data
        
        # Crear datos OCR expandidos incluyendo productos detallados
        ocr_data = OCRDataModel(
            vendor=ocr_result.get("vendor"),
            total_amount=ocr_result.get("total_amount"),
            date=ocr_result.get("date"),
            items=ocr_result.get("items", []),
            raw_text=ocr_result.get("raw_text", ""),
            confidence=ocr_result.get("confidence", 0.0),
            detailed_items=ocr_result.get("extracted_items", []),
            total_items_count=len(ocr_result.get("extracted_items", [])),
            chile_metadata=ChileReceiptMetadata(
                rut_emisor=ocr_result.get("rut"),
                folio=ocr_result.get("folio_number"),
                subtotal=ocr_result.get("subtotal"),
                iva_amount=ocr_result.get("iva_amount"),
                parsing_confidence=ocr_result.get("confidence", 0.0)
            ),
            ocr_engine_used=hybrid_result.engine_used,
            processing_time=hybrid_result.processing_time
        )
        
        # Categorización ML
        category_data = None
        if ocr_result.get("raw_text"):
            try:
                categorization_result = categorizer.categorize_receipt(ocr_result.get("raw_text"))
                category_data = CategoryPrediction(
                    category=categorization_result.get("category", "Otros"),
                    confidence=categorization_result.get("confidence", 0.0),
                    method=categorization_result.get("method", "ml_prediction")
                )
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
        except Exception as e:
            logger.error(f"Error en geolocalización: {str(e)}")
        
        # Crear el recibo
        receipt_data = ReceiptModel(
            user=ObjectId(current_user.id),
            companyName=companyName,
            folioNumber=folioNumber,
            date=datetime.fromisoformat(date.replace("Z", "+00:00")),
            description=description,
            totalAmount=totalAmount,
            imageUrl=f"/uploads/{unique_filename}",
            ocrData=ocr_data,
            categoryPrediction=category_data,
            chileSpecific=ChileSpecificData(
                rut=ocr_result.get("rut"),
                iva=ocr_result.get("iva_amount"),
                folio=ocr_result.get("folio_number")
            ) if ocr_result.get("rut") else None,
            locationData=location_data
        )
        
        # Guardar en MongoDB
        db = await get_database()
        result = await db.receipts.insert_one(receipt_data.dict(by_alias=True, exclude_none=True))
        receipt_id = result.inserted_id
        
        # Guardar productos individuales en colección separada
        if ocr_data.detailed_items:
            try:
                saved_products = await products_service.save_products_from_ocr(
                    receipt_id=receipt_id,
                    user_id=ObjectId(current_user.id),
                    detailed_products=ocr_data.detailed_items
                )
                logger.info(f"Guardados {len(saved_products)} productos para recibo {receipt_id}")
                
                # Validar totales automáticamente
                validation_result = await products_service.validate_receipt_totals(
                    str(receipt_id), totalAmount
                )
                logger.info(f"Validación de totales: {validation_result['recommendation']}")
                
            except Exception as e:
                logger.error(f"Error guardando productos: {str(e)}")
                # Continúa sin fallar - los productos se pueden extraer después
        
        # Procesamiento de workflow (evaluación automática)
        workflow_result = None
        try:
            workflow_result = await workflow_service.evaluate_receipt_workflow(
                receipt_id=str(receipt_id),
                user_id=current_user.id,
                amount=totalAmount,
                category=category_data.category if category_data else "Otros"
            )
        except Exception as e:
            logger.error(f"Error en workflow: {str(e)}")
        
        # Respuesta completa con información de productos
        response = {
            "success": True,
            "message": "Recibo creado exitosamente con análisis completo",
            "receipt": {
                "id": str(receipt_id),
                "companyName": companyName,
                "folioNumber": folioNumber,
                "date": date,
                "description": description,
                "totalAmount": totalAmount,
                "imageUrl": f"/uploads/{unique_filename}",
                "status": "en_revision"
            },
            "analysis": {
                "ocr": {
                    "vendor": ocr_data.vendor,
                    "total_amount": ocr_data.total_amount,
                    "confidence": ocr_data.confidence,
                    "products_found": len(ocr_data.detailed_items),
                    "extraction_quality": "high" if ocr_data.confidence > 0.8 else "medium"
                },
                "categorization": {
                    "category": category_data.category if category_data else "Otros",
                    "confidence": category_data.confidence if category_data else 0.0
                },
                "geolocation": location_data.dict() if location_data else None,
                "workflow": workflow_result,
                "products": {
                    "total_products": len(ocr_data.detailed_items),
                    "products_with_prices": len([p for p in ocr_data.detailed_items if p.total_price]),
                    "calculated_total": sum(p.total_price or 0 for p in ocr_data.detailed_items),
                    "validation_status": validation_result['recommendation'] if 'validation_result' in locals() else "not_validated"
                }
            },
            "confidence_summary": {
                "overall_confidence": (
                    ocr_data.confidence * 0.6 +
                    (category_data.confidence if category_data else 0.0) * 0.25 +
                    (location_data.confidence if location_data else 0.0) * 0.15
                )
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error creando recibo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando recibo: {str(e)}"
        )

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    companyName: str = Form(...),
    folioNumber: str = Form(...),
    date: str = Form(...),
    description: str = Form(...),
    totalAmount: float = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Create new receipt with enhanced OCR parsing including detailed product extraction
    """
    db = get_database()
    
    # Inicializar servicios OCR, parsing detallado, categorización, geolocalización y workflow
    ocr_service = FreeOCRService()
    chile_parser = ChileReceiptParser()
    categorizer = ChileCategorizerService()
    geolocation_service = GeolocationService()
    workflow_service = WorkflowService(db)
    ocr_data = None
    category_data = None
    location_data = None
    workflow_evaluation = None
    approval_instance = None
    
    # Handle image upload if present
    image_url = None
    if image:
        try:
            # Create uploads directory if it doesn't exist
            os.makedirs("uploads", exist_ok=True)
            
            # Generate unique filename for the image
            file_extension = os.path.splitext(image.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            
            # Save the file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # Set image URL for database
            image_url = f"/uploads/{unique_filename}"
            
            # Procesar la imagen con OCR si se ha guardado correctamente
            try:
                # Obtener datos del recibo mediante OCR
                extracted_data = ocr_service.extract_receipt_data(file_path)
                
                # Crear el modelo de datos OCR
                ocr_data = OCRDataModel(
                    vendor=extracted_data.get("vendor"),
                    total_amount=extracted_data.get("total_amount"),
                    date=extracted_data.get("date"),
                    items=extracted_data.get("items", []),
                    raw_text=extracted_data.get("raw_text", ""),
                    confidence=extracted_data.get("confidence", 0.0)
                )
                
                # Procesar datos del recibo con ChileReceiptParser
                parsed_data = chile_parser.parse_receipt_data(extracted_data.get("raw_text", ""))
                
                # Categorizar el recibo usando ML
                if extracted_data.get("raw_text"):
                    try:
                        categorization_result = categorizer.categorize_receipt(extracted_data.get("raw_text"))
                        
                        # Crear datos de categoría
                        chile_specific = ChileSpecificData(
                            rut_detected=categorization_result["chile_specific"]["rut_detected"],
                            document_type=categorization_result["chile_specific"]["document_type"],
                            iva_detected=categorization_result["chile_specific"]["iva_detected"],
                            known_brand=categorization_result["chile_specific"]["known_brand"]
                        )
                        
                        category_prediction = CategoryPrediction(
                            category=categorization_result["category"],
                            confidence=categorization_result["confidence"],
                            method=categorization_result["method"],
                            chile_specific=chile_specific,
                            all_probabilities=categorization_result["all_probabilities"]
                        )
                        
                        logger.info(f"Categorización automática: {categorization_result['category']} con confianza {categorization_result['confidence']}")
                    except Exception as e:
                        logger.error(f"Error en la categorización automática: {str(e)}")
                        category_prediction = None
                
                # Procesar geolocalización del recibo
                try:
                    location_result = await geolocation_service.process_receipt_location(extracted_data.get("raw_text", ""))
                    if location_result:
                        location_data = location_result
                        logger.info(f"Geolocalización exitosa con confianza: {location_data.confidence}")
                except Exception as e:
                    logger.error(f"Error en la geolocalización: {str(e)}")
                    location_data = None
                
                logger.info(f"OCR exitoso con confianza: {ocr_data.confidence}")
                
                # Auto-completar campos vacíos con datos del OCR
                if not companyName and ocr_data.vendor:
                    companyName = ocr_data.vendor
                    
                if totalAmount == 0 and ocr_data.total_amount:
                    totalAmount = ocr_data.total_amount
                    
                # Si hay fecha extraída y es válida, intentar usarla
                if ocr_data.date:
                    try:
                        # Convertir fecha de string a datetime si es posible
                        ocr_date = datetime.fromisoformat(ocr_data.date)
                        # Solo usar si la fecha del formulario es vacía o inválida
                        if not date or date == "":
                            date = ocr_date.isoformat()
                    except (ValueError, TypeError):
                        pass
                        
            except Exception as e:
                logger.error(f"Error en OCR: {str(e)}")
                # Si el OCR falla, continuamos sin datos OCR
                pass
                
        except Exception as e:
            logger.error(f"Error al procesar la imagen: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar la imagen: {str(e)}"
            )
    
    # Create receipt document
    receipt_data = {
        "user": ObjectId(current_user.id),
        "companyName": companyName,
        "folioNumber": folioNumber,
        "date": datetime.fromisoformat(date.replace('Z', '+00:00')) if 'Z' in date else datetime.fromisoformat(date),
        "description": description,
        "totalAmount": totalAmount,
        "imageUrl": image_url,
        "ocrData": ocr_data.dict() if ocr_data else None,
        "locationData": location_data.dict() if location_data else None,
        "status": "en_revision",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Agregar datos OCR si están disponibles
    if ocr_data:
        receipt_data["ocrData"] = ocr_data.model_dump()
    
    # Insert receipt into database
    result = await db.receipts.insert_one(receipt_data)
    receipt_id = result.inserted_id
    
    # Crear modelo de recibo para evaluación de workflow
    from app.models.receipt import ReceiptModel
    receipt_for_workflow = ReceiptModel(
        id=receipt_id,
        user=ObjectId(current_user.id),
        companyName=companyName,
        folioNumber=folioNumber,
        totalAmount=totalAmount,
        date=receipt_data["date"],
        description=description
    )
    
    # Evaluar workflow de aprobación
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflow_evaluation = await workflow_service.evaluate_receipt_approval(
            receipt_for_workflow,
            current_user,
            company_id
        )
        
        # Crear instancia de aprobación
        approval_instance = await workflow_service.create_approval_instance(
            str(receipt_id),
            workflow_evaluation,
            company_id
        )
        
        # Actualizar estado del recibo basado en la evaluación
        new_status = "aprobado" if workflow_evaluation.auto_approved else "pendiente_aprobacion"
        await db.receipts.update_one(
            {"_id": receipt_id},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
        )
        
        logger.info(f"Workflow evaluado para recibo {receipt_id}: {workflow_evaluation.action}")
        
    except Exception as e:
        logger.error(f"Error en evaluación de workflow: {str(e)}")
        # Si falla el workflow, mantener estado original
        workflow_evaluation = None
        approval_instance = None
    
    # Guardar categorización si existe
    if 'category_prediction' in locals() and category_prediction:
        try:
            category_model = CategoryModel(
                receipt_id=receipt_id,
                user_id=current_user.id,
                category=category_prediction.category,
                prediction=category_prediction,
                user_corrected=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            await db.categories.insert_one(category_model.dict(by_alias=True))
            logger.info(f"Categoría guardada para el recibo {str(receipt_id)}")
        except Exception as e:
            logger.error(f"Error al guardar categoría: {str(e)}")
    
    # Return created receipt with workflow information
    response_data = {
        "id": str(receipt_id), 
        "message": "Receipt created successfully",
        "category": str(category_prediction.category) if 'category_prediction' in locals() and category_prediction else None,
        "location": {
            "extracted": location_data is not None,
            "confidence": location_data.confidence if location_data else 0.0,
            "method": location_data.extraction_method if location_data else None,
            "address": getattr(getattr(location_data.location, "address", {}), "formatted_address", None) if location_data and location_data.location else None
        } if location_data else None,
        "approval": {
            "status": approval_instance.status if approval_instance else "en_revision",
            "auto_approved": workflow_evaluation.auto_approved if workflow_evaluation else False,
            "workflow_applied": workflow_evaluation.applied_rule_id if workflow_evaluation else None,
            "reason": workflow_evaluation.reason if workflow_evaluation else None,
            "next_approver": workflow_evaluation.next_approver_id if workflow_evaluation else None,
            "approval_instance_id": str(approval_instance.id) if approval_instance else None
        } if workflow_evaluation else None
    }
    
    return response_data

@router.get("/", response_model=dict)
async def get_receipts(current_user: UserPublic = Depends(get_current_user)) -> Any:
    """
    Get all receipts for current user
    """
    db = get_database()
    
    # Find all receipts for the current user
    cursor = db.receipts.find({"user": ObjectId(current_user.id)})
    receipts = await cursor.to_list(length=100)  # Limit to 100 receipts
    
    # Format response
    formatted_receipts = []
    for receipt in receipts:
        receipt["id"] = str(receipt["_id"])
        receipt["user"] = str(receipt["user"])
        formatted_receipts.append(receipt)
    
    return {
        "success": True,
        "count": len(formatted_receipts),
        "data": formatted_receipts
    }

@router.get("/stats", response_model=dict)
async def get_receipt_stats(current_user: UserPublic = Depends(get_current_user)) -> Any:
    """
    Get receipt statistics for current user
    """
    db = get_database()
    
    # Count total receipts
    total_receipts = await db.receipts.count_documents({"user": ObjectId(current_user.id)})
    
    # Count receipts by status
    en_revision = await db.receipts.count_documents({
        "user": ObjectId(current_user.id),
        "status": "en_revision"
    })
    
    aceptadas = await db.receipts.count_documents({
        "user": ObjectId(current_user.id),
        "status": "aceptada"
    })
    
    rechazadas = await db.receipts.count_documents({
        "user": ObjectId(current_user.id),
        "status": "rechazada"
    })
    
    # Calculate total amount for accepted receipts
    pipeline = [
        {"$match": {"user": ObjectId(current_user.id), "status": "aceptada"}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]
    
    result = await db.receipts.aggregate(pipeline).to_list(length=1)
    total_amount = result[0]["total"] if result else 0
    
    return {
        "success": True,
        "data": {
            "totalReceipts": total_receipts,
            "enRevision": en_revision,
            "aceptadas": aceptadas,
            "rechazadas": rechazadas,
            "totalAmount": total_amount
        }
    }

@router.get("/{receipt_id}", response_model=dict)
async def get_receipt_by_id(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Get receipt by ID
    """
    db = get_database()
    
    # Find receipt by ID
    receipt = await db.receipts.find_one({
        "_id": ObjectId(receipt_id),
        "user": ObjectId(current_user.id)
    })
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # 🔧 CORRECCIÓN: Convertir todos los ObjectIds a strings recursivamente
    def convert_objectids(obj):
        """Convierte recursivamente ObjectIds a strings en la estructura de datos"""
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, dict):
            return {key: convert_objectids(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [convert_objectids(item) for item in obj]
        else:
            return obj
    
    # Convertir ObjectIds en todo el documento
    receipt = convert_objectids(receipt)
    
    # Format response IDs principales
    receipt["id"] = str(receipt["_id"])
    if hasattr(receipt.get("user"), "generation_time"):
        receipt["user"] = str(receipt["user"])
    
    # Debug products field for individual receipt
    print(f"🔍 BACKEND DEBUG - Individual receipt {receipt['id']} raw products field exists: {'products' in receipt}")
    print(f"🔍 BACKEND DEBUG - Individual receipt {receipt['id']} products value: {receipt.get('products', 'MISSING')}")
    print(f"🔍 BACKEND DEBUG - Individual receipt {receipt['id']} products length: {len(receipt.get('products', []))}")
    
    # Asegurar que los productos están incluidos
    if "products" not in receipt or receipt["products"] is None:
        receipt["products"] = []
        print(f"🔍 BACKEND DEBUG - Individual receipt {receipt['id']} - PRODUCTS FIELD WAS MISSING OR NULL, SET TO EMPTY")
    
    return {
        "success": True,
        "data": receipt
    }

@router.put("/{receipt_id}", response_model=dict)
async def update_receipt(
    receipt_id: str,
    companyName: Optional[str] = Form(None),
    folioNumber: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    totalAmount: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Update receipt by ID
    """
    db = get_database()
    
    # Find receipt by ID and verify ownership
    receipt = await db.receipts.find_one({
        "_id": ObjectId(receipt_id),
        "user": ObjectId(current_user.id)
    })
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Prepare update data
    update_data = {}
    
    if companyName is not None:
        update_data["companyName"] = companyName
    
    if folioNumber is not None:
        update_data["folioNumber"] = folioNumber
    
    if date is not None:
        update_data["date"] = datetime.fromisoformat(date.replace('Z', '+00:00'))
    
    if description is not None:
        update_data["description"] = description
    
    if totalAmount is not None:
        update_data["totalAmount"] = totalAmount
    
    # Handle image upload if present
    if image:
        # Delete old image if exists
        if receipt.get("imageUrl"):
            old_image_path = os.path.join(os.getcwd(), receipt["imageUrl"].lstrip("/"))
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename for the image
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Set image URL for database
        update_data["imageUrl"] = f"/uploads/{unique_filename}"
    
    # Always update the updatedAt field
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update receipt in database
    if update_data:
        await db.receipts.update_one(
            {"_id": ObjectId(receipt_id)},
            {"$set": update_data}
        )
    
    # Get updated receipt
    updated_receipt = await db.receipts.find_one({"_id": ObjectId(receipt_id)})
    
    # Format response
    updated_receipt["id"] = str(updated_receipt["_id"])
    updated_receipt["user"] = str(updated_receipt["user"])
    
    return {
        "success": True,
        "data": updated_receipt
    }

@router.patch("/{receipt_id}/status", response_model=dict)
async def update_receipt_status(
    receipt_id: str,
    status_data: ReceiptStatusUpdate = Body(...),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Update receipt status
    """
    db = get_database()
    
    # Find receipt by ID and verify ownership
    receipt = await db.receipts.find_one({
        "_id": ObjectId(receipt_id),
        "user": ObjectId(current_user.id)
    })
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Update status and updatedAt field
    await db.receipts.update_one(
        {"_id": ObjectId(receipt_id)},
        {"$set": {
            "status": status_data.status,
            "updatedAt": datetime.utcnow()
        }}
    )
    
    # Get updated receipt
    updated_receipt = await db.receipts.find_one({"_id": ObjectId(receipt_id)})
    
    # Format response
    updated_receipt["id"] = str(updated_receipt["_id"])
    updated_receipt["user"] = str(updated_receipt["user"])
    
    return {
        "success": True,
        "data": updated_receipt
    }

@router.delete("/{receipt_id}", response_model=dict)
async def delete_receipt(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Delete receipt by ID
    """
    db = get_database()
    
    # Find receipt by ID and verify ownership
    receipt = await db.receipts.find_one({
        "_id": ObjectId(receipt_id),
        "user": ObjectId(current_user.id)
    })
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Delete image if exists
    if receipt.get("imageUrl"):
        image_path = os.path.join(os.getcwd(), receipt["imageUrl"].lstrip("/"))
        if os.path.exists(image_path):
            os.remove(image_path)
    
    # Delete receipt from database
    await db.receipts.delete_one({"_id": ObjectId(receipt_id)})
    
    return {
        "success": True,
        "message": "Receipt deleted successfully"
    }

@router.get("/location-analytics", response_model=dict)
async def get_location_analytics(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Get location analytics for user's receipts
    """
    db = get_database()
    geolocation_service = GeolocationService()
    
    # Obtener todos los recibos del usuario con datos de ubicación
    receipts_cursor = db.receipts.find({
        "user": ObjectId(current_user.id),
        "locationData": {"$exists": True, "$ne": None}
    })
    
    receipts = await receipts_cursor.to_list(length=None)
    
    if not receipts:
        return {
            "total_locations": 0,
            "top_locations": [],
            "total_spent": 0.0,
            "avg_distance_from_home": 0.0,
            "most_frequent_category": None,
            "business_trip_percentage": 0.0,
            "business_trips": []
        }
    
    # Convertir a modelos de recibo con ubicación
    from app.models.receipt_with_location import ReceiptWithLocationModel
    receipt_models = []
    
    for receipt in receipts:
        try:
            # Convertir ObjectId a string para el modelo
            receipt["_id"] = str(receipt["_id"])
            receipt["user"] = str(receipt["user"])
            
            # Crear modelo de recibo con ubicación
            receipt_model = ReceiptWithLocationModel(**receipt)
            receipt_models.append(receipt_model)
        except Exception as e:
            logger.error(f"Error al convertir recibo {receipt.get('_id')}: {str(e)}")
            continue
    
    # Obtener análisis de geolocalización
    try:
        analytics = await geolocation_service.get_location_analytics(receipt_models)
        return analytics
    except Exception as e:
        logger.error(f"Error en análisis de geolocalización: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar análisis de geolocalización: {str(e)}"
        )