"""
API endpoints para gestión de límites de gasto por empleado
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

# Modelos de datos para límites de gasto
class SpendingLimitCreate:
    def __init__(self, **data):
        self.employee_id = data.get('employee_id')
        self.limit_type = data.get('limit_type', 'monthly')  # daily, weekly, monthly, yearly, per_transaction
        self.limit_amount = data.get('limit_amount', 0)
        self.currency = data.get('currency', 'CLP')
        self.category_restrictions = data.get('category_restrictions', [])
        self.is_active = data.get('is_active', True)

class SpendingLimitResponse:
    def __init__(self, **data):
        self.id = data.get('id')
        self.employee_id = data.get('employee_id')
        self.employee_name = data.get('employee_name')
        self.employee_email = data.get('employee_email')
        self.limit_type = data.get('limit_type')
        self.limit_amount = data.get('limit_amount')
        self.currency = data.get('currency')
        self.category_restrictions = data.get('category_restrictions', [])
        self.is_active = data.get('is_active')
        self.created_by = data.get('created_by')
        self.created_at = data.get('created_at')
        self.updated_at = data.get('updated_at')

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_spending_limit(
    limit_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Crear un nuevo límite de gasto para un empleado
    Solo empleadores pueden crear límites
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden configurar límites de gasto"
        )
    
    db = get_database()
    
    try:
        # Verificar que el empleado pertenece a este empleador
        employee = db.users.find_one({
            "_id": ObjectId(limit_data["employee_id"]),
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado o no pertenece a tu empresa"
            )
        
        # Crear el límite
        spending_limit = {
            "employee_id": ObjectId(limit_data["employee_id"]),
            "limit_type": limit_data.get("limit_type", "monthly"),
            "limit_amount": float(limit_data.get("limit_amount", 0)),
            "currency": limit_data.get("currency", "CLP"),
            "category_restrictions": limit_data.get("category_restrictions", []),
            "is_active": limit_data.get("is_active", True),
            "created_by": ObjectId(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.spending_limits.insert_one(spending_limit)
        
        # Obtener el límite creado con información del empleado
        created_limit = db.spending_limits.aggregate([
            {"$match": {"_id": result.inserted_id}},
            {"$lookup": {
                "from": "users",
                "localField": "employee_id",
                "foreignField": "_id",
                "as": "employee_info"
            }},
            {"$unwind": "$employee_info"}
        ]).next()
        
        return {
            "id": str(created_limit["_id"]),
            "employee_id": str(created_limit["employee_id"]),
            "employee_name": f"{created_limit['employee_info']['firstName']} {created_limit['employee_info']['lastName']}",
            "employee_email": created_limit['employee_info']['email'],
            "limit_type": created_limit["limit_type"],
            "limit_amount": created_limit["limit_amount"],
            "currency": created_limit["currency"],
            "category_restrictions": created_limit["category_restrictions"],
            "is_active": created_limit["is_active"],
            "created_by": str(created_limit["created_by"]),
            "created_at": created_limit["created_at"].isoformat(),
            "updated_at": created_limit["updated_at"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating spending limit: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al crear límite de gasto"
        )

@router.get("/")
async def get_spending_limits(
    employee_id: Optional[str] = Query(None),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener límites de gasto
    Empleadores ven límites de sus empleados, empleados ven sus propios límites
    """
    db = get_database()
    
    try:
        # Construir filtro basado en rol
        if current_user.role == UserRole.EMPLOYER:
            # Empleador puede ver límites de sus empleados
            if employee_id:
                # Verificar que el empleado pertenece a este empleador
                employee = db.users.find_one({
                    "_id": ObjectId(employee_id),
                    "employer_id": ObjectId(current_user.id)
                })
                if not employee:
                    raise HTTPException(
                        status_code=404,
                        detail="Empleado no encontrado"
                    )
                filter_query = {"employee_id": ObjectId(employee_id)}
            else:
                # Obtener todos los límites de empleados de este empleador
                employee_ids = [doc["_id"] for doc in db.users.find({
                    "employer_id": ObjectId(current_user.id),
                    "role": UserRole.EMPLOYEE
                }, {"_id": 1})]
                filter_query = {"employee_id": {"$in": employee_ids}}
        
        elif current_user.role == UserRole.EMPLOYEE:
            # Empleado solo ve sus propios límites
            filter_query = {"employee_id": ObjectId(current_user.id)}
        
        else:
            raise HTTPException(
                status_code=403,
                detail="Acceso no autorizado"
            )
        
        # Obtener límites con información del empleado
        limits_cursor = db.spending_limits.aggregate([
            {"$match": filter_query},
            {"$lookup": {
                "from": "users",
                "localField": "employee_id",
                "foreignField": "_id",
                "as": "employee_info"
            }},
            {"$unwind": "$employee_info"},
            {"$sort": {"created_at": -1}}
        ])
        
        limits = []
        for limit_doc in limits_cursor:
            limits.append({
                "id": str(limit_doc["_id"]),
                "employee_id": str(limit_doc["employee_id"]),
                "employee_name": f"{limit_doc['employee_info']['firstName']} {limit_doc['employee_info']['lastName']}",
                "employee_email": limit_doc['employee_info']['email'],
                "limit_type": limit_doc["limit_type"],
                "limit_amount": limit_doc["limit_amount"],
                "currency": limit_doc["currency"],
                "category_restrictions": limit_doc.get("category_restrictions", []),
                "is_active": limit_doc["is_active"],
                "created_by": str(limit_doc["created_by"]),
                "created_at": limit_doc["created_at"].isoformat(),
                "updated_at": limit_doc.get("updated_at", limit_doc["created_at"]).isoformat()
            })
        
        return limits
        
    except Exception as e:
        logger.error(f"Error fetching spending limits: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al obtener límites"
        )

