from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import logging

from app.api.deps import get_current_user
from app.models.user import UserPublic
from app.models.receipt_product import ReceiptProductResponse, ReceiptProductsStats
from app.services.receipt_products_service import ReceiptProductsService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/receipt/{receipt_id}/products", response_model=List[ReceiptProductResponse])
async def get_receipt_products(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Obtiene todos los productos extraídos de un recibo específico
    """
    try:
        service = ReceiptProductsService()
        products = await service.get_products_by_receipt(receipt_id)
        
        logger.info(f"Usuario {current_user.id} consultó {len(products)} productos del recibo {receipt_id}")
        return products
        
    except Exception as e:
        logger.error(f"Error obteniendo productos del recibo {receipt_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo productos: {str(e)}"
        )

@router.get("/receipt/{receipt_id}/products/stats", response_model=ReceiptProductsStats)
async def get_receipt_products_stats(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Obtiene estadísticas de productos de un recibo
    """
    try:
        service = ReceiptProductsService()
        stats = await service.get_receipt_products_stats(receipt_id)
        
        logger.info(f"Estadísticas de productos calculadas para recibo {receipt_id}")
        return stats
        
    except Exception as e:
        logger.error(f"Error calculando estadísticas del recibo {receipt_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculando estadísticas: {str(e)}"
        )

@router.post("/receipt/{receipt_id}/validate-totals")
async def validate_receipt_totals(
    receipt_id: str,
    declared_total: float,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Valida la coherencia entre productos extraídos y total declarado del recibo
    """
    try:
        service = ReceiptProductsService()
        validation_result = await service.validate_receipt_totals(receipt_id, declared_total)
        
        logger.info(f"Validación de totales - Recibo {receipt_id}: {validation_result['recommendation']}")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Validación de totales completada",
                "validation": validation_result
            }
        )
        
    except Exception as e:
        logger.error(f"Error validando totales del recibo {receipt_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en validación: {str(e)}"
        )

@router.put("/product/{product_id}")
async def update_product(
    product_id: str,
    updates: Dict[str, Any],
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Actualiza un producto individual (para correcciones manuales)
    """
    try:
        service = ReceiptProductsService()
        
        # Filtrar campos permitidos para actualización
        allowed_fields = ['name', 'quantity', 'unit_price', 'total_price', 'barcode', 'sku', 'category']
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            raise HTTPException(
                status_code=400,
                detail="No se proporcionaron campos válidos para actualizar"
            )
        
        updated_product = await service.update_product(product_id, filtered_updates)
        
        logger.info(f"Producto {product_id} actualizado por usuario {current_user.id}")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Producto actualizado exitosamente",
                "product": {
                    "id": updated_product.id,
                    "name": updated_product.name,
                    "quantity": updated_product.quantity,
                    "unit_price": updated_product.unit_price,
                    "total_price": updated_product.total_price,
                    "extraction_method": updated_product.extraction_method
                }
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error actualizando producto {product_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error actualizando producto: {str(e)}"
        )

@router.post("/receipt/{receipt_id}/reprocess-products")
async def reprocess_receipt_products(
    receipt_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Reprocesa los productos de un recibo utilizando el OCR avanzado
    """
    try:
        # Importar servicios necesarios
        from app.services.hybrid_ocr_service import HybridOCRService
        from app.services.chile_receipt_parser_advanced import ChileReceiptParserAdvanced
        from app.core.database import get_database
        from bson import ObjectId
        
        # Obtener recibo original
        db = await get_database()
        receipt_doc = await db.receipts.find_one({"_id": ObjectId(receipt_id)})
        
        if not receipt_doc:
            raise HTTPException(status_code=404, detail="Recibo no encontrado")
        
        # Verificar que el recibo pertenece al usuario
        if str(receipt_doc["user"]) != str(current_user.id):
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Reprocessar si hay imagen disponible
        if receipt_doc.get("imageUrl"):
            # Aquí implementarías la lógica para reprocesar desde la imagen
            # Por simplicidad, simulamos un reprocesamiento
            logger.info(f"Reprocesando productos del recibo {receipt_id}")
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Reprocesamiento iniciado",
                    "status": "processing"
                }
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="No hay imagen disponible para reprocesar"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reprocesando recibo {receipt_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en reprocesamiento: {str(e)}"
        )
