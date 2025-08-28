import { useState, useEffect, useCallback } from 'react';
import { Coordinates, GoogleMapsConfig } from '@types/fuel';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  error: string | null;
  maps: typeof google.maps | null;
  initializeMap: (container: HTMLElement, options?: google.maps.MapOptions) => google.maps.Map | null;
  createMarker: (map: google.maps.Map, position: Coordinates, options?: google.maps.MarkerOptions) => google.maps.Marker | null;
  drawRoute: (map: google.maps.Map, route: google.maps.DirectionsResult) => void;
  clearMap: (map: google.maps.Map) => void;
}

/**
 * Hook para integración con Google Maps API
 */
export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maps, setMaps] = useState<typeof google.maps | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Configuración de Google Maps
  const config: GoogleMapsConfig = {
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    region: 'CL',
    language: 'es',
    libraries: ['places', 'geometry']
  };

  // Cargar Google Maps API
  useEffect(() => {
    if (!config.apiKey) {
      setError('API key de Google Maps no configurada');
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      setMaps(window.google.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=${config.libraries.join(',')}&region=${config.region}&language=${config.language}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setMaps(window.google.maps);
        setError(null);
      } else {
        setError('Error cargando Google Maps');
      }
    };

    script.onerror = () => {
      setError('Error cargando script de Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [config.apiKey]);

  // Inicializar mapa
  const initializeMap = useCallback((container: HTMLElement, options?: google.maps.MapOptions): google.maps.Map | null => {
    if (!isLoaded || !maps) {
      console.warn('Google Maps no está cargado');
      return null;
    }

    try {
      const defaultOptions: google.maps.MapOptions = {
        center: { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile
        zoom: 10,
        mapTypeId: maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        ...options
      };

      const map = new maps.Map(container, defaultOptions);
      
      // Crear DirectionsRenderer para rutas
      if (!directionsRenderer) {
        const renderer = new maps.DirectionsRenderer({
          suppressMarkers: false,
          draggable: false,
          polylineOptions: {
            strokeColor: '#4285F4',
            strokeOpacity: 1.0,
            strokeWeight: 4
          }
        });
        renderer.setMap(map);
        setDirectionsRenderer(renderer);
      }

      return map;
    } catch (err) {
      console.error('Error inicializando mapa:', err);
      setError('Error inicializando mapa');
      return null;
    }
  }, [isLoaded, maps, directionsRenderer]);

  // Crear marcador
  const createMarker = useCallback((
    map: google.maps.Map, 
    position: Coordinates, 
    options?: google.maps.MarkerOptions
  ): google.maps.Marker | null => {
    if (!isLoaded || !maps) {
      console.warn('Google Maps no está cargado');
      return null;
    }

    try {
      const defaultOptions: google.maps.MarkerOptions = {
        position: { lat: position.lat, lng: position.lng },
        map,
        animation: maps.Animation.DROP,
        ...options
      };

      return new maps.Marker(defaultOptions);
    } catch (err) {
      console.error('Error creando marcador:', err);
      return null;
    }
  }, [isLoaded, maps]);

  // Dibujar ruta
  const drawRoute = useCallback((map: google.maps.Map, route: google.maps.DirectionsResult): void => {
    if (!isLoaded || !maps || !directionsRenderer) {
      console.warn('Google Maps o DirectionsRenderer no está cargado');
      return;
    }

    try {
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(route);
    } catch (err) {
      console.error('Error dibujando ruta:', err);
      setError('Error dibujando ruta');
    }
  }, [isLoaded, maps, directionsRenderer]);

  // Limpiar mapa
  const clearMap = useCallback((map: google.maps.Map): void => {
    if (!isLoaded || !maps) {
      console.warn('Google Maps no está cargado');
      return;
    }

    try {
      // Limpiar DirectionsRenderer
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] } as any);
      }
    } catch (err) {
      console.error('Error limpiando mapa:', err);
    }
  }, [isLoaded, maps, directionsRenderer]);

  return {
    isLoaded,
    error,
    maps,
    initializeMap,
    createMarker,
    drawRoute,
    clearMap
  };
};

// Extender el tipo Window para incluir google
declare global {
  interface Window {
    google: typeof google;
  }
}

export default useGoogleMaps;