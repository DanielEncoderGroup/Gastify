import React, { useEffect, useState } from 'react';

interface GoogleMapsTestProps {
  className?: string;
}

/**
 * Componente de prueba para verificar el estado de Google Maps API
 */
export const GoogleMapsTest: React.FC<GoogleMapsTestProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verificando Google Maps API...');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        // Verificar si la API key está configurada
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!key) {
          setStatus('error');
          setMessage('❌ API Key de Google Maps no está configurada en las variables de entorno');
          return;
        }

        setApiKey(key.substring(0, 10) + '...' + key.substring(key.length - 5));

        // Verificar si Google Maps ya está cargado
        if (window.google && window.google.maps) {
          setStatus('success');
          setMessage('✅ Google Maps API cargada correctamente');
          return;
        }

        // Intentar cargar Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&region=CL&language=es`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google && window.google.maps) {
            setStatus('success');
            setMessage('✅ Google Maps API cargada correctamente');
          } else {
            setStatus('error');
            setMessage('❌ Error: Google Maps no se pudo cargar correctamente');
          }
        };

        script.onerror = () => {
          setStatus('error');
          setMessage('❌ Error: No se pudo cargar el script de Google Maps. Verifica que la API key sea válida.');
        };

        document.head.appendChild(script);

        // Timeout para detectar si la carga toma demasiado tiempo
        setTimeout(() => {
          if (status === 'loading') {
            setStatus('error');
            setMessage('⏰ Timeout: La carga de Google Maps está tomando demasiado tiempo. Verifica tu conexión a internet.');
          }
        }, 10000);

      } catch (error) {
        console.error('Error testing Google Maps:', error);
        setStatus('error');
        setMessage(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    testGoogleMaps();
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className={`google-maps-test ${className}`}>
      <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{getIcon()}</span>
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-2">Estado de Google Maps API</h3>
            <p className="text-sm mb-3">{message}</p>
            
            {apiKey && (
              <div className="text-xs space-y-1">
                <div><strong>API Key:</strong> {apiKey}</div>
                <div><strong>Región:</strong> Chile (CL)</div>
                <div><strong>Idioma:</strong> Español (es)</div>
                <div><strong>Bibliotecas:</strong> places, geometry</div>
              </div>
            )}

            {status === 'success' && (
              <div className="mt-3 text-xs">
                <div className="font-medium mb-1">Servicios disponibles:</div>
                <ul className="space-y-1">
                  <li>🗺️ Mapas interactivos</li>
                  <li>📍 Geocodificación</li>
                  <li>🛣️ Directions API (rutas)</li>
                  <li>🔍 Places API (autocompletado)</li>
                </ul>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-3 text-xs">
                <div className="font-medium mb-1">Posibles soluciones:</div>
                <ul className="space-y-1">
                  <li>• Verifica que la API key sea válida</li>
                  <li>• Asegúrate de tener habilitadas las APIs necesarias en Google Cloud Console</li>
                  <li>• Revisa que no haya restricciones de dominio</li>
                  <li>• Verifica tu conexión a internet</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsTest;

// Extender el tipo Window para incluir google
declare global {
  interface Window {
    google: any;
  }
}