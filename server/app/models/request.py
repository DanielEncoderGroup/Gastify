# server/app/models/request.py

from typing import Optional, List, Annotated, Any, Dict
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator

from app.models.user import PyObjectId, UserPublic

# ----------------------------------
# 1) Validación de ObjectId (PyObjectId)
# ----------------------------------
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


# ----------------------------------
# 2) Estados de la solicitud
# ----------------------------------
class RequestStatus:
    DRAFT = "draft"
    SUBMITTED = "submitted"               # Enviado para evaluación inicial
    REQUIREMENTS_ANALYSIS = "requirements_analysis"
    PLANNING = "planning"
    ESTIMATION = "estimation"
    PROPOSAL_READY = "proposal_ready"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_DEVELOPMENT = "in_development"
    COMPLETED = "completed"
    CANCELED = "canceled"
    # Legacy / compatibilidad
    IN_PROCESS = "in_process"
    IN_REVIEW = "in_review"

    @classmethod
    def all_statuses(cls) -> List[str]:
        return [
            cls.DRAFT,
            cls.SUBMITTED,
            cls.REQUIREMENTS_ANALYSIS,
            cls.PLANNING,
            cls.ESTIMATION,
            cls.PROPOSAL_READY,
            cls.APPROVED,
            cls.REJECTED,
            cls.IN_DEVELOPMENT,
            cls.COMPLETED,
            cls.CANCELED,
            cls.IN_PROCESS,
            cls.IN_REVIEW,
        ]

    @classmethod
    def status_labels(cls) -> Dict[str, str]:
        return {
            cls.DRAFT: "Borrador",
            cls.SUBMITTED: "Enviado",
            cls.REQUIREMENTS_ANALYSIS: "Análisis de Requisitos",
            cls.PLANNING: "Planificación",
            cls.ESTIMATION: "Estimación",
            cls.PROPOSAL_READY: "Propuesta Lista",
            cls.APPROVED: "Aprobado",
            cls.REJECTED: "Rechazado",
            cls.IN_DEVELOPMENT: "En Desarrollo",
            cls.COMPLETED: "Completado",
            cls.CANCELED: "Cancelado",
            cls.IN_PROCESS: "En Proceso",
            cls.IN_REVIEW: "En Revisión",
        }


# ----------------------------------
# 3) Modelos “anidados”:
#    - comentarios
#    - archivos adjuntos
#    - historial de estados
# ----------------------------------
class RequestComment(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: PyObjectId
    content: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


class RequestFile(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: PyObjectId
    filename: str
    filePath: str
    fileSize: int
    fileType: str
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


class StatusChange(BaseModel):
    fromStatus: Optional[str]
    toStatus: str
    changedBy: PyObjectId
    changedAt: datetime = Field(default_factory=datetime.utcnow)
    reason: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


# ----------------------------------
# 4) RequestCreate:
#    SOLO los campos que el frontend realmente envía
# ----------------------------------
class RequestCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=5,
        max_length=100,
        description="Título del proyecto"
    )
    description: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Descripción detallada del proyecto"
    )
    projectType: str = Field(
        ...,
        description="Tipo de proyecto (ej. 'web_app', 'mobile_app', etc.)"
    )
    priority: Optional[str] = Field(
        None,
        description="Prioridad del proyecto (ej. 'low', 'medium', 'high', 'urgent')"
    )
    budget: Optional[float] = Field(
        None,
        ge=0,
        description="Presupuesto estimado para el proyecto"
    )
    timeframe: Optional[str] = Field(
        None,
        description="Plazo deseado (ej. '3 meses', 'antes de diciembre', etc.)"
    )
    businessGoals: Optional[str] = Field(
        None,
        description="Objetivos de negocio del proyecto"
    )
    targetAudience: Optional[str] = Field(
        None,
        description="Público objetivo del proyecto"
    )
    additionalInfo: Optional[str] = Field(
        None,
        description="Información adicional relevante"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Desarrollo de portal web corporativo",
                "description": "Necesitamos un portal para clientes que muestre estado de pedidos y perfiles.",
                "projectType": "web_app",
                "priority": "medium",
                "budget": 250000.0,
                "timeframe": "3 meses",
                "businessGoals": "Mejorar la experiencia del usuario y reducir tickets de soporte",
                "targetAudience": "Clientes finales y equipo comercial interno",
                "additionalInfo": "El diseño debe respetar nuestra guía de estilo corporativa."
            }
        }
    }


