from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from app.core.config import settings

# MongoDB client instance
client = None
db = None

async def create_indexes(database):
    """Create necessary indexes for the application."""
    # Índices para la colección de recibos (Gastify)
    await database.receipts.create_index("userId")
    await database.receipts.create_index("date")
    await database.receipts.create_index("category")
    await database.receipts.create_index("amount")
    
    # Índices para búsquedas por texto en recibos
    await database.receipts.create_index([
        ("description", "text"),
        ("merchant", "text")
    ])
    
    # Índices compuestos para consultas frecuentes de Gastify
    await database.receipts.create_index([
        ("userId", 1),
        ("date", -1)
    ])
    
    # Índices para usuarios
    await database.users.create_index("email", unique=True)
    await database.users.create_index("username")
    
    # Índices para notificaciones
    await database.notifications.create_index("userId")
    await database.notifications.create_index("createdAt")
    await database.notifications.create_index("read")

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