import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { 
  PredictionResponse, 
  InsightsResponse, 
  AnomaliesResponse, 
  CategoryStatsResponse,
  PatternsResponse,
  TrendsResponse
} from '../types/analytics';

interface UseAnalyticsProps {
  userId: string;
  initialPeriod?: 'weekly' | 'monthly' | 'quarterly';
}

interface AnalyticsData {
  prediction: PredictionResponse | null;
  insights: InsightsResponse | null;
  anomalies: AnomaliesResponse | null;
  categoryStats: CategoryStatsResponse | null;
  patterns: PatternsResponse | null;
  trends: TrendsResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedPeriod: string;
  refreshData: () => Promise<void>;
  changePeriod: (period: string) => void;
}

/**
 * Hook para gestionar los datos de analytics
 * @param userId ID del usuario
 * @param initialPeriod Período inicial para las estadísticas ('weekly', 'monthly', 'quarterly')
 * @returns Objeto con datos de analytics, estado de carga y funciones para gestionar los datos
 */
export const useAnalytics = ({ 
  userId, 
  initialPeriod = 'monthly' 
}: UseAnalyticsProps): AnalyticsData => {
  // Estados para los diferentes tipos de datos
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStatsResponse | null>(null);
  const [patterns, setPatterns] = useState<PatternsResponse | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar datos
  const loadAnalyticsData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar todos los datos en paralelo con manejo de errores independiente
      // para cada llamada, evitando que un error en una llamada bloquee las demás
      
      const predictionPromise = analyticsService.getPrediction(userId, 30)
        .catch(error => {
          console.warn('Error al cargar predicción:', error);
          // No establecer error global, solo devolver datos predeterminados
          return analyticsService.getPrediction(userId, 30).catch(() => {
            // Fallback final con tipo garantizado
            const defaultData: PredictionResponse = {
              total_amount: 0,
              confidence: 0,
              trend: 'stable',
              trend_percentage: 0,
              by_category: {}
            };
            return defaultData;
          });
        });
      
      const anomaliesPromise = analyticsService.detectAnomalies(userId)
        .catch(error => {
          console.warn('Error al cargar anomalías:', error);
          const defaultData: AnomaliesResponse = {
            anomalies: [],
            count: 0,
            average_deviation: 0
          };
          return defaultData;
        });
      
      const categoryStatsPromise = analyticsService.getCategoryStats(userId, selectedPeriod)
        .catch(error => {
          console.warn('Error al cargar estadísticas por categoría:', error);
          const defaultData: CategoryStatsResponse = {
            stats: [],
            total_amount: 0,
            total_count: 0,
            period: selectedPeriod
          };
          return defaultData;
        });
      
      const patternsPromise = analyticsService.getSpendingPatterns(userId)
        .catch(error => {
          console.warn('Error al cargar patrones de gasto:', error);
          const defaultData: PatternsResponse = {
            patterns: [],
            total_patterns: 0
          };
          return defaultData;
        });
      
      const trendsPromise = analyticsService.getTrends(
        userId, 
        selectedPeriod === 'weekly' ? 1 : selectedPeriod === 'monthly' ? 3 : 6
      ).catch(error => {
        console.warn('Error al cargar tendencias:', error);
        const defaultData: TrendsResponse = {
          overall_trend: [],
          by_category: [],
          period: selectedPeriod,
          months_analyzed: selectedPeriod === 'weekly' ? 1 : selectedPeriod === 'monthly' ? 3 : 6
        };
        return defaultData;
      });
      
      const insightsPromise = analyticsService.getInsights(userId)
        .catch(error => {
          console.warn('Error al cargar insights:', error);
          const defaultData: InsightsResponse = {
            insights: [],
            total_savings_potential: 0,
            priority_categories: []
          };
          return defaultData;
        });

      // Esperar a que se completen todas las llamadas
      const [prediction, anomalies, insights, categoryStats, patterns, trends] = await Promise.all([
        predictionPromise, 
        anomaliesPromise, 
        insightsPromise, 
        categoryStatsPromise, 
        patternsPromise, 
        trendsPromise
      ]);

      // Actualizar estados sin errores globales
      setPrediction(prediction);
      setAnomalies(anomalies);
      setInsights(insights);
      setCategoryStats(categoryStats);
      setPatterns(patterns);
      setTrends(trends);

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar datos analíticos:', error);
      setError('Error al cargar datos analíticos. Por favor, inténtalo de nuevo más tarde.');
      setIsLoading(false);
    }
  };

  // Cambiar período
  const changePeriod = (period: string) => {
    setSelectedPeriod(period);
  };

  // Cargar datos cuando cambie el usuario o el período
  useEffect(() => {
    if (userId) {
      loadAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedPeriod]);
  // Nota: loadAnalyticsData se omite intencionalmente de las dependencias
  // ya que se recrea en cada renderizado y causaría un loop infinito

  return {
    prediction,
    insights,
    anomalies,
    categoryStats,
    patterns,
    trends,
    isLoading,
    error,
    selectedPeriod,
    refreshData: loadAnalyticsData,
    changePeriod
  };
};

export default useAnalytics;
