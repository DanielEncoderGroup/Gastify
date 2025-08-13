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
