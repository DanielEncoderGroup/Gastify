from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from app.api.routes import auth, receipts, notifications, categories, analytics, workflows, hybrid_ocr, ocr, invitations, websockets, spending_limits, advanced_notifications, employees, receipt_products, company_analytics
from app.routers import geolocation
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection

app = FastAPI(
    title="Gastify API",
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
app.include_router(receipt_products.router, prefix="/api", tags=["Receipt Products"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(company_analytics.router, prefix="/api/company-analytics", tags=["Company Analytics"])
app.include_router(workflows.router, prefix="/api", tags=["Workflows"])
app.include_router(geolocation.router, prefix="/api", tags=["Geolocation"])
app.include_router(hybrid_ocr.router, prefix="/api/hybrid-ocr", tags=["Hybrid OCR"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["Invitations"])
app.include_router(websockets.router, prefix="/api/v1/websockets", tags=["WebSockets"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(spending_limits.router, prefix="/api/spending-limits", tags=["Spending Limits"])
app.include_router(advanced_notifications.router, prefix="/api/advanced-notifications", tags=["Advanced Notifications"])

# Mount static files for uploads

# Eventos de inicio y cierre para la conexión a MongoDB
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/", tags=["Health"])
def health_check():
    return {"message": "Gastify API is running..."}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(settings.PORT),
        reload=settings.DEBUG
    )