from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Dict, Any, Optional
from app.models.category import CategoryModel, CategoryResponse, CategoryUpdate, CategoryStats, UserCategoryFeedback, ChileCategory
from app.models.user import UserPublic
from app.api.deps import get_current_user
from app.core.database import get_database
from bson import ObjectId
from datetime import datetime
from app.services.chile_ml_categorization import ChileCategorizerService, CHILE_CATEGORIES
import logging

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_categories(current_user: UserPublic = Depends(get_current_user)):
    """
    Obtener todas las categorías disponibles
    """
    try:
        # Devolver las categorías de Chile definidas en ChileCategorizerService
        categories = CHILE_CATEGORIES
        
        return {
            "success": True,
            "categories": categories
        }
    except Exception as e:
        logger.error(f"Error al obtener categorías: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al obtener categorías: {str(e)}"
        )

@router.get("/receipt/{receipt_id}", response_model=Dict[str, Any])
async def get_receipt_category(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Obtener la categoría de un recibo específico
    """
    db = get_database()
    
    try:
        # Verificar que el recibo existe y pertenece al usuario
        receipt = await db.receipts.find_one({"_id": ObjectId(receipt_id), "user": ObjectId(current_user.id)})
        
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recibo no encontrado o no tienes permiso para acceder a él"
            )
        
        # Buscar la categoría del recibo
        category = await db.categories.find_one({"receipt_id": ObjectId(receipt_id)})
        
        if not category:
            return {
                "success": True,
                "message": "El recibo no tiene categoría asignada",
                "category": None
            }
        
        # Formatear respuesta
        category_data = {
            "id": str(category.get("_id")),
            "receipt_id": str(category.get("receipt_id")),
            "user_id": str(category.get("user_id")),
            "category": category.get("category"),
            "prediction": category.get("prediction"),
            "user_corrected": category.get("user_corrected"),
            "created_at": category.get("created_at"),
            "updated_at": category.get("updated_at")
        }
        
        return {
            "success": True,
            "category": category_data
        }
    
    except Exception as e:
        logger.error(f"Error al obtener categoría del recibo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@router.put("/receipt/{receipt_id}", response_model=Dict[str, Any])
async def update_receipt_category(
    receipt_id: str,
    category_update: CategoryUpdate = Body(...),
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Actualizar la categoría de un recibo (feedback del usuario)
    """
    db = get_database()
    
    try:
        # Verificar que el recibo existe y pertenece al usuario
        receipt = await db.receipts.find_one({"_id": ObjectId(receipt_id), "user": ObjectId(current_user.id)})
        
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recibo no encontrado o no tienes permiso para acceder a él"
            )
        
        # Buscar la categoría actual
        current_category = await db.categories.find_one({"receipt_id": ObjectId(receipt_id)})
        
        if not current_category:
            # Si no existe una categorización previa, crear una nueva
            new_category = CategoryModel(
                receipt_id=ObjectId(receipt_id),
                user_id=ObjectId(current_user.id),
                category=category_update.category,
                prediction={
                    "category": category_update.category,
                    "confidence": 1.0,
                    "method": "user_defined",
                    "chile_specific": {
                        "rut_detected": None,
                        "document_type": None,
                        "iva_detected": False,
                        "known_brand": None
                    },
                    "all_probabilities": {category_update.category: 1.0}
                },
                user_corrected=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            result = await db.categories.insert_one(new_category.dict(by_alias=True))
            
            return {
                "success": True,
                "message": "Categoría creada correctamente",
                "category_id": str(result.inserted_id)
            }
        else:
            # Si existe, guardar la categoría original para feedback de ML
            original_category = current_category.get("category")
            
            if original_category != category_update.category:
                # Crear registro de feedback para reentrenamiento
                feedback = UserCategoryFeedback(
                    receipt_id=ObjectId(receipt_id),
                    user_id=ObjectId(current_user.id),
                    original_category=original_category,
                    corrected_category=category_update.category,
                    receipt_text=receipt.get("ocrData", {}).get("raw_text", ""),
                    created_at=datetime.utcnow()
                )
                
                await db.category_feedback.insert_one(feedback.dict(by_alias=True))
                
                # Procesar reentrenamiento si hay suficientes datos
                await process_retraining(db)
            
            # Actualizar la categoría existente
            update_result = await db.categories.update_one(
                {"_id": current_category.get("_id")},
                {
                    "$set": {
                        "category": category_update.category,
                        "user_corrected": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if update_result.modified_count == 0:
                logger.warning(f"No se actualizó ninguna categoría para el recibo {receipt_id}")
            
            return {
                "success": True,
                "message": "Categoría actualizada correctamente"
            }
    
    except Exception as e:
        logger.error(f"Error al actualizar categoría: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@router.get("/stats", response_model=Dict[str, Any])
async def get_category_stats(current_user: UserPublic = Depends(get_current_user)):
    """
    Obtener estadísticas de categorización
    """
    db = get_database()
    
    try:
        # Contar total de recibos categorizados para el usuario
        total_categorized = await db.categories.count_documents({"user_id": ObjectId(current_user.id)})
        
        # Contar por categoría
        categories_count = {}
        
        pipeline = [
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        async for doc in db.categories.aggregate(pipeline):
            categories_count[doc["_id"]] = doc["count"]
        
        # Contar recibos con categorías corregidas por el usuario
        user_corrected = await db.categories.count_documents({
            "user_id": ObjectId(current_user.id),
            "user_corrected": True
        })
        
        # Calcular auto-categorizados
        auto_categorized = total_categorized - user_corrected
        
        stats = CategoryStats(
            total_categorized=total_categorized,
            categories_count=categories_count,
            auto_categorized=auto_categorized,
            user_corrected=user_corrected
        )
        
        return {
            "success": True,
            "stats": stats.dict()
        }
    
    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

async def process_retraining(db):
    """
    Procesa el reentrenamiento del modelo si hay suficientes datos de feedback
    """
    try:
        # Obtener feedback reciente (últimos 50 registros)
        feedback_data = []
        texts = []
        categories = []
        
        cursor = db.category_feedback.find().sort("created_at", -1).limit(50)
        
        async for doc in cursor:
            if doc.get("receipt_text"):
                texts.append(doc.get("receipt_text"))
                categories.append(doc.get("corrected_category"))
                feedback_data.append(doc)
        
        # Solo reentrenar si hay suficiente feedback (al menos 5 registros)
        if len(texts) >= 5:
            logger.info(f"Reentrenando modelo con {len(texts)} registros de feedback")
            
            # Instanciar el servicio de categorización y reentrenar
            categorizer = ChileCategorizerService()
            success = categorizer.retrain_with_feedback(texts, categories)
            
            if success:
                logger.info("Reentrenamiento exitoso")
            else:
                logger.error("Error en el reentrenamiento del modelo")
                
    except Exception as e:
        logger.error(f"Error al procesar reentrenamiento: {str(e)}")
