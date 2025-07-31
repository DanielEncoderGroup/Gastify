"""
Servicio de Analytics Predictivos para Gastify Chile.
Utiliza Prophet para predicciones de gastos y análisis específicos del mercado chileno.
"""

import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logging.warning("Prophet no está disponible. Se usarán predicciones mock.")

from app.models.analytics import (
    PredictionModel, PredictionType, TrendDirection, TrendAnalysis,
    CategoryPrediction, ChileEconomicIndicator, ChileRetailEvent
)

logger = logging.getLogger(__name__)


class PredictiveAnalyticsService:
    """
    Servicio de analytics predictivos específico para el mercado chileno.
    Utiliza Prophet para generar predicciones de gastos futuros.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.min_data_points = 30  # Mínimo de recibos para predicciones confiables
        
        # Eventos específicos de Chile
        self.chile_holidays = [
            {'holiday': 'fiestas_patrias', 'ds': '2024-09-18', 'lower_window': -2, 'upper_window': 2},
            {'holiday': 'navidad', 'ds': '2024-12-25', 'lower_window': -7, 'upper_window': 2},
            {'holiday': 'año_nuevo', 'ds': '2025-01-01', 'lower_window': -3, 'upper_window': 2},
        ]
        
        # Factores estacionales chilenos
        self.seasonal_factors = {
            'marzo': 1.15,  # Vuelta a clases
            'septiembre': 1.20,  # Fiestas patrias
            'diciembre': 1.25,  # Navidad
            'enero': 0.85,  # Post navidad
            'febrero': 0.90,  # Vacaciones
        }

    async def predict_future_expenses(
        self, 
        user_id: str, 
        days: int = 30,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predice gastos futuros usando Prophet o predicciones mock.
        
        Args:
            user_id: ID del usuario
            days: Días a predecir (7, 30, 90)
            category: Categoría específica (opcional)
            
        Returns:
            Dict con predicciones y análisis
        """
        try:
            # Obtener datos históricos
            historical_data = await self._get_historical_data(user_id, category)
            
            if len(historical_data) < self.min_data_points:
                logger.info(f"Datos insuficientes para {user_id}. Usando predicciones mock.")
                return await self._generate_mock_predictions(user_id, days, category)
            
            if PROPHET_AVAILABLE:
                return await self._generate_prophet_predictions(historical_data, days, category)
            else:
                return await self._generate_statistical_predictions(historical_data, days, category)
                
        except Exception as e:
            logger.error(f"Error en predicción para usuario {user_id}: {str(e)}")
            return await self._generate_mock_predictions(user_id, days, category)

    async def _get_historical_data(self, user_id: str, category: Optional[str] = None) -> pd.DataFrame:
        """Obtiene datos históricos del usuario desde MongoDB."""
        pipeline = [
            {"$match": {"user": ObjectId(user_id)}},
            {"$sort": {"date": 1}}
        ]
        
        if category:
            # Buscar en la colección de categorías
            category_pipeline = [
                {"$match": {"user": ObjectId(user_id), "category": category}},
                {"$lookup": {
                    "from": "receipts",
                    "localField": "receipt_id", 
                    "foreignField": "_id",
                    "as": "receipt"
                }},
                {"$unwind": "$receipt"},
                {"$sort": {"receipt.date": 1}}
            ]
            receipts = await self.db.categories.aggregate(category_pipeline).to_list(None)
            data = []
            for item in receipts:
                receipt = item["receipt"]
                data.append({
                    "ds": receipt["date"],
                    "y": receipt["totalAmount"],
                    "category": item["category"]
                })
        else:
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            data = []
            for receipt in receipts:
                data.append({
                    "ds": receipt["date"],
                    "y": receipt["totalAmount"]
                })
        
        return pd.DataFrame(data)

    async def _generate_prophet_predictions(
        self, 
        data: pd.DataFrame, 
        days: int, 
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Genera predicciones usando Prophet."""
        try:
            # Preparar datos para Prophet
            df = data[['ds', 'y']].copy()
            df['ds'] = pd.to_datetime(df['ds'])
            
            # Agregar por día para evitar duplicados
            df = df.groupby('ds').agg({'y': 'sum'}).reset_index()
            
            # Crear modelo Prophet
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True,
                holidays=pd.DataFrame(self.chile_holidays)
            )
            
            # Entrenar modelo
            model.fit(df)
            
            # Crear fechas futuras
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            
            # Extraer predicciones
            future_forecast = forecast.tail(days)
            total_predicted = future_forecast['yhat'].sum()
            confidence = self._calculate_confidence(forecast, df)
            
            # Análisis de tendencia
            trend_analysis = self._analyze_trend(forecast)
            
            return {
                "total_amount": max(0, total_predicted),  # No permitir valores negativos
                "confidence": confidence,
                "trend": trend_analysis,
                "daily_breakdown": future_forecast[['ds', 'yhat']].to_dict('records'),
                "method": "prophet"
            }
            
        except Exception as e:
            logger.error(f"Error en predicción Prophet: {str(e)}")
            return await self._generate_statistical_predictions(data, days, category)

    async def _generate_statistical_predictions(
        self, 
        data: pd.DataFrame, 
        days: int, 
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Genera predicciones usando métodos estadísticos simples."""
        try:
            # Calcular promedio diario de los últimos 30 días
            recent_data = data.tail(30)
            daily_average = recent_data['y'].mean()
            
            # Aplicar factor estacional chileno
            current_month = datetime.now().strftime('%B').lower()
            month_names = {
                'january': 'enero', 'february': 'febrero', 'march': 'marzo',
                'april': 'abril', 'may': 'mayo', 'june': 'junio',
                'july': 'julio', 'august': 'agosto', 'september': 'septiembre',
                'october': 'octubre', 'november': 'noviembre', 'december': 'diciembre'
            }
            
            spanish_month = month_names.get(current_month, current_month)
            seasonal_factor = self.seasonal_factors.get(spanish_month, 1.0)
            
            # Calcular predicción
            adjusted_daily_average = daily_average * seasonal_factor
            total_predicted = adjusted_daily_average * days
            
            # Calcular confianza basada en variabilidad
            std_dev = recent_data['y'].std()
            confidence = max(0.3, min(0.9, 1 - (std_dev / daily_average) if daily_average > 0 else 0.3))
            
            # Análisis de tendencia simple
            if len(data) >= 14:
                recent_avg = data.tail(7)['y'].mean()
                previous_avg = data.tail(14).head(7)['y'].mean()
                growth_rate = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
                
                if growth_rate > 5:
                    trend_direction = TrendDirection.INCREASING
                elif growth_rate < -5:
                    trend_direction = TrendDirection.DECREASING
                else:
                    trend_direction = TrendDirection.STABLE
            else:
                growth_rate = 0
                trend_direction = TrendDirection.STABLE
            
            trend_analysis = TrendAnalysis(
                direction=trend_direction,
                monthly_growth=growth_rate,
                seasonal_factor=seasonal_factor,
                confidence=confidence
            )
            
            return {
                "total_amount": max(0, total_predicted),
                "confidence": confidence,
                "trend": trend_analysis.dict(),
                "method": "statistical"
            }
            
        except Exception as e:
            logger.error(f"Error en predicción estadística: {str(e)}")
            return await self._generate_mock_predictions("", days, category)

    async def _generate_mock_predictions(
        self, 
        user_id: str, 
        days: int, 
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Genera predicciones mock realistas para Chile."""
        # Montos base por categoría (en CLP)
        base_amounts = {
            "Supermercado": 15000,
            "Combustible": 25000,
            "Transporte": 8000,
            "Farmacia": 12000,
            "Retail": 35000,
            "Comida": 18000,
            "Salud": 45000,
            "Educación": 30000,
            "Entretenimiento": 20000,
            "Servicios": 25000,
            "Otros": 15000
        }
        
        if category and category in base_amounts:
            daily_base = base_amounts[category]
        else:
            daily_base = 20000  # Promedio general
        
        # Aplicar variabilidad y estacionalidad
        current_month = datetime.now().month
        seasonal_factor = self.seasonal_factors.get(
            ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][current_month - 1],
            1.0
        )
        
        total_predicted = daily_base * days * seasonal_factor
        
        trend_analysis = TrendAnalysis(
            direction=TrendDirection.STABLE,
            monthly_growth=2.5,  # Inflación promedio Chile
            seasonal_factor=seasonal_factor,
            confidence=0.6  # Confianza media para datos mock
        )
        
        return {
            "total_amount": total_predicted,
            "confidence": 0.6,
            "trend": trend_analysis.dict(),
            "method": "mock",
            "note": "Predicción basada en promedios del mercado chileno (datos insuficientes)"
        }

    def _calculate_confidence(self, forecast: pd.DataFrame, historical: pd.DataFrame) -> float:
        """Calcula la confianza de la predicción basada en el error histórico."""
        try:
            # Calcular MAPE (Mean Absolute Percentage Error)
            actual = historical['y'].values
            predicted = forecast.head(len(actual))['yhat'].values
            
            if len(actual) != len(predicted):
                return 0.7  # Confianza por defecto
            
            mape = np.mean(np.abs((actual - predicted) / actual)) * 100
            
            # Convertir MAPE a confianza (0-1)
            confidence = max(0.3, min(0.95, 1 - (mape / 100)))
            return confidence
            
        except Exception:
            return 0.7

    def _analyze_trend(self, forecast: pd.DataFrame) -> TrendAnalysis:
        """Analiza la tendencia de los datos."""
        try:
            trend_values = forecast['trend'].values
            
            if len(trend_values) < 2:
                return TrendAnalysis(
                    direction=TrendDirection.STABLE,
                    monthly_growth=0,
                    confidence=0.5
                )
            
            # Calcular pendiente de la tendencia
            x = np.arange(len(trend_values))
            slope = np.polyfit(x, trend_values, 1)[0]
            
            # Determinar dirección
            if slope > trend_values.mean() * 0.01:  # 1% del promedio
                direction = TrendDirection.INCREASING
            elif slope < -trend_values.mean() * 0.01:
                direction = TrendDirection.DECREASING
            else:
                direction = TrendDirection.STABLE
            
            # Calcular crecimiento mensual
            monthly_growth = (slope * 30 / trend_values.mean() * 100) if trend_values.mean() > 0 else 0
            
            return TrendAnalysis(
                direction=direction,
                monthly_growth=monthly_growth,
                confidence=0.8
            )
            
        except Exception:
            return TrendAnalysis(
                direction=TrendDirection.STABLE,
                monthly_growth=0,
                confidence=0.5
            )

    async def analyze_spending_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analiza patrones de gasto del usuario."""
        try:
            # Obtener datos históricos
            historical_data = await self._get_historical_data(user_id)
            
            if historical_data.empty:
                return {"patterns": [], "note": "No hay datos suficientes para análisis"}
            
            patterns = {}
            
            # Análisis por día de la semana
            historical_data['weekday'] = pd.to_datetime(historical_data['ds']).dt.day_name()
            weekday_spending = historical_data.groupby('weekday')['y'].mean()
            patterns['weekday'] = weekday_spending.to_dict()
            
            # Análisis por hora (si disponible)
            if 'hour' in historical_data.columns:
                hour_spending = historical_data.groupby('hour')['y'].mean()
                patterns['hourly'] = hour_spending.to_dict()
            
            # Análisis de quincenas (específico Chile)
            historical_data['day'] = pd.to_datetime(historical_data['ds']).dt.day
            quincena_1 = historical_data[historical_data['day'] <= 15]['y'].mean()
            quincena_2 = historical_data[historical_data['day'] > 15]['y'].mean()
            patterns['quincenas'] = {'primera': quincena_1, 'segunda': quincena_2}
            
            return {"patterns": patterns, "data_points": len(historical_data)}
            
        except Exception as e:
            logger.error(f"Error en análisis de patrones: {str(e)}")
            return {"patterns": [], "error": str(e)}

    async def generate_budget_recommendations(self, user_id: str) -> Dict[str, Any]:
        """Genera recomendaciones de presupuesto basadas en histórico."""
        try:
            # Obtener datos por categoría
            pipeline = [
                {"$match": {"user": ObjectId(user_id)}},
                {"$lookup": {
                    "from": "receipts",
                    "localField": "receipt_id",
                    "foreignField": "_id",
                    "as": "receipt"
                }},
                {"$unwind": "$receipt"},
                {"$group": {
                    "_id": "$category",
                    "total": {"$sum": "$receipt.totalAmount"},
                    "count": {"$sum": 1},
                    "avg": {"$avg": "$receipt.totalAmount"}
                }}
            ]
            
            category_data = await self.db.categories.aggregate(pipeline).to_list(None)
            
            if not category_data:
                return {"recommendations": [], "note": "No hay datos para generar recomendaciones"}
            
            recommendations = []
            total_spending = sum(item['total'] for item in category_data)
            
            for item in category_data:
                category = item['_id']
                monthly_avg = item['total']
                percentage = (monthly_avg / total_spending * 100) if total_spending > 0 else 0
                
                # Recomendaciones específicas para Chile
                if category == "Combustible" and percentage > 25:
                    recommendations.append({
                        "category": category,
                        "current_percentage": percentage,
                        "recommended_percentage": 20,
                        "message": "Considera usar transporte público o compartir viajes",
                        "chile_context": "Alto costo de combustible en Chile"
                    })
                elif category == "Comida" and percentage > 30:
                    recommendations.append({
                        "category": category,
                        "current_percentage": percentage,
                        "recommended_percentage": 25,
                        "message": "Considera cocinar más en casa",
                        "chile_context": "Delivery es costoso en Chile"
                    })
            
            return {
                "recommendations": recommendations,
                "total_monthly": total_spending,
                "categories_analyzed": len(category_data)
            }
            
        except Exception as e:
            logger.error(f"Error en recomendaciones: {str(e)}")
            return {"recommendations": [], "error": str(e)}
