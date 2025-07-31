import React from 'react';
import { TrendDataPoint } from '../../../types/analytics';

interface TrendChartProps {
  dataPoints: TrendDataPoint[];
  title?: string;
  isLoading?: boolean;
  height?: number;
  className?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  dataPoints,
  title = 'Tendencia de Gastos',
  isLoading = false,
  height = 200,
  className = '',
}) => {
  // Formatear fecha en formato chileno
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
  };

  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Encontrar el valor máximo para la escala
  const maxValue = Math.max(...dataPoints.map(point => point.amount), 0);
  const minValue = Math.min(...dataPoints.map(point => point.amount), 0);
  const range = maxValue - minValue;

  // Función para calcular la altura de la barra
  const getBarHeight = (amount: number): number => {
    if (range === 0) return 0;
    // Calcular altura relativa (80% del espacio disponible)
    return ((amount - minValue) / range) * 80;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {dataPoints.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No hay datos suficientes para mostrar tendencias</p>
        </div>
      ) : (
        <div>
          <div className="relative" style={{ height: `${height}px` }}>
            {/* Crear barras de tendencia */}
            <div className="absolute inset-0 flex items-end justify-between">
              {dataPoints.map((point, index) => (
                <div 
                  key={`${point.date}-${index}`} 
                  className="group flex flex-col items-center" 
                  style={{ width: `${100 / dataPoints.length}%`, maxWidth: '50px' }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {formatDate(point.date)}: {formatCurrency(point.amount)}
                  </div>
                  
                  {/* Barra */}
                  <div 
                    className={`w-4/5 bg-emerald-500 rounded-t transition-all duration-300 group-hover:bg-emerald-600`}
                    style={{ 
                      height: `${getBarHeight(point.amount)}%`,
                      minHeight: '4px'
                    }}
                  ></div>
                  
                  {/* Etiqueta */}
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                    {formatDate(point.date)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Línea de base */}
            <div className="absolute bottom-6 left-0 right-0 border-t border-gray-200"></div>
          </div>
          
          {/* Leyenda */}
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              {dataPoints.length > 0 && formatDate(dataPoints[0].date)}
            </div>
            <div>
              {dataPoints.length > 0 && formatDate(dataPoints[dataPoints.length - 1].date)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;
