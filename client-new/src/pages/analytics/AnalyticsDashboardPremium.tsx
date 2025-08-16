import React, { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import Card, { StatsCard } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast, ToastContainer } from '../../components/ui/Toast';
import analyticsService from '../../services/analyticsService';

interface DashboardData {
  overview: {
    totalSpent: number;
    monthlyAverage: number;
    transactionCount: number;
    savingsGoal: number;
    goalProgress: number;
  };
  predictions: {
    nextMonth: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  anomalies: Array<{
    id: string;
    amount: number;
    vendor: string;
    date: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  insights: Array<{
    id: string;
    title: string;
    description: string;
    type: 'savings' | 'warning' | 'opportunity';
    impact: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
    color: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
    transactions: number;
  }>;
}

const AnalyticsDashboardPremium: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos del dashboard
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData: DashboardData = {
        overview: {
          totalSpent: 45280.50,
          monthlyAverage: 7546.75,
          transactionCount: 234,
          savingsGoal: 50000,
          goalProgress: 0.74
        },
        predictions: {
          nextMonth: 8200.30,
          confidence: 0.87,
          trend: 'up',
          trendPercentage: 8.7
        },
        anomalies: [
          {
            id: '1',
            amount: 1250.00,
            vendor: 'Hotel Premium Plaza',
            date: '2025-07-28',
            severity: 'high',
            description: 'Gasto 300% superior al promedio en alojamiento'
          },
          {
            id: '2',
            amount: 450.75,
            vendor: 'Restaurante Gourmet',
            date: '2025-07-25',
            severity: 'medium',
            description: 'Gasto elevado para categoría comida'
          }
        ],
        insights: [
          {
            id: '1',
            title: 'Oportunidad de Ahorro',
            description: 'Podrías ahorrar $320 mensuales optimizando gastos en entretenimiento',
            type: 'savings',
            impact: 320
          },
          {
            id: '2',
            title: 'Patrón Detectado',
            description: 'Tus gastos en transporte aumentan 15% los viernes',
            type: 'opportunity',
            impact: 85
          },
          {
            id: '3',
            title: 'Alerta de Presupuesto',
            description: 'Has superado el presupuesto de comida en un 12% este mes',
            type: 'warning',
            impact: 180
          }
        ],
        categoryBreakdown: [
          { category: 'Comida', amount: 12450.30, percentage: 27.5, trend: 5.2, color: 'bg-red-500' },
          { category: 'Transporte', amount: 8920.15, percentage: 19.7, trend: -2.1, color: 'bg-blue-500' },
          { category: 'Alojamiento', amount: 7680.00, percentage: 17.0, trend: 12.3, color: 'bg-green-500' },
          { category: 'Entretenimiento', amount: 6230.45, percentage: 13.8, trend: -8.5, color: 'bg-purple-500' },
          { category: 'Material Oficina', amount: 4890.20, percentage: 10.8, trend: 3.7, color: 'bg-yellow-500' },
          { category: 'Salud', amount: 3210.80, percentage: 7.1, trend: 1.2, color: 'bg-pink-500' },
          { category: 'Otros', amount: 1898.60, percentage: 4.2, trend: -1.8, color: 'bg-gray-500' }
        ],
        monthlyTrends: [
          { month: 'Ene', amount: 6800, transactions: 42 },
          { month: 'Feb', amount: 7200, transactions: 38 },
          { month: 'Mar', amount: 6950, transactions: 45 },
          { month: 'Abr', amount: 7800, transactions: 52 },
          { month: 'May', amount: 7400, transactions: 48 },
          { month: 'Jun', amount: 8100, transactions: 55 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      toast.error('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'savings': return 'BanknotesIcon';
      case 'warning': return 'ExclamationTriangleIcon';
      case 'opportunity': return 'LightBulbIcon';
      default: return 'InformationCircleIcon';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'savings': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-red-600 bg-red-100';
      case 'opportunity': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner withLogo size="xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} />
      
      {/* Header Executive */}
      <div className="bg-gradient-to-r from-primary-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Analytics</h1>
              <p className="text-xl text-primary-100">
                Inteligencia artificial aplicada a tus finanzas
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="3months">Últimos 3 meses</option>
                <option value="6months">Últimos 6 meses</option>
                <option value="12months">Último año</option>
              </select>
            </div>
          </div>
          
          {/* Overview Cards en Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium">Total Gastado</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(data.overview.totalSpent)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon name="CurrencyDollarIcon" className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium">Promedio Mensual</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(data.overview.monthlyAverage)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon name="ChartBarIcon" className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium">Transacciones</p>
                  <p className="text-3xl font-bold mt-1">{data.overview.transactionCount}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon name="DocumentTextIcon" className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium">Meta de Ahorro</p>
                  <p className="text-3xl font-bold mt-1">{Math.round(data.overview.goalProgress * 100)}%</p>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                      style={{ width: `${data.overview.goalProgress * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon name="TrophyIcon" className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Predicciones Futuras */}
        <div className="mb-8">
          <Card variant="elevated" className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Predicción IA - Próximo Mes</h2>
                  <p className="text-gray-600">Basado en patrones históricos y tendencias actuales</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatCurrency(data.predictions.nextMonth)}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    data.predictions.trend === 'up' 
                      ? 'bg-red-100 text-red-800' 
                      : data.predictions.trend === 'down' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <Icon 
                      name={data.predictions.trend === 'up' ? 'ArrowTrendingUpIcon' : data.predictions.trend === 'down' ? 'ArrowTrendingDownIcon' : 'MinusIcon'} 
                      className="h-4 w-4 mr-1" 
                    />
                    {data.predictions.trendPercentage}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Confianza de la predicción</span>
                  <span>{Math.round(data.predictions.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${data.predictions.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Anomalías Detectadas */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Anomalías Detectadas</h3>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Icon name="ExclamationTriangleIcon" className="h-5 w-5 text-red-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                {data.anomalies.map((anomaly) => (
                  <div 
                    key={anomaly.id}
                    className={`p-4 rounded-lg border-l-4 ${getSeverityColor(anomaly.severity)} transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{anomaly.vendor}</h4>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(anomaly.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                        <p className="text-xs text-gray-500">{anomaly.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Insights Inteligentes */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Insights Inteligentes</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="SparklesIcon" className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                {data.insights.map((insight) => (
                  <div 
                    key={insight.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getInsightColor(insight.type)}`}>
                        <Icon name={getInsightIcon(insight.type)} className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        {insight.impact > 0 && (
                          <div className="text-xs font-medium text-green-600">
                            Impacto potencial: {formatCurrency(insight.impact)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Breakdown por Categorías */}
        <Card variant="elevated" className="mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Breakdown por Categorías</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de Barras CSS */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Distribución de Gastos</h4>
                <div className="space-y-3">
                  {data.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category.category}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{category.percentage}%</span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            category.trend > 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {category.trend > 0 ? '+' : ''}{category.trend}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`${category.color} h-3 rounded-full transition-all duration-1000 ease-out`}
                          style={{ 
                            width: `${category.percentage}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        ></div>
                      </div>
                      <div className="text-right mt-1">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tendencias Mensuales */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Tendencias Mensuales</h4>
                <div className="relative h-64 flex items-end justify-between space-x-2">
                  {data.monthlyTrends.map((trend, index) => {
                    const maxAmount = Math.max(...data.monthlyTrends.map(t => t.amount));
                    const height = (trend.amount / maxAmount) * 100;
                    
                    return (
                      <div key={trend.month} className="flex-1 flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                          <div 
                            className="bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-700 ease-out hover:from-primary-600 hover:to-primary-500"
                            style={{ 
                              height: `${height}%`,
                              minHeight: '20px',
                              animationDelay: `${index * 150}ms`
                            }}
                          ></div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            <div>{formatCurrency(trend.amount)}</div>
                            <div>{trend.transactions} transacciones</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-medium text-gray-600">{trend.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Metas Financieras */}
        <Card variant="elevated">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Progreso hacia Metas</h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="TrophyIcon" className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.overview.goalProgress)}`}
                      className="text-green-500 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">
                      {Math.round(data.overview.goalProgress * 100)}%
                    </span>
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Meta de Ahorro</h4>
                <p className="text-sm text-gray-600">
                  {formatCurrency(data.overview.totalSpent)} de {formatCurrency(data.overview.savingsGoal)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.65)}`}
                      className="text-blue-500 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">65%</span>
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Presupuesto Mensual</h4>
                <p className="text-sm text-gray-600">
                  {formatCurrency(4900)} de {formatCurrency(7500)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.82)}`}
                      className="text-purple-500 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">82%</span>
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Eficiencia IA</h4>
                <p className="text-sm text-gray-600">
                  Precisión en categorización
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPremium;
