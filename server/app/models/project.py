# server/app/models/project.py
from datetime import datetime
from typing import Optional, List, Dict, Any, Annotated
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from app.models.user import PyObjectId, UserPublic

# Validación de ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]

class TaskStatus:
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    
    @classmethod
    def all_statuses(cls):
        return [cls.TODO, cls.IN_PROGRESS, cls.IN_REVIEW, cls.DONE]

class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskLabel:
    BUG = "bug"
    FEATURE = "feature"
    IMPROVEMENT = "improvement"
    DOCUMENTATION = "documentation"

class Task(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    description: str
    status: str = TaskStatus.TODO
    priority: str = TaskPriority.MEDIUM
    labels: List[str] = []
    assignee: Optional[PyObjectId] = None
    dueDate: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    # Add the missing model configuration
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }

class Column(BaseModel):
    id: str
    title: str
    taskIds: List[str] = []

class Board(BaseModel):
    columns: Dict[str, Column]
    columnOrder: List[str]

class Project(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    requestId: PyObjectId  # Referencia a la solicitud aprobada
    title: str
    description: str
    clientId: PyObjectId
    assignedTeam: List[PyObjectId] = []
    startDate: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[datetime] = None
    status: str = "active"
    board: Optional[Board] = None
    tasks: List[Task] = []  # Add this line - it was missing!
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    # Update to use model_config instead of Config class
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }
        
# Modelos de solicitud
class ProjectCreate(BaseModel):
    title: str
    description: str
    clientId: str
    assignedTeam: List[str] = []
    deadline: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    assignedTeam: Optional[List[str]] = None

class TaskCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    assignee: Optional[str] = None
    dueDate: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    dueDate: Optional[datetime] = None

class BoardUpdate(BaseModel):
    columns: Dict[str, Dict[str, Any]]
    columnOrder: List[str]

# Modelos de respuesta
class ProjectResponse(BaseModel):
    success: bool = True
    project: dict

class ProjectListResponse(BaseModel):
    success: bool = True
    projects: List[dict]
    total: int
    page: int
    pages: int