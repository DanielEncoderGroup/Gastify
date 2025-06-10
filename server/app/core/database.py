from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from app.core.config import settings

# MongoDB client instance
client = None
db = None

async def create_indexes(database):
    """Create necessary indexes for the application."""
    # Índices para la colección de proyectos
    await database.projects.create_index("clientId")
    await database.projects.create_index("status")
    await database.projects.create_index("assignedTeam")
    await database.projects.create_index("createdAt")
    
    # Índices para búsquedas por texto
    await database.projects.create_index([
        ("title", "text"),
        ("description", "text")
    ])
    
    # Índices compuestos para consultas frecuentes
    await database.projects.create_index([
        ("clientId", 1),
        ("status", 1)
    ])
    
    # Índices para tareas anidadas
    await database.projects.create_index("tasks._id")
    await database.projects.create_index("tasks.assignee")
    await database.projects.create_index("tasks.status")
    await database.projects.create_index("tasks.dueDate")
    await database.projects.create_index("tasks.priority")
    
    # Índice para búsqueda de tareas por asignado
    await database.projects.create_index([
        ("tasks.assignee", 1),
        ("tasks.status", 1)
    ])

async def connect_to_mongo():
    """Connect to MongoDB and create indexes."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI)
        # Extraer el nombre de la base de datos de la URI
        db_name = settings.MONGO_URI.split("/")[-1]
        if not db_name or "?" in db_name:
            db_name = "encodergroup"  # Nombre por defecto
        
        db = client[db_name]
        
        # Crear índices
        await create_indexes(db)
        
        print(f"Connected to MongoDB at {settings.MONGO_URI}")
        print(f"Using database: {db_name}")
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("Closed connection to MongoDB")

def get_database() -> Database:
    """Get MongoDB database object."""
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db