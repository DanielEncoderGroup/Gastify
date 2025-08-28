"""
Rutas para gastos de combustible
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.api.deps import get_current_user
from app.models.user import UserModel
from pydantic import BaseModel

router = APIRouter()

# Modelos temporales para fuel expenses
class FuelExpenseBase(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    origin_address: str = ""
    destination_address: str = ""
    vehicle_type: str
    fuel_type: str
    business_purpose: str
    description: Optional[str] = None
    distance_km: float
    fuel_needed_liters: float
    fuel_price_per_liter: float
    total_cost: float

class FuelExpenseCreate(FuelExpenseBase):
    pass

class FuelExpenseResponse(FuelExpenseBase):
    id: str
    user_id: str
    status: str = "submitted"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FuelExpenseStats(BaseModel):
    total_expenses: int
    total_amount: float
    total_distance: float
    total_fuel_liters: float
    average_cost_per_km: float

# Mock data para desarrollo
mock_fuel_expenses = []
mock_stats = FuelExpenseStats(
    total_expenses=0,
    total_amount=0.0,
    total_distance=0.0,
    total_fuel_liters=0.0,
    average_cost_per_km=0.0
)

@router.get("/fuel-expenses", response_model=List[FuelExpenseResponse])
async def get_fuel_expenses(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Obtener todos los gastos de combustible del usuario
    """
    # Filtrar por usuario actual
    user_expenses = [
        expense for expense in mock_fuel_expenses 
        if expense.get("user_id") == str(current_user.id)
    ]
    return user_expenses

@router.post("/fuel-expenses", response_model=FuelExpenseResponse)
async def create_fuel_expense(
    fuel_expense: FuelExpenseCreate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Crear un nuevo gasto de combustible
    """
    from datetime import datetime
    import uuid
    
    # Crear nuevo gasto
    new_expense = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        "status": "submitted",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        **fuel_expense.dict()
    }
    
    # Agregar a mock data
    mock_fuel_expenses.append(new_expense)
    
    # Actualizar estadísticas
    global mock_stats
    mock_stats.total_expenses += 1
    mock_stats.total_amount += fuel_expense.total_cost
    mock_stats.total_distance += fuel_expense.distance_km
    mock_stats.total_fuel_liters += fuel_expense.fuel_needed_liters
    
    if mock_stats.total_distance > 0:
        mock_stats.average_cost_per_km = mock_stats.total_amount / mock_stats.total_distance
    
    return FuelExpenseResponse(**new_expense)

@router.get("/fuel-expenses/stats", response_model=FuelExpenseStats)
async def get_fuel_expense_stats(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Obtener estadísticas de gastos de combustible del usuario
    """
    # Calcular estadísticas solo para el usuario actual
    user_expenses = [
        expense for expense in mock_fuel_expenses 
        if expense.get("user_id") == str(current_user.id)
    ]
    
    if not user_expenses:
        return FuelExpenseStats(
            total_expenses=0,
            total_amount=0.0,
            total_distance=0.0,
            total_fuel_liters=0.0,
            average_cost_per_km=0.0
        )
    
    total_amount = sum(expense["total_cost"] for expense in user_expenses)
    total_distance = sum(expense["distance_km"] for expense in user_expenses)
    total_fuel = sum(expense["fuel_needed_liters"] for expense in user_expenses)
    
    return FuelExpenseStats(
        total_expenses=len(user_expenses),
        total_amount=total_amount,
        total_distance=total_distance,
        total_fuel_liters=total_fuel,
        average_cost_per_km=total_amount / total_distance if total_distance > 0 else 0.0
    )

@router.get("/fuel-expenses/{expense_id}", response_model=FuelExpenseResponse)
async def get_fuel_expense(
    expense_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Obtener un gasto de combustible específico
    """
    expense = next(
        (exp for exp in mock_fuel_expenses 
         if exp["id"] == expense_id and exp["user_id"] == str(current_user.id)), 
        None
    )
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto de combustible no encontrado"
        )
    
    return FuelExpenseResponse(**expense)

@router.delete("/fuel-expenses/{expense_id}")
async def delete_fuel_expense(
    expense_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Eliminar un gasto de combustible
    """
    global mock_fuel_expenses
    
    # Buscar y eliminar el gasto
    expense_index = next(
        (i for i, exp in enumerate(mock_fuel_expenses) 
         if exp["id"] == expense_id and exp["user_id"] == str(current_user.id)), 
        None
    )
    
    if expense_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto de combustible no encontrado"
        )
    
    # Obtener datos del gasto antes de eliminarlo para actualizar stats
    expense = mock_fuel_expenses[expense_index]
    
    # Eliminar de la lista
    mock_fuel_expenses.pop(expense_index)
    
    # Actualizar estadísticas
    global mock_stats
    mock_stats.total_expenses = max(0, mock_stats.total_expenses - 1)
    mock_stats.total_amount = max(0, mock_stats.total_amount - expense["total_cost"])
    mock_stats.total_distance = max(0, mock_stats.total_distance - expense["distance_km"])
    mock_stats.total_fuel_liters = max(0, mock_stats.total_fuel_liters - expense["fuel_needed_liters"])
    
    if mock_stats.total_distance > 0:
        mock_stats.average_cost_per_km = mock_stats.total_amount / mock_stats.total_distance
    else:
        mock_stats.average_cost_per_km = 0.0
    
    return {"message": "Gasto de combustible eliminado exitosamente"}