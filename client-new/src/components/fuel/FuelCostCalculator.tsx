import React from 'react';
import { FuelCalculation } from '../../types/fuel';
import { fuelCalculations } from '@utils/fuelCalculations';
import { mapUtils } from '@utils/mapUtils';

interface FuelCostCalculatorProps {
  calculation: FuelCalculation | null;
  loading?: boolean;
  error?: string | null;
  showDetails?: boolean;
  showComparison?: boolean;
  className?: string;
}

/**
 * Componente para mostrar cálculos de costo de combustible
 * Incluye detalles de la ruta, costos y comparaciones
 */
export const FuelCostCalculator: React.FC<FuelCostCalculatorProps> = ({
  calculation,
  loading = false,
  error = null,
  showDetails = true,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-red-600 text-xl mr-2">❌</span>
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-2xl block mb-2">⛽</span>
          <p className="text-sm">Esperando cálculos de combustible...</p>
        </div>
      </div>
    );
  }

  const costPerKm = fuelCalculations.calculateCostPerKm(
    calculation.totalCost, 
    calculation.routeData.distance
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Costos</h3>
      
      {/* Costos principales */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Distancia total:</span>
          <span className="text-sm font-medium text-gray-900">
            {mapUtils.formatDistance(calculation.routeData.distance)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Combustible necesario:</span>
          <span className="text-sm font-medium text-gray-900">
            {fuelCalculations.formatLiters(calculation.fuelNeeded)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Precio por litro:</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900">
              {fuelCalculations.formatChileanPrice(calculation.fuelPrice)}
            </span>
            <p className="text-xs text-green-600">Precio actualizado hoy</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Costo total:</span>
            <span className="text-lg font-bold text-green-600">
              {fuelCalculations.formatChileanPrice(calculation.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Detalles Adicionales</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Costo por kilómetro:</span>
              <span>{fuelCalculations.formatChileanPrice(costPerKm)}/km</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo de vehículo:</span>
              <span className="capitalize">{calculation.vehicleType}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo de combustible:</span>
              <span className="capitalize">{calculation.fuelType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Duración estimada:</span>
              <span>{mapUtils.formatDuration(calculation.routeData.duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelCostCalculator;