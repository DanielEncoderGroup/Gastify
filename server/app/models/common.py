from bson import ObjectId
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema, PydanticCustomError
from typing import Annotated, Any, ClassVar

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
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: GetCoreSchemaHandler):
        def validate_object_id(value):
            if not ObjectId.is_valid(value):
                raise PydanticCustomError("invalid_objectid", "Invalid ObjectId")
            return ObjectId(value)
        
        # Versión simplificada para Pydantic 2.3.0
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),  # Usar str_schema() en lugar de StringSchema()
                core_schema.no_info_plain_validator_function(validate_object_id)
            ])
        ])

class MongoBaseModel(BaseModel):
    """
    Modelo base para modelos de MongoDB
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str
        }
    }
