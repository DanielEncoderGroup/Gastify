"""
Servicio de Métricas y Monitoreo para Sistema OCR Híbrido
Proporciona analytics detallados, alertas y reportes de uso para optimización de costos
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

logger = logging.getLogger(__name__)


class OCREngine(Enum):
    """Engines OCR disponibles."""
    TESSERACT = "tesseract"
    GOOGLE_VISION = "google_vision"
    HYBRID = "hybrid"


class AlertType(Enum):
    """Tipos de alertas del sistema."""
    COST_WARNING = "cost_warning"
    COST_CRITICAL = "cost_critical"
    PERFORMANCE_DEGRADED = "performance_degraded"
    QUOTA_EXCEEDED = "quota_exceeded"
    LOW_CONFIDENCE = "low_confidence"
    HIGH_ERROR_RATE = "high_error_rate"


@dataclass
class OCRMetric:
    """Métrica individual de procesamiento OCR."""
    timestamp: datetime
    engine_used: str
    confidence: float
    processing_time: float
    fallback_used: bool
    google_vision_used: bool
    cache_hit: bool
    file_size_bytes: int
    image_dimensions: Optional[Dict[str, int]] = None
    error_occurred: bool = False
    error_type: Optional[str] = None
    cost_estimate: float = 0.0
    user_id: Optional[str] = None


@dataclass
class DailyMetrics:
    """Métricas agregadas por día."""
    date: str
    total_requests: int
    tesseract_requests: int
    google_vision_requests: int
    cache_hits: int
    average_confidence: float
    average_processing_time: float
    total_cost_estimate: float
    error_count: int
    unique_users: int


@dataclass
class Alert:
    """Alerta del sistema."""
    id: str
    type: AlertType
    title: str
    message: str
    severity: str  # low, medium, high, critical
    timestamp: datetime
    resolved: bool = False
    metadata: Optional[Dict[str, Any]] = None


class OCRMetricsService:
    """
    Servicio de métricas para el sistema OCR híbrido.
    
    Características:
    - Tracking en tiempo real de métricas de uso
    - Análisis de costos y eficiencia
    - Sistema de alertas automáticas
    - Reportes y analytics avanzados
    - Exportación de datos para análisis externos
    """
    
    def __init__(self, metrics_dir: str = "ocr_metrics"):
        """Inicializa el servicio de métricas."""
        self.metrics_dir = Path(metrics_dir)
        self.metrics_dir.mkdir(exist_ok=True)
        
        self.metrics_file = self.metrics_dir / "metrics.jsonl"
        self.daily_metrics_file = self.metrics_dir / "daily_metrics.json"
        self.alerts_file = self.metrics_dir / "alerts.json"
        
        # Configuración de alertas
        self.alert_thresholds = {
            "monthly_cost_warning": 80.0,  # % del presupuesto mensual
            "monthly_cost_critical": 95.0,
            "confidence_threshold": 0.70,  # Confianza mínima aceptable
            "error_rate_threshold": 0.15,  # 15% de errores máximo
            "processing_time_threshold": 10.0  # 10 segundos máximo
        }
        
        # Estimación de costos (Google Vision API)
        self.google_vision_cost_per_1000 = 1.50  # USD por 1000 requests
        
        logger.info(f"OCRMetricsService inicializado - Directorio: {self.metrics_dir}")
    
    def record_ocr_processing(self, 
                            engine_used: str,
                            confidence: float,
                            processing_time: float,
                            fallback_used: bool = False,
                            google_vision_used: bool = False,
                            cache_hit: bool = False,
                            file_size_bytes: int = 0,
                            image_dimensions: Optional[Dict[str, int]] = None,
                            error_occurred: bool = False,
                            error_type: Optional[str] = None,
                            user_id: Optional[str] = None) -> None:
        """
        Registra una métrica de procesamiento OCR.
        """
        
        # Calcular costo estimado
        cost_estimate = 0.0
        if google_vision_used:
            cost_estimate = self.google_vision_cost_per_1000 / 1000
        
        # Crear métrica
        metric = OCRMetric(
            timestamp=datetime.now(),
            engine_used=engine_used,
            confidence=confidence,
            processing_time=processing_time,
            fallback_used=fallback_used,
            google_vision_used=google_vision_used,
            cache_hit=cache_hit,
            file_size_bytes=file_size_bytes,
            image_dimensions=image_dimensions,
            error_occurred=error_occurred,
            error_type=error_type,
            cost_estimate=cost_estimate,
            user_id=user_id
        )
        
        # Guardar métrica
        self._save_metric(metric)
        
        # Verificar alertas
        self._check_alerts(metric)
        
        # Actualizar métricas diarias
        self._update_daily_metrics(metric)
        
        logger.debug(f"Métrica OCR registrada - Engine: {engine_used}, Confianza: {confidence:.2f}")
    
    def _save_metric(self, metric: OCRMetric) -> None:
        """Guarda una métrica en el archivo JSONL."""
        try:
            metric_dict = asdict(metric)
            metric_dict['timestamp'] = metric.timestamp.isoformat()
            
            with open(self.metrics_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(metric_dict) + '\n')
                
        except Exception as e:
            logger.error(f"Error guardando métrica: {str(e)}")
    
    def _check_alerts(self, metric: OCRMetric) -> None:
        """Verifica y genera alertas basadas en la métrica."""
        alerts = []
        
        # Alerta de baja confianza
        if metric.confidence < self.alert_thresholds["confidence_threshold"]:
            alerts.append(Alert(
                id=f"low_confidence_{datetime.now().timestamp()}",
                type=AlertType.LOW_CONFIDENCE,
                title="Baja confianza OCR",
                message=f"Confianza {metric.confidence:.1%} está por debajo del umbral ({self.alert_thresholds['confidence_threshold']:.1%})",
                severity="medium",
                timestamp=datetime.now(),
                metadata={"confidence": metric.confidence, "engine": metric.engine_used}
            ))
        
        # Alerta de tiempo de procesamiento alto
        if metric.processing_time > self.alert_thresholds["processing_time_threshold"]:
            alerts.append(Alert(
                id=f"slow_processing_{datetime.now().timestamp()}",
                type=AlertType.PERFORMANCE_DEGRADED,
                title="Procesamiento lento",
                message=f"Tiempo de procesamiento {metric.processing_time:.1f}s excede el umbral ({self.alert_thresholds['processing_time_threshold']}s)",
                severity="low",
                timestamp=datetime.now(),
                metadata={"processing_time": metric.processing_time, "engine": metric.engine_used}
            ))
        
        # Verificar uso mensual de Google Vision
        monthly_usage = self._get_monthly_google_vision_usage()
        monthly_cost = monthly_usage * self.google_vision_cost_per_1000 / 1000
        
        if monthly_cost > 50 * (self.alert_thresholds["monthly_cost_warning"] / 100):  # Asumiendo presupuesto de $50
            severity = "critical" if monthly_cost > 50 * (self.alert_thresholds["monthly_cost_critical"] / 100) else "high"
            alerts.append(Alert(
                id=f"cost_alert_{datetime.now().timestamp()}",
                type=AlertType.COST_CRITICAL if severity == "critical" else AlertType.COST_WARNING,
                title=f"Alerta de costo {'crítica' if severity == 'critical' else 'de advertencia'}",
                message=f"Costo mensual estimado: ${monthly_cost:.2f} ({(monthly_cost/50)*100:.1f}% del presupuesto)",
                severity=severity,
                timestamp=datetime.now(),
                metadata={"monthly_cost": monthly_cost, "monthly_usage": monthly_usage}
            ))
        
        # Guardar alertas
        for alert in alerts:
            self._save_alert(alert)
    
    def _save_alert(self, alert: Alert) -> None:
        """Guarda una alerta."""
        try:
            alerts = self._load_alerts()
            
            alert_dict = asdict(alert)
            alert_dict['timestamp'] = alert.timestamp.isoformat()
            alert_dict['type'] = alert.type.value
            
            alerts.append(alert_dict)
            
            with open(self.alerts_file, 'w', encoding='utf-8') as f:
                json.dump(alerts, f, indent=2)
                
            logger.warning(f"Nueva alerta generada: {alert.title}")
            
        except Exception as e:
            logger.error(f"Error guardando alerta: {str(e)}")
    
    def _load_alerts(self) -> List[Dict[str, Any]]:
        """Carga las alertas existentes."""
        try:
            if self.alerts_file.exists():
                with open(self.alerts_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error cargando alertas: {str(e)}")
            return []
    
    def _update_daily_metrics(self, metric: OCRMetric) -> None:
        """Actualiza las métricas diarias agregadas."""
        try:
            today = datetime.now().date().isoformat()
            daily_metrics = self._load_daily_metrics()
            
            # Obtener métricas del día
            today_metrics = daily_metrics.get(today, {
                "date": today,
                "total_requests": 0,
                "tesseract_requests": 0,
                "google_vision_requests": 0,
                "cache_hits": 0,
                "average_confidence": 0.0,
                "average_processing_time": 0.0,
                "total_cost_estimate": 0.0,
                "error_count": 0,
                "unique_users": 0,
                "confidences": [],
                "processing_times": [],
                "users": set()
            })
            
            # Actualizar métricas
            today_metrics["total_requests"] += 1
            
            if metric.engine_used == OCREngine.TESSERACT.value:
                today_metrics["tesseract_requests"] += 1
            elif metric.google_vision_used:
                today_metrics["google_vision_requests"] += 1
            
            if metric.cache_hit:
                today_metrics["cache_hits"] += 1
            
            if metric.error_occurred:
                today_metrics["error_count"] += 1
            
            today_metrics["total_cost_estimate"] += metric.cost_estimate
            
            # Actualizar promedios
            today_metrics["confidences"].append(metric.confidence)
            today_metrics["processing_times"].append(metric.processing_time)
            
            if metric.user_id:
                today_metrics["users"].add(metric.user_id)
            
            today_metrics["average_confidence"] = statistics.mean(today_metrics["confidences"])
            today_metrics["average_processing_time"] = statistics.mean(today_metrics["processing_times"])
            today_metrics["unique_users"] = len(today_metrics["users"])
            
            # Limpiar datos temporales para serialización
            today_metrics_clean = {k: v for k, v in today_metrics.items() 
                                 if k not in ["confidences", "processing_times", "users"]}
            
            daily_metrics[today] = today_metrics_clean
            
            # Guardar métricas diarias
            with open(self.daily_metrics_file, 'w', encoding='utf-8') as f:
                json.dump(daily_metrics, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error actualizando métricas diarias: {str(e)}")
    
    def _load_daily_metrics(self) -> Dict[str, Any]:
        """Carga las métricas diarias."""
        try:
            if self.daily_metrics_file.exists():
                with open(self.daily_metrics_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error cargando métricas diarias: {str(e)}")
            return {}
    
    def _get_monthly_google_vision_usage(self) -> int:
        """Obtiene el uso mensual de Google Vision API."""
        try:
            start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            usage_count = 0
            if self.metrics_file.exists():
                with open(self.metrics_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            metric_data = json.loads(line.strip())
                            metric_timestamp = datetime.fromisoformat(metric_data['timestamp'])
                            
                            if (metric_timestamp >= start_of_month and 
                                metric_data.get('google_vision_used', False)):
                                usage_count += 1
                                
                        except (json.JSONDecodeError, ValueError, KeyError):
                            continue
            
            return usage_count
            
        except Exception as e:
            logger.error(f"Error calculando uso mensual: {str(e)}")
            return 0
    
    def get_usage_analytics(self, days: int = 30) -> Dict[str, Any]:
        """
        Obtiene analytics de uso para los últimos N días.
        """
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            analytics = {
                "period_days": days,
                "start_date": start_date.isoformat(),
                "end_date": datetime.now().isoformat(),
                "total_requests": 0,
                "engine_breakdown": {
                    "tesseract": 0,
                    "google_vision": 0,
                    "hybrid": 0
                },
                "cache_performance": {
                    "hits": 0,
                    "total": 0,
                    "hit_rate": 0.0
                },
                "confidence_stats": {
                    "average": 0.0,
                    "min": 1.0,
                    "max": 0.0,
                    "below_threshold": 0
                },
                "performance_stats": {
                    "average_processing_time": 0.0,
                    "min_processing_time": float('inf'),
                    "max_processing_time": 0.0
                },
                "cost_analysis": {
                    "total_estimated_cost": 0.0,
                    "google_vision_cost": 0.0,
                    "monthly_projection": 0.0
                },
                "error_analysis": {
                    "error_count": 0,
                    "error_rate": 0.0,
                    "error_types": {}
                },
                "daily_breakdown": []
            }
            
            confidences = []
            processing_times = []
            
            if self.metrics_file.exists():
                with open(self.metrics_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            metric_data = json.loads(line.strip())
                            metric_timestamp = datetime.fromisoformat(metric_data['timestamp'])
                            
                            if metric_timestamp >= start_date:
                                analytics["total_requests"] += 1
                                
                                # Engine breakdown
                                engine = metric_data.get('engine_used', 'unknown')
                                if engine in analytics["engine_breakdown"]:
                                    analytics["engine_breakdown"][engine] += 1
                                
                                # Cache performance
                                analytics["cache_performance"]["total"] += 1
                                if metric_data.get('cache_hit', False):
                                    analytics["cache_performance"]["hits"] += 1
                                
                                # Confidence stats
                                confidence = metric_data.get('confidence', 0.0)
                                confidences.append(confidence)
                                
                                if confidence < self.alert_thresholds["confidence_threshold"]:
                                    analytics["confidence_stats"]["below_threshold"] += 1
                                
                                # Performance stats
                                processing_time = metric_data.get('processing_time', 0.0)
                                processing_times.append(processing_time)
                                
                                # Cost analysis
                                cost = metric_data.get('cost_estimate', 0.0)
                                analytics["cost_analysis"]["total_estimated_cost"] += cost
                                
                                if metric_data.get('google_vision_used', False):
                                    analytics["cost_analysis"]["google_vision_cost"] += cost
                                
                                # Error analysis
                                if metric_data.get('error_occurred', False):
                                    analytics["error_analysis"]["error_count"] += 1
                                    error_type = metric_data.get('error_type', 'unknown')
                                    analytics["error_analysis"]["error_types"][error_type] = \
                                        analytics["error_analysis"]["error_types"].get(error_type, 0) + 1
                                        
                        except (json.JSONDecodeError, ValueError, KeyError):
                            continue
            
            # Calcular estadísticas
            if confidences:
                analytics["confidence_stats"]["average"] = statistics.mean(confidences)
                analytics["confidence_stats"]["min"] = min(confidences)
                analytics["confidence_stats"]["max"] = max(confidences)
            
            if processing_times:
                analytics["performance_stats"]["average_processing_time"] = statistics.mean(processing_times)
                analytics["performance_stats"]["min_processing_time"] = min(processing_times)
                analytics["performance_stats"]["max_processing_time"] = max(processing_times)
            
            # Cache hit rate
            if analytics["cache_performance"]["total"] > 0:
                analytics["cache_performance"]["hit_rate"] = \
                    analytics["cache_performance"]["hits"] / analytics["cache_performance"]["total"]
            
            # Error rate
            if analytics["total_requests"] > 0:
                analytics["error_analysis"]["error_rate"] = \
                    analytics["error_analysis"]["error_count"] / analytics["total_requests"]
            
            # Proyección mensual de costos
            if days > 0:
                daily_cost = analytics["cost_analysis"]["total_estimated_cost"] / days
                analytics["cost_analysis"]["monthly_projection"] = daily_cost * 30
            
            # Métricas diarias
            daily_metrics = self._load_daily_metrics()
            for date_str, metrics in daily_metrics.items():
                date_obj = datetime.fromisoformat(date_str).date()
                if date_obj >= start_date.date():
                    analytics["daily_breakdown"].append(metrics)
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error generando analytics: {str(e)}")
            return {}
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Obtiene alertas activas (no resueltas)."""
        try:
            alerts = self._load_alerts()
            return [alert for alert in alerts if not alert.get('resolved', False)]
        except Exception as e:
            logger.error(f"Error obteniendo alertas: {str(e)}")
            return []
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Marca una alerta como resuelta."""
        try:
            alerts = self._load_alerts()
            
            for alert in alerts:
                if alert.get('id') == alert_id:
                    alert['resolved'] = True
                    alert['resolved_at'] = datetime.now().isoformat()
                    
                    with open(self.alerts_file, 'w', encoding='utf-8') as f:
                        json.dump(alerts, f, indent=2)
                    
                    logger.info(f"Alerta {alert_id} marcada como resuelta")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error resolviendo alerta: {str(e)}")
            return False
    
    def export_metrics(self, format: str = "json", days: int = 30) -> Dict[str, Any]:
        """
        Exporta métricas en diferentes formatos para análisis externos.
        """
        try:
            analytics = self.get_usage_analytics(days)
            active_alerts = self.get_active_alerts()
            
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "period_days": days,
                "analytics": analytics,
                "active_alerts": active_alerts,
                "system_health": {
                    "status": "healthy" if len(active_alerts) == 0 else "degraded",
                    "critical_alerts": len([a for a in active_alerts if a.get('severity') == 'critical']),
                    "total_alerts": len(active_alerts)
                }
            }
            
            if format.lower() == "csv":
                # TODO: Implementar exportación CSV
                pass
            
            return export_data
            
        except Exception as e:
            logger.error(f"Error exportando métricas: {str(e)}")
            return {}
    
    def get_cost_optimization_recommendations(self) -> List[Dict[str, Any]]:
        """
        Genera recomendaciones para optimizar costos basadas en el uso.
        """
        try:
            analytics = self.get_usage_analytics(30)
            recommendations = []
            
            # Recomendación de cache
            cache_hit_rate = analytics.get("cache_performance", {}).get("hit_rate", 0.0)
            if cache_hit_rate < 0.3:
                recommendations.append({
                    "type": "cache_optimization",
                    "priority": "high",
                    "title": "Mejorar uso de cache",
                    "description": f"La tasa de aciertos de cache es solo {cache_hit_rate:.1%}. Considera procesar imágenes similares o ajustar la política de cache.",
                    "potential_savings": "20-40% reducción en costos"
                })
            
            # Recomendación de engine
            google_vision_usage = analytics.get("engine_breakdown", {}).get("google_vision", 0)
            total_requests = analytics.get("total_requests", 1)
            
            if google_vision_usage / total_requests > 0.5:
                recommendations.append({
                    "type": "engine_optimization",
                    "priority": "medium",
                    "title": "Optimizar selección de engine",
                    "description": f"Google Vision se usa en {(google_vision_usage/total_requests):.1%} de los casos. Considera ajustar el umbral de confianza.",
                    "potential_savings": "15-25% reducción en costos"
                })
            
            # Recomendación de calidad de imagen
            avg_confidence = analytics.get("confidence_stats", {}).get("average", 0.0)
            if avg_confidence < 0.85:
                recommendations.append({
                    "type": "image_quality",
                    "priority": "medium",
                    "title": "Mejorar calidad de imágenes",
                    "description": f"Confianza promedio es {avg_confidence:.1%}. Mejores imágenes reducen la necesidad de Google Vision.",
                    "potential_savings": "10-30% reducción en costos"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generando recomendaciones: {str(e)}")
            return []


# Instancia global del servicio de métricas
ocr_metrics_service = OCRMetricsService()
