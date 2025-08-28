import React, { useEffect, useRef } from 'react';
import { RouteData, Coordinates } from '../../types/fuel';
import { useGoogleMaps } from '@hooks/useGoogleMaps';
import { mapUtils } from '@utils/mapUtils';

interface RouteMapViewerProps {
  routeData: RouteData | null;
  loading?: boolean;
  error?: string | null;
  height?: string;
  showDetails?: boolean;
  onMapClick?: (coordinates: Coordinates) => void;
  className?: string;
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
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error: mapsError, initializeMap } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded && mapRef.current && !loading) {
      // Inicializar mapa
      const map = initializeMap(mapRef.current, {
        center: { lat: -33.4489, lng: -70.6693 }, // Santiago por defecto
        zoom: 10
      });

      if (map && routeData) {
        // Centrar en la ruta
        const bounds = mapUtils.getBounds([
          routeData.origin.coordinates,
          routeData.destination.coordinates
        ]);
        
        map.fitBounds({
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        });
      }
    }
  }, [isLoaded, initializeMap, routeData, loading]);

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