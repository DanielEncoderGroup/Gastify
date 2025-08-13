import React from 'react';
import { CategoryStat } from '../../../types/analytics';
import Card from '../../ui/Card';

interface CategoryBreakdownChartProps {
  categories: CategoryStat[];
  isLoading: boolean;
  totalAmount: number;
  className?: string;
}

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ 
  categories, 
  isLoading, 
  totalAmount,
  className = '' 
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Comida': 'bg-red-500',
      'Transporte': 'bg-blue-500',
      'Alojamiento': 'bg-green-500',
      'Entretenimiento': 'bg-purple-500',
      'Material Oficina': 'bg-yellow-500',
      'Salud': 'bg-pink-500',
      'Combustible': 'bg-orange-500',
      'Supermercado': 'bg-teal-500',
      'Farmacia': 'bg-indigo-500',
      'Retail': 'bg-cyan-500',
      'Otros': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-emerald-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Gastos por Categoría</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        
        {/* Gráfico circular skeleton */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-48 h-48 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        
        {/* Lista skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Calcular ángulos para el gráfico circular
  const calculateAngles = () => {
    let currentAngle = 0;
    return categories.map(category => {
      const angle = (category.percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...category, startAngle, angle };
    });
  };

  const categoriesWithAngles = calculateAngles();

  // Crear path SVG para cada segmento
  const createPath = (startAngle: number, angle: number, radius: number = 90) => {
    const centerX = 100;
    const centerY = 100;
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Gastos por Categoría
        </h3>
        <div className="text-sm text-gray-500">
          Total: {formatCurrency(totalAmount)}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">
            No hay datos de categorías disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico circular */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="200" height="200" className="transform -rotate-90">
                {categoriesWithAngles.map((category, index) => (
                  <path
                    key={`segment-${index}`}
                    d={createPath(category.startAngle, category.angle)}
                    className={`${getCategoryColor(category.category)} hover:opacity-80 transition-opacity cursor-pointer`}
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
                {/* Círculo central */}
                <circle
                  cx="100"
                  cy="100"
                  r="40"
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
              </svg>
              
              {/* Texto central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-sm font-bold text-gray-800">
                    {categories.length}
                  </div>
                  <div className="text-xs text-gray-500">categorías</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de categorías */}
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div 
                key={`category-${index}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-4 h-4 rounded ${getCategoryColor(category.category)}`}
                  ></div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {category.category}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.count} transacciones
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-sm text-gray-800">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </span>
                    {category.trend_percentage !== undefined && (
                      <span className={`flex items-center ${getTrendColor(category.trend)}`}>
                        <span className="mr-0.5">{getTrendIcon(category.trend)}</span>
                        {Math.abs(category.trend_percentage).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Estadísticas adicionales */}
      {categories.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Categoría principal:</span>
              <div className="font-semibold text-gray-800">
                {categories[0]?.category} ({categories[0]?.percentage.toFixed(1)}%)
              </div>
            </div>
            <div>
              <span className="text-gray-600">Promedio por categoría:</span>
              <div className="font-semibold text-gray-800">
                {formatCurrency(totalAmount / categories.length)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CategoryBreakdownChart;