@router.get("/usage")
async def get_spending_usage(
    employee_id: Optional[str] = Query(None),
    period_type: str = Query("monthly"),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener uso actual vs límites de gasto por empleado
    """
    db = get_database()
    
    try:
        # Determinar período de tiempo
        now = datetime.utcnow()
        if period_type == "daily":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period_type == "weekly":
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period_type == "monthly":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period_type == "yearly":
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Construir filtro de empleados
        if current_user.role == UserRole.EMPLOYER:
            if employee_id:
                employee_ids = [ObjectId(employee_id)]
            else:
                employee_ids = [doc["_id"] for doc in db.users.find({
                    "employer_id": ObjectId(current_user.id),
                    "role": UserRole.EMPLOYEE
                }, {"_id": 1})]
        elif current_user.role == UserRole.EMPLOYEE:
            employee_ids = [ObjectId(current_user.id)]
        else:
            raise HTTPException(status_code=403, detail="Acceso no autorizado")
        
        usage_data = []
        
        for emp_id in employee_ids:
            # Obtener información del empleado
            employee = db.users.find_one({"_id": emp_id})
            if not employee:
                continue
            
            # Calcular gasto total en el período
            receipts_cursor = db.receipts.find({
                "userId": emp_id,
                "createdAt": {"$gte": start_date}
            })
            
            total_spent = 0
            transaction_count = 0
            categories_breakdown = {}
            
            for receipt in receipts_cursor:
                amount = float(receipt.get("totalAmount", 0))
                total_spent += amount
                transaction_count += 1
                
                category = receipt.get("category", "Otros")
                if category in categories_breakdown:
                    categories_breakdown[category] += amount
                else:
                    categories_breakdown[category] = amount
            
            # Convertir breakdown a formato de respuesta
            categories_list = []
            for category, amount in categories_breakdown.items():
                percentage = (amount / total_spent * 100) if total_spent > 0 else 0
                categories_list.append({
                    "category": category,
                    "amount": amount,
                    "percentage": round(percentage, 2)
                })
            
            # Obtener límites del empleado
            limits_cursor = db.spending_limits.find({
                "employee_id": emp_id,
                "is_active": True
            })
            
            limits_status = []
            for limit_doc in limits_cursor:
                limit_amount = limit_doc["limit_amount"]
                usage_percentage = (total_spent / limit_amount * 100) if limit_amount > 0 else 0
                is_exceeded = usage_percentage > 100
                
                # Calcular días hasta reset
                days_until_reset = 0
                if limit_doc["limit_type"] == "daily":
                    days_until_reset = 1
                elif limit_doc["limit_type"] == "weekly":
                    days_until_reset = 7 - now.weekday()
                elif limit_doc["limit_type"] == "monthly":
                    next_month = now.replace(day=28) + timedelta(days=4)
                    days_until_reset = (next_month - next_month.replace(day=1) - timedelta(days=next_month.day-1)).days
                elif limit_doc["limit_type"] == "yearly":
                    next_year = now.replace(year=now.year + 1, month=1, day=1)
                    days_until_reset = (next_year - now).days
                
                limits_status.append({
                    "limit_id": str(limit_doc["_id"]),
                    "limit_type": limit_doc["limit_type"],
                    "limit_amount": limit_amount,
                    "current_usage": total_spent,
                    "usage_percentage": round(usage_percentage, 2),
                    "is_exceeded": is_exceeded,
                    "days_until_reset": days_until_reset
                })
            
            usage_data.append({
                "employee_id": str(emp_id),
                "employee_name": f"{employee['firstName']} {employee['lastName']}",
                "period_type": period_type,
                "period_start": start_date.isoformat(),
                "period_end": now.isoformat(),
                "total_spent": total_spent,
                "transaction_count": transaction_count,
                "categories_breakdown": categories_list,
                "limits_status": limits_status
            })
        
        return usage_data
        
    except Exception as e:
        logger.error(f"Error fetching spending usage: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al obtener uso de gastos"
        )

@router.post("/validate-transaction")
async def validate_transaction(
    transaction_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Validar si una transacción excedería los límites establecidos
    """
    db = get_database()
    
    try:
        employee_id = transaction_data.get("employee_id")
        amount = float(transaction_data.get("amount", 0))
        category = transaction_data.get("category")
        
        # Verificar permisos
        if current_user.role == UserRole.EMPLOYEE:
            employee_id = current_user.id
        elif current_user.role == UserRole.EMPLOYER:
            # Verificar que el empleado pertenece a este empleador
            employee = db.users.find_one({
                "_id": ObjectId(employee_id),
                "employer_id": ObjectId(current_user.id)
            })
            if not employee:
                raise HTTPException(status_code=404, detail="Empleado no encontrado")
        else:
            raise HTTPException(status_code=403, detail="Acceso no autorizado")
        
        # Obtener límites activos del empleado
        limits_cursor = db.spending_limits.find({
            "employee_id": ObjectId(employee_id),
            "is_active": True
        })
        
        exceeded_limits = []
        warnings = []
        
        for limit_doc in limits_cursor:
            # Verificar restricciones de categoría
            if limit_doc.get("category_restrictions") and category:
                if category not in limit_doc["category_restrictions"]:
                    continue
            
            # Calcular uso actual en el período del límite
            current_usage = 0  # Aquí se calcularía el uso actual basado en el tipo de límite
            # (implementación simplificada)
            
            limit_amount = limit_doc["limit_amount"]
            would_exceed_by = (current_usage + amount) - limit_amount
            
            if would_exceed_by > 0:
                exceeded_limits.append({
                    "limit_id": str(limit_doc["_id"]),
                    "limit_type": limit_doc["limit_type"],
                    "limit_amount": limit_amount,
                    "current_usage": current_usage,
                    "would_exceed_by": would_exceed_by
                })
            else:
                usage_percentage = ((current_usage + amount) / limit_amount * 100) if limit_amount > 0 else 0
                if usage_percentage > 80:  # Advertencia si supera 80%
                    warnings.append({
                        "limit_id": str(limit_doc["_id"]),
                        "limit_type": limit_doc["limit_type"],
                        "usage_percentage": round(usage_percentage, 2),
                        "message": f"Esta transacción llevará el uso al {usage_percentage:.1f}% del límite {limit_doc['limit_type']}"
                    })
        
        return {
            "is_valid": len(exceeded_limits) == 0,
            "exceeded_limits": exceeded_limits,
            "warnings": warnings
        }
        
    except Exception as e:
        logger.error(f"Error validating transaction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al validar transacción"
        )

@router.put("/{limit_id}")
async def update_spending_limit(
    limit_id: str,
    limit_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Actualizar un límite de gasto existente
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden modificar límites de gasto"
        )
    
    db = get_database()
    
    try:
        # Verificar que el límite existe y pertenece a este empleador
        limit_doc = db.spending_limits.find_one({"_id": ObjectId(limit_id)})
        if not limit_doc:
            raise HTTPException(status_code=404, detail="Límite no encontrado")
        
        # Verificar que el empleado pertenece a este empleador
        employee = db.users.find_one({
            "_id": limit_doc["employee_id"],
            "employer_id": ObjectId(current_user.id)
        })
        if not employee:
            raise HTTPException(status_code=403, detail="No tienes permisos para modificar este límite")
        
        # Actualizar el límite
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        # Solo actualizar campos proporcionados
        if "limit_amount" in limit_data:
            update_data["limit_amount"] = float(limit_data["limit_amount"])
        if "limit_type" in limit_data:
            update_data["limit_type"] = limit_data["limit_type"]
        if "category_restrictions" in limit_data:
            update_data["category_restrictions"] = limit_data["category_restrictions"]
        if "is_active" in limit_data:
            update_data["is_active"] = limit_data["is_active"]
        
        db.spending_limits.update_one(
            {"_id": ObjectId(limit_id)},
            {"$set": update_data}
        )
        
        # Obtener el límite actualizado
        updated_limit = db.spending_limits.aggregate([
            {"$match": {"_id": ObjectId(limit_id)}},
            {"$lookup": {
                "from": "users",
                "localField": "employee_id",
                "foreignField": "_id",
                "as": "employee_info"
            }},
            {"$unwind": "$employee_info"}
        ]).next()
        
        return {
            "id": str(updated_limit["_id"]),
            "employee_id": str(updated_limit["employee_id"]),
            "employee_name": f"{updated_limit['employee_info']['firstName']} {updated_limit['employee_info']['lastName']}",
            "employee_email": updated_limit['employee_info']['email'],
            "limit_type": updated_limit["limit_type"],
            "limit_amount": updated_limit["limit_amount"],
            "currency": updated_limit["currency"],
            "category_restrictions": updated_limit.get("category_restrictions", []),
            "is_active": updated_limit["is_active"],
            "created_by": str(updated_limit["created_by"]),
            "created_at": updated_limit["created_at"].isoformat(),
            "updated_at": updated_limit["updated_at"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating spending limit: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al actualizar límite"
        )

@router.delete("/{limit_id}")
async def delete_spending_limit(
    limit_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Eliminar un límite de gasto
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden eliminar límites de gasto"
        )
    
    db = get_database()
    
    try:
        # Verificar que el límite existe y pertenece a este empleador
        limit_doc = db.spending_limits.find_one({"_id": ObjectId(limit_id)})
        if not limit_doc:
            raise HTTPException(status_code=404, detail="Límite no encontrado")
        
        # Verificar que el empleado pertenece a este empleador
        employee = db.users.find_one({
            "_id": limit_doc["employee_id"],
            "employer_id": ObjectId(current_user.id)
        })
        if not employee:
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este límite")
        
        # Eliminar el límite
        result = db.spending_limits.delete_one({"_id": ObjectId(limit_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Límite no encontrado")
        
        return {"message": "Límite eliminado exitosamente"}
        
    except Exception as e:
        logger.error(f"Error deleting spending limit: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al eliminar límite"
        )

@router.post("/bulk")
async def create_bulk_limits(
    bulk_data: dict,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Crear límites de gasto masivamente para múltiples empleados
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden crear límites masivos"
        )
    
    db = get_database()
    
    try:
        employee_ids = bulk_data.get("employee_ids", [])
        limit_data = {
            "limit_type": bulk_data.get("limit_type", "monthly"),
            "limit_amount": float(bulk_data.get("limit_amount", 0)),
            "currency": bulk_data.get("currency", "CLP"),
            "category_restrictions": bulk_data.get("category_restrictions", []),
            "is_active": bulk_data.get("is_active", True)
        }
        
        created_limits = []
        
        for employee_id in employee_ids:
            # Verificar que el empleado pertenece a este empleador
            employee = db.users.find_one({
                "_id": ObjectId(employee_id),
                "employer_id": ObjectId(current_user.id),
                "role": UserRole.EMPLOYEE
            })
            
            if not employee:
                continue
            
            # Crear el límite
            spending_limit = {
                "employee_id": ObjectId(employee_id),
                "limit_type": limit_data["limit_type"],
                "limit_amount": limit_data["limit_amount"],
                "currency": limit_data["currency"],
                "category_restrictions": limit_data["category_restrictions"],
                "is_active": limit_data["is_active"],
                "created_by": ObjectId(current_user.id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = db.spending_limits.insert_one(spending_limit)
            
            created_limits.append({
                "id": str(result.inserted_id),
                "employee_id": employee_id,
                "employee_name": f"{employee['firstName']} {employee['lastName']}",
                "employee_email": employee['email'],
                "limit_type": limit_data["limit_type"],
                "limit_amount": limit_data["limit_amount"],
                "currency": limit_data["currency"],
                "category_restrictions": limit_data["category_restrictions"],
                "is_active": limit_data["is_active"],
                "created_by": str(current_user.id),
                "created_at": datetime.utcnow().isoformat()
            })
        
        return {
            "message": f"Se crearon {len(created_limits)} límites exitosamente",
            "created_limits": created_limits
        }
        
    except Exception as e:
        logger.error(f"Error creating bulk limits: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al crear límites masivos"
        )
