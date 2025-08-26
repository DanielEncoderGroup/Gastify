from typing import List, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
import logging
from datetime import datetime

from app.models.receipt_product import ReceiptProductModel, ReceiptProductResponse, ReceiptProductsStats
from app.models.receipt import DetailedProductItem
from app.core.database import get_database

logger = logging.getLogger(__name__)

class ReceiptProductsService:
    """Servicio para gestión de productos extraídos de recibos"""
    
    def __init__(self):
        self.db = None
        self.collection: Optional[AsyncIOMotorCollection] = None
    
    async def _get_collection(self):
        """Obtener colección de productos de recibos"""
        if not self.collection:
            self.db = await get_database()
            self.collection = self.db.receipt_products
            # Crear índices para consultas eficientes
            await self._ensure_indexes()
        return self.collection
    
    async def _ensure_indexes(self):
        """Crear índices necesarios para optimización"""
        try:
            await self.collection.create_index("receipt_id")
            await self.collection.create_index("user_id")
            await self.collection.create_index([("user_id", 1), ("receipt_id", 1)])
            await self.collection.create_index("barcode")
            logger.info("Índices de receipt_products creados/verificados")
        except Exception as e:
            logger.warning(f"Error creando índices: {e}")
    
    async def save_products_from_ocr(
        self, 
        receipt_id: ObjectId, 
        user_id: ObjectId, 
        detailed_products: List[DetailedProductItem]
    ) -> List[ReceiptProductModel]:
        """
        Guarda productos extraídos por OCR en la colección separada
        """
        collection = await self._get_collection()
        saved_products = []
        
        # Limpiar productos existentes para este recibo (en caso de reprocesamiento)
        await collection.delete_many({"receipt_id": receipt_id})
        
        for product_item in detailed_products:
            product_model = ReceiptProductModel(
                receipt_id=receipt_id,
                user_id=user_id,
                name=product_item.name,
                barcode=product_item.barcode,
                sku=product_item.sku,
                quantity=product_item.quantity,
                unit_price=product_item.unit_price,
                total_price=product_item.total_price,
                category=product_item.category,
                confidence=product_item.confidence,
                raw_line=product_item.raw_line,
                extraction_method="advanced_parser"
            )
            
            # Insertar en MongoDB
            result = await collection.insert_one(product_model.dict(by_alias=True))
            product_model.id = result.inserted_id
            saved_products.append(product_model)
            
        logger.info(f"Guardados {len(saved_products)} productos para recibo {receipt_id}")
        return saved_products
    
    async def get_products_by_receipt(self, receipt_id: str) -> List[ReceiptProductResponse]:
        """Obtener productos de un recibo específico"""
        collection = await self._get_collection()
        
        cursor = collection.find({"receipt_id": ObjectId(receipt_id)})
        products = []
        
        async for doc in cursor:
            product = ReceiptProductResponse(
                id=str(doc["_id"]),
                receipt_id=str(doc["receipt_id"]),
                name=doc["name"],
                barcode=doc.get("barcode"),
                quantity=doc.get("quantity", 1.0),
                unit_price=doc.get("unit_price"),
                total_price=doc.get("total_price"),
                confidence=doc.get("confidence", 0.0),
                extraction_method=doc.get("extraction_method", "advanced_parser"),
                created_at=doc.get("created_at", datetime.utcnow())
            )
            products.append(product)
        
        return products
    
    async def validate_receipt_totals(
        self, 
        receipt_id: str, 
        declared_total: float
    ) -> Dict:
        """
        Valida la coherencia entre productos extraídos y total declarado
        """
        products = await self.get_products_by_receipt(receipt_id)
        
        # Calcular total de productos
        calculated_total = sum(
            (p.total_price or 0) for p in products if p.total_price
        )
        
        # Calcular diferencia
        difference = abs(calculated_total - declared_total)
        difference_percentage = (difference / declared_total * 100) if declared_total > 0 else 100
        
        # Determinar si es válido (tolerancia del 5%)
        is_valid = difference_percentage <= 5.0
        
        # Detectar posibles problemas
        issues = []
        if not products:
            issues.append("No se encontraron productos extraídos")
        elif calculated_total == 0:
            issues.append("No se pudieron calcular precios de productos")
        elif difference_percentage > 10:
            issues.append("Diferencia significativa entre productos y total")
        
        # Calcular confianza promedio
        avg_confidence = (
            sum(p.confidence for p in products) / len(products)
        ) if products else 0.0
        
        return {
            "is_valid": is_valid,
            "declared_total": declared_total,
            "calculated_total": calculated_total,
            "difference": difference,
            "difference_percentage": difference_percentage,
            "products_count": len(products),
            "average_confidence": avg_confidence,
            "issues": issues,
            "recommendation": "auto_approve" if is_valid and avg_confidence > 0.8 else "manual_review"
        }
    
    async def get_receipt_products_stats(self, receipt_id: str) -> ReceiptProductsStats:
        """Obtener estadísticas de productos por recibo"""
        products = await self.get_products_by_receipt(receipt_id)
        
        # Agrupar por método de extracción
        extraction_methods = {}
        categories_found = set()
        total_value = 0
        
        for product in products:
            # Método de extracción
            method = product.extraction_method
            extraction_methods[method] = extraction_methods.get(method, 0) + 1
            
            # Categorías encontradas
            if hasattr(product, 'category') and product.category:
                categories_found.add(product.category)
            
            # Valor total
            if product.total_price:
                total_value += product.total_price
        
        # Confianza promedio
        avg_confidence = (
            sum(p.confidence for p in products) / len(products)
        ) if products else 0.0
        
        return ReceiptProductsStats(
            total_products=len(products),
            total_value=total_value,
            average_confidence=avg_confidence,
            extraction_methods=extraction_methods,
            categories_found=list(categories_found)
        )
    
    async def update_product(
        self,
        product_id: str,
        updates: Dict
    ) -> ReceiptProductResponse:
        """Actualizar producto individual (para correcciones manuales)"""
        collection = await self._get_collection()
        
        updates["updated_at"] = datetime.utcnow()
        updates["extraction_method"] = "manual_correction"
        
        result = await collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": updates}
        )
        
        if result.modified_count == 0:
            raise ValueError(f"Producto {product_id} no encontrado")
        
        # Retornar producto actualizado
        doc = await collection.find_one({"_id": ObjectId(product_id)})
        return ReceiptProductResponse(
            id=str(doc["_id"]),
            receipt_id=str(doc["receipt_id"]),
            name=doc["name"],
            barcode=doc.get("barcode"),
            quantity=doc.get("quantity", 1.0),
            unit_price=doc.get("unit_price"),
            total_price=doc.get("total_price"),
            confidence=doc.get("confidence", 0.0),
            extraction_method=doc.get("extraction_method", "manual_correction"),
            created_at=doc.get("created_at", datetime.utcnow())
        )
