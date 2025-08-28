import React, { useEffect, useRef, useState } from 'react';
import { RouteData, Coordinates } from '../../types/fuel';
import { useGoogleMaps } from '@hooks/useGoogleMaps';
import { mapUtils } from '@utils/mapUtils';
import '../../types/google-maps.d.ts';

interface RouteMapViewerProps {
  routeData: RouteData | null;
  loading?: boolean;
  error?: string | null;
  height?: string;
  showDetails?: boolean;
  onMapClick?: (coordinates: Coordinates) => void;
  className?: string;
  // Nuevas props para marcadores individuales
  originCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  showMarkers?: boolean;
  showRoute?: boolean;
}

/**
 * Componente para visualizar mapas con rutas de Google Maps
 */
export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  routeData,
  loading = false,
  error = null,
  height = '400px',
  showDetails = true,
  className = '',
  originCoordinates,
  destinationCoordinates,
  showMarkers = true,
  showRoute = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const { isLoaded, error: mapsError, initializeMap } = useGoogleMaps();

  // Limpiar marcadores existentes
  const clearMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  };

  // Crear marcador
  const createMarker = (position: Coordinates, title: string, icon?: string) => {
    if (!map || !window.google) return null;

    const marker = new window.google.maps.Marker({
      position,
      map,
      title,
      icon: icon || undefined,
      animation: window.google.maps.Animation.DROP
    });

    return marker;
  };

  // Actualizar marcadores
  const updateMarkers = () => {
    if (!map || !isLoaded || !showMarkers) return;

    clearMarkers();
    const newMarkers: any[] = [];

    // Marcador de origen
    if (originCoordinates) {
      const originMarker = createMarker(
        originCoordinates,
        'Origen',
        'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%2300a650"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E'
      );
      if (originMarker) newMarkers.push(originMarker);
    }

    // Marcador de destino
    if (destinationCoordinates) {
      const destinationMarker = createMarker(
        destinationCoordinates,
        'Destino',
        'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23ea4335"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E'
      );
      if (destinationMarker) newMarkers.push(destinationMarker);
    }

    setMarkers(newMarkers);

    // Ajustar vista para mostrar todos los marcadores
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    }
  };

  // Mostrar ruta usando Directions API
  const displayRoute = () => {
    if (!map || !isLoaded || !showRoute || !originCoordinates || !destinationCoordinates || !window.google) return;

    // Crear DirectionsService y DirectionsRenderer si no existen
    if (!directionsRenderer) {
      const renderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: showMarkers, // Suprimir marcadores si ya los estamos mostrando
        polylineOptions: {
          strokeColor: '#1976d2',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      renderer.setMap(map);
      setDirectionsRenderer(renderer);

      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route({
        origin: originCoordinates,
        destination: destinationCoordinates,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      }, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result);
        } else {
          console.error('Error obteniendo direcciones:', status);
        }
      });
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (isLoaded && mapRef.current && !loading) {
      const newMap = initializeMap(mapRef.current, {
        center: { lat: -33.4489, lng: -70.6693 }, // Santiago por defecto
        zoom: 10
      });

      setMap(newMap);

      // Si hay routeData completa, ajustar vista
      if (newMap && routeData) {
        const bounds = mapUtils.getBounds([
          routeData.origin.coordinates,
          routeData.destination.coordinates
        ]);
        
        newMap.fitBounds({
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        });
      }
    }
  }, [isLoaded, initializeMap, loading]);

  // Actualizar marcadores cuando cambien las coordenadas
  useEffect(() => {
    updateMarkers();
  }, [map, originCoordinates, destinationCoordinates, showMarkers]);

  // Mostrar ruta cuando cambien las coordenadas o la configuración
  useEffect(() => {
    if (showRoute && originCoordinates && destinationCoordinates) {
      displayRoute();
    }
  }, [map, originCoordinates, destinationCoordinates, showRoute, isLoaded, directionsRenderer]);

  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || mapsError) {
    return (
      <div className={`border border-red-200 rounded-lg bg-red-50 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <span className="text-red-600 text-2xl block mb-2">❌</span>
            <p className="text-sm text-red-700">Error: {error || mapsError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <span className="text-gray-400 text-2xl block mb-2">🗺️</span>
            <p className="text-sm text-gray-600">Cargando Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%' }} />
      
      {showDetails && routeData && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium text-gray-900">Origen:</span>
              <p className="text-gray-600 truncate">{routeData.origin.address}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Destino:</span>
              <p className="text-gray-600 truncate">{routeData.destination.address}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Distancia:</span> {mapUtils.formatDistance(routeData.distance)}
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Duración:</span> {mapUtils.formatDuration(routeData.duration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMapViewer;