from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

from app.models.common import PyObjectId
from bson import ObjectId


class PredictionType(str, Enum):
    """Tipo de predicción generada."""
    SHORT_TERM = "short_term"  # 7 días
    MID_TERM = "mid_term"      # 30 días
    LONG_TERM = "long_term"    # 90 días
    CUSTOM = "custom"          # Personalizado


class TrendDirection(str, Enum):
    """Dirección de una tendencia."""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    FLUCTUATING = "fluctuating"


class AnomalyType(str, Enum):
    """Tipos de anomalías que pueden ser detectadas."""
    UNUSUAL_AMOUNT = "unusual_amount"         # Monto inusual
    DUPLICATE_RECEIPT = "duplicate_receipt"   # Recibo duplicado
    SUSPICIOUS_PATTERN = "suspicious_pattern" # Patrón sospechoso (múltiples gastos mismo día)
    UNUSUAL_TIME = "unusual_time"             # Horario inusual
    UNUSUAL_FREQUENCY = "unusual_frequency"   # Frecuencia inusual
    CATEGORY_SHIFT = "category_shift"         # Cambio brusco en categoría


class AnomalySeverity(str, Enum):
    """Severidad de una anomalía detectada."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InsightType(str, Enum):
    """Tipos de insights que pueden ser generados."""
    SPENDING_PATTERN = "spending_pattern"     # Patrones de gasto
    TREND_ANALYSIS = "trend_analysis"         # Análisis de tendencias
    BUDGET_RECOMMENDATION = "budget_recommendation"  # Recomendación de presupuesto
    SAVINGS_OPPORTUNITY = "savings_opportunity"  # Oportunidad de ahorro
    CATEGORY_COMPARISON = "category_comparison"  # Comparación entre categorías
    SEASONAL_PATTERN = "seasonal_pattern"     # Patrón estacional
    CHILE_SPECIFIC = "chile_specific"         # Específico para Chile


class InsightImpact(str, Enum):
    """Impacto potencial de un insight."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ChileEconomicIndicator(str, Enum):
    """Indicadores económicos específicos de Chile."""
    UF = "uf"
    IPC = "ipc"
    DOLAR = "dolar"
    UTM = "utm"
    SUELDO_MINIMO = "sueldo_minimo"
    PRECIO_BENCINA = "precio_bencina"


class ChileRetailEvent(str, Enum):
    """Eventos comerciales específicos de Chile."""
    CYBER_DAY = "cyber_day"
    CYBER_MONDAY = "cyber_monday"
    BLACK_FRIDAY = "black_friday"
    NAVIDAD = "navidad"
    FIESTAS_PATRIAS = "fiestas_patrias"
    VUELTA_CLASES = "vuelta_a_clases"


class ChileTimePattern(BaseModel):
    """Patrones temporales específicos de Chile."""
    quincena: bool = False  # Si coincide con quincena (15 o 30/31)
    fin_de_semana: bool = False  # Si es fin de semana
    feriado: bool = False  # Si es feriado chileno
    horario_comercial: bool = False  # Si está dentro del horario comercial (10-20hrs)
    

class CategoryPrediction(BaseModel):
    """Predicción para una categoría específica."""
    category: str  # Nombre de la categoría
    amount: float  # Monto predicho
    previous_period_amount: Optional[float] = None  # Monto del período anterior
    change_percentage: Optional[float] = None  # Cambio porcentual


class TrendAnalysis(BaseModel):
    """Análisis de tendencia general."""
    direction: TrendDirection  # Dirección de la tendencia
    monthly_growth: float  # Crecimiento mensual en porcentaje
    seasonal_factor: Optional[float] = None  # Factor estacional
    confidence: float  # Confianza en la predicción (0-1)


class PredictionModel(BaseModel):
    """Modelo para almacenar predicciones generadas."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user: PyObjectId  # Usuario para el que se generó la predicción
    type: PredictionType  # Tipo de predicción
    date_from: datetime  # Fecha de inicio del período
    date_to: datetime  # Fecha de fin del período
    total_amount: float  # Monto total predicho
    confidence: float  # Confianza en la predicción (0-1)
    categories: List[CategoryPrediction] = []  # Predicciones por categoría
    trend: TrendAnalysis  # Análisis de tendencia
    chile_context: Dict[str, Any] = {}  # Contexto específico de Chile
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


class ChileAnomalyContext(BaseModel):
    """Contexto específico de Chile para anomalías."""
    rut_emisor: Optional[str] = None  # RUT del emisor del recibo
    compared_to_retail_average: bool = False  # Si se comparó con promedio de retail
    economic_indicator: Optional[ChileEconomicIndicator] = None  # Indicador económico relacionado
    retail_event: Optional[ChileRetailEvent] = None  # Evento de retail relacionado
    time_pattern: Optional[ChileTimePattern] = None  # Patrón temporal relacionado


class AnomalyModel(BaseModel):
    """Modelo para almacenar anomalías detectadas."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user: PyObjectId  # Usuario para el que se detectó la anomalía
    receipt_id: Optional[PyObjectId] = None  # ID del recibo relacionado (si aplica)
    type: AnomalyType  # Tipo de anomalía
    severity: AnomalySeverity  # Severidad de la anomalía
    amount: Optional[float] = None  # Monto involucrado
    expected_amount: Optional[float] = None  # Monto esperado
    deviation_percentage: Optional[float] = None  # Porcentaje de desviación
    description: str  # Descripción de la anomalía
    chile_context: Optional[ChileAnomalyContext] = None  # Contexto específico de Chile
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


class InsightSource(BaseModel):
    """Fuente de datos para un insight."""
    data_points: int  # Cantidad de puntos de datos usados
    time_range_days: int  # Rango de tiempo en días
    categories: List[str] = []  # Categorías analizadas
    confidence: float  # Confianza en el insight (0-1)


class ChileInsightContext(BaseModel):
    """Contexto específico de Chile para insights."""
    economic_indicator: Optional[ChileEconomicIndicator] = None  # Indicador económico relacionado
    retail_event: Optional[ChileRetailEvent] = None  # Evento de retail relacionado
    compared_to_national_average: bool = False  # Si se comparó con promedio nacional
    location_specific: Optional[str] = None  # Región o ciudad específica
    additional_context: Optional[str] = None  # Contexto adicional


class InsightModel(BaseModel):
    """Modelo para almacenar insights generados."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user: PyObjectId  # Usuario para el que se generó el insight
    type: InsightType  # Tipo de insight
    category: Optional[str] = None  # Categoría relacionada (si aplica)
    message: str  # Mensaje principal del insight
    impact: InsightImpact  # Impacto potencial del insight
    recommendation: Optional[str] = None  # Recomendación asociada
    source: InsightSource  # Fuente de datos para el insight
    chile_context: Optional[ChileInsightContext] = None  # Contexto específico de Chile
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }


class DashboardModel(BaseModel):
    """Modelo para datos de dashboard completo."""
    predictions: Dict[str, Any]  # Predicciones
    anomalies: List[Dict[str, Any]]  # Anomalías
    insights: List[Dict[str, Any]]  # Insights
    trends: Dict[str, Any]  # Tendencias
    chile_specific: Dict[str, Any]  # Datos específicos de Chile
