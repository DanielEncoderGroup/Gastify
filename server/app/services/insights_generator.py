"""
Generador de Insights Inteligentes para Gastify Chile.
Analiza patrones de gasto y genera insights personalizados para el mercado chileno.
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from collections import defaultdict

from app.models.analytics import (
    InsightModel, InsightType, InsightImpact, InsightSource,
    ChileInsightContext, ChileEconomicIndicator, ChileRetailEvent
)

logger = logging.getLogger(__name__)


class IntelligentInsights:
    """
    Generador de insights inteligentes específico para el mercado chileno.
    Analiza patrones temporales, comparaciones y tendencias.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Datos económicos de referencia para Chile (valores aproximados 2024)
        self.chile_economic_data = {
            "sueldo_minimo": 460000,  # CLP
            "gasto_promedio_hogar": 1200000,  # CLP mensual
            "inflacion_anual": 3.5,  # Porcentaje
            "uf_valor": 37000,  # CLP aproximado
        }
        
        # Promedios de gasto por categoría en Chile
        self.chile_category_averages = {
            "Supermercado": 180000,  # Mensual
            "Combustible": 120000,
            "Transporte": 80000,
            "Farmacia": 45000,
            "Retail": 150000,
            "Comida": 120000,
            "Salud": 100000,
            "Educación": 200000,
            "Entretenimiento": 80000,
            "Servicios": 150000
        }
        
        # Eventos comerciales chilenos
        self.chile_retail_events = {
            "cyber_day": {"month": 5, "impact": 1.4},  # Mayo
            "cyber_monday": {"month": 5, "impact": 1.3},
            "black_friday": {"month": 11, "impact": 1.5},  # Noviembre
            "navidad": {"month": 12, "impact": 1.6},
            "fiestas_patrias": {"month": 9, "impact": 1.3},
            "vuelta_clases": {"month": 3, "impact": 1.2}  # Marzo
        }

    async def generate_all_insights(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Genera todos los insights disponibles para un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de insights generados
        """
        insights = []
        
        try:
            # Obtener datos históricos
            historical_data = await self._get_user_historical_data(user_id)
            
            if not historical_data:
                return [self._generate_no_data_insight()]
            
            # Generar diferentes tipos de insights
            spending_insights = await self.generate_spending_insights(user_id, historical_data)
            insights.extend(spending_insights)
            
            temporal_insights = await self.generate_temporal_insights(user_id, historical_data)
            insights.extend(temporal_insights)
            
            comparison_insights = await self.generate_comparison_insights(user_id, historical_data)
            insights.extend(comparison_insights)
            
            trend_insights = await self.generate_trend_insights(user_id, historical_data)
            insights.extend(trend_insights)
            
            chile_specific_insights = await self.generate_chile_specific_insights(user_id, historical_data)
            insights.extend(chile_specific_insights)
            
            # Ordenar por impacto y relevancia
            insights.sort(key=lambda x: self._calculate_insight_priority(x), reverse=True)
            
            # Limitar a los 10 insights más relevantes
            return insights[:10]
            
        except Exception as e:
            logger.error(f"Error generando insights para usuario {user_id}: {str(e)}")
            return [self._generate_error_insight(str(e))]

    async def generate_spending_insights(self, user_id: str, data: List[Dict]) -> List[Dict[str, Any]]:
        """Genera insights sobre patrones de gasto."""
        insights = []
        
        try:
            # Convertir a DataFrame para análisis
            df = pd.DataFrame(data)
            if df.empty:
                return insights
            
            df['date'] = pd.to_datetime(df['date'])
            df['weekday'] = df['date'].dt.day_name()
            df['hour'] = df['date'].dt.hour
            df['day'] = df['date'].dt.day
            
            # Insight 1: Día de la semana con más gastos
            weekday_spending = df.groupby('weekday')['amount'].sum()
            max_weekday = weekday_spending.idxmax()
            max_amount = weekday_spending.max()
            avg_amount = weekday_spending.mean()
            
            if max_amount > avg_amount * 1.3:  # 30% más que el promedio
                percentage_higher = ((max_amount - avg_amount) / avg_amount * 100)
                
                insight = {
                    "type": InsightType.SPENDING_PATTERN,
                    "category": "temporal",
                    "message": f"Gastas {percentage_higher:.0f}% más los {max_weekday.lower()} vs otros días",
                    "impact": InsightImpact.MEDIUM,
                    "recommendation": f"Considera revisar gastos de {max_weekday.lower()} para optimizar tu presupuesto",
                    "source": InsightSource(
                        data_points=len(df),
                        time_range_days=30,
                        confidence=0.8
                    ).dict(),
                    "amount": max_amount
                }
                insights.append(insight)
            
            # Insight 2: Horario de mayor gasto
            if 'hour' in df.columns:
                hour_spending = df.groupby('hour')['amount'].sum()
                peak_hour = hour_spending.idxmax()
                peak_amount = hour_spending.max()
                
                if peak_hour < 10 or peak_hour > 20:  # Fuera de horario comercial normal
                    insight = {
                        "type": InsightType.SPENDING_PATTERN,
                        "category": "temporal",
                        "message": f"Tu horario de mayor gasto es a las {peak_hour}:00 hrs",
                        "impact": InsightImpact.LOW,
                        "recommendation": "Considera si estos gastos son planificados o impulsivos",
                        "source": InsightSource(
                            data_points=len(df),
                            time_range_days=30,
                            confidence=0.7
                        ).dict(),
                        "chile_context": ChileInsightContext(
                            additional_context="Horario fuera del comercio tradicional chileno"
                        ).dict()
                    }
                    insights.append(insight)
            
            # Insight 3: Patrón de quincenas (específico Chile)
            df['quincena'] = df['day'].apply(lambda x: 'primera' if x <= 15 else 'segunda')
            quincena_spending = df.groupby('quincena')['amount'].sum()
            
            if len(quincena_spending) == 2:
                primera = quincena_spending.get('primera', 0)
                segunda = quincena_spending.get('segunda', 0)
                
                if primera > 0 and segunda > 0:
                    diff_percentage = abs(primera - segunda) / max(primera, segunda) * 100
                    
                    if diff_percentage > 30:  # Diferencia significativa
                        higher_quincena = 'primera' if primera > segunda else 'segunda'
                        insight = {
                            "type": InsightType.SPENDING_PATTERN,
                            "category": "quincena",
                            "message": f"Gastas {diff_percentage:.0f}% más en la {higher_quincena} quincena del mes",
                            "impact": InsightImpact.MEDIUM,
                            "recommendation": "Considera distribuir mejor tus gastos durante el mes",
                            "source": InsightSource(
                                data_points=len(df),
                                time_range_days=30,
                                confidence=0.8
                            ).dict(),
                            "chile_context": ChileInsightContext(
                                additional_context="Patrón típico chileno relacionado con fechas de pago"
                            ).dict()
                        }
                        insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generando insights de gasto: {str(e)}")
            return []

    async def generate_temporal_insights(self, user_id: str, data: List[Dict]) -> List[Dict[str, Any]]:
        """Genera insights sobre patrones temporales."""
        insights = []
        
        try:
            df = pd.DataFrame(data)
            if df.empty:
                return insights
            
            df['date'] = pd.to_datetime(df['date'])
            df['month'] = df['date'].dt.month
            df['week'] = df['date'].dt.isocalendar().week
            
            # Insight 1: Mes de mayor gasto
            monthly_spending = df.groupby('month')['amount'].sum()
            if len(monthly_spending) >= 3:  # Al menos 3 meses de datos
                max_month = monthly_spending.idxmax()
                max_amount = monthly_spending.max()
                avg_amount = monthly_spending.mean()
                
                if max_amount > avg_amount * 1.4:  # 40% más que el promedio
                    month_names = {
                        1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
                        5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
                        9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
                    }
                    
                    month_name = month_names.get(max_month, str(max_month))
                    percentage_higher = ((max_amount - avg_amount) / avg_amount * 100)
                    
                    # Contexto chileno para el mes
                    chile_context = self._get_month_context(max_month)
                    
                    insight = {
                        "type": InsightType.SEASONAL_PATTERN,
                        "category": "mensual",
                        "message": f"Tu mayor gasto fue en {month_name} ({percentage_higher:.0f}% sobre promedio)",
                        "impact": InsightImpact.HIGH,
                        "recommendation": f"Planifica mejor el presupuesto para {month_name}",
                        "source": InsightSource(
                            data_points=len(df),
                            time_range_days=90,
                            confidence=0.85
                        ).dict(),
                        "chile_context": chile_context,
                        "amount": max_amount
                    }
                    insights.append(insight)
            
            # Insight 2: Tendencia semanal
            weekly_spending = df.groupby('week')['amount'].sum()
            if len(weekly_spending) >= 4:  # Al menos 4 semanas
                # Calcular tendencia
                weeks = list(weekly_spending.index)
                amounts = list(weekly_spending.values)
                
                if len(weeks) >= 4:
                    # Tendencia simple: comparar últimas 2 semanas vs primeras 2
                    recent_avg = np.mean(amounts[-2:])
                    early_avg = np.mean(amounts[:2])
                    
                    if recent_avg > early_avg * 1.2:  # 20% de incremento
                        trend_percentage = ((recent_avg - early_avg) / early_avg * 100)
                        
                        insight = {
                            "type": InsightType.TREND_ANALYSIS,
                            "category": "semanal",
                            "message": f"Tus gastos han aumentado {trend_percentage:.0f}% en las últimas semanas",
                            "impact": InsightImpact.MEDIUM,
                            "recommendation": "Revisa qué está causando el incremento en gastos",
                            "source": InsightSource(
                                data_points=len(weekly_spending),
                                time_range_days=28,
                                confidence=0.75
                            ).dict()
                        }
                        insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generando insights temporales: {str(e)}")
            return []

    async def generate_comparison_insights(self, user_id: str, data: List[Dict]) -> List[Dict[str, Any]]:
        """Genera insights comparando con promedios chilenos."""
        insights = []
        
        try:
            # Agrupar por categoría
            category_totals = defaultdict(float)
            for item in data:
                category = item.get('category', 'Otros')
                category_totals[category] += item['amount']
            
            # Comparar con promedios chilenos
            for category, user_amount in category_totals.items():
                if category in self.chile_category_averages:
                    chile_avg = self.chile_category_averages[category]
                    difference_percentage = ((user_amount - chile_avg) / chile_avg * 100)
                    
                    if abs(difference_percentage) > 30:  # Diferencia significativa
                        comparison_type = "más alto" if difference_percentage > 0 else "más bajo"
                        impact = InsightImpact.HIGH if abs(difference_percentage) > 50 else InsightImpact.MEDIUM
                        
                        recommendation = ""
                        if difference_percentage > 50:
                            if category == "Combustible":
                                recommendation = "Considera usar transporte público o compartir viajes"
                            elif category == "Comida":
                                recommendation = "Evalúa cocinar más en casa vs delivery"
                            elif category == "Retail":
                                recommendation = "Revisa si las compras son necesarias o impulsivas"
                            else:
                                recommendation = f"Analiza tus gastos en {category} para optimizar"
                        elif difference_percentage < -30:
                            recommendation = f"Tienes un gasto controlado en {category} comparado con el promedio chileno"
                        
                        insight = {
                            "type": InsightType.CATEGORY_COMPARISON,
                            "category": category,
                            "message": f"Tu gasto en {category} es {abs(difference_percentage):.0f}% {comparison_type} que el promedio chileno",
                            "impact": impact,
                            "recommendation": recommendation,
                            "source": InsightSource(
                                data_points=len([d for d in data if d.get('category') == category]),
                                time_range_days=30,
                                confidence=0.8
                            ).dict(),
                            "chile_context": ChileInsightContext(
                                compared_to_national_average=True,
                                additional_context=f"Promedio nacional: ${chile_avg:,.0f}"
                            ).dict(),
                            "amount": user_amount,
                            "benchmark_amount": chile_avg
                        }
                        insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generando insights de comparación: {str(e)}")
            return []

    async def generate_trend_insights(self, user_id: str, data: List[Dict]) -> List[Dict[str, Any]]:
        """Genera insights sobre tendencias de gasto."""
        insights = []
        
        try:
            if len(data) < 10:  # Necesitamos datos suficientes
                return insights
            
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Agrupar por categoría y analizar tendencias
            categories = df['category'].unique()
            
            for category in categories:
                category_data = df[df['category'] == category].copy()
                
                if len(category_data) < 5:  # Necesitamos al menos 5 puntos
                    continue
                
                # Dividir en dos períodos
                mid_point = len(category_data) // 2
                early_period = category_data.iloc[:mid_point]
                recent_period = category_data.iloc[mid_point:]
                
                early_avg = early_period['amount'].mean()
                recent_avg = recent_period['amount'].mean()
                
                if early_avg > 0:
                    change_percentage = ((recent_avg - early_avg) / early_avg * 100)
                    
                    if abs(change_percentage) > 25:  # Cambio significativo
                        trend_direction = "aumentado" if change_percentage > 0 else "disminuido"
                        impact = InsightImpact.HIGH if abs(change_percentage) > 50 else InsightImpact.MEDIUM
                        
                        # Contexto específico por categoría
                        context_message = ""
                        if category == "Combustible" and change_percentage > 0:
                            context_message = "Puede estar relacionado con alzas en el precio de la bencina"
                        elif category == "Supermercado" and change_percentage > 0:
                            context_message = "Puede estar relacionado con inflación en alimentos"
                        elif category == "Retail" and change_percentage > 0:
                            current_month = datetime.now().month
                            if current_month in [5, 11, 12]:  # Meses de eventos comerciales
                                context_message = "Coincide con eventos comerciales en Chile (Cyber, Black Friday, Navidad)"
                        
                        insight = {
                            "type": InsightType.TREND_ANALYSIS,
                            "category": category,
                            "message": f"Tu gasto en {category} ha {trend_direction} {abs(change_percentage):.0f}% recientemente",
                            "impact": impact,
                            "recommendation": f"{'Controla' if change_percentage > 0 else 'Mantén'} esta tendencia en {category}",
                            "source": InsightSource(
                                data_points=len(category_data),
                                time_range_days=60,
                                confidence=0.8
                            ).dict(),
                            "chile_context": ChileInsightContext(
                                additional_context=context_message
                            ).dict() if context_message else None,
                            "trend_percentage": change_percentage
                        }
                        insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generando insights de tendencia: {str(e)}")
            return []

    async def generate_chile_specific_insights(self, user_id: str, data: List[Dict]) -> List[Dict[str, Any]]:
        """Genera insights específicos para el contexto chileno."""
        insights = []
        
        try:
            df = pd.DataFrame(data)
            if df.empty:
                return insights
            
            df['date'] = pd.to_datetime(df['date'])
            total_monthly = df['amount'].sum()
            
            # Insight 1: Comparación con sueldo mínimo
            sueldo_minimo = self.chile_economic_data["sueldo_minimo"]
            if total_monthly > 0:
                percentage_of_minimum = (total_monthly / sueldo_minimo * 100)
                
                if percentage_of_minimum > 80:  # Más del 80% del sueldo mínimo
                    insight = {
                        "type": InsightType.CHILE_SPECIFIC,
                        "category": "economia",
                        "message": f"Tus gastos representan {percentage_of_minimum:.0f}% del sueldo mínimo chileno",
                        "impact": InsightImpact.HIGH if percentage_of_minimum > 120 else InsightImpact.MEDIUM,
                        "recommendation": "Considera optimizar gastos para mejorar tu capacidad de ahorro",
                        "source": InsightSource(
                            data_points=len(df),
                            time_range_days=30,
                            confidence=0.9
                        ).dict(),
                        "chile_context": ChileInsightContext(
                            economic_indicator=ChileEconomicIndicator.SUELDO_MINIMO,
                            compared_to_national_average=True,
                            additional_context=f"Sueldo mínimo actual: ${sueldo_minimo:,.0f}"
                        ).dict()
                    }
                    insights.append(insight)
            
            # Insight 2: Detección de eventos comerciales
            current_month = datetime.now().month
            for event_name, event_data in self.chile_retail_events.items():
                if event_data["month"] == current_month:
                    # Verificar si hay incremento en retail durante este mes
                    retail_spending = df[df['category'] == 'Retail']['amount'].sum()
                    if retail_spending > 0:
                        expected_normal = retail_spending / event_data["impact"]
                        extra_spending = retail_spending - expected_normal
                        
                        if extra_spending > 20000:  # Gasto extra significativo
                            insight = {
                                "type": InsightType.CHILE_SPECIFIC,
                                "category": "eventos_comerciales",
                                "message": f"Gastaste ${extra_spending:,.0f} extra en retail durante {event_name.replace('_', ' ')}",
                                "impact": InsightImpact.MEDIUM,
                                "recommendation": "Planifica mejor para eventos comerciales futuros",
                                "source": InsightSource(
                                    data_points=len(df[df['category'] == 'Retail']),
                                    time_range_days=30,
                                    confidence=0.7
                                ).dict(),
                                "chile_context": ChileInsightContext(
                                    retail_event=ChileRetailEvent(event_name),
                                    additional_context=f"Incremento típico en {event_name}: {(event_data['impact']-1)*100:.0f}%"
                                ).dict()
                            }
                            insights.append(insight)
            
            # Insight 3: Análisis de inflación
            # Simular comparación con IPC (en implementación real se obtendría de API)
            inflacion_anual = self.chile_economic_data["inflacion_anual"]
            if len(df) >= 60:  # Al menos 2 meses de datos
                # Comparar gastos recientes vs anteriores
                recent_month = df.tail(30)['amount'].sum()
                previous_month = df.iloc[-60:-30]['amount'].sum() if len(df) >= 60 else recent_month
                
                if previous_month > 0:
                    monthly_increase = ((recent_month - previous_month) / previous_month * 100)
                    monthly_inflation = inflacion_anual / 12  # Inflación mensual aproximada
                    
                    if monthly_increase > monthly_inflation * 2:  # Incremento muy por encima de inflación
                        insight = {
                            "type": InsightType.CHILE_SPECIFIC,
                            "category": "inflacion",
                            "message": f"Tus gastos aumentaron {monthly_increase:.1f}% vs inflación chilena de {monthly_inflation:.1f}%",
                            "impact": InsightImpact.MEDIUM,
                            "recommendation": "Revisa si el incremento se debe a cambios de hábitos o alzas de precios",
                            "source": InsightSource(
                                data_points=60,
                                time_range_days=60,
                                confidence=0.7
                            ).dict(),
                            "chile_context": ChileInsightContext(
                                economic_indicator=ChileEconomicIndicator.IPC,
                                additional_context=f"Inflación anual Chile: {inflacion_anual}%"
                            ).dict()
                        }
                        insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generando insights específicos de Chile: {str(e)}")
            return []

    async def _get_user_historical_data(self, user_id: str) -> List[Dict]:
        """Obtiene datos históricos del usuario con categorías."""
        try:
            # Pipeline para obtener recibos con sus categorías
            pipeline = [
                {"$match": {"user": ObjectId(user_id)}},
                {"$lookup": {
                    "from": "categories",
                    "localField": "_id",
                    "foreignField": "receipt_id",
                    "as": "category_info"
                }},
                {"$sort": {"date": -1}},
                {"$limit": 500}  # Últimos 500 recibos
            ]
            
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            
            # Formatear datos
            formatted_data = []
            for receipt in receipts:
                category = "Otros"
                if receipt.get("category_info"):
                    category = receipt["category_info"][0].get("category", "Otros")
                
                formatted_data.append({
                    "date": receipt["date"],
                    "amount": receipt["totalAmount"],
                    "category": category,
                    "company": receipt.get("companyName", ""),
                    "description": receipt.get("description", "")
                })
            
            return formatted_data
            
        except Exception as e:
            logger.error(f"Error obteniendo datos históricos: {str(e)}")
            return []

    def _get_month_context(self, month: int) -> Dict[str, Any]:
        """Obtiene contexto chileno para un mes específico."""
        month_contexts = {
            3: {"retail_event": "vuelta_clases", "context": "Mes de vuelta a clases en Chile"},
            5: {"retail_event": "cyber_day", "context": "Mes del Cyber Day en Chile"},
            9: {"retail_event": "fiestas_patrias", "context": "Mes de Fiestas Patrias en Chile"},
            11: {"retail_event": "black_friday", "context": "Mes del Black Friday en Chile"},
            12: {"retail_event": "navidad", "context": "Mes de Navidad en Chile"}
        }
        
        context = month_contexts.get(month, {"context": "Mes regular"})
        
        return ChileInsightContext(
            retail_event=ChileRetailEvent(context.get("retail_event")) if context.get("retail_event") else None,
            additional_context=context["context"]
        ).dict()

    def _calculate_insight_priority(self, insight: Dict[str, Any]) -> float:
        """Calcula la prioridad de un insight para ordenamiento."""
        impact_scores = {
            InsightImpact.HIGH: 3,
            InsightImpact.MEDIUM: 2,
            InsightImpact.LOW: 1
        }
        
        type_scores = {
            InsightType.CHILE_SPECIFIC: 1.2,
            InsightType.TREND_ANALYSIS: 1.1,
            InsightType.CATEGORY_COMPARISON: 1.0,
            InsightType.SPENDING_PATTERN: 0.9,
            InsightType.SEASONAL_PATTERN: 0.8
        }
        
        impact = insight.get("impact", InsightImpact.LOW)
        insight_type = insight.get("type", InsightType.SPENDING_PATTERN)
        
        base_score = impact_scores.get(impact, 1) * type_scores.get(insight_type, 1)
        
        # Bonus por contexto chileno
        if insight.get("chile_context"):
            base_score *= 1.1
        
        # Bonus por confianza alta
        source = insight.get("source", {})
        confidence = source.get("confidence", 0.5)
        base_score *= confidence
        
        return base_score

    def _generate_no_data_insight(self) -> Dict[str, Any]:
        """Genera insight cuando no hay datos suficientes."""
        return {
            "type": InsightType.BUDGET_RECOMMENDATION,
            "category": "general",
            "message": "Sube más recibos para obtener insights personalizados",
            "impact": InsightImpact.LOW,
            "recommendation": "Registra al menos 10 gastos para comenzar a ver patrones",
            "source": InsightSource(
                data_points=0,
                time_range_days=0,
                confidence=1.0
            ).dict()
        }

    def _generate_error_insight(self, error: str) -> Dict[str, Any]:
        """Genera insight de error."""
        return {
            "type": InsightType.BUDGET_RECOMMENDATION,
            "category": "error",
            "message": "No se pudieron generar insights en este momento",
            "impact": InsightImpact.LOW,
            "recommendation": "Intenta nuevamente más tarde",
            "source": InsightSource(
                data_points=0,
                time_range_days=0,
                confidence=0.0
            ).dict(),
            "error": error
        }
