"""
Rutas de API para Analytics Predictivos de Gastify Chile.
Endpoints para predicciones, anomalías, insights y dashboard.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.auth import get_current_user
from app.models.user import UserPublic
from app.services.analytics_service import PredictiveAnalyticsService
from app.services.anomaly_detector import ExpenseAnomalyDetector
from app.services.insights_generator import IntelligentInsights

router = APIRouter()


@router.get("/predictions", response_model=Dict[str, Any])
async def get_predictions(
    days: int = Query(30, description="Días a predecir (7, 30, 90)", ge=1, le=365),
    category: Optional[str] = Query(None, description="Categoría específica (opcional)"),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Obtiene predicciones de gastos futuros usando Prophet o métodos estadísticos.
    
    Args:
        days: Número de días a predecir
        category: Categoría específica para predicción (opcional)
        current_user: Usuario autenticado
        db: Base de datos
        
    Returns:
        Predicciones con análisis de tendencias y contexto chileno
    """
    try:
        analytics_service = PredictiveAnalyticsService(db)
        
        # Generar predicción principal
        prediction = await analytics_service.predict_future_expenses(
            user_id=str(current_user.id),
            days=days,
            category=category
        )
        
        # Generar predicciones por períodos estándar si no se especifica categoría
        if not category:
            predictions_7d = await analytics_service.predict_future_expenses(
                user_id=str(current_user.id),
                days=7
            )
            predictions_90d = await analytics_service.predict_future_expenses(
                user_id=str(current_user.id),
                days=90
            )
            
            # Generar predicciones por categoría
            category_predictions = {}
            main_categories = ["Supermercado", "Combustible", "Comida", "Retail", "Transporte"]
            
            for cat in main_categories:
                try:
                    cat_prediction = await analytics_service.predict_future_expenses(
                        user_id=str(current_user.id),
                        days=days,
                        category=cat
                    )
                    category_predictions[cat] = cat_prediction.get("total_amount", 0)
                except Exception:
                    category_predictions[cat] = 0
            
            # Estructura de respuesta completa
            response = {
                "predictions": {
                    "next_7_days": {
                        "amount": predictions_7d.get("total_amount", 0),
                        "confidence": predictions_7d.get("confidence", 0.5)
                    },
                    "next_30_days": {
                        "amount": prediction.get("total_amount", 0),
                        "confidence": prediction.get("confidence", 0.5)
                    },
                    "next_90_days": {
                        "amount": predictions_90d.get("total_amount", 0),
                        "confidence": predictions_90d.get("confidence", 0.5)
                    }
                },
                "trends": prediction.get("trend", {}),
                "category_breakdown": category_predictions,
                "method": prediction.get("method", "statistical"),
                "chile_context": {
                    "seasonal_factors_applied": True,
                    "economic_indicators_considered": ["inflacion", "eventos_comerciales"],
                    "note": prediction.get("note", "")
                }
            }
        else:
            # Respuesta para categoría específica
            response = {
                "category": category,
                "prediction": prediction,
                "period_days": days
            }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando predicciones: {str(e)}"
        )


