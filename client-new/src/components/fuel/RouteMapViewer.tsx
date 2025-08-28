import React, { useEffect, useRef, useCallback } from 'react';
import { RouteData, Coordinates } from '@types/fuel';
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
 * Componente para visualizar rutas en Google Maps
 * Muestra origen, destino y la ruta calculada
 */
export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  routeData,
  loading = false,
  error = null,
  height = '400px',
  showDetails = true,
  onMapClick,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    isLoaded,
    loadError,
    createMap,
    addMarker,
    displayRoute,
    clearAllMarkers,
    clearRoute,
    fitBounds,
    centerMap
  } = useGoogleMaps();

  // Crear mapa cuando Google Maps esté cargado
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || loadError) return;

    const defaultCenter: Coordinates = {
      lat: -33.4489, // Santiago, Chile
      lng: -70.6693
    };

    const map = createMap(mapContainerRef.current, {
      center: routeData?.origin.coordinates || defaultCenter,
      zoom: routeData ? 10 : 12,
      mapTypeId: 'roadmap',
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });

    // Agregar listener para clicks en el mapa
    if (map && onMapClick) {
      const clickListener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const coordinates: Coordinates = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          onMapClick(coordinates);
        }
      });

      return () => {
        google.maps.event.removeListener(clickListener);
      };
    }
  }, [isLoaded, loadError, createMap, routeData, onMapClick]);

  // Actualizar mapa cuando cambie la ruta
  useEffect(() => {
    if (!isLoaded || !routeData) return;

    // Limpiar marcadores y rutas anteriores
    clearAllMarkers();
    clearRoute();

    // Agregar marcadores de origen y destino
    addMarker({
      id: 'origin',
      position: routeData.origin.coordinates,
      title: `Origen: ${routeData.origin.address}`,
      type: 'origin'
    });

    addMarker({
      id: 'destination',
      position: routeData.destination.coordinates,
      title: `Destino: ${routeData.destination.address}`,
      type: 'destination'
    });

    // Mostrar ruta
    displayRoute({
      origin: routeData.origin.coordinates,
      destination: routeData.destination.coordinates,
      strokeColor: '#4285f4',
      strokeWeight: 5
    });

    // Ajustar vista para mostrar toda la ruta
    const coordinates = [routeData.origin.coordinates, routeData.destination.coordinates];
    fitBounds(coordinates);
  }, [
    isLoaded,
    routeData,
    addMarker,
    displayRoute,
    clearAllMarkers,
    clearRoute,
    fitBounds
  ]);

  const handleCenterOnOrigin = useCallback(() => {
    if (routeData?.origin.coordinates) {
      centerMap(routeData.origin.coordinates, 15);
    }
  }, [routeData, centerMap]);

  const handleCenterOnDestination = useCallback(() => {
    if (routeData?.destination.coordinates) {
      centerMap(routeData.destination.coordinates, 15);
    }
  }, [routeData, centerMap]);

  const handleFitRoute = useCallback(() => {
    if (routeData) {
      fitBounds([routeData.origin.coordinates, routeData.destination.coordinates]);
    }
  }, [routeData, fitBounds]);

  if (loadError) {
    return (
      <div className={`route-map-viewer ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" style={{ height }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-red-600 text-3xl block mb-2">🗺️</span>
              <h3 className="text-sm font-medium text-red-800 mb-1">Error cargando mapa</h3>
              <p className="text-sm text-red-700">{loadError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className={`route-map-viewer ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ height }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                {loading ? 'Cargando ruta...' : 'Cargando mapa...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`route-map-viewer ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" style={{ height }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-red-600 text-3xl block mb-2">⚠️</span>
              <h3 className="text-sm font-medium text-red-800 mb-1">Error en la ruta</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`route-map-viewer ${className}`}>
      {/* Controles del mapa */}
      {routeData && (
        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCenterOnOrigin}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            🔴 Ver Origen
          </button>
          
          <button
            type="button"
            onClick={handleCenterOnDestination}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            🟢 Ver Destino
          </button>
          
          <button
            type="button"
            onClick={handleFitRoute}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            🗺️ Ver Ruta Completa
          </button>
        </div>
      )}

      {/* Container del mapa */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div
          ref={mapContainerRef}
          style={{ height }}
          className="w-full bg-gray-100"
          data-testid="map-container"
        />

        {/* Overlay cuando no hay ruta */}
        {!routeData && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <span className="text-gray-400 text-4xl block mb-2">🛣️</span>
              <p className="text-sm text-gray-600">
                Selecciona origen y destino para ver la ruta
              </p>
              {onMapClick && (
                <p className="text-xs text-gray-500 mt-1">
                  Haz clic en el mapa para seleccionar ubicaciones
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detalles de la ruta */}
      {showDetails && routeData && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <span className="text-blue-600 mr-1">ℹ️</span>
            Información de la Ruta
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex justify-between md:block">
              <span className="text-gray-600">Distancia:</span>
              <span className="font-medium text-gray-900 md:block">
                {mapUtils.formatDistance(routeData.distance)}
              </span>
            </div>

            <div className="flex justify-between md:block">
              <span className="text-gray-600">Duración:</span>
              <span className="font-medium text-gray-900 md:block">
                {mapUtils.formatDuration(routeData.duration)}
              </span>
            </div>

            <div className="flex justify-between md:block">
              <span className="text-gray-600">Velocidad promedio:</span>
              <span className="font-medium text-gray-900 md:block">
                {Math.round((routeData.distance / (routeData.duration / 60)))} km/h
              </span>
            </div>
          </div>

          {/* Direcciones */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2 text-xs">
              <div className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">🔴</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-700">Origen:</span>
                  <p className="text-gray-600 mt-0.5">{routeData.origin.address}</p>
                  <p className="text-gray-500">
                    {mapUtils.formatCoordinates(routeData.origin.coordinates, 4)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-blue-600 mr-2 mt-0.5">🟢</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-700">Destino:</span>
                  <p className="text-gray-600 mt-0.5">{routeData.destination.address}</p>
                  <p className="text-gray-500">
                    {mapUtils.formatCoordinates(routeData.destination.coordinates, 4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Validación de ruta */}
          {(() => {
            const validation = mapUtils.isReasonableRoute(routeData.distance);
            if (validation.reason) {
              return (
                <div className={`mt-2 p-2 rounded text-xs ${
                  validation.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  validation.severity === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <span className="mr-1">
                    {validation.severity === 'error' ? '❌' : 
                     validation.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  {validation.reason}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

export default RouteMapViewer;