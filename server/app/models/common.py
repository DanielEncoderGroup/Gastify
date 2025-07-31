from bson import ObjectId
from pydantic import BaseModel, Field

class PyObjectId(ObjectId):
    """
    Helper para convertir ObjectId de MongoDB a string y viceversa
    """
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import PydanticCustomError, core_schema
        
        def validate_object_id(value):
            if not ObjectId.is_valid(value):
                raise PydanticCustomError("invalid_objectid", "Invalid ObjectId")
            return ObjectId(value)
        
        return core_schema.with_info_plain_schema(
            core_schema.string_schema(),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
            validation_function=validate_object_id,
        )

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
