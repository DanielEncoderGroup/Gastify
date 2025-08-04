from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Any

class PyObjectId(ObjectId):
    """
    Helper para convertir ObjectId de MongoDB a string y viceversa
    """
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, (str, ObjectId)):
            raise TypeError('ObjectId required')
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return str(v)
    
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class MongoBaseModel(BaseModel):
    """
    Modelo base para modelos de MongoDB
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
