import { Coordinates } from '@types/fuel';

/**
 * Utilidades para manejo de mapas y geolocalización en Gastify
 */
export const mapUtils = {
  /**
   * Valida que las coordenadas estén dentro del territorio chileno
   */
  isWithinChile: (coordinates: Coordinates): boolean => {
    const { lat, lng } = coordinates;
    
    // Límites aproximados de Chile continental
    // Latitud: -17.5 (norte) a -55.9 (sur)
    // Longitud: -109.4 (oeste) a -66.4 (este)
    const isLatValid = lat >= -56 && lat <= -17;
    const isLngValid = lng >= -110 && lng <= -66;
    
    return isLatValid && isLngValid;
  },

  /**
   * Calcula la distancia entre dos puntos usando fórmula Haversine (en km)
   */
  calculateDistance: (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = mapUtils.toRadians(coord2.lat - coord1.lat);
    const dLng = mapUtils.toRadians(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(mapUtils.toRadians(coord1.lat)) * 
      Math.cos(mapUtils.toRadians(coord2.lat)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  },

  /**
   * Convierte grados a radianes
   */
  toRadians: (degrees: number): number => {
    return degrees * (Math.PI / 180);
  },

  /**
   * Convierte radianes a grados
   */
  toDegrees: (radians: number): number => {
    return radians * (180 / Math.PI);
  },

  /**
   * Formatea distancia con unidades apropiadas
   */
  formatDistance: (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    }
    return `${Math.round(distanceKm)} km`;
  },

  /**
   * Formatea duración en minutos a formato legible
   */
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  },

  /**
   * Obtiene el centro entre múltiples coordenadas
   */
  getCenterPoint: (coordinates: Coordinates[]): Coordinates => {
    if (coordinates.length === 0) {
      return { lat: -33.4489, lng: -70.6693 }; // Santiago por defecto
    }
    
    if (coordinates.length === 1) {
      return coordinates[0];
    }
    
    let totalLat = 0;
    let totalLng = 0;
    
    coordinates.forEach(coord => {
      totalLat += coord.lat;
      totalLng += coord.lng;
    });
    
    return {
      lat: totalLat / coordinates.length,
      lng: totalLng / coordinates.length
    };
  },

  /**
   * Calcula bounds que contengan todas las coordenadas
   */
  getBounds: (coordinates: Coordinates[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } => {
    if (coordinates.length === 0) {
      return { north: -33, south: -34, east: -70, west: -71 };
    }
    
    let north = coordinates[0].lat;
    let south = coordinates[0].lat;
    let east = coordinates[0].lng;
    let west = coordinates[0].lng;
    
    coordinates.forEach(coord => {
      north = Math.max(north, coord.lat);
      south = Math.min(south, coord.lat);
      east = Math.max(east, coord.lng);
      west = Math.min(west, coord.lng);
    });
    
    // Agregar un pequeño padding
    const latPadding = (north - south) * 0.1 || 0.01;
    const lngPadding = (east - west) * 0.1 || 0.01;
    
    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  },

  /**
   * Valida que dos coordenadas sean suficientemente diferentes
   */
  areCoordinatesDifferent: (coord1: Coordinates, coord2: Coordinates, minDistanceKm: number = 0.1): boolean => {
    const distance = mapUtils.calculateDistance(coord1, coord2);
    return distance >= minDistanceKm;
  },

  /**
   * Determina la región chilena aproximada basada en coordenadas
   */
  getChileanRegion: (coordinates: Coordinates): string => {
    const { lat } = coordinates;
    
    if (lat > -18.5) return 'Arica y Parinacota';
    if (lat > -21.4) return 'Tarapacá';
    if (lat > -26.1) return 'Antofagasta';
    if (lat > -29.1) return 'Atacama';
    if (lat > -32.2) return 'Coquimbo';
    if (lat > -34.2) return 'Valparaíso';
    if (lat > -35.0) return 'Región Metropolitana';
    if (lat > -36.0) return 'O\'Higgins';
    if (lat > -36.5) return 'Maule';
    if (lat > -38.5) return 'Ñuble';
    if (lat > -39.4) return 'Biobío';
    if (lat > -40.6) return 'Araucanía';
    if (lat > -44.0) return 'Los Ríos';
    if (lat > -46.0) return 'Los Lagos';
    if (lat > -49.0) return 'Aysén';
    return 'Magallanes';
  },

  /**
   * Valida que la distancia sea razonable para un viaje de trabajo
   */
  isReasonableDistance: (distanceKm: number): {
    isReasonable: boolean;
    warning?: string;
  } => {
    if (distanceKm <= 0) {
      return { isReasonable: false, warning: 'La distancia debe ser mayor a 0' };
    }
    
    if (distanceKm < 0.5) {
      return { isReasonable: false, warning: 'La distancia es muy corta para justificar gasto de combustible' };
    }
    
    if (distanceKm > 1000) {
      return { isReasonable: false, warning: 'La distancia parece excesiva para un viaje de trabajo' };
    }
    
    if (distanceKm > 500) {
      return { isReasonable: true, warning: 'Distancia larga - considere si es necesario para el trabajo' };
    }
    
    return { isReasonable: true };
  },

  /**
   * Genera una URL de Google Maps para la ruta
   */
  generateGoogleMapsUrl: (origin: Coordinates, destination: Coordinates): string => {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    
    return `${baseUrl}${originStr}/${destinationStr}`;
  },

  /**
   * Estima el tiempo de viaje basado en distancia (aproximación simple)
   */
  estimateTravelTime: (distanceKm: number): number => {
    // Velocidad promedio estimada en Chile (considerando ciudad y carretera)
    let avgSpeedKmh = 45; // km/h promedio
    
    if (distanceKm > 100) {
      avgSpeedKmh = 65; // Velocidad mayor en carreteras largas
    } else if (distanceKm < 10) {
      avgSpeedKmh = 25; // Velocidad menor en ciudad
    }
    
    return (distanceKm / avgSpeedKmh) * 60; // Convertir a minutos
  },

  /**
   * Determina el nivel de zoom apropiado para mostrar una ruta
   */
  getAppropriateZoom: (distanceKm: number): number => {
    if (distanceKm < 1) return 15;
    if (distanceKm < 5) return 13;
    if (distanceKm < 20) return 11;
    if (distanceKm < 100) return 9;
    if (distanceKm < 500) return 7;
    return 6;
  }
};

export default mapUtils;