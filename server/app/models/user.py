from typing import Optional, Any
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, validator

# Función para validar ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Tipo para ObjectId compatible con Pydantic v1
PyObjectId = ObjectId

# Definición de roles disponibles
class UserRole:
    ADMIN = "admin"
    CLIENT = "client"
    
    @classmethod
    def all_roles(cls):
        return [cls.ADMIN, cls.CLIENT]

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    role: str = Field(default=UserRole.CLIENT)  # Por defecto, todos los usuarios son clientes
    resetPasswordToken: Optional[str] = None
    resetPasswordExpire: Optional[datetime] = None
    emailVerified: bool = False
    emailVerificationToken: Optional[str] = None
    emailVerificationExpire: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = None
    
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
        schema_extra = {
            "example": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com",
                "password": "securepassword"
            }
        }

class UserInDB(UserModel):
    """User as stored in the database (including hashed password)"""
    pass

class UserPublic(BaseModel):
    """User information without sensitive data"""
    id: str
    firstName: str
    lastName: str
    email: EmailStr
    role: str
    createdAt: datetime

    class Config:
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com",
                "role": "client",
                "createdAt": "2023-08-28T12:34:56.789000"
            }
        }

class UserCreate(BaseModel):
    """Request model for user creation"""
    firstName: str
    lastName: str
    email: EmailStr
    password: str

    class Config:
        schema_extra = {
            "example": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com",
                "password": "securepassword"
            }
        }

class UserUpdate(BaseModel):
    """Request model for user update"""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "firstName": "John",
                "lastName": "Smith"
            }
        }

class UserLogin(BaseModel):
    """Request model for user login"""
    email: EmailStr
    password: str

    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepassword"
            }
        }

class ForgotPassword(BaseModel):
    """Request model for password reset request"""
    email: EmailStr

    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com"
            }
        }

class ResetPassword(BaseModel):
    """Request model for password reset"""
    password: str

    class Config:
        schema_extra = {
            "example": {
                "password": "newsecurepassword"
            }
        }

class Token(BaseModel):
    """Response model for JWT token"""
    access_token: str
    token_type: str = "bearer"

    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }