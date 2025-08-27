"""
Analytics Empresariales para Gastify - KPIs Empleador-Empleado
Métricas específicas para gestión de gastos corporativos
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

from app.core.database import get_database
from app.api.routes.auth import get_current_user
from app.models.user import UserPublic, UserRole

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/company-dashboard", response_model=Dict[str, Any])
async def get_company_dashboard(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
    period: str = Query("monthly", description="Período: weekly, monthly, quarterly")
) -> Any:
    """
    Dashboard empresarial con KPIs específicos para empleadores
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo empleadores pueden acceder al dashboard empresarial"
        )
    
    try:
        # Definir período de análisis
        end_date = datetime.now()
        if period == "weekly":
            start_date = end_date - timedelta(days=7)
            prev_start = end_date - timedelta(days=14)
            prev_end = end_date - timedelta(days=7)
        elif period == "monthly":
            start_date = end_date - timedelta(days=30)
            prev_start = end_date - timedelta(days=60)
            prev_end = end_date - timedelta(days=30)
        else:  # quarterly
            start_date = end_date - timedelta(days=90)
            prev_start = end_date - timedelta(days=180)
            prev_end = end_date - timedelta(days=90)

        # Obtener empleados
        employees = await db.users.find({
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        }).to_list(None)
        
        employee_ids = [emp["_id"] for emp in employees]
        
        # KPI 1: Gastos Totales por Período
        current_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1}
                }
            }
        ]).to_list(None)
        
        prev_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": prev_start, "$lte": prev_end}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1}
                }
            }
        ]).to_list(None)
        
        current_total = current_expenses[0]["total_amount"] if current_expenses else 0
        prev_total = prev_expenses[0]["total_amount"] if prev_expenses else 0
        
        # KPI 2: Gastos por Empleado
        employee_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$userId",
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "employee"
                }
            },
            {"$unwind": "$employee"},
            {
                "$project": {
                    "employee_name": {"$concat": ["$employee.firstName", " ", "$employee.lastName"]},
                    "department": "$employee.department",
                    "position": "$employee.position",
                    "total_amount": 1,
                    "receipt_count": 1,
                    "avg_per_receipt": {"$divide": ["$total_amount", "$receipt_count"]}
                }
            },
            {"$sort": {"total_amount": -1}}
        ]).to_list(None)
        
        # KPI 3: Gastos por Categoría
        category_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$category",
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_amount": -1}}
        ]).to_list(None)
        
        # KPI 4: Top Gastos por Departamento
        department_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "employee"
                }
            },
            {"$unwind": "$employee"},
            {
                "$group": {
                    "_id": "$employee.department",
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1},
                    "unique_employees": {"$addToSet": "$userId"}
                }
            },
            {
                "$project": {
                    "department": "$_id",
                    "total_amount": 1,
                    "receipt_count": 1,
                    "employee_count": {"$size": "$unique_employees"},
                    "avg_per_employee": {"$divide": ["$total_amount", {"$size": "$unique_employees"}]}
                }
            },
            {"$sort": {"total_amount": -1}}
        ]).to_list(None)
        
        # KPI 5: Tendencia Semanal
        weekly_trend = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": {"$in": employee_ids},
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "week": {"$week": "$date"},
                        "year": {"$year": "$date"}
                    },
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.week": 1}}
        ]).to_list(None)
        
        # Calcular métricas derivadas
        growth_rate = ((current_total - prev_total) / prev_total * 100) if prev_total > 0 else 0
        avg_per_employee = current_total / len(employees) if employees else 0
        
        # Alertas y Insights
        alerts = []
        if growth_rate > 20:
            alerts.append({
                "type": "warning",
                "title": "Aumento Significativo de Gastos",
                "message": f"Los gastos aumentaron {growth_rate:.1f}% vs período anterior",
                "severity": "high"
            })
        
        if len(employee_expenses) > 0:
            top_spender = employee_expenses[0]
            if top_spender["total_amount"] > avg_per_employee * 2:
                alerts.append({
                    "type": "info",
                    "title": "Empleado con Gastos Elevados",
                    "message": f"{top_spender['employee_name']} gastó ${top_spender['total_amount']:,.0f}",
                    "severity": "medium"
                })
        
        return {
            "success": True,
            "period": period,
            "company_overview": {
                "total_expenses": current_total,
                "previous_expenses": prev_total,
                "growth_rate": growth_rate,
                "total_employees": len(employees),
                "active_employees": len(employee_expenses),
                "avg_per_employee": avg_per_employee,
                "total_receipts": current_expenses[0]["receipt_count"] if current_expenses else 0
            },
            "employee_ranking": employee_expenses[:10],  # Top 10
            "category_breakdown": category_expenses,
            "department_summary": department_expenses,
            "weekly_trend": weekly_trend,
            "alerts": alerts,
            "insights": [
                {
                    "title": "Empleado Más Activo",
                    "value": employee_expenses[0]["employee_name"] if employee_expenses else "N/A",
                    "subtitle": f"${employee_expenses[0]['total_amount']:,.0f}" if employee_expenses else "Sin datos"
                },
                {
                    "title": "Categoría Principal",
                    "value": category_expenses[0]["_id"] if category_expenses else "N/A",
                    "subtitle": f"${category_expenses[0]['total_amount']:,.0f}" if category_expenses else "Sin datos"
                },
                {
                    "title": "Departamento Más Activo",
                    "value": department_expenses[0]["department"] if department_expenses else "N/A",
                    "subtitle": f"${department_expenses[0]['total_amount']:,.0f}" if department_expenses else "Sin datos"
                }
            ],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generando dashboard empresarial: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando analytics: {str(e)}"
        )

@router.get("/employee-performance/{employee_id}", response_model=Dict[str, Any])
async def get_employee_performance(
    employee_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
    days: int = Query(30, description="Días a analizar")
) -> Any:
    """
    Analytics detallados de un empleado específico
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=403,
            detail="Solo empleadores pueden ver performance de empleados"
        )
    
    try:
        # Verificar que el empleado pertenece al empleador
        employee = await db.users.find_one({
            "_id": ObjectId(employee_id),
            "employer_id": ObjectId(current_user.id),
            "role": UserRole.EMPLOYEE
        })
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado"
            )
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Gastos del empleado
        employee_expenses = await db.receipts.aggregate([
            {
                "$match": {
                    "userId": ObjectId(employee_id),
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$totalAmount"},
                    "receipt_count": {"$sum": 1},
                    "avg_per_receipt": {"$avg": "$totalAmount"}
                }
            }
        ]).to_list(None)
        
        # Comparar con promedio de empleados
        all_employees_avg = await db.receipts.aggregate([
            {
                "$lookup": {
                    "from": "users",
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$match": {
                    "user.employer_id": ObjectId(current_user.id),
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$userId",
                    "total_amount": {"$sum": "$totalAmount"}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_spending": {"$avg": "$total_amount"}
                }
            }
        ]).to_list(None)
        
        return {
            "success": True,
            "employee": {
                "name": f"{employee['firstName']} {employee['lastName']}",
                "department": employee.get("department", "Sin departamento"),
                "position": employee.get("position", "Sin posición")
            },
            "performance": {
                "total_spent": employee_expenses[0]["total_amount"] if employee_expenses else 0,
                "receipt_count": employee_expenses[0]["receipt_count"] if employee_expenses else 0,
                "avg_per_receipt": employee_expenses[0]["avg_per_receipt"] if employee_expenses else 0,
                "company_avg": all_employees_avg[0]["avg_spending"] if all_employees_avg else 0
            },
            "period_days": days,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo performance del empleado {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo analytics: {str(e)}"
        )
