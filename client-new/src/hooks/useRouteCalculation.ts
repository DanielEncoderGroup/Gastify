import { useState, useCallback } from 'react';
import {
  Coordinates,
  RouteData,
  FuelCalculation,
  VehicleType,
  FuelType,
  Location
} from '../types/fuel';
import { mapsService } from '../services/mapsService';
import { fixedFuelPricesService } from '../services/fixedFuelPricesService';
import { fuelCalculations } from '../utils/fuelCalculations';

interface UseRouteCalculationReturn {
  routeData: RouteData | null;
  calculation: FuelCalculation | null;
  loading: boolean;
  error: string | null;
  calculateRoute: (origin: Coordinates, destination: Coordinates) => Promise<void>;
  calculateFuelCost: (
    routeData: RouteData,
    vehicleType: VehicleType,
    fuelType: FuelType,
    manualPrice?: number
  ) => Promise<void>;
  resetCalculation: () => void;
}

/**
 * Hook para cálculos de rutas y costos de combustible
 */
export const useRouteCalculation = (): UseRouteCalculationReturn => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [calculation, setCalculation] = useState<FuelCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
    try {
      setLoading(true);
      setError(null);

      // Calcular ruta usando Google Maps
      const route = await mapsService.calculateRoute(origin, destination);
      
      setRouteData(route);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error calculando ruta';
      setError(errorMessage);
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFuelCost = useCallback(async (
    routeData: RouteData,
    vehicleType: VehicleType,
    fuelType: FuelType,
    manualPrice?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      let fuelPrice: number;

      // Usar precio manual o obtener de CNE
      if (manualPrice && fuelCalculations.validateFuelPrice(manualPrice)) {
        fuelPrice = manualPrice;
      } else {
        const prices = await fixedFuelPricesService.getFuelPrices();
        const regionPrice = Object.values(prices).find((p: any) => p.fuelType === fuelType);
        
        if (!regionPrice) {
          throw new Error(`No se encontró precio para ${fuelType}`);
        }
        
        fuelPrice = regionPrice.price;
      }

      // Calcular combustible necesario
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(routeData.distance, vehicleType);
      
      // Calcular costo total
      const totalCost = fuelCalculations.calculateTotalCost(fuelNeeded, fuelPrice);

      // Validar cálculos
      const validation = fuelCalculations.validateCalculation(
        routeData.distance,
        vehicleType,
        fuelNeeded,
        totalCost,
        fuelPrice
      );

      if (!validation.isValid) {
        throw new Error(`Cálculo inválido: ${validation.errors.join(', ')}`);
      }

      // Crear objeto de cálculo
      const fuelCalculation: FuelCalculation = {
        routeData,
        vehicleType,
        fuelType,
        fuelPrice,
        fuelNeeded,
        totalCost,
        consumption: fuelCalculations.calculateFuelNeeded(1, vehicleType) * 1 // km/L
      };

      setCalculation(fuelCalculation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error calculando costo';
      setError(errorMessage);
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetCalculation = useCallback(() => {
    setRouteData(null);
    setCalculation(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    routeData,
    calculation,
    loading,
    error,
    calculateRoute,
    calculateFuelCost,
    resetCalculation
  };
};

export default useRouteCalculation;