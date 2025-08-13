"""
Endpoints API para Métricas y Monitoreo del Sistema OCR Híbrido
Proporciona acceso a analytics, alertas y reportes de rendimiento
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import Any, Optional, List
import logging
from datetime import datetime

from app.api.deps import get_current_user
from app.models.user import UserPublic
from app.services.ocr_metrics_service import ocr_metrics_service

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/analytics", status_code=status.HTTP_200_OK)
async def get_ocr_analytics(
    days: int = Query(30, description="Número de días para el análisis", ge=1, le=365),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene analytics detallados del sistema OCR híbrido.
    
    Incluye:
    - Estadísticas de uso por engine
    - Rendimiento de cache
    - Análisis de confianza
    - Estadísticas de costos
    - Análisis de errores
    - Breakdown diario
    """
    try:
        analytics = ocr_metrics_service.get_usage_analytics(days=days)
        
        if not analytics:
            raise HTTPException(
                status_code=500,
                detail="Error obteniendo analytics del sistema OCR"
            )
        
        # Agregar información adicional útil
        recommendations = ocr_metrics_service.get_cost_optimization_recommendations()
        
        response = {
            "success": True,
            "message": f"Analytics obtenidos para los últimos {days} días",
            "analytics": analytics,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
        
        logger.info(f"Analytics generados para usuario {current_user.email} - {days} días")
        
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo analytics: {str(e)}"
        )

