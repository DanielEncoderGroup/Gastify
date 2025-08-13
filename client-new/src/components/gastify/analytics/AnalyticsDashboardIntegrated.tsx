import React, { useState, useEffect } from 'react';
import { 
  PredictionResponse, 
  AnomaliesResponse, 
  InsightsResponse,
  CategoryStatsResponse,
  TrendsResponse 
} from '../../../types/analytics';
import analyticsService from '../../../services/analyticsService';
import { StatsCard } from '../../ui';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { useToast } from '../../ui/Toast';
import { 
  PredictionCard, 
  AnomalyCard, 
  InsightVisualization, 
  CategoryBreakdownChart,
  TrendChart 
} from './index';

interface AnalyticsDashboardIntegratedProps {
  userId: string;
  className?: string;
}

const AnalyticsDashboardIntegrated: React.FC<AnalyticsDashboardIntegratedProps> = ({ 
  userId, 
  className = '' 
}) => {
  // Estados para los datos del dashboard
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStatsResponse | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  
  // Estados de carga
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const { error: showError } = useToast();

  useEffect(() => {
    // Cargar todos los datos del dashboard
    loadPredictions();
    loadAnomalies();
    loadInsights();
    loadCategoryStats();
    loadTrends();
  }, [userId, selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllAnalytics = async () => {
    // Cargar predicciones
    loadPredictions();
    
    // Cargar anomalías
    loadAnomalies();
    
    // Cargar insights
    loadInsights();
    
    // Cargar estadísticas por categoría
    loadCategoryStats();
    
    // Cargar tendencias
    loadTrends();
  };

  const loadPredictions = async () => {
    setLoadingPrediction(true);
    try {
      const predictionData = await analyticsService.getPrediction(userId, 30);
      setPrediction(predictionData);
    } catch (error) {
      console.error('Error cargando predicciones:', error);
      showError('Error', 'No se pudieron cargar las predicciones');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const loadAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      const anomaliesData = await analyticsService.detectAnomalies(userId, 0.05);
      setAnomalies(anomaliesData);
    } catch (error) {
      console.error('Error cargando anomalías:', error);
      showError('Error', 'No se pudieron cargar las anomalías');
    } finally {
      setLoadingAnomalies(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const insightsData = await analyticsService.getInsights(userId);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error cargando insights:', error);
      showError('Error', 'No se pudieron cargar los insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadCategoryStats = async () => {
    setLoadingCategories(true);
    try {
      const categoryData = await analyticsService.getCategoryStats(userId, selectedPeriod);
      setCategoryStats(categoryData);
    } catch (error) {
      console.error('Error cargando estadísticas de categorías:', error);
      showError('Error', 'No se pudieron cargar las estadísticas por categoría');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTrends = async () => {
    setLoadingTrends(true);
    try {
      const trendsData = await analyticsService.getTrends(userId, 6);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error cargando tendencias:', error);
      showError('Error', 'No se pudieron cargar las tendencias');
    } finally {
      setLoadingTrends(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = loadingPrediction || loadingAnomalies || loadingInsights || loadingCategories || loadingTrends;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Dashboard Analytics Premium
            </h1>
            <p className="text-emerald-100">
              Análisis inteligente de tus gastos empresariales
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
            </select>
            
            <button
              onClick={loadAllAnalytics}
              disabled={isLoading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                '🔄 Actualizar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PredictionCard 
          prediction={prediction}
          isLoading={loadingPrediction}
        />
        
        <StatsCard
          title="Total Gastado"
          value={categoryStats ? formatCurrency(categoryStats.total_amount) : "Cargando..."}
          description={`${categoryStats?.total_count || 0} transacciones`}
          isLoading={loadingCategories}
          icon={<span className="text-xl">💳</span>}
        />
        
        <StatsCard
          title="Anomalías Detectadas"
          value={anomalies?.count || 0}
          trend={anomalies && anomalies.count > 0 ? 'up' : 'stable'}
          percentage={anomalies?.average_deviation}
          description="Gastos inusuales"
          isLoading={loadingAnomalies}
          icon={<span className="text-xl">🚨</span>}
        />
        
        <StatsCard
          title="Potencial Ahorro"
          value={insights ? formatCurrency(insights.total_savings_potential) : "Cargando..."}
          description={`${insights?.insights.length || 0} oportunidades`}
          isLoading={loadingInsights}
          icon={<span className="text-xl">💰</span>}
        />
      </div>

      {/* Sección Principal de Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomalías */}
        <AnomalyCard
          anomalies={anomalies?.anomalies || []}
          isLoading={loadingAnomalies}
        />
        
        {/* Insights */}
        <InsightVisualization
          insights={insights?.insights || []}
          isLoading={loadingInsights}
        />
      </div>

      {/* Breakdown por Categorías y Tendencias */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Breakdown de Categorías */}
        <div className="xl:col-span-2">
          <CategoryBreakdownChart
            categories={categoryStats?.stats || []}
            totalAmount={categoryStats?.total_amount || 0}
            isLoading={loadingCategories}
          />
        </div>
        
        {/* Tendencias */}
        <div>
          <TrendChart
            dataPoints={trends?.overall_trend || []}
            title="Tendencia General"
            isLoading={loadingTrends}
          />
        </div>
      </div>

      {/* Información Adicional */}
      {!isLoading && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Resumen del Análisis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="text-gray-600 mb-1">Confianza de Predicción</div>
              <div className="text-xl font-bold text-emerald-600">
                {prediction ? `${(prediction.confidence * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="text-gray-600 mb-1">Categorías Analizadas</div>
              <div className="text-xl font-bold text-blue-600">
                {categoryStats?.stats.length || 0}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="text-gray-600 mb-1">Período Analizado</div>
              <div className="text-xl font-bold text-purple-600">
                {trends?.months_analyzed || 0} meses
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardIntegrated;
