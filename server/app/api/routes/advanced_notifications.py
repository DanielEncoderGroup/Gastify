"""
API endpoints para notificaciones avanzadas y alertas inteligentes
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Any
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.api.deps import get_current_user, get_database
from app.models.user import UserPublic, UserRole

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_notifications(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    notification_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener notificaciones del usuario con filtros avanzados
    """
    db = get_database()
    
    try:
        # Construir filtro
        filter_query = {"user_id": ObjectId(current_user.id)}
        
        if notification_type:
            filter_query["type"] = notification_type
        if priority:
            filter_query["priority"] = priority
        if is_read is not None:
            filter_query["is_read"] = is_read
        
        # Obtener notificaciones
        notifications_cursor = db.notifications.find(filter_query).sort("created_at", -1).skip(offset).limit(limit)
        
        notifications = []
        for notif in notifications_cursor:
            notifications.append({
                "id": str(notif["_id"]),
                "type": notif["type"],
                "title": notif["title"],
                "message": notif["message"],
                "priority": notif.get("priority", "medium"),
                "is_read": notif.get("is_read", False),
                "metadata": notif.get("metadata", {}),
                "created_at": notif["created_at"].isoformat(),
                "read_at": notif.get("read_at").isoformat() if notif.get("read_at") else None
            })
        
        # Contar total
        total = db.notifications.count_documents(filter_query)
        
        return {
            "notifications": notifications,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/")
async def create_notification(
    notification_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Crear nueva notificación (admin/sistema)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.EMPLOYER]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    
    db = get_database()
    
    try:
        notification = {
            "user_id": ObjectId(notification_data["user_id"]),
            "type": notification_data.get("type", "info"),
            "title": notification_data["title"],
            "message": notification_data["message"],
            "priority": notification_data.get("priority", "medium"),
            "is_read": False,
            "metadata": notification_data.get("metadata", {}),
            "created_at": datetime.utcnow(),
            "created_by": ObjectId(current_user.id)
        }
        
        result = db.notifications.insert_one(notification)
        
        return {
            "id": str(result.inserted_id),
            "message": "Notificación creada exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Marcar notificación como leída
    """
    db = get_database()
    
    try:
        result = db.notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(current_user.id)},
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        return {"message": "Notificación marcada como leída"}
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/bulk-read")
async def mark_bulk_as_read(
    notification_ids: List[str],
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Marcar múltiples notificaciones como leídas
    """
    db = get_database()
    
    try:
        object_ids = [ObjectId(nid) for nid in notification_ids]
        
        result = db.notifications.update_many(
            {"_id": {"$in": object_ids}, "user_id": ObjectId(current_user.id)},
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
        )
        
        return {
            "message": f"{result.modified_count} notificaciones marcadas como leídas"
        }
        
    except Exception as e:
        logger.error(f"Error marking bulk notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/stats")
async def get_notification_stats(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener estadísticas de notificaciones del usuario
    """
    db = get_database()
    
    try:
        # Estadísticas básicas
        total = db.notifications.count_documents({"user_id": ObjectId(current_user.id)})
        unread = db.notifications.count_documents({"user_id": ObjectId(current_user.id), "is_read": False})
        
        # Por tipo
        type_stats = list(db.notifications.aggregate([
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Por prioridad
        priority_stats = list(db.notifications.aggregate([
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        return {
            "total": total,
            "unread": unread,
            "read": total - unread,
            "by_type": [{"type": item["_id"], "count": item["count"]} for item in type_stats],
            "by_priority": [{"priority": item["_id"], "count": item["count"]} for item in priority_stats]
        }
        
    except Exception as e:
        logger.error(f"Error fetching notification stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/intelligent-alerts")
async def get_intelligent_alerts(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Generar alertas inteligentes basadas en patrones de gasto
    """
    db = get_database()
    
    try:
        alerts = []
        
        # Calcular fechas para análisis
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # 1. Alertas de gasto inusual
        recent_receipts = list(db.receipts.find({
            "userId": ObjectId(current_user.id),
            "createdAt": {"$gte": seven_days_ago}
        }))
        
        if recent_receipts:
            recent_avg = sum(float(r.get("totalAmount", 0)) for r in recent_receipts) / len(recent_receipts)
            
            historical_receipts = list(db.receipts.find({
                "userId": ObjectId(current_user.id),
                "createdAt": {"$gte": thirty_days_ago, "$lt": seven_days_ago}
            }))
            
            if historical_receipts:
                historical_avg = sum(float(r.get("totalAmount", 0)) for r in historical_receipts) / len(historical_receipts)
                
                if recent_avg > historical_avg * 1.5:  # 50% más que el promedio histórico
                    alerts.append({
                        "id": "unusual_spending",
                        "type": "spending_pattern",
                        "severity": "high",
                        "title": "Gasto inusualmente alto detectado",
                        "message": f"Tus gastos recientes (${recent_avg:,.0f} promedio) son 50% más altos que tu patrón habitual (${historical_avg:,.0f})",
                        "recommendations": [
                            "Revisa tus gastos recientes para identificar compras grandes",
                            "Considera establecer un límite de gasto semanal",
                            "Analiza si estos gastos son necesarios o pueden posponerse"
                        ],
                        "metadata": {
                            "recent_average": recent_avg,
                            "historical_average": historical_avg,
                            "increase_percentage": ((recent_avg - historical_avg) / historical_avg * 100)
                        }
                    })
        
        # 2. Alertas de categorías problemáticas
        category_stats = list(db.receipts.aggregate([
            {"$match": {"userId": ObjectId(current_user.id), "createdAt": {"$gte": thirty_days_ago}}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": {"$toDouble": "$totalAmount"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 3}
        ]))
        
        if category_stats:
            total_spent = sum(stat["total"] for stat in category_stats)
            top_category = category_stats[0]
            
            if top_category["total"] > total_spent * 0.5:  # Más del 50% en una categoría
                alerts.append({
                    "id": "category_concentration",
                    "type": "category_alert",
                    "severity": "medium",
                    "title": f"Alto gasto en {top_category['_id']}",
                    "message": f"Has gastado ${top_category['total']:,.0f} ({top_category['total']/total_spent*100:.1f}%) en {top_category['_id']} este mes",
                    "recommendations": [
                        f"Considera reducir gastos en {top_category['_id']}",
                        "Diversifica tus gastos en otras categorías",
                        "Establece un límite específico para esta categoría"
                    ],
                    "metadata": {
                        "category": top_category["_id"],
                        "amount": top_category["total"],
                        "percentage": top_category["total"]/total_spent*100,
                        "transaction_count": top_category["count"]
                    }
                })
        
        # 3. Alertas de límites de gasto
        if current_user.role == UserRole.EMPLOYEE:
            limits = list(db.spending_limits.find({
                "employee_id": ObjectId(current_user.id),
                "is_active": True
            }))
            
            for limit in limits:
                # Calcular uso actual (simplificado)
                period_start = now.replace(day=1) if limit["limit_type"] == "monthly" else now - timedelta(days=7)
                
                current_usage = sum(float(r.get("totalAmount", 0)) for r in db.receipts.find({
                    "userId": ObjectId(current_user.id),
                    "createdAt": {"$gte": period_start}
                }))
                
                usage_percentage = (current_usage / limit["limit_amount"] * 100) if limit["limit_amount"] > 0 else 0
                
                if usage_percentage > 90:
                    alerts.append({
                        "id": f"limit_exceeded_{str(limit['_id'])}",
                        "type": "spending_limit",
                        "severity": "high" if usage_percentage > 100 else "medium",
                        "title": "Límite de gasto excedido" if usage_percentage > 100 else "Cerca del límite de gasto",
                        "message": f"Has utilizado {usage_percentage:.1f}% de tu límite {limit['limit_type']} (${current_usage:,.0f} de ${limit['limit_amount']:,.0f})",
                        "recommendations": [
                            "Reduce gastos no esenciales",
                            "Contacta a tu empleador si necesitas un ajuste",
                            "Revisa gastos pendientes antes de nuevas compras"
                        ],
                        "metadata": {
                            "limit_type": limit["limit_type"],
                            "limit_amount": limit["limit_amount"],
                            "current_usage": current_usage,
                            "usage_percentage": usage_percentage
                        }
                    })
        
        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "generated_at": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating intelligent alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/preferences")
async def update_notification_preferences(
    preferences_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Actualizar preferencias de notificaciones del usuario
    """
    db = get_database()
    
    try:
        preferences = {
            "user_id": ObjectId(current_user.id),
            "email_notifications": preferences_data.get("email_notifications", True),
            "push_notifications": preferences_data.get("push_notifications", True),
            "spending_alerts": preferences_data.get("spending_alerts", True),
            "limit_warnings": preferences_data.get("limit_warnings", True),
            "weekly_summary": preferences_data.get("weekly_summary", True),
            "monthly_report": preferences_data.get("monthly_report", True),
            "updated_at": datetime.utcnow()
        }
        
        db.notification_preferences.update_one(
            {"user_id": ObjectId(current_user.id)},
            {"$set": preferences},
            upsert=True
        )
        
        return {"message": "Preferencias actualizadas exitosamente"}
        
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/preferences")
async def get_notification_preferences(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener preferencias de notificaciones del usuario
    """
    db = get_database()
    
    try:
        preferences = db.notification_preferences.find_one({"user_id": ObjectId(current_user.id)})
        
        if not preferences:
            # Valores por defecto
            preferences = {
                "email_notifications": True,
                "push_notifications": True,
                "spending_alerts": True,
                "limit_warnings": True,
                "weekly_summary": True,
                "monthly_report": True
            }
        else:
            preferences.pop("_id", None)
            preferences.pop("user_id", None)
            preferences.pop("updated_at", None)
        
        return preferences
        
    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
