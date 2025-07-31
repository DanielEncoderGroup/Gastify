import React from 'react';
import { Insight } from '../../types/analytics';

interface InsightCardProps {
  insight: Insight;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  isLoading = false,
  onClick,
  className = '',
}) => {
  // Determinar el color según el tipo de insight
  const getInsightTypeColor = () => {
    switch (insight?.type) {
      case 'saving_opportunity':
        return 'bg-emerald-100 text-emerald-800';
      case 'spending_habit':
        return 'bg-amber-100 text-amber-800';
      case 'anomaly_detected':
        return 'bg-rose-100 text-rose-800';
      case 'prediction':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Renderizar skeleton loader si está cargando
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-5 border-l-4 border-gray-300 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ borderLeftColor: insight.type === 'saving_opportunity' ? '#10b981' : 
                                 insight.type === 'spending_habit' ? '#f59e0b' : 
                                 insight.type === 'anomaly_detected' ? '#f43f5e' : 
                                 '#3b82f6' }}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInsightTypeColor()}`}>
              {insight.type === 'saving_opportunity' ? 'Oportunidad de ahorro' :
               insight.type === 'spending_habit' ? 'Hábito de gasto' :
               insight.type === 'anomaly_detected' ? 'Anomalía detectada' :
               insight.type === 'prediction' ? 'Predicción' : insight.type}
            </span>
            
            {insight.category && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {insight.category}
              </span>
            )}
          </div>
          
          {insight.impact_percentage && (
            <span className={`font-medium text-sm ${
              insight.type === 'saving_opportunity' ? 'text-emerald-600' : 'text-gray-700'
            }`}>
              {insight.impact_percentage > 0 ? '+' : ''}{insight.impact_percentage.toFixed(1)}%
            </span>
          )}
        </div>
        
        <h4 className="text-base font-semibold text-gray-800 mt-2">{insight.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
        
        {insight.impact > 0 && (
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Impacto estimado:
            </span>
            <span className="font-medium text-sm">
              {formatCurrency(insight.impact)}
            </span>
          </div>
        )}
        
        {insight.recommended_action && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-700 font-medium">Recomendación:</p>
            <p className="text-sm text-gray-600">{insight.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCard;
