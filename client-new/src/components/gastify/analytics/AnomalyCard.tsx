import React from 'react';
import { Anomaly } from '../../../types/analytics';
import Card from '../../ui/Card';

interface AnomalyCardProps {
  anomalies: Anomaly[];
  isLoading: boolean;
  className?: string;
}

const AnomalyCard: React.FC<AnomalyCardProps> = ({ 
  anomalies, 
  isLoading, 
  className = '' 
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSeverityColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-100 text-red-800 border-red-200';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getSeverityIcon = (percentage: number): string => {
    if (percentage >= 100) return '🚨';
    if (percentage >= 50) return '⚠️';
    return 'ℹ️';
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Anomalías Detectadas</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Anomalías Detectadas
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {anomalies.length} detectadas
          </span>
          {anomalies.length > 0 && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-500 text-sm">
            No se detectaron anomalías en tus gastos
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Tus patrones de gasto están dentro de lo normal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.slice(0, 5).map((anomaly, index) => (
            <div 
              key={`anomaly-${index}`}
              className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">
                      {getSeverityIcon(anomaly.percentage)}
                    </span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(anomaly.amount)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(anomaly.percentage)}`}>
                      +{anomaly.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    {anomaly.description || `Gasto ${anomaly.percentage.toFixed(1)}% superior al promedio`}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(anomaly.date)}</span>
                    <span>
                      Esperado: {formatCurrency(anomaly.expected_amount)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Barra de desviación visual */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      anomaly.percentage >= 100 ? 'bg-red-500' :
                      anomaly.percentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${Math.min(anomaly.percentage, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {anomalies.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                Ver {anomalies.length - 5} anomalías más
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AnomalyCard;
