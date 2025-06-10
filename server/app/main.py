from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from app.api.routes import auth, receipts, requests, notifications, projects
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection

app = FastAPI(
    title="Encodergroup API",
    description="API para gestión de boletas de gastos",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["Receipts"])
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])

# Mount static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Eventos de inicio y cierre para la conexión a MongoDB
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/", tags=["Health"])
def health_check():
    return {"message": "Encodergroup API is running..."}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(settings.PORT),
        reload=settings.DEBUG
    )