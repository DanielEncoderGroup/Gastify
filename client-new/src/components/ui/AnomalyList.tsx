import React from 'react';
import { Anomaly } from '../../types/analytics';

interface AnomalyListProps {
  anomalies: Anomaly[];
  isLoading?: boolean;
  title?: string;
  maxItems?: number;
  className?: string;
}

const AnomalyList: React.FC<AnomalyListProps> = ({
  anomalies,
  isLoading = false,
  title = 'Anomalías Detectadas',
  maxItems = 5,
  className = '',
}) => {
  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formatear fecha en formato chileno
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayAnomalies = anomalies.slice(0, maxItems);

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {anomalies.length > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {anomalies.length} detectadas
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {displayAnomalies.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-green-500 text-3xl mb-2">✓</div>
            <p className="text-gray-500 text-sm">No se detectaron anomalías</p>
          </div>
        ) : (
          displayAnomalies.map((anomaly, index) => (
            <div 
              key={`${anomaly.date}-${index}`}
              className="pb-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <span className="text-red-500 mr-1">⚠️</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatDate(anomaly.date)}
                    </span>
                  </div>
                  
                  {anomaly.category && (
                    <p className="text-xs text-gray-600 mt-1">
                      Categoría: <span className="font-medium">{anomaly.category}</span>
                    </p>
                  )}
                  
                  {anomaly.description && (
                    <p className="text-xs text-gray-500 mt-1">{anomaly.description}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">
                    {formatCurrency(anomaly.amount)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1 justify-end">
                    <span>Esperado: {formatCurrency(anomaly.expected_amount)}</span>
                  </div>
                  <div className="text-xs font-semibold text-red-500 mt-1">
                    +{anomaly.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {anomalies.length > maxItems && (
        <div className="mt-4 text-center">
          <button 
            className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
          >
            Ver todas ({anomalies.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default AnomalyList;
