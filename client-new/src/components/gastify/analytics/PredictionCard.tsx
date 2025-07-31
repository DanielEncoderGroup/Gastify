import React from 'react';
import { StatsCard } from '../../ui';
import { PredictionResponse } from '../../../types/analytics';

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  isLoading: boolean;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, isLoading }) => {
  // Formatear valor en pesos chilenos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <StatsCard
      title="Predicción Gasto Mensual"
      value={isLoading ? "Cargando..." : prediction ? formatCurrency(prediction.total_amount) : "N/A"}
      trend={prediction?.trend}
      percentage={prediction?.trend_percentage}
      description="Próximos 30 días"
      isLoading={isLoading}
      className="transition-all hover:scale-105 duration-200"
    />
  );
};

export default PredictionCard;
