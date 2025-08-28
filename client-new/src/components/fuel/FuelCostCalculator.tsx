import React, { useMemo } from 'react';
import { FuelCalculation, VehicleType, FuelType } from '@types/fuel';
import { fuelCalculations } from '@utils/fuelCalculations';
import { vehicleConstants } from '@utils/vehicleConstants';
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
  showComparison = true,
  className = ''
}) => {
  // Calcular comparaciones con otros tipos de vehículo
  const vehicleComparison = useMemo(() => {
    if (!calculation || !showComparison) return null;

    const otherVehicles = vehicleConstants.getAllVehicleTypes()
      .filter(type => type !== calculation.vehicleType)
      .map(type => {
        const savings = fuelCalculations.calculateSavingsBetweenVehicles(
          calculation.routeData.distance,
          calculation.fuelPrice,
          calculation.vehicleType,
          type
        );
        return {
          type,
          ...savings
        };
      });

    return otherVehicles;
  }, [calculation, showComparison]);

  // Validación del cálculo
  const validation = useMemo(() => {
    if (!calculation) return null;
    return fuelCalculations.isCalculationReasonable(calculation);
  }, [calculation]);

  if (loading) {
    return (
      <div className={`fuel-cost-calculator ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Calculando costos...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fuel-cost-calculator ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-2">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error en el cálculo</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className={`fuel-cost-calculator ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-center text-gray-500">
            <span className="text-2xl mb-2 block">🛣️</span>
            <p className="text-sm">Selecciona origen, destino y tipo de vehículo para calcular costos</p>
          </div>
        </div>
      </div>
    );
  }

  const costPerKm = fuelCalculations.calculateCostPerKilometer(
    calculation.totalCost,
    calculation.routeData.distance
  );

  const carbonFootprint = fuelCalculations.calculateCarbonFootprint(
    calculation.fuelNeeded,
    calculation.fuelType
  );

  return (
    <div className={`fuel-cost-calculator space-y-4 ${className}`} data-testid="fuel-cost-calculator">
      {/* Resumen principal */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="text-green-600 mr-2">💰</span>
          Cálculo de Combustible
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {fuelCalculations.formatChileanPrice(calculation.totalCost)}
            </div>
            <div className="text-sm text-gray-500">Costo Total</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {calculation.fuelNeeded.toFixed(2)}L
            </div>
            <div className="text-sm text-gray-500">Combustible</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mapUtils.formatDistance(calculation.routeData.distance)}
            </div>
            <div className="text-sm text-gray-500">Distancia</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mapUtils.formatDuration(calculation.routeData.duration)}
            </div>
            <div className="text-sm text-gray-500">Duración</div>
          </div>
        </div>
      </div>

      {/* Detalles de la ruta */}
      {showDetails && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-blue-600 mr-2">🗺️</span>
            Detalles de la Ruta
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Origen:</span>
              <span className="text-gray-900 text-right max-w-xs truncate">
                {calculation.routeData.origin.address}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Destino:</span>
              <span className="text-gray-900 text-right max-w-xs truncate">
                {calculation.routeData.destination.address}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Vehículo:</span>
              <span className="text-gray-900">
                {vehicleConstants.formatVehicleName(calculation.vehicleType)} 
                <span className="text-gray-500 ml-1">({calculation.consumption} km/L)</span>
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Combustible:</span>
              <span className="text-gray-900">
                {calculation.fuelType.replace('_', ' ')} - {fuelCalculations.formatChileanPrice(calculation.fuelPrice)}/L
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Costo por km:</span>
              <span className="text-gray-900">{fuelCalculations.formatChileanPrice(costPerKm)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Huella de carbono:</span>
              <span className="text-gray-900">{carbonFootprint} kg CO₂</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparación con otros vehículos */}
      {showComparison && vehicleComparison && vehicleComparison.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-yellow-600 mr-2">📊</span>
            Comparación con Otros Vehículos
          </h4>

          <div className="space-y-2">
            {vehicleComparison.map((comp) => {
              const isCheaper = comp.vehicle2Cost < comp.vehicle1Cost;
              const vehicleInfo = vehicleConstants.getVehicleInfo(comp.type);

              return (
                <div key={comp.type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{vehicleInfo.icon}</span>
                    <span className="text-sm font-medium">{vehicleInfo.shortName}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {fuelCalculations.formatChileanPrice(comp.vehicle2Cost)}
                    </div>
                    <div className={`text-xs ${isCheaper ? 'text-green-600' : 'text-red-600'}`}>
                      {isCheaper ? '-' : '+'}{fuelCalculations.formatChileanPrice(comp.savings)} 
                      <span className="ml-1">({comp.percentageSavings}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advertencias y validaciones */}
      {validation && (!validation.isValid || validation.warnings.length > 0) && (
        <div className={`border rounded-lg p-4 ${
          validation.isValid ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
        }`}>
          <h4 className={`font-medium mb-2 flex items-center ${
            validation.isValid ? 'text-yellow-800' : 'text-red-800'
          }`}>
            <span className="mr-2">{validation.isValid ? '⚠️' : '❌'}</span>
            {validation.isValid ? 'Advertencias' : 'Problemas Detectados'}
          </h4>

          <ul className={`text-sm space-y-1 ${
            validation.isValid ? 'text-yellow-700' : 'text-red-700'
          }`}>
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-xs">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <span className="text-blue-600 mr-2">💡</span>
          Recomendaciones
        </h4>

        <ul className="text-sm text-blue-800 space-y-1">
          {costPerKm > 100 && (
            <li>• Considera usar transporte público para reducir costos</li>
          )}
          {calculation.routeData.distance > 200 && (
            <li>• Para viajes largos, considera la comodidad del vehículo</li>
          )}
          {carbonFootprint > 10 && (
            <li>• Este viaje tiene un impacto ambiental considerable</li>
          )}
          <li>• Verifica el precio del combustible antes del viaje</li>
          <li>• Considera compartir el viaje para reducir costos por persona</li>
        </ul>
      </div>

      {/* Botón para guardar/usar cálculo */}
      <div className="flex justify-center">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          onClick={() => {
            // Esta funcionalidad se implementará en el componente padre
            console.log('Usar este cálculo para crear gasto');
          }}
        >
          <span className="mr-2">✅</span>
          Usar Este Cálculo
        </button>
      </div>
    </div>
  );
};

export default FuelCostCalculator;