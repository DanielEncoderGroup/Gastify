from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form
from typing import List, Optional, Any
from app.models.receipt import ReceiptCreate, ReceiptUpdate, ReceiptStatusUpdate, ReceiptResponse, ReceiptStats, OCRDataModel
from app.models.user import UserPublic
from app.api.deps import get_current_user
from app.core.database import get_database
from bson import ObjectId
from datetime import datetime
import os
import shutil
import uuid
from app.services.ocr_service import FreeOCRService
from app.services.chile_ml_categorization import ChileCategorizerService
from app.models.category import CategoryModel, CategoryPrediction, ChileCategory, ChileSpecificData
from app.services.geolocation_service import GeolocationService
from app.models.location_models import LocationDataModel
import logging

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

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
    Create new receipt
    """
    db = get_database()
    
    # Inicializar servicios OCR, categorización y geolocalización
    ocr_service = FreeOCRService()
    categorizer = ChileCategorizerService()
    geolocation_service = GeolocationService()
    ocr_data = None
    category_data = None
    location_data = None
    
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
                        location_data = LocationDataModel(
                            location=location_result,
                            extraction_method=location_result.get("extraction_method", "unknown"),
                            confidence=location_result.get("confidence", 0.0)
                        )
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
    
    # Return created receipt
    return {
        "id": str(receipt_id), 
        "message": "Receipt created successfully",
        "category": str(category_prediction.category) if 'category_prediction' in locals() and category_prediction else None,
        "location": {
            "extracted": location_data is not None,
            "confidence": location_data.confidence if location_data else 0.0,
            "method": location_data.extraction_method if location_data else None,
            "address": location_data.location.get("address", {}).get("formatted_address") if location_data and location_data.location else None
        } if location_data else None
    }

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
    
    # Format response
    receipt["id"] = str(receipt["_id"])
    receipt["user"] = str(receipt["user"])
    
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