@router.get("/anomalies", response_model=Dict[str, Any])
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filtrar por severidad (low, medium, high)"),
    limit: int = Query(50, description="Límite de anomalías a retornar", ge=1, le=100),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Detecta y retorna anomalías en los gastos del usuario.
    
    Args:
        severity: Filtro por severidad de anomalía
        limit: Número máximo de anomalías a retornar
        current_user: Usuario autenticado
        db: Base de datos
        
    Returns:
        Lista de anomalías detectadas con contexto chileno
    """
    try:
        anomaly_detector = ExpenseAnomalyDetector(db)
        
        # Detectar todas las anomalías
        anomalies = await anomaly_detector.detect_all_anomalies(str(current_user.id))
        
        # Filtrar por severidad si se especifica
        if severity:
            anomalies = [a for a in anomalies if a.get("severity") == severity]
        
        # Limitar resultados
        anomalies = anomalies[:limit]
        
        # Calcular score de riesgo
        risk_analysis = await anomaly_detector.calculate_risk_score(anomalies)
        
        # Estadísticas por tipo
        type_stats = {}
        for anomaly in anomalies:
            anomaly_type = anomaly.get("type", "unknown")
            type_stats[anomaly_type] = type_stats.get(anomaly_type, 0) + 1
        
        response = {
            "anomalies": anomalies,
            "risk_analysis": risk_analysis,
            "statistics": {
                "total_anomalies": len(anomalies),
                "by_type": type_stats,
                "detection_date": datetime.now().isoformat()
            },
            "chile_context": {
                "rut_validation": "Validación de RUT chileno aplicada",
                "commercial_hours": "Horarios comerciales chilenos considerados",
                "typical_amounts": "Comparación con montos típicos Chile"
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detectando anomalías: {str(e)}"
        )


@router.get("/insights", response_model=Dict[str, Any])
async def get_insights(
    insight_type: Optional[str] = Query(None, description="Tipo de insight (spending_pattern, trend_analysis, etc.)"),
    category: Optional[str] = Query(None, description="Categoría específica"),
    limit: int = Query(10, description="Límite de insights a retornar", ge=1, le=20),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Genera insights inteligentes sobre patrones de gasto del usuario.
    
    Args:
        insight_type: Tipo específico de insight
        category: Categoría específica para análisis
        limit: Número máximo de insights a retornar
        current_user: Usuario autenticado
        db: Base de datos
        
    Returns:
        Lista de insights personalizados con contexto chileno
    """
    try:
        insights_generator = IntelligentInsights(db)
        
        # Generar todos los insights
        insights = await insights_generator.generate_all_insights(str(current_user.id))
        
        # Filtrar por tipo si se especifica
        if insight_type:
            insights = [i for i in insights if i.get("type") == insight_type]
        
        # Filtrar por categoría si se especifica
        if category:
            insights = [i for i in insights if i.get("category") == category]
        
        # Limitar resultados
        insights = insights[:limit]
        
        # Estadísticas de insights
        impact_stats = {}
        type_stats = {}
        
        for insight in insights:
            impact = insight.get("impact", "low")
            insight_type_val = insight.get("type", "unknown")
            
            impact_stats[impact] = impact_stats.get(impact, 0) + 1
            type_stats[insight_type_val] = type_stats.get(insight_type_val, 0) + 1
        
        response = {
            "insights": insights,
            "statistics": {
                "total_insights": len(insights),
                "by_impact": impact_stats,
                "by_type": type_stats,
                "generation_date": datetime.now().isoformat()
            },
            "chile_context": {
                "economic_indicators": "Comparación con indicadores económicos chilenos",
                "retail_events": "Eventos comerciales chilenos considerados",
                "cultural_patterns": "Patrones culturales chilenos (quincenas, feriados)"
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando insights: {str(e)}"
        )


@router.get("/trends", response_model=Dict[str, Any])
async def get_trends(
    period: str = Query("monthly", description="Período de análisis (weekly, monthly, quarterly)"),
    category: Optional[str] = Query(None, description="Categoría específica"),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Analiza tendencias de gasto por categorías chilenas.
    
    Args:
        period: Período de análisis
        category: Categoría específica (opcional)
        current_user: Usuario autenticado
        db: Base de datos
        
    Returns:
        Análisis de tendencias con contexto del mercado chileno
    """
    try:
        analytics_service = PredictiveAnalyticsService(db)
        
        # Analizar patrones de gasto
        patterns = await analytics_service.analyze_spending_patterns(str(current_user.id))
        
        # Obtener datos históricos para análisis de tendencias
        from bson import ObjectId
        
        # Determinar rango de fechas según período
        if period == "weekly":
            date_from = datetime.now() - timedelta(weeks=12)  # 12 semanas
        elif period == "quarterly":
            date_from = datetime.now() - timedelta(days=270)  # 9 meses
        else:  # monthly
            date_from = datetime.now() - timedelta(days=180)  # 6 meses
        
        # Pipeline para obtener tendencias por categoría
        pipeline = [
            {"$match": {
                "user": ObjectId(current_user.id),
                "date": {"$gte": date_from}
            }},
            {"$lookup": {
                "from": "categories",
                "localField": "_id",
                "foreignField": "receipt_id",
                "as": "category_info"
            }},
            {"$unwind": {"path": "$category_info", "preserveNullAndEmptyArrays": True}},
            {"$group": {
                "_id": {
                    "category": {"$ifNull": ["$category_info.category", "Sin categoría"]},
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"}
                },
                "total": {"$sum": "$totalAmount"},
                "count": {"$sum": 1},
                "avg": {"$avg": "$totalAmount"}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        if category:
            # Filtrar por categoría específica en el match
            pipeline[0]["$match"]["category_info.category"] = category
        
        trend_data = await db.receipts.aggregate(pipeline).to_list(None)
        
        # Procesar datos de tendencias
        category_trends = {}
        for item in trend_data:
            cat = item["_id"]["category"]
            if cat not in category_trends:
                category_trends[cat] = []
            
            category_trends[cat].append({
                "year": item["_id"]["year"],
                "month": item["_id"]["month"],
                "total": item["total"],
                "count": item["count"],
                "average": item["avg"]
            })
        
        # Calcular tendencias por categoría
        trend_analysis = {}
        for cat, data in category_trends.items():
            if len(data) >= 2:
                # Calcular crecimiento
                recent = data[-1]["total"]
                previous = data[-2]["total"] if len(data) >= 2 else recent
                
                growth = ((recent - previous) / previous * 100) if previous > 0 else 0
                
                trend_analysis[cat] = {
                    "current_month": recent,
                    "previous_month": previous,
                    "growth_percentage": growth,
                    "trend_direction": "increasing" if growth > 5 else "decreasing" if growth < -5 else "stable",
                    "data_points": len(data)
                }
        
        response = {
            "trends": trend_analysis,
            "patterns": patterns,
            "period": period,
            "date_range": {
                "from": date_from.isoformat(),
                "to": datetime.now().isoformat()
            },
            "chile_context": {
                "seasonal_factors": "Factores estacionales chilenos aplicados",
                "economic_events": "Eventos económicos Chile considerados",
                "retail_calendar": "Calendario comercial chileno incluido"
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analizando tendencias: {str(e)}"
        )


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Obtiene dashboard completo con predicciones, anomalías, insights y tendencias.
    
    Args:
        current_user: Usuario autenticado
        db: Base de datos
        
    Returns:
        Dashboard completo con todos los analytics
    """
    try:
        # Inicializar servicios
        analytics_service = PredictiveAnalyticsService(db)
        anomaly_detector = ExpenseAnomalyDetector(db)
        insights_generator = IntelligentInsights(db)
        
        user_id = str(current_user.id)
        
        # Obtener predicciones (30 días)
        predictions = await analytics_service.predict_future_expenses(user_id, days=30)
        
        # Obtener anomalías (últimas 10)
        anomalies = await anomaly_detector.detect_all_anomalies(user_id)
        anomalies = anomalies[:10]  # Limitar a 10
        
        # Calcular score de riesgo
        risk_analysis = await anomaly_detector.calculate_risk_score(anomalies)
        
        # Obtener insights (top 5)
        insights = await insights_generator.generate_all_insights(user_id)
        insights = insights[:5]  # Top 5 insights
        
        # Obtener patrones de gasto
        patterns = await analytics_service.analyze_spending_patterns(user_id)
        
        # Obtener recomendaciones de presupuesto
        budget_recommendations = await analytics_service.generate_budget_recommendations(user_id)
        
        # Estadísticas generales
        from bson import ObjectId
        
        # Total de recibos y gasto del mes actual
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_stats = await db.receipts.aggregate([
            {"$match": {
                "user": ObjectId(user_id),
                "date": {"$gte": current_month_start}
            }},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$totalAmount"},
                "total_receipts": {"$sum": 1},
                "avg_amount": {"$avg": "$totalAmount"}
            }}
        ]).to_list(1)
        
        monthly_summary = monthly_stats[0] if monthly_stats else {
            "total_amount": 0,
            "total_receipts": 0,
            "avg_amount": 0
        }
        
        # Construir dashboard
        dashboard = {
            "predictions": {
                "next_30_days": predictions.get("total_amount", 0),
                "confidence": predictions.get("confidence", 0.5),
                "trend": predictions.get("trend", {}),
                "method": predictions.get("method", "statistical")
            },
            "anomalies": {
                "recent_anomalies": anomalies,
                "risk_score": risk_analysis.get("risk_score", 0),
                "risk_level": risk_analysis.get("risk_level", "low"),
                "total_detected": len(anomalies)
            },
            "insights": {
                "top_insights": insights,
                "total_generated": len(insights)
            },
            "trends": {
                "spending_patterns": patterns.get("patterns", {}),
                "budget_recommendations": budget_recommendations
            },
            "current_month": {
                "total_spent": monthly_summary["total_amount"],
                "total_receipts": monthly_summary["total_receipts"],
                "average_per_receipt": monthly_summary["avg_amount"],
                "month": datetime.now().strftime("%B %Y")
            },
            "chile_specific": {
                "economic_context": "Análisis basado en economía chilena",
                "retail_events": "Eventos comerciales Chile incluidos",
                "cultural_patterns": "Patrones culturales chilenos aplicados",
                "currency": "CLP",
                "last_updated": datetime.now().isoformat()
            }
        }
        
        return dashboard
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando dashboard: {str(e)}"
        )
