import React from 'react';
import { CategoryStat } from '../../types/analytics';
import ProgressBar from './ProgressBar';

interface CategoryBreakdownProps {
  categories: CategoryStat[];
  isLoading?: boolean;
  title?: string;
  className?: string;
}

// Array de colores para categorías
const CATEGORY_COLORS = [
  'emerald',
  'blue',
  'amber',
  'rose',
  'indigo',
  'purple',
] as const;

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  isLoading = false,
  title = 'Desglose por Categoría',
  className = '',
}) => {
  // Asignar colores a categorías
  const getColorForIndex = (index: number) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay datos disponibles</p>
        ) : (
          categories.map((category, index) => (
            <div key={category.category} className="category-item">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className={`h-3 w-3 rounded-full bg-${getColorForIndex(index)}-500 mr-2`}></span>
                  <span className="font-medium text-sm text-gray-800">{category.category}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-700 mr-3">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <ProgressBar 
                percentage={category.percentage} 
                color={getColorForIndex(index)}
                size="sm"
                showPercentage={false}
              />
              
              {category.trend && category.trend_percentage && (
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-medium flex items-center ${
                    category.trend === 'up' 
                      ? 'text-red-600'
                      : category.trend === 'down'
                        ? 'text-emerald-600' 
                        : 'text-gray-500'
                  }`}>
                    {category.trend === 'up' ? '↑' : category.trend === 'down' ? '↓' : '→'}
                    {category.trend_percentage.toFixed(1)}% desde el período anterior
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