@router.get("/alerts", status_code=status.HTTP_200_OK)
async def get_active_alerts(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene todas las alertas activas del sistema OCR.
    
    Incluye alertas de:
    - Costos elevados
    - Rendimiento degradado
    - Baja confianza
    - Cuotas excedidas
    - Altas tasas de error
    """
    try:
        alerts = ocr_metrics_service.get_active_alerts()
        
        # Categorizar alertas por severidad
        alerts_by_severity = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        for alert in alerts:
            severity = alert.get('severity', 'low')
            if severity in alerts_by_severity:
                alerts_by_severity[severity].append(alert)
        
        # Contar alertas
        total_alerts = len(alerts)
        critical_count = len(alerts_by_severity['critical'])
        
        response = {
            "success": True,
            "message": f"Se encontraron {total_alerts} alertas activas",
            "alerts": {
                "total_count": total_alerts,
                "critical_count": critical_count,
                "by_severity": alerts_by_severity,
                "all_alerts": alerts
            },
            "system_status": "critical" if critical_count > 0 else "warning" if total_alerts > 0 else "healthy",
            "generated_at": datetime.now().isoformat()
        }
        
        logger.info(f"Alertas obtenidas para usuario {current_user.email} - {total_alerts} activas")
        
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo alertas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo alertas: {str(e)}"
        )

@router.post("/alerts/{alert_id}/resolve", status_code=status.HTTP_200_OK)
async def resolve_alert(
    alert_id: str,
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Marca una alerta específica como resuelta.
    """
    try:
        success = ocr_metrics_service.resolve_alert(alert_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Alerta con ID {alert_id} no encontrada"
            )
        
        logger.info(f"Alerta {alert_id} resuelta por usuario {current_user.email}")
        
        return {
            "success": True,
            "message": f"Alerta {alert_id} marcada como resuelta",
            "resolved_at": datetime.now().isoformat(),
            "resolved_by": current_user.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolviendo alerta: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error resolviendo alerta: {str(e)}"
        )

@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def get_ocr_dashboard(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene datos consolidados para el dashboard de monitoreo OCR.
    
    Combina analytics, alertas y recomendaciones en una vista ejecutiva.
    """
    try:
        # Obtener datos de los últimos 7 y 30 días
        analytics_7d = ocr_metrics_service.get_usage_analytics(days=7)
        analytics_30d = ocr_metrics_service.get_usage_analytics(days=30)
        alerts = ocr_metrics_service.get_active_alerts()
        recommendations = ocr_metrics_service.get_cost_optimization_recommendations()
        
        # KPIs principales
        kpis = {
            "total_requests_7d": analytics_7d.get("total_requests", 0),
            "total_requests_30d": analytics_30d.get("total_requests", 0),
            "average_confidence_7d": analytics_7d.get("confidence_stats", {}).get("average", 0.0),
            "average_confidence_30d": analytics_30d.get("confidence_stats", {}).get("average", 0.0),
            "cache_hit_rate_7d": analytics_7d.get("cache_performance", {}).get("hit_rate", 0.0),
            "cache_hit_rate_30d": analytics_30d.get("cache_performance", {}).get("hit_rate", 0.0),
            "error_rate_7d": analytics_7d.get("error_analysis", {}).get("error_rate", 0.0),
            "error_rate_30d": analytics_30d.get("error_analysis", {}).get("error_rate", 0.0),
            "monthly_cost_projection": analytics_30d.get("cost_analysis", {}).get("monthly_projection", 0.0),
            "google_vision_usage_30d": analytics_30d.get("engine_breakdown", {}).get("google_vision", 0)
        }
        
        # Estado del sistema
        critical_alerts = len([a for a in alerts if a.get('severity') == 'critical'])
        system_health = {
            "status": "critical" if critical_alerts > 0 else "warning" if len(alerts) > 0 else "healthy",
            "score": max(0, 100 - (critical_alerts * 30) - (len(alerts) * 10)),  # Puntuación de salud
            "critical_alerts": critical_alerts,
            "total_alerts": len(alerts)
        }
        
        # Tendencias (comparación 7d vs 30d)
        trends = {
            "requests_trend": "up" if kpis["total_requests_7d"] > (kpis["total_requests_30d"] / 4) else "down",
            "confidence_trend": "up" if kpis["average_confidence_7d"] > kpis["average_confidence_30d"] else "down",
            "cache_trend": "up" if kpis["cache_hit_rate_7d"] > kpis["cache_hit_rate_30d"] else "down",
            "error_trend": "down" if kpis["error_rate_7d"] < kpis["error_rate_30d"] else "up"  # Menos errores es mejor
        }
        
        response = {
            "success": True,
            "message": "Dashboard OCR generado exitosamente",
            "dashboard": {
                "kpis": kpis,
                "system_health": system_health,
                "trends": trends,
                "engine_distribution_7d": analytics_7d.get("engine_breakdown", {}),
                "engine_distribution_30d": analytics_30d.get("engine_breakdown", {}),
                "daily_breakdown": analytics_7d.get("daily_breakdown", []),
                "active_alerts": alerts[:5],  # Top 5 alertas más recientes
                "recommendations": recommendations[:3]  # Top 3 recomendaciones
            },
            "generated_at": datetime.now().isoformat()
        }
        
        logger.info(f"Dashboard OCR generado para usuario {current_user.email}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error generando dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando dashboard: {str(e)}"
        )

@router.get("/export", status_code=status.HTTP_200_OK)
async def export_metrics(
    format: str = Query("json", description="Formato de exportación (json, csv)"),
    days: int = Query(30, description="Días a incluir en la exportación", ge=1, le=365),
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Exporta métricas del sistema OCR en diferentes formatos.
    
    Útil para análisis externos, reportes ejecutivos y auditorías.
    """
    try:
        if format.lower() not in ["json", "csv"]:
            raise HTTPException(
                status_code=400,
                detail="Formato no soportado. Use 'json' o 'csv'"
            )
        
        export_data = ocr_metrics_service.export_metrics(format=format, days=days)
        
        if not export_data:
            raise HTTPException(
                status_code=500,
                detail="Error generando exportación de métricas"
            )
        
        # Agregar metadatos de exportación
        export_data["export_metadata"] = {
            "exported_by": current_user.email,
            "export_format": format,
            "days_included": days,
            "export_timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Métricas exportadas por usuario {current_user.email} - Formato: {format}, Días: {days}")
        
        if format.lower() == "csv":
            # TODO: Implementar respuesta CSV con headers apropiados
            return JSONResponse(
                content=export_data,
                headers={"Content-Type": "application/json"}  # Temporalmente JSON
            )
        else:
            return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exportando métricas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error exportando métricas: {str(e)}"
        )

@router.get("/recommendations", status_code=status.HTTP_200_OK)
async def get_optimization_recommendations(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Obtiene recomendaciones de optimización para el sistema OCR.
    
    Basadas en patrones de uso, costos y rendimiento.
    """
    try:
        recommendations = ocr_metrics_service.get_cost_optimization_recommendations()
        
        # Agregar recomendaciones adicionales basadas en analytics recientes
        analytics = ocr_metrics_service.get_usage_analytics(days=7)
        additional_recommendations = []
        
        # Recomendación de horarios de uso
        daily_breakdown = analytics.get("daily_breakdown", [])
        if len(daily_breakdown) >= 3:
            recent_requests = sum(day.get("total_requests", 0) for day in daily_breakdown[-3:])
            if recent_requests < 10:
                additional_recommendations.append({
                    "type": "usage_pattern",
                    "priority": "low",
                    "title": "Bajo uso del sistema",
                    "description": "El sistema OCR ha tenido poco uso recientemente. Considera promocionar su uso para mejores insights.",
                    "potential_benefit": "Mejor precisión de analytics y optimizaciones"
                })
        
        # Recomendación de configuración de engine
        engine_breakdown = analytics.get("engine_breakdown", {})
        if engine_breakdown.get("tesseract", 0) == 0 and engine_breakdown.get("google_vision", 0) > 0:
            additional_recommendations.append({
                "type": "engine_configuration",
                "priority": "high",
                "title": "Solo se usa Google Vision",
                "description": "Tesseract no está siendo utilizado. Verifica la configuración del sistema híbrido.",
                "potential_savings": "Hasta 80% reducción en costos"
            })
        
        all_recommendations = recommendations + additional_recommendations
        
        response = {
            "success": True,
            "message": f"Se generaron {len(all_recommendations)} recomendaciones",
            "recommendations": {
                "total_count": len(all_recommendations),
                "by_priority": {
                    "high": [r for r in all_recommendations if r.get("priority") == "high"],
                    "medium": [r for r in all_recommendations if r.get("priority") == "medium"],
                    "low": [r for r in all_recommendations if r.get("priority") == "low"]
                },
                "all_recommendations": all_recommendations
            },
            "based_on_analytics": {
                "period_days": 7,
                "total_requests": analytics.get("total_requests", 0),
                "average_confidence": analytics.get("confidence_stats", {}).get("average", 0.0)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        logger.info(f"Recomendaciones generadas para usuario {current_user.email}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error generando recomendaciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando recomendaciones: {str(e)}"
        )

@router.post("/test-metric", status_code=status.HTTP_200_OK)
async def create_test_metric(
    current_user: UserPublic = Depends(get_current_user)
) -> Any:
    """
    Crea una métrica de prueba para verificar el sistema de monitoreo.
    Solo para desarrollo y testing.
    """
    try:
        # Crear métrica de prueba
        ocr_metrics_service.record_ocr_processing(
            engine_used="tesseract",
            confidence=0.85,
            processing_time=2.5,
            fallback_used=False,
            google_vision_used=False,
            cache_hit=False,
            file_size_bytes=1024000,
            image_dimensions={"width": 800, "height": 600},
            error_occurred=False,
            user_id=current_user.id
        )
        
        logger.info(f"Métrica de prueba creada por usuario {current_user.email}")
        
        return {
            "success": True,
            "message": "Métrica de prueba creada exitosamente",
            "metric": {
                "engine_used": "tesseract",
                "confidence": 0.85,
                "processing_time": 2.5,
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error creando métrica de prueba: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creando métrica de prueba: {str(e)}"
        )

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check_metrics() -> Any:
    """
    Verifica el estado del sistema de métricas.
    """
    try:
        # Verificar que los archivos de métricas existen y son accesibles
        analytics = ocr_metrics_service.get_usage_analytics(days=1)
        alerts = ocr_metrics_service.get_active_alerts()
        
        health_status = {
            "status": "healthy",
            "components": {
                "metrics_storage": "available",
                "alerts_system": "available",
                "analytics_engine": "available"
            },
            "stats": {
                "total_metrics_today": analytics.get("total_requests", 0),
                "active_alerts": len(alerts),
                "system_uptime": "available"
            }
        }
        
        return {
            "success": True,
            "message": "Sistema de métricas saludable",
            "health": health_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error en health check de métricas: {str(e)}")
        return {
            "success": False,
            "message": f"Error en sistema de métricas: {str(e)}",
            "health": {
                "status": "unhealthy",
                "error": str(e)
            },
            "timestamp": datetime.now().isoformat()
        }
