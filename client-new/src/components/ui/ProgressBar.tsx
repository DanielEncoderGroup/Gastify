import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  value?: string | number;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  value,
  color = 'emerald',
  size = 'md',
  showPercentage = true,
  animate = true,
  className = '',
}) => {
  // Mapa de colores para barras de progreso
  const colorMap = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
  };

  // Mapa de tamaños
  const sizeMap = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  // Limitar el porcentaje entre 0 y 100
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {(label || value) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {value && <span className="text-gray-600">{value}</span>}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeMap[size]}`}>
        <div 
          className={`${colorMap[color]} rounded-full ${sizeMap[size]} ${animate ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ width: `${safePercentage}%` }}
          aria-label={`${safePercentage}% completo`}
          role="progressbar"
          aria-valuenow={safePercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {showPercentage && size === 'lg' && (
            <span className="sr-only">{safePercentage}%</span>
          )}
        </div>
      </div>
      
      {showPercentage && size !== 'lg' && (
        <div className="text-right mt-1">
          <span className="text-xs font-semibold text-gray-500">{safePercentage}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
