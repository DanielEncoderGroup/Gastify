import { Coordinates, GeolocationState } from '../types/fuel';

/**
 * Servicio para gestión de geolocalización del navegador
 * Proporciona funciones para obtener ubicación actual con manejo de errores y permisos
 */
export const geolocationService = {
  /**
   * Verificar si la geolocalización está soportada por el navegador
   */
  isGeolocationSupported: (): boolean => {
    return 'geolocation' in navigator;
  },

  /**
   * Verificar el estado de los permisos de geolocalización
   */
  checkGeolocationPermission: async (): Promise<PermissionState> => {
    try {
      if (!geolocationService.isGeolocationSupported()) {
        throw new Error('Geolocalización no soportada por el navegador');
      }

      // Verificar permisos si la API de permisos está disponible
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
      }

      // Fallback: asumir granted si no podemos verificar
      return 'granted';
    } catch (error) {
      console.error('Error verificando permisos de geolocalización:', error);
      return 'denied';
    }
  },

  /**
   * Obtener la posición actual del usuario
   */
  getCurrentPosition: async (options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  } = {}): Promise<{ coordinates: Coordinates; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!geolocationService.isGeolocationSupported()) {
        reject(new Error('Geolocalización no soportada por este navegador'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 300000, // 5 minutos
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          console.log('Ubicación obtenida:', coordinates);
          console.log('Precisión:', position.coords.accuracy, 'metros');

          resolve({
            coordinates,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Error obteniendo geolocalización:', error);
          
          let errorMessage = 'Error desconocido obteniendo ubicación';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permisos de geolocalización denegados';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado para obtener ubicación';
              break;
          }

          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  },

  /**
   * Monitorear cambios en la posición del usuario
   */
  watchPosition: (
    onSuccess: (coordinates: Coordinates, accuracy: number) => void,
    onError: (error: string) => void,
    options: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    } = {}
  ): number | null => {
    if (!geolocationService.isGeolocationSupported()) {
      onError('Geolocalización no soportada por este navegador');
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 600000, // 10 minutos
      ...options
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        onSuccess(coordinates, position.coords.accuracy);
      },
      (error) => {
        let errorMessage = 'Error desconocido monitoreando ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de geolocalización denegados';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado para obtener ubicación';
            break;
        }

        onError(errorMessage);
      },
      defaultOptions
    );

    return watchId;
  },

  /**
   * Detener el monitoreo de la posición
   */
  clearWatch: (watchId: number): void => {
    if (geolocationService.isGeolocationSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Calcular la distancia entre la posición actual y coordenadas dadas
   */
  getDistanceFromCurrentPosition: async (targetCoordinates: Coordinates): Promise<number> => {
    try {
      const { coordinates: currentPosition } = await geolocationService.getCurrentPosition();
      
      // Fórmula de Haversine para calcular distancia
      const R = 6371; // Radio de la Tierra en km
      const dLat = (targetCoordinates.lat - currentPosition.lat) * Math.PI / 180;
      const dLon = (targetCoordinates.lng - currentPosition.lng) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(currentPosition.lat * Math.PI / 180) * Math.cos(targetCoordinates.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return Math.round(distance * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      console.error('Error calculando distancia desde posición actual:', error);
      throw error;
    }
  },

  /**
   * Validar si las coordenadas están en territorio chileno
   */
  isLocationInChile: (coordinates: Coordinates): boolean => {
    // Límites aproximados de Chile continental e insular
    const chileBounds = {
      continental: {
        north: -17.5, // Región de Arica y Parinacota
        south: -56.0, // Región de Magallanes
        east: -66.0,  // Frontera con Argentina y Bolivia
        west: -81.0   // Océano Pacífico
      },
      // Isla de Pascua
      easterIsland: {
        north: -27.0,
        south: -27.2,
        east: -109.2,
        west: -109.5
      },
      // Juan Fernández
      juanFernandez: {
        north: -33.6,
        south: -33.8,
        east: -78.7,
        west: -81.0
      }
    };

    const { lat, lng } = coordinates;

    // Verificar Chile continental
    const inContinental = (
      lat >= chileBounds.continental.south &&
      lat <= chileBounds.continental.north &&
      lng >= chileBounds.continental.west &&
      lng <= chileBounds.continental.east
    );

    // Verificar Isla de Pascua
    const inEasterIsland = (
      lat >= chileBounds.easterIsland.south &&
      lat <= chileBounds.easterIsland.north &&
      lng >= chileBounds.easterIsland.west &&
      lng <= chileBounds.easterIsland.east
    );

    // Verificar Juan Fernández
    const inJuanFernandez = (
      lat >= chileBounds.juanFernandez.south &&
      lat <= chileBounds.juanFernandez.north &&
      lng >= chileBounds.juanFernandez.west &&
      lng <= chileBounds.juanFernandez.east
    );

    return inContinental || inEasterIsland || inJuanFernandez;
  },

  /**
   * Obtener información detallada del estado de geolocalización
   */
  getGeolocationState: async (): Promise<GeolocationState> => {
    const state: GeolocationState = {
      loading: false,
      error: null,
      currentPosition: null,
      accuracy: null
    };

    try {
      // Verificar soporte
      if (!geolocationService.isGeolocationSupported()) {
        state.error = 'Geolocalización no soportada por el navegador';
        return state;
      }

      // Verificar permisos
      const permission = await geolocationService.checkGeolocationPermission();
      if (permission === 'denied') {
        state.error = 'Permisos de geolocalización denegados';
        return state;
      }

      // Obtener posición
      state.loading = true;
      const position = await geolocationService.getCurrentPosition();
      
      state.loading = false;
      state.currentPosition = position.coordinates;
      state.accuracy = position.accuracy;

      // Validar ubicación en Chile
      if (!geolocationService.isLocationInChile(position.coordinates)) {
        state.error = 'La ubicación detectada está fuera del territorio chileno';
      }

    } catch (error) {
      state.loading = false;
      state.error = error instanceof Error ? error.message : 'Error obteniendo ubicación';
    }

    return state;
  },

  /**
   * Formatear coordenadas para mostrar al usuario
   */
  formatCoordinates: (coordinates: Coordinates): string => {
    const lat = Math.abs(coordinates.lat).toFixed(6);
    const lng = Math.abs(coordinates.lng).toFixed(6);
    const latDir = coordinates.lat >= 0 ? 'N' : 'S';
    const lngDir = coordinates.lng >= 0 ? 'E' : 'W';
    
    return `${lat}°${latDir}, ${lng}°${lngDir}`;
  },

  /**
   * Convertir coordenadas a formato DMS (Degrees, Minutes, Seconds)
   */
  coordinatesToDMS: (coordinates: Coordinates): { lat: string; lng: string } => {
    const convertToDMS = (decimal: number): string => {
      const absolute = Math.abs(decimal);
      const degrees = Math.floor(absolute);
      const minutesFloat = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = Math.round((minutesFloat - minutes) * 60);
      
      return `${degrees}° ${minutes}' ${seconds}"`;
    };

    const latDirection = coordinates.lat >= 0 ? 'N' : 'S';
    const lngDirection = coordinates.lng >= 0 ? 'E' : 'W';

    return {
      lat: `${convertToDMS(coordinates.lat)} ${latDirection}`,
      lng: `${convertToDMS(coordinates.lng)} ${lngDirection}`
    };
  }
};

export default geolocationService;