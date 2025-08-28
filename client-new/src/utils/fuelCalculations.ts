import { VehicleType, FuelType, VEHICLE_CONSUMPTION } from '@types/fuel';

/**
 * Utilidades para cálculos de combustible en Gastify
 */
export const fuelCalculations = {
  /**
   * Calcula litros de combustible necesarios basado en distancia y tipo de vehículo
   */
  calculateFuelNeeded: (distanceKm: number, vehicleType: VehicleType): number => {
    const consumption = VEHICLE_CONSUMPTION[vehicleType];
    if (!consumption || distanceKm <= 0) return 0;
    
    return distanceKm / consumption;
  },

  /**
   * Calcula costo total del combustible
   */
  calculateTotalCost: (fuelNeeded: number, pricePerLiter: number): number => {
    if (fuelNeeded <= 0 || pricePerLiter <= 0) return 0;
    
    return fuelNeeded * pricePerLiter;
  },

  /**
   * Calcula costo por kilómetro
   */
  calculateCostPerKm: (totalCost: number, distanceKm: number): number => {
    if (distanceKm <= 0) return 0;
    
    return totalCost / distanceKm;
  },

  /**
   * Valida que el precio de combustible esté en rango razonable para Chile (700-1500 CLP)
   */
  validateFuelPrice: (price: number): boolean => {
    return price >= 700 && price <= 1500;
  },

  /**
   * Formatea precio en pesos chilenos
   */
  formatChileanPrice: (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Formatea cantidad de litros con 1 decimal
   */
  formatLiters: (liters: number): string => {
    return `${liters.toFixed(1)} L`;
  },

  /**
   * Calcula ahorro/sobrecosto comparando con precio base
   */
  calculateSavingsVsBase: (actualCost: number, basePricePerLiter: number, fuelNeeded: number): {
    difference: number;
    percentageDiff: number;
    isSavings: boolean;
  } => {
    const baseCost = basePricePerLiter * fuelNeeded;
    const difference = baseCost - actualCost;
    const percentageDiff = baseCost > 0 ? (difference / baseCost) * 100 : 0;
    
    return {
      difference: Math.abs(difference),
      percentageDiff: Math.abs(percentageDiff),
      isSavings: difference > 0
    };
  },

  /**
   * Estima tiempo de repostaje basado en litros (aproximadamente 1L por segundo)
   */
  estimateRefuelTime: (liters: number): number => {
    return Math.ceil(liters * 1.2); // 1.2 segundos por litro considerando tiempo de manejo
  },

  /**
   * Calcula emisiones de CO2 aproximadas (kg CO2 por litro)
   */
  calculateCO2Emissions: (liters: number, fuelType: FuelType): number => {
    const co2PerLiter = {
      [FuelType.GASOLINA_93]: 2.31,
      [FuelType.GASOLINA_95]: 2.31,
      [FuelType.GASOLINA_97]: 2.31,
      [FuelType.DIESEL]: 2.68
    };
    
    return liters * co2PerLiter[fuelType];
  },

  /**
   * Determina el tipo de combustible más económico para un vehículo
   */
  getMostEconomicalFuel: (prices: Record<FuelType, number>, vehicleType: VehicleType): {
    fuelType: FuelType;
    price: number;
    savings: number;
  } => {
    const sortedByPrice = Object.entries(prices)
      .sort(([, a], [, b]) => a - b)
      .map(([fuel, price]) => ({ fuel: fuel as FuelType, price }));
    
    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
    
    return {
      fuelType: cheapest.fuel,
      price: cheapest.price,
      savings: mostExpensive.price - cheapest.price
    };
  },

  /**
   * Valida que los cálculos sean consistentes
   */
  validateCalculation: (distanceKm: number, vehicleType: VehicleType, fuelNeeded: number, totalCost: number, pricePerLiter: number): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    // Validar distancia
    if (distanceKm <= 0) {
      errors.push('La distancia debe ser mayor a 0');
    }
    if (distanceKm > 2000) {
      errors.push('La distancia parece excesiva (>2000km)');
    }
    
    // Validar combustible necesario
    const expectedFuel = fuelCalculations.calculateFuelNeeded(distanceKm, vehicleType);
    if (Math.abs(fuelNeeded - expectedFuel) > 0.1) {
      errors.push('El combustible calculado no coincide con la distancia y vehículo');
    }
    
    // Validar costo total
    const expectedCost = fuelCalculations.calculateTotalCost(fuelNeeded, pricePerLiter);
    if (Math.abs(totalCost - expectedCost) > 1) {
      errors.push('El costo total no coincide con el combustible y precio');
    }
    
    // Validar precio por litro
    if (!fuelCalculations.validateFuelPrice(pricePerLiter)) {
      errors.push('El precio por litro está fuera del rango esperado');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default fuelCalculations;