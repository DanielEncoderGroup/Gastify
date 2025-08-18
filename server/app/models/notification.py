from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pydantic import BaseModel, Field, validator
from app.models.user import PyObjectId

class NotificationType:
    RECEIPT_CREATED = "receipt_created"
    RECEIPT_UPDATED = "receipt_updated"
    COMMENT_ADDED = "comment_added"
    FILE_UPLOADED = "file_uploaded"
    SYSTEM_NOTIFICATION = "system_notification"
    
    # Invitation notifications
    INVITATION_SENT = "invitation_sent"
    INVITATION_ACCEPTED = "invitation_accepted"
    INVITATION_DECLINED = "invitation_declined"
    INVITATION_EXPIRED = "invitation_expired"
    
    # Employee notifications
    EMPLOYEE_JOINED = "employee_joined"
    EMPLOYEE_LEFT = "employee_left"
    
    # Receipt workflow notifications
    RECEIPT_SUBMITTED = "receipt_submitted"
    RECEIPT_APPROVED = "receipt_approved"
    RECEIPT_REJECTED = "receipt_rejected"

class Notification(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

# Alias para compatibilidad
NotificationModel = Notification

class NotificationCreate(BaseModel):
    """Modelo para crear notificaciones"""
    user_id: PyObjectId
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class NotificationUpdate(BaseModel):
    """Modelo para actualizar notificaciones"""
    read: Optional[bool] = None
    read_at: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True