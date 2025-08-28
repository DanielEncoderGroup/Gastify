import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapsService } from '../mapsService';
import { Coordinates, Location, RouteData } from '@types/fuel';

// Mock global Google Maps API
const mockGoogleMaps = {
  maps: {
    DirectionsService: vi.fn(),
    DirectionsStatus: {
      OK: 'OK',
      NOT_FOUND: 'NOT_FOUND',
      ZERO_RESULTS: 'ZERO_RESULTS'
    },
    TravelMode: {
      DRIVING: 'DRIVING'
    },
    UnitSystem: {
      METRIC: 'METRIC'
    },
    Geocoder: vi.fn(),
    GeocoderStatus: {
      OK: 'OK',
      ZERO_RESULTS: 'ZERO_RESULTS'
    },
    LatLng: vi.fn()
  }
};

// Mock window.google
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true
});

describe('MapsService', () => {
  let mockDirectionsService: any;
  let mockGeocoder: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup DirectionsService mock
    mockDirectionsService = {
      route: vi.fn()
    };
    mockGoogleMaps.maps.DirectionsService.mockImplementation(() => mockDirectionsService);

    // Setup Geocoder mock
    mockGeocoder = {
      geocode: vi.fn()
    };
    mockGoogleMaps.maps.Geocoder.mockImplementation(() => mockGeocoder);

    // Mock LatLng constructor
    mockGoogleMaps.maps.LatLng.mockImplementation((lat: number, lng: number) => ({
      lat: () => lat,
      lng: () => lng
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateRoute', () => {
    it('should calculate route between two coordinates successfully', async () => {
      // Arrange
      const origin: Coordinates = { lat: -33.4489, lng: -70.6693 }; // Santiago Centro
      const destination: Coordinates = { lat: -33.3745, lng: -70.5728 }; // Las Condes

      const mockDirectionsResult = {
        routes: [{
          legs: [{
            distance: { value: 15500, text: '15.5 km' },
            duration: { value: 1500, text: '25 min' }
          }],
          overview_polyline: {
            getPath: () => [],
            getArray: () => []
          }
        }]
      };

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(mockDirectionsResult, 'OK');
      });

      const expectedRouteData: RouteData = {
        origin: {
          coordinates: origin,
          address: 'Santiago Centro, Santiago, Chile',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile'
        },
        destination: {
          coordinates: destination,
          address: 'Las Condes, Santiago, Chile',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile'
        },
        distance: 15.5,
        duration: 25
      };

      // Act
      const result = await mapsService.calculateRoute(origin, destination);

      // Assert
      expect(mockDirectionsService.route).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          destination: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          travelMode: 'DRIVING',
          unitSystem: 'METRIC',
          region: 'cl'
        }),
        expect.any(Function)
      );
      
      expect(result.distance).toBe(15.5);
      expect(result.duration).toBe(25);
      expect(result.origin.coordinates).toEqual(origin);
      expect(result.destination.coordinates).toEqual(destination);
    });

    it('should handle route not found error', async () => {
      // Arrange
      const origin: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const destination: Coordinates = { lat: 0, lng: 0 }; // Invalid destination

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(null, 'NOT_FOUND');
      });

      // Act & Assert
      await expect(mapsService.calculateRoute(origin, destination))
        .rejects.toThrow('No se pudo encontrar una ruta entre los puntos especificados');
    });

    it('should handle zero results error', async () => {
      // Arrange
      const origin: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const destination: Coordinates = { lat: -33.3745, lng: -70.5728 };

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(null, 'ZERO_RESULTS');
      });

      // Act & Assert
      await expect(mapsService.calculateRoute(origin, destination))
        .rejects.toThrow('No se encontraron resultados para la ruta solicitada');
    });

    it('should validate coordinates are within Chile bounds', async () => {
      // Arrange
      const originOutsideChile: Coordinates = { lat: 40.7128, lng: -74.0060 }; // New York
      const destination: Coordinates = { lat: -33.3745, lng: -70.5728 };

      // Act & Assert
      await expect(mapsService.calculateRoute(originOutsideChile, destination))
        .rejects.toThrow('Las coordenadas deben estar dentro de los límites de Chile');
    });

    it('should calculate multiple waypoints route', async () => {
      // Arrange
      const origin: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const destination: Coordinates = { lat: -33.3745, lng: -70.5728 };
      const waypoints: Coordinates[] = [
        { lat: -33.4372, lng: -70.6506 } // Waypoint intermedio
      ];

      const mockDirectionsResult = {
        routes: [{
          legs: [
            {
              distance: { value: 8000, text: '8 km' },
              duration: { value: 900, text: '15 min' }
            },
            {
              distance: { value: 7500, text: '7.5 km' },
              duration: { value: 600, text: '10 min' }
            }
          ],
          overview_polyline: {
            getPath: () => [],
            getArray: () => []
          }
        }]
      };

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(mockDirectionsResult, 'OK');
      });

      // Act
      const result = await mapsService.calculateRoute(origin, destination, waypoints);

      // Assert
      expect(result.distance).toBe(15.5); // 8 + 7.5
      expect(result.duration).toBe(25); // 15 + 10
      expect(mockDirectionsService.route).toHaveBeenCalledWith(
        expect.objectContaining({
          waypoints: expect.arrayContaining([
            expect.objectContaining({
              location: expect.any(Object),
              stopover: true
            })
          ])
        }),
        expect.any(Function)
      );
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode address to coordinates successfully', async () => {
      // Arrange
      const address = 'Plaza de Armas, Santiago, Chile';
      const expectedLocation: Location = {
        coordinates: { lat: -33.4489, lng: -70.6693 },
        address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile'
      };

      const mockGeocodingResult = [{
        geometry: {
          location: {
            lat: () => -33.4489,
            lng: () => -70.6693
          }
        },
        formatted_address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
        address_components: [
          { long_name: 'Plaza de Armas', types: ['point_of_interest'] },
          { long_name: 'Santiago', types: ['locality'] },
          { long_name: 'Región Metropolitana', types: ['administrative_area_level_1'] },
          { long_name: 'Chile', types: ['country'] }
        ]
      }];

      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback(mockGeocodingResult, 'OK');
      });

      // Act
      const result = await mapsService.geocodeAddress(address);

      // Assert
      expect(mockGeocoder.geocode).toHaveBeenCalledWith(
        { address: address, region: 'cl' },
        expect.any(Function)
      );
      expect(result).toEqual(expectedLocation);
    });

    it('should handle geocoding failure', async () => {
      // Arrange
      const invalidAddress = 'Dirección inexistente 12345';

      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback(null, 'ZERO_RESULTS');
      });

      // Act & Assert
      await expect(mapsService.geocodeAddress(invalidAddress))
        .rejects.toThrow('No se pudo encontrar la dirección especificada');
    });

    it('should validate result is within Chile', async () => {
      // Arrange
      const address = 'Times Square, New York, USA';

      const mockGeocodingResult = [{
        geometry: {
          location: {
            lat: () => 40.7128,
            lng: () => -74.0060
          }
        },
        formatted_address: 'Times Square, New York, NY, USA',
        address_components: [
          { long_name: 'Times Square', types: ['point_of_interest'] },
          { long_name: 'New York', types: ['locality'] },
          { long_name: 'New York', types: ['administrative_area_level_1'] },
          { long_name: 'United States', types: ['country'] }
        ]
      }];

      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback(mockGeocodingResult, 'OK');
      });

      // Act & Assert
      await expect(mapsService.geocodeAddress(address))
        .rejects.toThrow('La dirección debe estar ubicada en Chile');
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates to address successfully', async () => {
      // Arrange
      const coordinates: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const expectedLocation: Location = {
        coordinates,
        address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile'
      };

      const mockGeocodingResult = [{
        formatted_address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
        address_components: [
          { long_name: 'Plaza de Armas', types: ['point_of_interest'] },
          { long_name: 'Santiago', types: ['locality'] },
          { long_name: 'Región Metropolitana', types: ['administrative_area_level_1'] },
          { long_name: 'Chile', types: ['country'] }
        ]
      }];

      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback(mockGeocodingResult, 'OK');
      });

      // Act
      const result = await mapsService.reverseGeocode(coordinates);

      // Assert
      expect(mockGeocoder.geocode).toHaveBeenCalledWith(
        { location: expect.any(Object), region: 'cl' },
        expect.any(Function)
      );
      expect(result).toEqual(expectedLocation);
    });

    it('should handle reverse geocoding failure', async () => {
      // Arrange
      const invalidCoordinates: Coordinates = { lat: 0, lng: 0 };

      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback(null, 'ZERO_RESULTS');
      });

      // Act & Assert
      await expect(mapsService.reverseGeocode(invalidCoordinates))
        .rejects.toThrow('No se pudo obtener la dirección para las coordenadas especificadas');
    });
  });

  describe('isWithinChileBounds', () => {
    it('should return true for coordinates within Chile', () => {
      // Arrange
      const validCoordinates = [
        { lat: -33.4489, lng: -70.6693 }, // Santiago
        { lat: -23.6509, lng: -70.3975 }, // Antofagasta
        { lat: -36.8201, lng: -73.0444 }, // Concepción
        { lat: -53.1638, lng: -70.9171 }  // Punta Arenas
      ];

      // Act & Assert
      validCoordinates.forEach(coord => {
        expect(mapsService.isWithinChileBounds(coord)).toBe(true);
      });
    });

    it('should return false for coordinates outside Chile', () => {
      // Arrange
      const invalidCoordinates = [
        { lat: 40.7128, lng: -74.0060 }, // New York
        { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
        { lat: 0, lng: 0 }, // Null Island
        { lat: -15.7942, lng: -47.8822 }  // Brasília
      ];

      // Act & Assert
      invalidCoordinates.forEach(coord => {
        expect(mapsService.isWithinChileBounds(coord)).toBe(false);
      });
    });

    it('should handle edge cases at Chile borders', () => {
      // Arrange
      const borderCoordinates = [
        { lat: -17.5, lng: -69.5 }, // Northern border
        { lat: -56, lng: -68 }, // Southern border
        { lat: -30, lng: -71.5 }, // Western border
        { lat: -22, lng: -68.5 }  // Eastern border
      ];

      // Act & Assert
      borderCoordinates.forEach(coord => {
        const result = mapsService.isWithinChileBounds(coord);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate straight-line distance between two points', () => {
      // Arrange
      const origin: Coordinates = { lat: -33.4489, lng: -70.6693 }; // Santiago Centro
      const destination: Coordinates = { lat: -33.3745, lng: -70.5728 }; // Las Condes

      // Act
      const distance = mapsService.calculateDistance(origin, destination);

      // Assert
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(20); // Should be less than 20km straight line
      expect(typeof distance).toBe('number');
    });

    it('should return 0 for same coordinates', () => {
      // Arrange
      const coordinates: Coordinates = { lat: -33.4489, lng: -70.6693 };

      // Act
      const distance = mapsService.calculateDistance(coordinates, coordinates);

      // Assert
      expect(distance).toBe(0);
    });

    it('should calculate distance between distant cities', () => {
      // Arrange
      const santiago: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const puntaArenas: Coordinates = { lat: -53.1638, lng: -70.9171 };

      // Act
      const distance = mapsService.calculateDistance(santiago, puntaArenas);

      // Assert
      expect(distance).toBeGreaterThan(2000); // Should be more than 2000km
      expect(distance).toBeLessThan(2500); // Should be less than 2500km
    });
  });
});