# ----------------------------------
# 5) RequestUpdate:
#    Exactamente los mismos campos de RequestCreate, todos opcionales
# ----------------------------------
class RequestUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Título del proyecto")
    description: Optional[str] = Field(None, description="Descripción detallada del proyecto")
    status: Optional[str] = Field(None, description="Nuevo estado de la solicitud")
    assignedTo: Optional[str] = Field(None, description="ID del admin asignado")
    projectType: Optional[str] = Field(None, description="Tipo de proyecto")
    priority: Optional[str] = Field(None, description="Prioridad del proyecto")
    budget: Optional[float] = Field(None, ge=0, description="Presupuesto estimado")
    timeframe: Optional[str] = Field(None, description="Plazo deseado")
    businessGoals: Optional[str] = Field(None, description="Objetivos de negocio nuevos")
    targetAudience: Optional[str] = Field(None, description="Público objetivo actualizado")
    additionalInfo: Optional[str] = Field(None, description="Información adicional actualizada")

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Portal web v2",
                "description": "Agregar sección de blog y foros",
                "priority": "high",
                "budget": 300000.0,
                "businessGoals": "Incluir módulo de comercio electrónico",
                "targetAudience": "Usuarios B2B",
                "additionalInfo": "Debemos integrar pago mediante PayPal"
            }
        }
    }


# ----------------------------------
# 6) RequestSummary:
#    Campos que enviamos en listados (GET /api/requests/)
# ----------------------------------
class RequestSummary(BaseModel):
    id: str = Field(..., description="ID de la solicitud")
    title: str = Field(..., description="Título de la solicitud")
    description: str = Field(..., description="Descripción breve")
    status: str = Field(..., description="Código del estado actual (p. ej. 'draft')")
    statusLabel: str = Field(..., description="Etiqueta legible del estado")
    projectType: Optional[str] = Field(None, description="Tipo de proyecto")
    projectTypeLabel: Optional[str] = Field(None, description="Etiqueta legible de projectType")
    priority: Optional[str] = Field(None, description="Prioridad (p. ej. 'low', 'medium')")
    priorityLabel: Optional[str] = Field(None, description="Etiqueta legible de priority")
    clientId: str = Field(..., description="ID del cliente que creó la solicitud")
    client: Optional[UserPublic] = Field(None, description="Datos públicos del cliente")
    assignedTo: Optional[str] = Field(None, description="ID del admin asignado")
    assignedAdmin: Optional[UserPublic] = Field(None, description="Datos públicos del admin asignado")
    budget: Optional[float] = Field(None, description="Presupuesto estimado")
    timeframe: Optional[str] = Field(None, description="Plazo deseado")
    businessGoals: Optional[str] = Field(None, description="Objetivos de negocio (resumido)")
    targetAudience: Optional[str] = Field(None, description="Público objetivo (resumido)")
    additionalInfo: Optional[str] = Field(None, description="Notas adicionales (resumido)")
    commentsCount: int = Field(..., description="Cantidad de comentarios")
    filesCount: int = Field(..., description="Cantidad de archivos adjuntos")
    createdAt: datetime = Field(..., description="Fecha de creación")
    updatedAt: Optional[datetime] = Field(None, description="Fecha de última actualización")
    progress: Optional[int] = Field(None, description="Porcentaje de progreso (0-100)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "64f8abe1aabbccddeeff0011",
                "title": "Desarrollo de portal web corporativo",
                "description": "Portal para clientes con control de pedidos y perfiles.",
                "status": "draft",
                "statusLabel": "Borrador",
                "projectType": "web_app",
                "projectTypeLabel": "Aplicación Web",
                "priority": "medium",
                "priorityLabel": "Media",
                "clientId": "607f1f77bcf86cd799439022",
                "client": {
                    "id": "607f1f77bcf86cd799439022",
                    "firstName": "María",
                    "lastName": "González",
                    "email": "maria@example.com",
                    "role": "client",
                    "createdAt": "2025-05-30T12:34:56.789000"
                },
                "assignedTo": None,
                "assignedAdmin": None,
                "budget": 250000.0,
                "timeframe": "3 meses",
                "businessGoals": "Mejorar experiencia y reducir soporte",
                "targetAudience": "Clientes finales",
                "additionalInfo": "Debe respetar branding corporativo",
                "commentsCount": 0,
                "filesCount": 0,
                "createdAt": "2025-05-30T12:34:56.789000",
                "updatedAt": None,
                "progress": 0
            }
        }
    }


