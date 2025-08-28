import { FuelPrice, FuelType } from '../types/fuel';

/**
 * Servicio para obtener precios de combustible desde la API del CNE Chile
 * Documentación: https://api.cne.cl
 */

interface CNETokenResponse {
  token: string;
}

interface CNEEstacion {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  region: string;
  lat: number;
  lng: number;
  precios: {
    gasolina_93?: number;
    gasolina_95?: number;
    gasolina_97?: number;
    diesel?: number;
  };
}

class CNEService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly baseUrl = 'https://api.cne.cl';
  
  // Credenciales del usuario (estas deberían estar en variables de entorno en producción)
  private readonly credentials = {
    email: 'daniel.eduardo1610@gmail.com',
    password: 'Daleleon1610.'
  };

  /**
   * Obtener token de acceso de la API CNE
   */
  private async getToken(): Promise<string> {
    // Verificar si tenemos un token válido
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/login?email=${this.credentials.email}&password=${this.credentials.password}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error en login CNE: ${response.status}`);
      }

      const data: CNETokenResponse = await response.json();
      this.token = data.token;
      
      // El token dura 1 hora según la documentación
      this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      
      console.log('🔐 Token CNE obtenido exitosamente');
      return this.token;

    } catch (error) {
      console.error('❌ Error obteniendo token CNE:', error);
      throw new Error('No se pudo autenticar con la API de CNE');
    }
  }

  /**
   * Obtener estaciones de servicio con precios
   */
  async getEstaciones(): Promise<CNEEstacion[]> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${this.baseUrl}/api/v4/estaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo estaciones: ${response.status}`);
      }

      const estaciones: CNEEstacion[] = await response.json();
      console.log(`📍 Obtenidas ${estaciones.length} estaciones de CNE`);
      
      return estaciones;

    } catch (error) {
      console.error('❌ Error obteniendo estaciones CNE:', error);
      throw error;
    }
  }

  /**
   * Obtener precios promedio por región
   */
  async getFuelPrices(region: string = 'Metropolitana'): Promise<Record<string, FuelPrice>> {
    try {
      const estaciones = await this.getEstaciones();
      
      // Filtrar estaciones por región
      const estacionesRegion = estaciones.filter(
        estacion => estacion.region.toLowerCase().includes(region.toLowerCase())
      );

      if (estacionesRegion.length === 0) {
        console.warn(`⚠️ No se encontraron estaciones en la región: ${region}`);
        return this.getFallbackPrices(region);
      }

      // Calcular precios promedio por tipo de combustible
      const precios: Record<string, FuelPrice> = {};

      const tiposCombustible = [
        { tipo: FuelType.GASOLINA_93, campo: 'gasolina_93' },
        { tipo: FuelType.GASOLINA_95, campo: 'gasolina_95' },
        { tipo: FuelType.GASOLINA_97, campo: 'gasolina_97' },
        { tipo: FuelType.DIESEL, campo: 'diesel' }
      ];

      for (const { tipo, campo } of tiposCombustible) {
        const preciosValidos = estacionesRegion
          .map(est => est.precios[campo as keyof typeof est.precios])
          .filter(precio => precio && precio > 0) as number[];

        if (preciosValidos.length > 0) {
          const promedio = preciosValidos.reduce((sum, precio) => sum + precio, 0) / preciosValidos.length;
          
          precios[tipo] = {
            fuelType: tipo,
            price: Math.round(promedio),
            region: region,
            lastUpdated: new Date().toISOString(),
            source: 'CNE'
          };
        }
      }

      console.log(`⛽ Precios CNE obtenidos para ${region}:`, precios);
      return precios;

    } catch (error) {
      console.error('❌ Error obteniendo precios CNE:', error);
      return this.getFallbackPrices(region);
    }
  }

  /**
   * Precios fallback cuando falla la API
   */
  private getFallbackPrices(region: string): Record<string, FuelPrice> {
    const fechaActual = new Date().toISOString();
    
    // Precios promedio estimados para Chile (actualizado 2024)
    return {
      [FuelType.GASOLINA_93]: {
        fuelType: FuelType.GASOLINA_93,
        price: 1450, // CLP por litro
        region: region,
        lastUpdated: fechaActual,
        source: 'manual'
      },
      [FuelType.GASOLINA_95]: {
        fuelType: FuelType.GASOLINA_95,
        price: 1520,
        region: region,
        lastUpdated: fechaActual,
        source: 'manual'
      },
      [FuelType.GASOLINA_97]: {
        fuelType: FuelType.GASOLINA_97,
        price: 1590,
        region: region,
        lastUpdated: fechaActual,
        source: 'manual'
      },
      [FuelType.DIESEL]: {
        fuelType: FuelType.DIESEL,
        price: 1380,
        region: region,
        lastUpdated: fechaActual,
        source: 'manual'
      }
    };
  }

  /**
   * Obtener precio específico de un combustible
   */
  async getFuelPrice(fuelType: FuelType, region: string = 'Metropolitana'): Promise<FuelPrice> {
    const precios = await this.getFuelPrices(region);
    
    if (precios[fuelType]) {
      return precios[fuelType];
    }

    // Fallback si no se encuentra el tipo específico
    return this.getFallbackPrices(region)[fuelType];
  }

  /**
   * Limpiar cache de token (para testing)
   */
  clearTokenCache(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

export const cneService = new CNEService();