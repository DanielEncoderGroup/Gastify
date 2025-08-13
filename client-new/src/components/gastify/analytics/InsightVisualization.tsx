import React from 'react';
import { Insight } from '../../../types/analytics';
import Card from '../../ui/Card';

interface InsightVisualizationProps {
  insights: Insight[];
  isLoading: boolean;
  className?: string;
}

const InsightVisualization: React.FC<InsightVisualizationProps> = ({ 
  insights, 
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

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'saving_opportunity':
      case 'savings':
        return '💰';
      case 'spending_habit':
        return '📊';
      case 'warning':
        return '⚠️';
      case 'opportunity':
        return '🎯';
      default:
        return '💡';
    }
  };

  const getInsightColor = (type: string): string => {
    switch (type) {
      case 'saving_opportunity':
      case 'savings':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'spending_habit':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getImpactLevel = (impact: number): { level: string; color: string } => {
    if (impact >= 500) return { level: 'Alto', color: 'text-red-600' };
    if (impact >= 200) return { level: 'Medio', color: 'text-yellow-600' };
    return { level: 'Bajo', color: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Insights Inteligentes</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
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
          Insights Inteligentes
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {insights.length} insights
          </span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-500 text-sm">
            Analizando tus patrones de gasto...
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Los insights aparecerán cuando tengamos más datos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const impactInfo = getImpactLevel(insight.impact);
            
            return (
              <div 
                key={`insight-${index}`}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        {insight.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${impactInfo.color}`}>
                          {impactInfo.level}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          {formatCurrency(insight.impact)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    {insight.recommended_action && (
                      <div className="bg-white bg-opacity-50 rounded p-2 border border-current border-opacity-20">
                        <p className="text-xs font-medium mb-1">💡 Acción recomendada:</p>
                        <p className="text-xs">
                          {insight.recommended_action}
                        </p>
                      </div>
                    )}
                    
                    {insight.category && (
                      <div className="mt-2">
                        <span className="inline-block bg-white bg-opacity-50 px-2 py-1 rounded text-xs font-medium border border-current border-opacity-20">
                          {insight.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barra de impacto visual */}
                <div className="mt-3">
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full bg-current opacity-60 transition-all duration-700"
                      style={{ 
                        width: `${Math.min((insight.impact / 1000) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Potencial de ahorro total:
            </span>
            <span className="font-bold text-emerald-600">
              {formatCurrency(insights.reduce((sum, insight) => sum + insight.impact, 0))}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InsightVisualization;