# ----------------------------------
# 7) RequestDetail:
#    Igual que RequestSummary + arreglos de comentarios, archivos e historial
# ----------------------------------
class CommentResponse(BaseModel):
    id: str
    content: str
    createdAt: datetime
    user: Optional[UserPublic] = None


class FileResponse(BaseModel):
    id: str
    filename: str
    fileSize: int
    fileType: str
    uploadedAt: datetime
    user: Optional[UserPublic] = None


class StatusHistoryEntry(BaseModel):
    fromStatus: Optional[str]
    fromStatusLabel: Optional[str]
    toStatus: str
    toStatusLabel: str
    changedAt: datetime 
    reason: Optional[str]
    changedBy: Optional[UserPublic]

class RequestStatusUpdatePayload(BaseModel):
    status: str = Field(..., description="El nuevo estado al que se cambiará la solicitud.")
    reason: Optional[str] = Field(None, description="La razón para el cambio de estado (opcional).")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "approved",
                "reason": "La solicitud cumple con todos los criterios."
            }
        }
    }

class RequestDetail(RequestSummary):
    # Hereda todos los campos de RequestSummary
    comments: List[CommentResponse] = []
    files: List[FileResponse] = []
    statusHistory: List[StatusHistoryEntry] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "64f8abe1aabbccddeeff0011",
                "title": "Desarrollo de portal web corporativo",
                "description": "Portal para clientes con control de pedidos y perfiles.",
                "status": "draft",
                "statusLabel": "Borrador",
                "projectType": "web_app",
                "projectTypeLabel": "Aplicación Web",
                "priority": "medium",
                "priorityLabel": "Media",
                "clientId": "607f1f77bcf86cd799439022",
                "client": {
                    "id": "607f1f77bcf86cd799439022",
                    "firstName": "María",
                    "lastName": "González",
                    "email": "maria@example.com",
                    "role": "client",
                    "createdAt": "2025-05-30T12:34:56.789000"
                },
                "assignedTo": None,
                "assignedAdmin": None,
                "budget": 250000.0,
                "timeframe": "3 meses",
                "businessGoals": "Mejorar experiencia y reducir soporte",
                "targetAudience": "Clientes finales",
                "additionalInfo": "Debe respetar branding corporativo",
                "commentsCount": 2,
                "filesCount": 1,
                "createdAt": "2025-05-30T12:34:56.789000",
                "updatedAt": "2025-05-30T14:00:00.000000",
                "progress": 0,
                "comments": [
                    {
                        "id": "64f8ac12aabbccddeeff0012",
                        "content": "Por favor adjunta el diagrama de flujo.",
                        "createdAt": "2025-05-30T13:00:00.000000",
                        "user": {
                            "id": "607f1f77bcf86cd799439033",
                            "firstName": "Pedro",
                            "lastName": "López",
                            "email": "pedro@example.com",
                            "role": "admin",
                            "createdAt": "2025-04-01T10:20:30.000000"
                        }
                    }
                ],
                "files": [
                    {
                        "id": "64f8ac53aabbccddeeff0013",
                        "filename": "requisitos.pdf",
                        "fileSize": 102400,
                        "fileType": "application/pdf",
                        "uploadedAt": "2025-05-30T13:30:00.000000",
                        "user": {
                            "id": "607f1f77bcf86cd799439022",
                            "firstName": "María",
                            "lastName": "González",
                            "email": "maria@example.com",
                            "role": "client",
                            "createdAt": "2025-05-30T12:34:56.789000"
                        }
                    }
                ],
                "statusHistory": [
                    {
                        "fromStatus": None,
                        "fromStatusLabel": None,
                        "toStatus": "draft",
                        "toStatusLabel": "Borrador",
                        "changedAt": "2025-05-30T12:34:56.789000",
                        "reason": "Creación de la solicitud",
                        "changedBy": {
                            "id": "607f1f77bcf86cd799439022",
                            "firstName": "María",
                            "lastName": "González",
                            "email": "maria@example.com",
                            "role": "client",
                            "createdAt": "2025-05-30T12:34:56.789000"
                        }
                    }
                ]
            }
        }
    }


# ----------------------------------
# 8) RequestResponse (para GET /api/requests/{id})
# ----------------------------------
class RequestResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    request: RequestDetail

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "request": {
                    # Aquí puedes copiar el ejemplo de RequestDetail del apartado anterior
                }
            }
        }
    }

