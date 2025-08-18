from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Any, Optional
from bson import ObjectId
import logging

from app.api.deps import get_current_user, get_database
from app.models.user import UserPublic, UserRole
from app.models.receipt import ReceiptModel

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/my-employees", response_model=List[UserPublic])
async def get_my_employees(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene la lista de empleados del empleador actual
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden ver sus empleados"
        )
    
    db = get_database()
    
    try:
        # Buscar empleados que reportan a este empleador
        employees_cursor = db.users.find({
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        employees = []
        for employee_doc in employees_cursor:
            employee = UserPublic(
                id=str(employee_doc["_id"]),
                firstName=employee_doc["firstName"],
                lastName=employee_doc["lastName"],
                email=employee_doc["email"],
                role=employee_doc["role"],
                employer_id=str(employee_doc.get("employer_id", "")),
                company_name=employee_doc.get("company_name"),
                department=employee_doc.get("department"),
                position=employee_doc.get("position"),
                createdAt=employee_doc["createdAt"]
            )
            employees.append(employee)
        
        logger.info(f"Empleador {current_user.id} consultó {len(employees)} empleados")
        return employees
        
    except Exception as e:
        logger.error(f"Error obteniendo empleados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/my-employer", response_model=Optional[UserPublic])
async def get_my_employer(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene información del empleador (si el usuario es empleado)
    """
    if current_user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleados pueden ver su empleador"
        )
    
    if not current_user.employer_id:
        return None
    
    db = get_database()
    
    try:
        # Buscar el empleador
        employer_doc = db.users.find_one({
            "_id": ObjectId(current_user.employer_id),
            "role": UserRole.EMPLOYER
        })
        
        if not employer_doc:
            return None
        
        employer = UserPublic(
            id=str(employer_doc["_id"]),
            firstName=employer_doc["firstName"],
            lastName=employer_doc["lastName"],
            email=employer_doc["email"],
            role=employer_doc["role"],
            company_name=employer_doc.get("company_name"),
            department=employer_doc.get("department"),
            position=employer_doc.get("position"),
            createdAt=employer_doc["createdAt"]
        )
        
        return employer
        
    except Exception as e:
        logger.error(f"Error obteniendo empleador: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/employee-receipts/{employee_id}")
async def get_employee_receipts(
    employee_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene los recibos de un empleado específico (solo para empleadores)
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden ver recibos de empleados"
        )
    
    db = get_database()
    
    try:
        # Verificar que el empleado pertenece a este empleador
        employee_doc = db.users.find_one({
            "_id": ObjectId(employee_id),
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        if not employee_doc:
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado o no autorizado"
            )
        
        # Obtener recibos del empleado
        receipts_cursor = db.receipts.find({
            "userId": ObjectId(employee_id)
        }).sort("createdAt", -1)
        
        receipts = []
        for receipt_doc in receipts_cursor:
            # Convertir ObjectId a string para la respuesta
            receipt_doc["_id"] = str(receipt_doc["_id"])
            receipt_doc["userId"] = str(receipt_doc["userId"])
            
            # Agregar información del empleado
            receipt_doc["employee_info"] = {
                "name": f"{employee_doc['firstName']} {employee_doc['lastName']}",
                "email": employee_doc["email"],
                "department": employee_doc.get("department"),
                "position": employee_doc.get("position")
            }
            
            receipts.append(receipt_doc)
        
        logger.info(f"Empleador {current_user.id} consultó {len(receipts)} recibos del empleado {employee_id}")
        
        return {
            "employee": {
                "id": str(employee_doc["_id"]),
                "name": f"{employee_doc['firstName']} {employee_doc['lastName']}",
                "email": employee_doc["email"],
                "department": employee_doc.get("department"),
                "position": employee_doc.get("position")
            },
            "receipts": receipts,
            "total_receipts": len(receipts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo recibos del empleado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/all-employee-receipts")
async def get_all_employee_receipts(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene todos los recibos de todos los empleados del empleador
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden ver recibos de empleados"
        )
    
    db = get_database()
    
    try:
        # Obtener todos los empleados del empleador
        employees_cursor = db.users.find({
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        employee_ids = []
        employees_info = {}
        
        for employee_doc in employees_cursor:
            employee_id = employee_doc["_id"]
            employee_ids.append(employee_id)
            employees_info[str(employee_id)] = {
                "name": f"{employee_doc['firstName']} {employee_doc['lastName']}",
                "email": employee_doc["email"],
                "department": employee_doc.get("department"),
                "position": employee_doc.get("position")
            }
        
        if not employee_ids:
            return {
                "employees": [],
                "receipts": [],
                "total_receipts": 0,
                "summary": {
                    "total_employees": 0,
                    "total_amount": 0.0,
                    "receipts_by_employee": {}
                }
            }
        
        # Obtener todos los recibos de estos empleados
        receipts_cursor = db.receipts.find({
            "userId": {"$in": employee_ids}
        }).sort("createdAt", -1)
        
        receipts = []
        total_amount = 0.0
        receipts_by_employee = {}
        
        for receipt_doc in receipts_cursor:
            user_id_str = str(receipt_doc["userId"])
            
            # Convertir ObjectId a string
            receipt_doc["_id"] = str(receipt_doc["_id"])
            receipt_doc["userId"] = user_id_str
            
            # Agregar información del empleado
            if user_id_str in employees_info:
                receipt_doc["employee_info"] = employees_info[user_id_str]
                
                # Contar recibos por empleado
                if user_id_str not in receipts_by_employee:
                    receipts_by_employee[user_id_str] = {
                        "employee_name": employees_info[user_id_str]["name"],
                        "count": 0,
                        "total_amount": 0.0
                    }
                
                receipts_by_employee[user_id_str]["count"] += 1
                receipts_by_employee[user_id_str]["total_amount"] += receipt_doc.get("totalAmount", 0.0)
            
            total_amount += receipt_doc.get("totalAmount", 0.0)
            receipts.append(receipt_doc)
        
        logger.info(f"Empleador {current_user.id} consultó {len(receipts)} recibos de {len(employee_ids)} empleados")
        
        return {
            "employees": list(employees_info.values()),
            "receipts": receipts,
            "total_receipts": len(receipts),
            "summary": {
                "total_employees": len(employee_ids),
                "total_amount": total_amount,
                "receipts_by_employee": receipts_by_employee
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo todos los recibos de empleados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/employer-analytics")
async def get_employer_analytics(
    period: str = "30d",
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtener analytics agregados del empleador con métricas de todos sus empleados
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo los empleadores pueden ver analytics agregados"
        )
    
    try:
        db = get_database()
        
        # Calcular período de tiempo
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        period_days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365
        }.get(period, 30)
        
        start_date = now - timedelta(days=period_days)
        
        # Obtener todos los empleados del empleador
        employees_cursor = db.users.find({
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        employees = await employees_cursor.to_list(length=None)
        employee_ids = [emp["_id"] for emp in employees]
        
        if not employee_ids:
            return {
                "success": True,
                "data": {
                    "total_employees": 0,
                    "total_receipts": 0,
                    "total_amount": 0,
                    "average_per_employee": 0,
                    "category_breakdown": [],
                    "department_breakdown": [],
                    "employee_rankings": [],
                    "monthly_trends": []
                }
            }
        
        # Pipeline de agregación para analytics consolidados
        pipeline = [
            {
                "$match": {
                    "user": {"$in": employee_ids},
                    "date": {"$gte": start_date}
                }
            },
            {
                "$facet": {
                    # Estadísticas generales
                    "general_stats": [
                        {
                            "$group": {
                                "_id": None,
                                "total_receipts": {"$sum": 1},
                                "total_amount": {"$sum": "$totalAmount"},
                                "avg_amount": {"$avg": "$totalAmount"}
                            }
                        }
                    ],
                    # Por empleado
                    "by_employee": [
                        {
                            "$group": {
                                "_id": "$user",
                                "receipts_count": {"$sum": 1},
                                "total_amount": {"$sum": "$totalAmount"},
                                "avg_amount": {"$avg": "$totalAmount"}
                            }
                        },
                        {"$sort": {"total_amount": -1}}
                    ],
                    # Por categorías
                    "by_category": [
                        {
                            "$group": {
                                "_id": {"$ifNull": ["$category", "Sin categoría"]},
                                "count": {"$sum": 1},
                                "total": {"$sum": "$totalAmount"},
                                "avg": {"$avg": "$totalAmount"}
                            }
                        },
                        {"$sort": {"total": -1}}
                    ],
                    # Por mes
                    "by_month": [
                        {
                            "$group": {
                                "_id": {
                                    "year": {"$year": "$date"},
                                    "month": {"$month": "$date"}
                                },
                                "count": {"$sum": 1},
                                "total": {"$sum": "$totalAmount"}
                            }
                        },
                        {"$sort": {"_id.year": 1, "_id.month": 1}}
                    ]
                }
            }
        ]
        
        result = await db.receipts.aggregate(pipeline).to_list(1)
        
        if not result:
            return {
                "success": True,
                "data": {
                    "total_employees": len(employees),
                    "total_receipts": 0,
                    "total_amount": 0,
                    "average_per_employee": 0,
                    "category_breakdown": [],
                    "department_breakdown": [],
                    "employee_rankings": [],
                    "monthly_trends": []
                }
            }
        
        data = result[0]
        general_stats = data["general_stats"][0] if data["general_stats"] else {}
        
        # Procesar rankings de empleados
        employee_rankings = []
        employee_map = {str(emp["_id"]): emp for emp in employees}
        
        for emp_stat in data["by_employee"]:
            emp_id = str(emp_stat["_id"])
            employee_info = employee_map.get(emp_id, {})
            
            employee_rankings.append({
                "employee_id": emp_id,
                "name": f"{employee_info.get('firstName', '')} {employee_info.get('lastName', '')}".strip() or employee_info.get('email', 'Sin nombre'),
                "email": employee_info.get('email'),
                "department": employee_info.get('department'),
                "position": employee_info.get('position'),
                "receipts_count": emp_stat["receipts_count"],
                "total_amount": emp_stat["total_amount"],
                "average_per_receipt": emp_stat["avg_amount"]
            })
        
        # Procesar categorías
        categories = []
        total_amount = general_stats.get("total_amount", 0)
        for cat in data["by_category"]:
            percentage = (cat["total"] / total_amount * 100) if total_amount > 0 else 0
            categories.append({
                "category": cat["_id"],
                "count": cat["count"],
                "total": cat["total"],
                "average": cat["avg"],
                "percentage": round(percentage, 2)
            })
        
        # Procesar tendencias mensuales
        monthly_trends = []
        for month in data["by_month"]:
            monthly_trends.append({
                "year": month["_id"]["year"],
                "month": month["_id"]["month"],
                "receipts_count": month["count"],
                "total_amount": month["total"]
            })
        
        # Procesar breakdown por departamento
        department_map = {}
        for emp in employees:
            dept = emp.get("department", "Sin departamento")
            if dept not in department_map:
                department_map[dept] = {"employees": [], "total_amount": 0, "receipts_count": 0}
            department_map[dept]["employees"].append(str(emp["_id"]))
        
        # Agregar datos de gastos por departamento
        for ranking in employee_rankings:
            dept = ranking.get("department", "Sin departamento")
            if dept in department_map:
                department_map[dept]["total_amount"] += ranking["total_amount"]
                department_map[dept]["receipts_count"] += ranking["receipts_count"]
        
        department_breakdown = []
        for dept, data_dept in department_map.items():
            employee_count = len(data_dept["employees"])
            avg_per_employee = data_dept["total_amount"] / employee_count if employee_count > 0 else 0
            
            department_breakdown.append({
                "department": dept,
                "employee_count": employee_count,
                "total_amount": data_dept["total_amount"],
                "receipts_count": data_dept["receipts_count"],
                "average_per_employee": avg_per_employee
            })
        
        department_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)
        
        # Calcular promedio por empleado
        total_employees = len(employees)
        average_per_employee = general_stats.get("total_amount", 0) / total_employees if total_employees > 0 else 0
        
        return {
            "success": True,
            "period": period,
            "period_days": period_days,
            "data": {
                "total_employees": total_employees,
                "total_receipts": general_stats.get("total_receipts", 0),
                "total_amount": general_stats.get("total_amount", 0),
                "average_per_employee": average_per_employee,
                "category_breakdown": categories[:10],  # Top 10 categorías
                "department_breakdown": department_breakdown,
                "employee_rankings": employee_rankings,
                "monthly_trends": monthly_trends
            }
        }
        
    except Exception as e:
        logger.error(f"Error en analytics del empleador: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener analytics del empleador: {str(e)}"
        )
