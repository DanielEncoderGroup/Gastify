import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  StatsCard, 
  CategoryBreakdown, 
  InsightCard,
  AnomalyList,
  ProgressBar
} from '../../components/ui';
import { 
  SpendingPatterns,
  TrendChart
} from '../../components/gastify/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import { Insight } from '../../types/analytics';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  // Usar hook personalizado para gestionar los datos de analytics
  const { 
    prediction,
    insights, 
    anomalies, 
    categoryStats,
    patterns,
    trends,
    isLoading, 
    error, 
    selectedPeriod,
    changePeriod 
  } = useAnalytics({ userId });
  
  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Convertir insights para mostrarlos como tarjetas
  const getTopInsightsForCards = (): Insight[] => {
    if (!insights?.insights) return [];
    // Ordenar por impacto y tomar los 3 primeros
    return [...insights.insights]
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  };

  const handlePeriodChange = (period: string) => {
    changePeriod(period);
  };

  // Componente para mostrar error
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-center my-8 mx-auto max-w-2xl">
        <div className="text-red-600 text-xl mb-2">⚠️ Error</div>
        <p className="text-red-700">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visualiza predicciones, patrones de gasto y anomalías detectadas
        </p>
      </div>

      {/* Selector de período */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {['weekly', 'monthly', 'quarterly'].map((period) => (
            <button
              key={period}
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                selectedPeriod === period 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${
                period === 'weekly' ? 'rounded-l-lg' : ''
              } ${
                period === 'quarterly' ? 'rounded-r-lg' : ''
              } border border-gray-200`}
              onClick={() => handlePeriodChange(period)}
            >
              {period === 'weekly' ? 'Semanal' : 
               period === 'monthly' ? 'Mensual' : 'Trimestral'}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Predicción Gasto Mensual"
          value={isLoading ? "Cargando..." : prediction ? formatCurrency(prediction.total_amount) : "N/A"}
          trend={prediction?.trend}
          percentage={prediction?.trend_percentage}
          description="Próximos 30 días"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Confianza Predicción"
          value={isLoading ? "Cargando..." : prediction ? `${Math.round(prediction.confidence * 100)}%` : "N/A"}
          description="Basado en historial de gastos"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Anomalías Detectadas"
          value={isLoading ? "Cargando..." : anomalies ? anomalies.count : "0"}
          description="Gastos fuera de lo normal"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Potencial de Ahorro"
          value={isLoading ? "Cargando..." : insights ? formatCurrency(insights.total_savings_potential) : "N/A"}
          description="Basado en recomendaciones"
          isLoading={isLoading}
        />
      </div>

      {/* Sección principal - grid responsive */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Panel izquierdo - Desglose por categorías */}
        <div className="lg:col-span-1">
          <CategoryBreakdown
            categories={categoryStats?.stats || []}
            isLoading={isLoading}
            title={`Desglose por Categoría (${
              selectedPeriod === 'weekly' ? 'Semanal' : 
              selectedPeriod === 'monthly' ? 'Mensual' : 'Trimestral'
            })`}
            className="h-full"
          />
        </div>
        
        {/* Panel central - Insights principales */}
        <div className="lg:col-span-1">
          <div className="space-y-5 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">Insights Principales</h3>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4 flex-grow">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 flex-grow">
                {getTopInsightsForCards().length > 0 ? (
                  getTopInsightsForCards().map((insight, index) => (
                    <InsightCard
                      key={`${insight.type}-${index}`}
                      insight={insight}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-5 text-center text-gray-500 flex-grow">
                    No hay insights disponibles en este momento
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Panel derecho - Anomalías detectadas */}
        <div className="lg:col-span-1">
          <AnomalyList
            anomalies={anomalies?.anomalies || []}
            isLoading={isLoading}
            className="h-full"
          />
        </div>
      </div>

      {/* Sección inferior - Patrones y Tendencias */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Patrones de Gasto */}
        <div>
          <SpendingPatterns 
            patterns={patterns?.patterns || []} 
            isLoading={isLoading} 
          />
        </div>
        
        {/* Tendencias de Gastos */}
        <div>
          <TrendChart 
            dataPoints={trends?.overall_trend || []} 
            title="Tendencia de Gastos" 
            isLoading={isLoading}
            height={200} 
          />
        </div>
      </div>
      
      {/* Sección de metas financieras */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progreso de Metas Financieras</h3>
          
          {isLoading ? (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="mb-6">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Ahorro mensual</span>
                  <span className="text-sm font-semibold text-gray-900">65%</span>
                </div>
                <ProgressBar percentage={65} color="emerald" size="md" />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Reducción de gastos</span>
                  <span className="text-sm font-semibold text-gray-900">42%</span>
                </div>
                <ProgressBar percentage={42} color="blue" size="md" />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Control de presupuesto</span>
                  <span className="text-sm font-semibold text-gray-900">78%</span>
                </div>
                <ProgressBar percentage={78} color="indigo" size="md" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
