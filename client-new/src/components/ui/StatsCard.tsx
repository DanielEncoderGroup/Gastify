import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
  description?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  percentage,
  description,
  icon,
  isLoading = false,
  onClick,
  className = '',
}) => {
  // Determinar colores según tendencia
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend === 'up' 
      ? 'text-red-600' 
      : trend === 'down' 
        ? 'text-emerald-600' 
        : 'text-gray-500';
  };

  // Determinar ícono de flecha según tendencia
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' 
      ? '↑' 
      : trend === 'down' 
        ? '↓' 
        : '→';
  };

  // Renderizar skeleton loader si está cargando
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-5 shadow-md border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg p-5 shadow-md border border-gray-100 transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          
          {(trend || description) && (
            <div className="mt-1 flex items-center text-sm">
              {trend && percentage !== undefined && (
                <span className={`font-medium ${getTrendColor()} mr-1 flex items-center`}>
                  <span className="mr-0.5">{getTrendIcon()}</span>
                  {percentage.toFixed(1)}%
                </span>
              )}
              
              {description && (
                <span className="text-gray-500 text-xs">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
