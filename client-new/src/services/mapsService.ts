import { Coordinates, Location, RouteData } from '@types/fuel';

// Configuración de Google Maps desde variables de entorno
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY no está configurada');
}

/**
 * Servicio para interacción con Google Maps API
 * Maneja geocodificación, cálculo de rutas y validaciones geográficas
 */
export const mapsService = {
  /**
   * Inicializar Google Maps con configuración específica para Chile
   */
  initializeGoogleMaps: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.google !== 'undefined' && window.google.maps) {
        resolve();
        return;
      }

      if (!GOOGLE_MAPS_API_KEY) {
        reject(new Error('Google Maps API Key no está configurada'));
        return;
      }

      // Crear y cargar script de Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&region=CL&language=es`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API cargada exitosamente');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error cargando Google Maps API:', error);
        reject(new Error('Error al cargar Google Maps API'));
      };

      document.head.appendChild(script);
    });
  },

  /**
   * Geocodificar una dirección a coordenadas
   */
  geocodeAddress: async (address: string): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps API no está cargada'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        { 
          address,
          region: 'CL', // Bias hacia Chile
          componentRestrictions: { country: 'CL' } // Restringir a Chile
        },
        (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            const location = result.geometry.location;
            
            // Extraer componentes de dirección
            const addressComponents = result.address_components;
            let city = '';
            let region = '';
            let country = '';

            addressComponents.forEach((component) => {
              const types = component.types;
              
              if (types.includes('locality') || types.includes('administrative_area_level_3')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                region = component.long_name;
              } else if (types.includes('country')) {
                country = component.long_name;
              }
            });

            const locationData: Location = {
              coordinates: {
                lat: location.lat(),
                lng: location.lng()
              },
              address: result.formatted_address,
              city: city || 'No especificada',
              region: region || 'No especificada',
              country: country || 'Chile'
            };

            // Validar que esté en Chile
            if (!mapsService.isLocationInChile(locationData.coordinates)) {
              reject(new Error('La dirección debe estar ubicada en Chile'));
              return;
            }

            resolve(locationData);
          } else {
            console.error('Geocoding error:', status);
            reject(new Error('No se pudo encontrar la dirección especificada'));
          }
        }
      );
    });
  },

  /**
   * Geocodificar coordenadas a dirección (reverse geocoding)
   */
  reverseGeocode: async (coordinates: Coordinates): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps API no está cargada'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const latLng = new window.google.maps.LatLng(coordinates.lat, coordinates.lng);
      
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let city = '';
          let region = '';
          let country = '';

          addressComponents.forEach((component) => {
            const types = component.types;
            
            if (types.includes('locality') || types.includes('administrative_area_level_3')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              region = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          });

          const locationData: Location = {
            coordinates,
            address: result.formatted_address,
            city: city || 'No especificada',
            region: region || 'No especificada',
            country: country || 'Chile'
          };

          resolve(locationData);
        } else {
          console.error('Reverse geocoding error:', status);
          reject(new Error('No se pudo obtener la dirección de las coordenadas'));
        }
      });
    });
  },

  /**
   * Calcular ruta entre dos puntos usando Directions API
   */
  calculateRoute: async (origin: Coordinates, destination: Coordinates): Promise<RouteData> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps API no está cargada'));
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();

      const request: google.maps.DirectionsRequest = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        region: 'CL',
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, async (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];

          try {
            // Geocodificar origen y destino para obtener información completa
            const [originLocation, destinationLocation] = await Promise.all([
              mapsService.reverseGeocode(origin),
              mapsService.reverseGeocode(destination)
            ]);

            const routeData: RouteData = {
              origin: originLocation,
              destination: destinationLocation,
              distance: leg.distance.value / 1000, // Convertir metros a kilómetros
              duration: Math.round(leg.duration.value / 60), // Convertir segundos a minutos
              polyline: route.overview_polyline,
              tollCost: 0 // TODO: Implementar cálculo de peajes si es necesario
            };

            resolve(routeData);
          } catch (geocodingError) {
            console.error('Error en geocodificación durante cálculo de ruta:', geocodingError);
            reject(new Error('Error procesando la información de la ruta'));
          }
        } else {
          console.error('Directions service error:', status);
          reject(new Error('No se pudo calcular la ruta entre los puntos especificados'));
        }
      });
    });
  },

  /**
   * Validar si una coordenada está dentro de los límites de Chile
   */
  isLocationInChile: (coordinates: Coordinates): boolean => {
    // Límites aproximados de Chile continental
    const chileBounds = {
      north: -17.5, // Región de Arica y Parinacota
      south: -56.0, // Región de Magallanes
      east: -66.0,  // Frontera con Argentina y Bolivia
      west: -81.0   // Océano Pacífico
    };

    return (
      coordinates.lat >= chileBounds.south &&
      coordinates.lat <= chileBounds.north &&
      coordinates.lng >= chileBounds.west &&
      coordinates.lng <= chileBounds.east
    );
  },

  /**
   * Calcular distancia en línea recta entre dos coordenadas (Haversine)
   */
  calculateDistance: (origin: Coordinates, destination: Coordinates): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Validar si dos direcciones son diferentes (no el mismo lugar)
   */
  areAddressesDifferent: (address1: string, address2: string): boolean => {
    if (!address1 || !address2) return false;
    
    // Normalizar direcciones para comparación
    const normalize = (addr: string) => addr.toLowerCase().trim().replace(/\s+/g, ' ');
    return normalize(address1) !== normalize(address2);
  },

  /**
   * Obtener sugerencias de lugares usando Places API
   */
  getPlaceSuggestions: async (query: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.places) {
        reject(new Error('Google Places API no está cargada'));
        return;
      }

      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'CL' },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions = predictions.map(prediction => prediction.description);
            resolve(suggestions);
          } else {
            resolve([]);
          }
        }
      );
    });
  }
};

// Declaración de tipos para Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

export default mapsService;