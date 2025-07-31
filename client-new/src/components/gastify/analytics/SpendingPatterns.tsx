import React from 'react';
import { SpendingPattern } from '../../../types/analytics';

interface SpendingPatternsProps {
  patterns: SpendingPattern[];
  isLoading: boolean;
  className?: string;
}

const SpendingPatterns: React.FC<SpendingPatternsProps> = ({ 
  patterns, 
  isLoading,
  className = '' 
}) => {
  // Traducir tipo de patrón al español
  const getPatternTypeText = (type: string): string => {
    switch (type) {
      case 'weekday':
        return 'Patrón por día de semana';
      case 'monthly':
        return 'Patrón mensual';
      case 'category_sequence':
        return 'Secuencia de categorías';
      case 'amount_pattern':
        return 'Patrón de montos';
      default:
        return type;
    }
  };

  // Formatear porcentaje de confianza
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Patrones de Gasto</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-100 pb-4 mb-4 last:border-0">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Patrones de Gasto</h3>
      
      {patterns.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">No se detectaron patrones de gasto</p>
          <p className="text-gray-400 text-xs mt-2">
            Los patrones se detectarán automáticamente a medida que registres más gastos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <div 
              key={`${pattern.type}-${index}`} 
              className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getPatternTypeText(pattern.type)}
                  </span>
                  
                  <h4 className="font-semibold text-gray-800 mt-2">
                    {pattern.description}
                  </h4>
                </div>
                
                <div className="text-sm bg-gray-50 px-2 py-1 rounded text-gray-600">
                  Confianza: {formatConfidence(pattern.confidence)}
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                Frecuencia: <span className="font-medium">{pattern.frequency}</span> veces detectado
              </div>
              
              {pattern.examples && pattern.examples.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Ejemplos:</p>
                  <div className="text-xs text-gray-600">
                    {pattern.examples.slice(0, 2).map((example, i) => (
                      <div key={i} className="inline-block mr-3">
                        {new Date(example.date).toLocaleDateString('es-CL')} 
                        {example.description && ` - ${example.description.substring(0, 20)}${example.description.length > 20 ? '...' : ''}`}
                      </div>
                    ))}
                    {pattern.examples.length > 2 && (
                      <span className="text-emerald-600">y {pattern.examples.length - 2} más</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpendingPatterns;
