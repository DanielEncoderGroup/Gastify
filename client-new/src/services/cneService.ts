import { FuelPrice, FuelType } from '@types/fuel';

/**
 * Servicio para obtener precios de combustible desde la API del CNE Chile
 * Implementa cache para optimizar las consultas y reduce las llamadas a la API externa
 */

// Cache para precios de combustible
interface PriceCache {
  [key: string]: {
    price: FuelPrice;
    timestamp: number;
  };
}

// Cache local con TTL de 1 hora
const priceCache: PriceCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en millisegundos

/**
 * Mapeo de tipos de combustible internos a códigos CNE
 */
const FUEL_TYPE_CNE_MAPPING: Record<FuelType, string> = {
  [FuelType.GASOLINA_93]: 'gasolina_93',
  [FuelType.GASOLINA_95]: 'gasolina_95', 
  [FuelType.GASOLINA_97]: 'gasolina_97',
  [FuelType.DIESEL]: 'diesel'
};

/**
 * Mapeo de regiones chilenas para la API CNE
 */
const REGION_MAPPING: Record<string, string> = {
  'Metropolitana': 'metropolitana',
  'Valparaíso': 'valparaiso',
  'Biobío': 'biobio',
  'Antofagasta': 'antofagasta',
  'Atacama': 'atacama',
  'Coquimbo': 'coquimbo',
  'O\'Higgins': 'ohiggins',
  'Maule': 'maule',
  'Araucanía': 'araucania',
  'Los Ríos': 'los_rios',
  'Los Lagos': 'los_lagos',
  'Aysén': 'aysen',
  'Magallanes': 'magallanes',
  'Arica y Parinacota': 'arica_parinacota',
  'Tarapacá': 'tarapaca'
};

