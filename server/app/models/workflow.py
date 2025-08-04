from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId
from pydantic import BaseModel, Field, validator

# Función para validar ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Tipo para ObjectId compatible con Pydantic v1
PyObjectId = ObjectId

# Enums para el sistema de workflows
class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"

class ApprovalAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUIRE_APPROVAL = "require_approval"
    ESCALATE = "escalate"

class ConditionOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_EQUAL = "greater_equal"
    LESS_EQUAL = "less_equal"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    AUTO_APPROVED = "auto_approved"

# Modelos para condiciones de workflow
class WorkflowCondition(BaseModel):
    """Condición individual para evaluación de workflow"""
    field: str  # Campo a evaluar (amount, category, user_role, etc.)
    operator: ConditionOperator
    value: Any  # Valor a comparar
    description: Optional[str] = None

class WorkflowRule(BaseModel):
    """Regla de workflow con condiciones y acción"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    description: Optional[str] = None
    conditions: List[WorkflowCondition]
    condition_logic: str = "AND"  # AND/OR para combinar condiciones
    action: ApprovalAction
    priority: int = 0  # Mayor número = mayor prioridad
    escalation_user_id: Optional[str] = None  # Usuario al que escalar
    escalation_role: Optional[str] = None  # Rol al que escalar
    auto_approve_limit: Optional[float] = None  # Límite para auto-aprobación

# Modelo principal de Workflow
class WorkflowModel(BaseModel):
    """Modelo principal de workflow de aprobación"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    company_id: str  # ID de la empresa
    name: str
    description: Optional[str] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    rules: List[WorkflowRule] = []
    default_action: ApprovalAction = ApprovalAction.REQUIRE_APPROVAL
    created_by: str  # ID del usuario que creó el workflow
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_default: bool = False  # Si es el workflow por defecto de la empresa

    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return v
        return validate_object_id(v)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

# Modelo para instancias de aprobación
class ApprovalInstance(BaseModel):
    """Instancia de aprobación para un recibo específico"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    receipt_id: str
    workflow_id: str
    company_id: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    current_approver_id: Optional[str] = None
    current_approver_role: Optional[str] = None
    applied_rule_id: Optional[str] = None  # ID de la regla que se aplicó
    approval_chain: List[Dict[str, Any]] = []  # Historial de aprobaciones
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    escalation_count: int = 0
    comments: List[Dict[str, Any]] = []  # Comentarios de aprobadores

    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return v
        return validate_object_id(v)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

# Modelos para roles y jerarquías organizacionales
class OrganizationRole(BaseModel):
    """Rol organizacional con jerarquía"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    company_id: str
    name: str
    description: Optional[str] = None
    level: int  # Nivel jerárquico (1 = más alto)
    approval_limit: Optional[float] = None  # Límite de aprobación en CLP
    can_approve_categories: List[str] = []  # Categorías que puede aprobar
    parent_role_id: Optional[str] = None  # Rol padre en la jerarquía
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return v
        return validate_object_id(v)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

class UserRoleAssignment(BaseModel):
    """Asignación de rol organizacional a usuario"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    company_id: str
    role_id: str
    assigned_by: str  # ID del usuario que asignó el rol
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    @validator('id', pre=True, always=True)
    def validate_id(cls, v):
        if v is None:
            return v
        return validate_object_id(v)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

# DTOs para API
class WorkflowCreate(BaseModel):
    """DTO para crear workflow"""
    name: str
    description: Optional[str] = None
    rules: List[WorkflowRule] = []
    default_action: ApprovalAction = ApprovalAction.REQUIRE_APPROVAL
    is_default: bool = False

class WorkflowUpdate(BaseModel):
    """DTO para actualizar workflow"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    rules: Optional[List[WorkflowRule]] = None
    default_action: Optional[ApprovalAction] = None
    is_default: Optional[bool] = None

class ApprovalDecision(BaseModel):
    """DTO para decisión de aprobación"""
    action: ApprovalAction
    comment: Optional[str] = None
    escalate_to_user_id: Optional[str] = None
    escalate_to_role: Optional[str] = None

class WorkflowEvaluation(BaseModel):
    """Resultado de evaluación de workflow"""
    workflow_id: str
    applied_rule_id: Optional[str] = None
    action: ApprovalAction
    reason: str
    confidence: float  # 0.0 - 1.0
    next_approver_id: Optional[str] = None
    next_approver_role: Optional[str] = None
    auto_approved: bool = False

# Modelos para reportes y analytics
class WorkflowAnalytics(BaseModel):
    """Analytics de workflows"""
    total_approvals: int
    auto_approved: int
    manual_approved: int
    rejected: int
    pending: int
    average_approval_time: float  # En horas
    escalation_rate: float  # Porcentaje
    approval_rate_by_category: Dict[str, float]
    approval_rate_by_amount_range: Dict[str, float]
    top_approvers: List[Dict[str, Any]]