# -----------------------------
# 9) PaginatedRequestsResponse:
#    Para GET /api/requests/
# -----------------------------
class PaginatedRequestsResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    total: int = Field(..., description="Total de solicitudes encontradas")
    skip: int = Field(..., description="Offset aplicado")
    limit: int = Field(..., description="Cantidad máxima solicitada")
    requests: List[RequestSummary] = Field(..., description="Lista de RequestSummary")
    # Alias opcional para compatibilidad con frontend que tal vez espere 'items'
    items: Optional[List[RequestSummary]] = Field(
        None,
        description="Alias opcional (mismo contenido que 'requests')"
    )
    page: Optional[int] = Field(None, description="Número de página (opcional)")
    pages: Optional[int] = Field(None, description="Total de páginas (opcional)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "total": 42,
                "skip": 0,
                "limit": 10,
                "requests": [
                    {
                        "id": "64f8abe1aabbccddeeff0011",
                        "title": "Desarrollo de portal web corporativo",
                        "description": "Portal para clientes con control de pedidos y perfiles.",
                        "status": "draft",
                        "statusLabel": "Borrador",
                        "projectType": "web_app",
                        "projectTypeLabel": "Aplicación Web",
                        "priority": "medium",
                        "priorityLabel": "Media",
                        "clientId": "607f1f77bcf86cd799439022",
                        "client": {
                            "id": "607f1f77bcf86cd799439022",
                            "firstName": "María",
                            "lastName": "González",
                            "email": "maria@example.com",
                            "role": "client",
                            "createdAt": "2025-05-30T12:34:56.789000"
                        },
                        "assignedTo": None,
                        "assignedAdmin": None,
                        "budget": 250000.0,
                        "timeframe": "3 meses",
                        "commentsCount": 0,
                        "filesCount": 0,
                        "createdAt": "2025-05-30T12:34:56.789000",
                        "updatedAt": None,
                        "progress": 0,
                    }
                ],
                "items": [
                    # Igual que cada elemento de "requests", es un RequestSummary completo
                    {
                        "id": "64f8abe1aabbccddeeff0011",
                        "title": "Desarrollo de portal web corporativo",
                        "description": "Portal para clientes con control de pedidos y perfiles.",
                        "status": "draft",
                        "statusLabel": "Borrador",
                        "projectType": "web_app",
                        "projectTypeLabel": "Aplicación Web",
                        "priority": "medium",
                        "priorityLabel": "Media",
                        "clientId": "607f1f77bcf86cd799439022",
                        "client": {
                            "id": "607f1f77bcf86cd799439022",
                            "firstName": "María",
                            "lastName": "González",
                            "email": "maria@example.com",
                            "role": "client",
                            "createdAt": "2025-05-30T12:34:56.789000"
                        },
                        "assignedTo": None,
                        "assignedAdmin": None,
                        "budget": 250000.0,
                        "timeframe": "3 meses",
                        "commentsCount": 0,
                        "filesCount": 0,
                        "createdAt": "2025-05-30T12:34:56.789000",
                        "updatedAt": None,
                        "progress": 0,
                    }
                ],
                "page": 0,
                "pages": 5
            }
        }
    }
# ----------------------------------
# 9) Otros modelos de respuesta genérica:
#     - CreateRequestResponse
#     - UpdateRequestResponse
#     - DeleteRequestResponse
#     - AddCommentResponse
# ----------------------------------
class CreateRequestResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje descriptivo")
    requestId: str = Field(..., description="ID de la solicitud recién creada")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Solicitud creada correctamente",
                "requestId": "64f8abe1aabbccddeeff0011"
            }
        }
    }


class UpdateRequestResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje descriptivo")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Solicitud actualizada correctamente"
            }
        }
    }


class DeleteRequestResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje descriptivo")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Solicitud eliminada correctamente"
            }
        }
    }


class AddCommentResponse(BaseModel):
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje descriptivo")
    comment: CommentResponse

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Comentario añadido correctamente",
                "comment": {
                    "id": "64f8ac12aabbccddeeff0012",
                    "content": "Por favor adjunta el diagrama de flujo.",
                    "createdAt": "2025-05-30T13:00:00.000000",
                    "user": {
                        "id": "607f1f77bcf86cd799439033",
                        "firstName": "Pedro",
                        "lastName": "López",
                        "email": "pedro@example.com",
                        "role": "admin",
                        "createdAt": "2025-04-01T10:20:30.000000"
                    }
                }
            }
        }
    }