export const cneService = {
  /**
   * Obtener precio de combustible por tipo y región
   */
  getFuelPrice: async (fuelType: FuelType, region: string = 'Metropolitana'): Promise<FuelPrice> => {
    try {
      // Generar clave de cache
      const cacheKey = `${fuelType}_${region}`;
      
      // Verificar cache
      const cached = priceCache[cacheKey];
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('Usando precio de combustible desde cache:', cacheKey);
        return cached.price;
      }

      // Mapear región a formato CNE
      const mappedRegion = REGION_MAPPING[region] || 'metropolitana';
      
      // Simular llamada a API CNE (en producción sería una llamada HTTP real)
      const price = await cneService.fetchFromCNEAPI(fuelType, mappedRegion);
      
      // Crear objeto FuelPrice
      const fuelPrice: FuelPrice = {
        fuelType,
        price,
        region,
        lastUpdated: new Date().toISOString(),
        source: 'CNE'
      };

      // Actualizar cache
      priceCache[cacheKey] = {
        price: fuelPrice,
        timestamp: Date.now()
      };

      console.log('Precio de combustible obtenido desde CNE:', fuelPrice);
      return fuelPrice;
    } catch (error) {
      console.error('Error obteniendo precio de combustible:', error);
      
      // Fallback: devolver precio estimado basado en históricos
      return cneService.getFallbackPrice(fuelType, region);
    }
  },

  /**
   * Obtener precios de todos los tipos de combustible para una región
   */
  getAllFuelPrices: async (region: string = 'Metropolitana'): Promise<FuelPrice[]> => {
    try {
      const fuelTypes = Object.values(FuelType);
      const pricesPromises = fuelTypes.map(type => cneService.getFuelPrice(type, region));
      
      const prices = await Promise.all(pricesPromises);
      return prices;
    } catch (error) {
      console.error('Error obteniendo todos los precios de combustible:', error);
      
      // Fallback: devolver precios estimados
      return Object.values(FuelType).map(type => 
        cneService.getFallbackPrice(type, region)
      );
    }
  },

  /**
   * Simular llamada a API CNE (en producción esto sería una llamada HTTP real)
   */
  fetchFromCNEAPI: async (fuelType: FuelType, region: string): Promise<number> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Precios base aproximados en CLP por litro (basados en precios reales CNE)
    const basePrices: Record<FuelType, number> = {
      [FuelType.GASOLINA_93]: 830,
      [FuelType.GASOLINA_95]: 850,
      [FuelType.GASOLINA_97]: 880,
      [FuelType.DIESEL]: 740
    };

    // Variación regional (algunas regiones tienen precios más altos)
    const regionalMultiplier: Record<string, number> = {
      'metropolitana': 1.0,
      'valparaiso': 1.02,
      'biobio': 1.01,
      'antofagasta': 1.05,
      'atacama': 1.04,
      'coquimbo': 1.02,
      'ohiggins': 1.01,
      'maule': 1.01,
      'araucania': 1.03,
      'los_rios': 1.04,
      'los_lagos': 1.04,
      'aysen': 1.08,
      'magallanes': 1.10,
      'arica_parinacota': 1.06,
      'tarapaca': 1.07
    };

    const basePrice = basePrices[fuelType];
    const multiplier = regionalMultiplier[region] || 1.0;
    
    // Agregar variación aleatoria pequeña para simular fluctuaciones
    const randomVariation = 1 + (Math.random() - 0.5) * 0.04; // ±2%
    
    const finalPrice = Math.round(basePrice * multiplier * randomVariation);
    
    // Simular posibles errores de API
    if (Math.random() < 0.05) { // 5% de probabilidad de error
      throw new Error('CNE API temporalmente no disponible');
    }

    return finalPrice;
  },

  /**
   * Obtener precio de fallback cuando la API CNE no está disponible
   */
  getFallbackPrice: (fuelType: FuelType, region: string): FuelPrice => {
    // Precios de respaldo conservadores (aproximados)
    const fallbackPrices: Record<FuelType, number> = {
      [FuelType.GASOLINA_93]: 850,
      [FuelType.GASOLINA_95]: 870,
      [FuelType.GASOLINA_97]: 900,
      [FuelType.DIESEL]: 760
    };

    const price = fallbackPrices[fuelType];

    return {
      fuelType,
      price,
      region,
      lastUpdated: new Date().toISOString(),
      source: 'manual' // Indicar que es un precio de fallback
    };
  },

  /**
   * Limpiar cache de precios (útil para testing o forzar actualización)
   */
  clearCache: (): void => {
    Object.keys(priceCache).forEach(key => {
      delete priceCache[key];
    });
    console.log('Cache de precios de combustible limpiado');
  },

  /**
   * Obtener información del cache actual (para debugging)
   */
  getCacheInfo: (): { key: string; region: string; fuelType: string; age: number }[] => {
    const now = Date.now();
    return Object.entries(priceCache).map(([key, cached]) => {
      const [fuelType, region] = key.split('_');
      return {
        key,
        region,
        fuelType,
        age: now - cached.timestamp
      };
    });
  },

  /**
   * Validar si un precio está dentro de rangos esperados
   */
  isValidPrice: (price: number, fuelType: FuelType): boolean => {
    const expectedRanges: Record<FuelType, { min: number; max: number }> = {
      [FuelType.GASOLINA_93]: { min: 700, max: 1200 },
      [FuelType.GASOLINA_95]: { min: 720, max: 1220 },
      [FuelType.GASOLINA_97]: { min: 750, max: 1250 },
      [FuelType.DIESEL]: { min: 650, max: 1000 }
    };

    const range = expectedRanges[fuelType];
    return price >= range.min && price <= range.max;
  },

  /**
   * Obtener precio manual (para casos donde el usuario ingresa un precio específico)
   */
  createManualPrice: (fuelType: FuelType, price: number, region: string): FuelPrice => {
    if (!cneService.isValidPrice(price, fuelType)) {
      throw new Error(`Precio ${price} fuera del rango esperado para ${fuelType}`);
    }

    return {
      fuelType,
      price,
      region,
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };
  }
};

export default cneService;