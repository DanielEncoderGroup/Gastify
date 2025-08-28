import { FuelPrice, FuelType } from '../types/fuel';

/**
 * Servicio de precios fijos para combustible en Chile
 * Reemplaza la API de CNE con precios actualizados al 28/08/2025
 */
export class FixedFuelPricesService {
  // Precios fijos actualizados en pesos chilenos por litro
  private readonly fixedPrices: Record<FuelType, number> = {
    [FuelType.GASOLINA_93]: 1267,
    [FuelType.GASOLINA_95]: 1305,
    [FuelType.GASOLINA_97]: 1335,
    [FuelType.DIESEL]: 1074
  };

  /**
   * Obtener precio específico de un combustible
   */
  async getFuelPrice(fuelType: FuelType, region: string = 'Chile'): Promise<FuelPrice> {
    const price = this.fixedPrices[fuelType];
    
    if (!price) {
      throw new Error(`Precio no disponible para tipo de combustible: ${fuelType}`);
    }

    return {
      fuelType,
      price,
      region,
      lastUpdated: new Date().toISOString(),
      source: 'fixed_prices'
    };
  }

  /**
   * Obtener todos los precios de combustible
   */
  async getFuelPrices(region: string = 'Chile'): Promise<Record<string, FuelPrice>> {
    const prices: Record<string, FuelPrice> = {};
    const currentTimestamp = new Date().toISOString();

    for (const [fuelType, price] of Object.entries(this.fixedPrices)) {
      prices[fuelType] = {
        fuelType: fuelType as FuelType,
        price,
        region,
        lastUpdated: currentTimestamp,
        source: 'fixed_prices'
      };
    }

    return prices;
  }

  /**
   * Obtener precio más económico disponible
   */
  getCheapestFuelPrice(): { fuelType: FuelType; price: number } {
    let cheapestType: FuelType = FuelType.GASOLINA_93;
    let cheapestPrice = this.fixedPrices[FuelType.GASOLINA_93];

    for (const [type, price] of Object.entries(this.fixedPrices)) {
      if (price < cheapestPrice) {
        cheapestPrice = price;
        cheapestType = type as FuelType;
      }
    }

    return { fuelType: cheapestType, price: cheapestPrice };
  }

  /**
   * Obtener precio más caro disponible
   */
  getMostExpensiveFuelPrice(): { fuelType: FuelType; price: number } {
    let expensiveType: FuelType = FuelType.GASOLINA_93;
    let expensivePrice = this.fixedPrices[FuelType.GASOLINA_93];

    for (const [type, price] of Object.entries(this.fixedPrices)) {
      if (price > expensivePrice) {
        expensivePrice = price;
        expensiveType = type as FuelType;
      }
    }

    return { fuelType: expensiveType, price: expensivePrice };
  }

  /**
   * Comparar precios entre tipos de combustible
   */
  comparePrices(): Array<{ fuelType: FuelType; price: number; rank: number }> {
    const sortedPrices = Object.entries(this.fixedPrices)
      .map(([type, price]) => ({ fuelType: type as FuelType, price }))
      .sort((a, b) => a.price - b.price)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return sortedPrices;
  }

  /**
   * Validar si un precio está dentro del rango esperado
   */
  isPriceReasonable(fuelType: FuelType, price: number): boolean {
    const basePrice = this.fixedPrices[fuelType];
    const tolerance = 0.15; // 15% de tolerancia
    
    const minPrice = basePrice * (1 - tolerance);
    const maxPrice = basePrice * (1 + tolerance);
    
    return price >= minPrice && price <= maxPrice;
  }

  /**
   * Obtener información sobre los precios
   */
  getPriceInfo(): {
    lastUpdated: string;
    source: string;
    pricesCount: number;
    priceRange: { min: number; max: number };
  } {
    const prices = Object.values(this.fixedPrices);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      lastUpdated: new Date().toISOString(),
      source: 'Precios fijos actualizados - 28/08/2025',
      pricesCount: prices.length,
      priceRange: { min: minPrice, max: maxPrice }
    };
  }

  /**
   * Calcular diferencia de precio entre dos tipos de combustible
   */
  getPriceDifference(fuelType1: FuelType, fuelType2: FuelType): {
    difference: number;
    percentage: number;
    cheaper: FuelType;
    moreExpensive: FuelType;
  } {
    const price1 = this.fixedPrices[fuelType1];
    const price2 = this.fixedPrices[fuelType2];
    
    const difference = Math.abs(price1 - price2);
    const percentage = (difference / Math.min(price1, price2)) * 100;
    
    return {
      difference,
      percentage: Math.round(percentage * 100) / 100,
      cheaper: price1 < price2 ? fuelType1 : fuelType2,
      moreExpensive: price1 > price2 ? fuelType1 : fuelType2
    };
  }

  /**
   * Limpiar cache (para compatibilidad con interfaz anterior)
   */
  clearTokenCache(): void {
    // No se requiere acción para precios fijos
    console.log('Cache cleared (fixed prices service)');
  }
}

// Instancia singleton
export const fixedFuelPricesService = new FixedFuelPricesService();

// Export por defecto para compatibilidad
export default fixedFuelPricesService;
