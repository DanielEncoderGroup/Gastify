"""
Modelo de datos para sistema de invitaciones empleador→empleado
"""

from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field
from app.models.common import PyObjectId


class InvitationStatus:
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class InvitationModel(BaseModel):
    """Modelo de invitación de empleado"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    # Información del empleador que invita
    employer_id: PyObjectId = Field(..., description="ID del empleador que invita")
    employer_email: str = Field(..., description="Email del empleador para referencia")
    company_name: str = Field(..., description="Nombre de la empresa")
    
    # Información del empleado invitado
    invited_email: str = Field(..., description="Email del empleado invitado")
    invited_first_name: Optional[str] = Field(None, description="Nombre del empleado (opcional)")
    invited_last_name: Optional[str] = Field(None, description="Apellido del empleado (opcional)")
    
    # Información del puesto
    department: Optional[str] = Field(None, description="Departamento del empleado")
    position: Optional[str] = Field(None, description="Cargo/posición del empleado")
    
    # Token y estado de la invitación
    invitation_token: str = Field(..., description="Token único para la invitación")
    status: str = Field(default=InvitationStatus.PENDING, description="Estado de la invitación")
    
    # Fechas importantes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="Fecha de expiración de la invitación")
    accepted_at: Optional[datetime] = Field(None, description="Fecha cuando fue aceptada")
    
    # Notas adicionales
    invitation_message: Optional[str] = Field(None, description="Mensaje personalizado de invitación")
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class InvitationCreate(BaseModel):
    """Datos para crear una nueva invitación"""
    invited_email: str = Field(..., description="Email del empleado a invitar")
    invited_first_name: Optional[str] = Field(None, description="Nombre del empleado")
    invited_last_name: Optional[str] = Field(None, description="Apellido del empleado")
    department: Optional[str] = Field(None, description="Departamento")
    position: Optional[str] = Field(None, description="Cargo/posición")
    invitation_message: Optional[str] = Field(None, description="Mensaje personalizado")
    expires_in_days: int = Field(default=7, description="Días hasta que expire la invitación")


class InvitationPublic(BaseModel):
    """Respuesta pública de invitación"""
    id: str
    invited_email: str
    invited_first_name: Optional[str] = None
    invited_last_name: Optional[str] = None
    company_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    status: str
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    invitation_message: Optional[str] = None


class InvitationTokenData(BaseModel):
    """Datos decodificados del token de invitación"""
    invitation_id: str
    employer_id: str
    invited_email: str
    company_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    expires_at: datetime


class AcceptInvitationRequest(BaseModel):
    """Solicitud para aceptar invitación"""
    token: str = Field(..., description="Token de invitación")
    user_data: dict = Field(..., description="Datos del usuario para registro")


class InvitationStats(BaseModel):
    """Estadísticas de invitaciones para empleador"""
    total_sent: int
    pending: int
    accepted: int
    expired: int
    acceptance_rate: float  # Porcentaje de invitaciones aceptadas
    recent_invitations: list[InvitationPublic]  # Últimas 5 invitaciones


class InvitationEmailData(BaseModel):
    """Datos para email de invitación"""
    invited_email: str
    invited_name: str
    employer_name: str
    company_name: str
    position: Optional[str] = None
    department: Optional[str] = None
    invitation_url: str
    expires_at: datetime
    invitation_message: Optional[str] = None
