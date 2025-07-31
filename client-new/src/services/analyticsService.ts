import api from './api';
import { 
  PredictionResponse, 
  InsightsResponse, 
  AnomaliesResponse, 
  CategoryStatsResponse,
  PatternsResponse,
  TrendsResponse,
  TrendDataPoint,
  CategoryTrend
} from '../types/analytics';

// -------------------------------
// analyticsService: Servicios de análisis predictivo y estadísticas
// -------------------------------
export const analyticsService = {
  // Obtener predicción de gastos futuros
  getPrediction: async (userId: string, days: number = 30): Promise<PredictionResponse> => {
    try {
      const response = await api.get(`/api/analytics/predict/${userId}?days=${days}`);
      // Asegurar que la respuesta cumple con la interfaz PredictionResponse
      const trend = response.data.trend;
      // Validar que trend sea uno de los valores permitidos
      const validTrend: 'up' | 'down' | 'stable' = 
        (trend === 'up' || trend === 'down' || trend === 'stable') ? trend : 'stable';
        
      return {
        total_amount: response.data.total_amount || 0,
        confidence: response.data.confidence || 0,
        trend: validTrend,
        trend_percentage: response.data.trend_percentage || 0,
        by_category: response.data.by_category || {}
      };
    } catch (error) {
      console.error('Error al obtener predicción:', error);
      // Devolver datos predeterminados en caso de error
      // Datos predeterminados con tipos correctos
      const defaultPrediction: PredictionResponse = {
        total_amount: 0,
        confidence: 0,
        trend: 'stable',
        trend_percentage: 0,
        by_category: {}
      };
      return defaultPrediction;
    }
  },

  // Detectar anomalías en gastos
  detectAnomalies: async (userId: string, threshold: number = 0.05): Promise<AnomaliesResponse> => {
    try {
      const response = await api.get(`/api/analytics/anomalies/${userId}?threshold=${threshold}`);
      return {
        anomalies: response.data.anomalies || [],
        count: response.data.anomalies?.length || 0,
        average_deviation: response.data.average_deviation || 0
      };
    } catch (error) {
      console.error('Error al detectar anomalías:', error);
      // Devolver datos predeterminados en caso de error
      return {
        anomalies: [],
        count: 0,
        average_deviation: 0
      };
    }
  },

  // Obtener patrones de gastos
  getSpendingPatterns: async (userId: string): Promise<PatternsResponse> => {
    try {
      // Usar la ruta correcta para obtener tendencias
      const response = await api.get(`/api/analytics/trends/${userId}`);
      const patterns = response.data.spending_patterns || [];
      
      return {
        patterns: patterns,
        total_patterns: patterns.length
      };
    } catch (error) {
      console.error('Error al obtener patrones de gastos:', error);
      // Devolver datos predeterminados en caso de error
      return {
        patterns: [],
        total_patterns: 0
      };
    }
  },

  // Obtener insights de gastos
  getInsights: async (userId: string): Promise<InsightsResponse> => {
    try {
      const response = await api.get(`/api/analytics/insights/${userId}`);
      return {
        insights: response.data.insights || [],
        total_savings_potential: response.data.savings_potential || 0,
        priority_categories: response.data.priority_categories || []
      };
    } catch (error) {
      console.error('Error al obtener insights:', error);
      // Devolver datos predeterminados en caso de error
      return {
        insights: [],
        total_savings_potential: 0,
        priority_categories: []
      };
    }
  },

  // Obtener estadísticas de gastos por categoría
  getCategoryStats: async (userId: string, period: string = 'monthly'): Promise<CategoryStatsResponse> => {
    try {
      // Esta ruta puede que necesite ser creada en el servidor
      // Por ahora usamos el dashboard que tiene datos de categorías
      const response = await api.get(`/api/analytics/dashboard/${userId}?period=${period}`);
      const stats = response.data?.trends?.spending_patterns?.by_category || [];
      
      return {
        stats: stats,
        total_amount: stats.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
        total_count: stats.reduce((sum: number, item: any) => sum + (item.count || 0), 0),
        period: period
      };
    } catch (error) {
      console.error('Error al obtener estadísticas por categoría:', error);
      // Devolver datos predeterminados en caso de error
      return {
        stats: [],
        total_amount: 0,
        total_count: 0,
        period: period
      };
    }
  },

  // Obtener tendencias de gastos
  getTrends: async (userId: string, months: number = 3): Promise<TrendsResponse> => {
    try {
      const response = await api.get(`/api/analytics/trends/${userId}?months=${months}`);
      const overall: TrendDataPoint[] = response.data.trend_data || [];
      const byCategory: CategoryTrend[] = response.data.category_trends || [];
      
      return {
        overall_trend: overall,
        by_category: byCategory,
        period: response.data.period || 'monthly',
        months_analyzed: months
      };
    } catch (error) {
      console.error('Error al obtener tendencias:', error);
      // Devolver datos predeterminados en caso de error
      return {
        overall_trend: [],
        by_category: [],
        period: 'monthly',
        months_analyzed: months
      };
    }
  }
};

export default analyticsService;
