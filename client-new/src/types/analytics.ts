// Interfaces para Analytics

// Respuesta de predicción de gastos
export interface PredictionResponse {
  total_amount: number;
  confidence: number;
  by_category?: {
    [category: string]: number;
  };
  trend?: 'up' | 'down' | 'stable';
  trend_percentage?: number;
}

// Anomalía detectada
export interface Anomaly {
  date: string;
  amount: number;
  expected_amount: number;
  deviation: number;
  percentage: number;
  category?: string;
  description?: string;
}

// Respuesta de detección de anomalías
export interface AnomaliesResponse {
  anomalies: Anomaly[];
  count: number;
  average_deviation: number;
}

// Patrón de gasto
export interface SpendingPattern {
  type: string; // 'weekday', 'monthly', 'category_sequence', etc.
  description: string;
  frequency: number;
  confidence: number;
  examples?: Array<{
    date: string;
    amount: number;
    description?: string;
  }>;
}

// Respuesta de patrones de gasto
export interface PatternsResponse {
  patterns: SpendingPattern[];
  total_patterns: number;
}

// Insight individual
export interface Insight {
  type: string; // 'saving_opportunity', 'spending_habit', etc.
  title: string;
  description: string;
  impact: number; // valor numérico del impacto
  impact_percentage?: number;
  recommended_action?: string;
  category?: string;
}

// Respuesta de insights
export interface InsightsResponse {
  insights: Insight[];
  total_savings_potential: number;
  priority_categories: string[];
}

// Estadística por categoría
export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage?: number;
  color?: string; // para asignar colores consistentes
}

// Respuesta de estadísticas por categoría
export interface CategoryStatsResponse {
  stats: CategoryStat[];
  total_amount: number;
  total_count: number;
  period: string;
  comparison?: {
    previous_period: {
      total_amount: number;
      difference_percentage: number;
    }
  };
}

// Punto de datos para tendencia
export interface TrendDataPoint {
  date: string;
  amount: number;
  count?: number;
}

// Tendencia por categoría
export interface CategoryTrend {
  category: string;
  data_points: TrendDataPoint[];
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

// Respuesta de tendencias
export interface TrendsResponse {
  overall_trend: TrendDataPoint[];
  by_category: CategoryTrend[];
  period: string;
  months_analyzed: number;
}
