import { useState, useEffect, useCallback, useRef } from 'react';
import { FuelPrice, FuelType } from '../types/fuel';
import { fixedFuelPricesService } from '../services/fixedFuelPricesService';

/**
 * Hook personalizado para gestión de precios de combustible
 * Proporciona precios actualizados desde CNE con cache y refrescado automático
 */
export const useFuelPrices = () => {
  const [prices, setPrices] = useState<Record<string, FuelPrice>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Referencia para interval de actualización automática
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Generar clave para el cache de precios
   */
  const getPriceKey = useCallback((fuelType: FuelType, region: string): string => {
    return `${fuelType}_${region}`;
  }, []);

  /**
   * Obtener precio de un combustible específico
   */
  const getFuelPrice = useCallback(async (
    fuelType: FuelType,
    region: string = 'Metropolitana'
  ): Promise<FuelPrice | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const priceKey = getPriceKey(fuelType, region);
      
      // Verificar si ya tenemos el precio en cache y es reciente
      const cachedPrice = prices[priceKey];
      if (cachedPrice) {
        const cacheAge = Date.now() - new Date(cachedPrice.lastUpdated).getTime();
        const oneHour = 60 * 60 * 1000; // 1 hora en millisegundos
        
        if (cacheAge < oneHour) {
          console.log('Usando precio desde cache:', priceKey);
          return cachedPrice;
        }
      }

      console.log('Obteniendo precio actualizado desde precios fijos:', priceKey);
      const price = await fixedFuelPricesService.getFuelPrice(fuelType, region);
      
      // Actualizar cache
      setPrices(prev => ({
        ...prev,
        [priceKey]: price
      }));
      
      setLastUpdated(new Date());
      return price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo precio de combustible';
      setError(errorMessage);
      console.error('Error fetching fuel price:', err);
      
      // Intentar devolver precio de cache si existe, aunque sea antiguo
      const priceKey = getPriceKey(fuelType, region);
      const cachedPrice = prices[priceKey];
      if (cachedPrice) {
        console.warn('Devolviendo precio de cache debido a error:', priceKey);
        return cachedPrice;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [prices, getPriceKey]);

  /**
   * Obtener precios de todos los combustibles para una región
   */
  const getAllPricesForRegion = useCallback(async (region: string = 'Metropolitana'): Promise<FuelPrice[]> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo todos los precios para región:', region);
      
      // Cancelar operación anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const fuelTypes = Object.values(FuelType);
      const pricesPromises = fuelTypes.map(fuelType => 
        fixedFuelPricesService.getFuelPrice(fuelType, region)
      );
      
      const fetchedPrices = await Promise.all(pricesPromises);
      
      // Verificar si fue cancelado
      if (abortControllerRef.current.signal.aborted) {
        return [];
      }
      
      // Actualizar cache con todos los precios
      const newPricesCache: Record<string, FuelPrice> = {};
      fetchedPrices.forEach(price => {
        const key = getPriceKey((price as any).fuelType, (price as any).region);
        newPricesCache[key] = price;
      });
      
      setPrices(prev => ({ ...prev, ...newPricesCache }));
      setLastUpdated(new Date());
      
      return fetchedPrices;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Operación de precios cancelada');
        return [];
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo precios de combustible';
      setError(errorMessage);
      console.error('Error fetching all fuel prices:', err);
      return [];
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [getPriceKey]);

  /**
   * Refrescar precio específico (forzar actualización)
   */
  const refreshPrice = useCallback(async (fuelType: FuelType, region: string = 'Metropolitana'): Promise<FuelPrice | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpiar cache para este precio específico
      const priceKey = getPriceKey(fuelType, region);
      setPrices(prev => {
        const { [priceKey]: removed, ...rest } = prev;
        return rest;
      });
      
      // Limpiar cache del servicio también
      fixedFuelPricesService.clearTokenCache();
      
      // Obtener precio fresco
      const freshPrice = await fixedFuelPricesService.getFuelPrice(fuelType, region);
      
      // Actualizar estado
      setPrices(prev => ({
        ...prev,
        [priceKey]: freshPrice
      }));
      
      setLastUpdated(new Date());
      return freshPrice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error refrescando precio';
      setError(errorMessage);
      console.error('Error refreshing price:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getPriceKey]);

  /**
   * Refrescar todos los precios
   */
  const refreshAllPrices = useCallback(async (region: string = 'Metropolitana'): Promise<void> => {
    try {
      // Limpiar cache completo
      fixedFuelPricesService.clearTokenCache();
      setPrices({});
      
      // Obtener precios frescos
      await getAllPricesForRegion(region);
    } catch (err) {
      console.error('Error refreshing all prices:', err);
    }
  }, [getAllPricesForRegion]);

  /**
   * Comparar precios entre regiones
   */
  const comparePricesByRegion = useCallback(async (
    fuelType: FuelType,
    regions: string[]
  ): Promise<Array<{
    region: string;
    price: FuelPrice | null;
    error?: string;
  }>> => {
    try {
      setLoading(true);
      setError(null);
      
      const comparisons = await Promise.allSettled(
        regions.map(async (region) => {
          const price = await fixedFuelPricesService.getFuelPrice(fuelType, region);
          return { region, price };
        })
      );

      return comparisons.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            region: regions[index],
            price: null,
            error: result.reason?.message || 'Error obteniendo precio'
          };
        }
      });
    } catch (err) {
      console.error('Error comparing prices by region:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener precio más económico para un tipo de combustible
   */
  const getCheapestPrice = useCallback((fuelType: FuelType): {
    price: FuelPrice | null;
    region: string | null;
  } => {
    const relevantPrices = Object.values(prices).filter(price => price.fuelType === fuelType);
    
    if (relevantPrices.length === 0) {
      return { price: null, region: null };
    }

    const cheapest = relevantPrices.reduce((prev, current) => 
      current.price < prev.price ? current : prev
    );

    return { price: cheapest, region: cheapest.region };
  }, [prices]);

  /**
   * Configurar actualización automática de precios
   */
  const startAutoRefresh = useCallback((intervalMinutes: number = 60, region: string = 'Metropolitana') => {
    // Limpiar interval anterior si existe
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Configurar nuevo interval
    refreshIntervalRef.current = setInterval(() => {
      console.log('Actualización automática de precios...');
      getAllPricesForRegion(region).catch(err => {
        console.error('Error en actualización automática:', err);
      });
    }, intervalMinutes * 60 * 1000);

    console.log(`Actualización automática configurada cada ${intervalMinutes} minutos`);
  }, [getAllPricesForRegion]);

  /**
   * Detener actualización automática
   */
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log('Actualización automática detenida');
    }
  }, []);

  /**
   * Obtener información del estado del cache
   */
  const getCacheInfo = useCallback((): {
    totalPrices: number;
    regions: string[];
    fuelTypes: FuelType[];
    oldestPrice: Date | null;
    newestPrice: Date | null;
  } => {
    const priceList = Object.values(prices);
    const regions = Array.from(new Set(priceList.map(p => p.region)));
    const fuelTypes = Array.from(new Set(priceList.map(p => p.fuelType)));
    
    const dates = priceList.map(p => new Date(p.lastUpdated));
    const oldestPrice = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const newestPrice = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    return {
      totalPrices: priceList.length,
      regions,
      fuelTypes,
      oldestPrice,
      newestPrice
    };
  }, [prices]);

  /**
   * Validar si un precio está actualizado
   */
  const isPriceUpToDate = useCallback((fuelType: FuelType, region: string, maxAgeHours: number = 1): boolean => {
    const priceKey = getPriceKey(fuelType, region);
    const price = prices[priceKey];
    
    if (!price) return false;
    
    const ageHours = (Date.now() - new Date(price.lastUpdated).getTime()) / (1000 * 60 * 60);
    return ageHours <= maxAgeHours;
  }, [prices, getPriceKey]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopAutoRefresh]);

  // Cargar precios iniciales para región metropolitana
  useEffect(() => {
    getAllPricesForRegion('Metropolitana').catch(err => {
      console.error('Error cargando precios iniciales:', err);
    });
  }, [getAllPricesForRegion]);

  return {
    // Estado
    prices,
    loading,
    error,
    lastUpdated,
    
    // Funciones principales
    getFuelPrice,
    getAllPricesForRegion,
    refreshPrice,
    refreshAllPrices,
    
    // Comparaciones y análisis
    comparePricesByRegion,
    getCheapestPrice,
    
    // Control de actualización automática
    startAutoRefresh,
    stopAutoRefresh,
    
    // Utilidades
    clearError,
    getCacheInfo,
    isPriceUpToDate,
    
    // Propiedades computadas
    hasPrices: Object.keys(prices).length > 0,
    priceCount: Object.keys(prices).length,
    
    // Acceso directo a precios comunes (para conveniencia)
    getGasolina93Price: (region = 'Metropolitana') => getFuelPrice(FuelType.GASOLINA_93, region),
    getGasolina95Price: (region = 'Metropolitana') => getFuelPrice(FuelType.GASOLINA_95, region),
    getGasolina97Price: (region = 'Metropolitana') => getFuelPrice(FuelType.GASOLINA_97, region),
    getDieselPrice: (region = 'Metropolitana') => getFuelPrice(FuelType.DIESEL, region)
  };
};

export default useFuelPrices;