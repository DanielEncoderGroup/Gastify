import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geolocationService } from '../geolocationService';
import { Coordinates, GeolocationState } from '@types/fuel';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock permissions API
const mockPermissions = {
  query: vi.fn()
};

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  writable: true
});

describe('GeolocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      // Arrange
      const mockPosition = {
        coords: {
          latitude: -33.4489,
          longitude: -70.6693,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const expectedCoordinates: Coordinates = {
        lat: -33.4489,
        lng: -70.6693
      };

      // Act
      const result = await geolocationService.getCurrentPosition();

      // Assert
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      );
      expect(result.coordinates).toEqual(expectedCoordinates);
      expect(result.accuracy).toBe(10);
    });

    it('should handle geolocation permission denied', async () => {
      // Arrange
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied the request for Geolocation.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('Permisos de geolocalización denegados. Por favor, habilita la ubicación en tu navegador.');
    });

    it('should handle geolocation position unavailable', async () => {
      // Arrange
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Location information is unavailable.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('No se pudo obtener la ubicación. Verifica tu conexión a internet.');
    });

    it('should handle geolocation timeout', async () => {
      // Arrange
      const mockError = {
        code: 3, // TIMEOUT
        message: 'The request to get user location timed out.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('Tiempo de espera agotado al obtener la ubicación.');
    });

    it('should validate coordinates are within Chile', async () => {
      // Arrange
      const mockPositionOutsideChile = {
        coords: {
          latitude: 40.7128, // New York
          longitude: -74.0060,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPositionOutsideChile);
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('La ubicación detectada está fuera de Chile. Verifica que estés en territorio chileno.');
    });

    it('should use high accuracy options by default', async () => {
      // Arrange
      const mockPosition = {
        coords: {
          latitude: -33.4489,
          longitude: -70.6693,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Act
      await geolocationService.getCurrentPosition({ enableHighAccuracy: true });

      // Assert
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      );
    });

    it('should allow custom options', async () => {
      // Arrange
      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000
      };

      const mockPosition = {
        coords: {
          latitude: -33.4489,
          longitude: -70.6693,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Act
      await geolocationService.getCurrentPosition(customOptions);

      // Assert
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      );
    });
  });

  describe('watchPosition', () => {
    it('should start watching position and return watch ID', () => {
      // Arrange
      const mockWatchId = 123;
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();

      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

      // Act
      const watchId = geolocationService.watchPosition(mockCallback, mockErrorCallback);

      // Assert
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      );
      expect(watchId).toBe(mockWatchId);
    });

    it('should call callback with position updates', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockPosition = {
        coords: {
          latitude: -33.4489,
          longitude: -70.6693,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.watchPosition.mockImplementation((callback) => {
        // Simulate position update
        setTimeout(() => callback(mockPosition), 100);
        return 123;
      });

      // Act
      geolocationService.watchPosition(mockCallback, mockErrorCallback);
      vi.advanceTimersByTime(100);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        coordinates: { lat: -33.4489, lng: -70.6693 },
        accuracy: 10,
        timestamp: mockPosition.timestamp
      });
    });

    it('should call error callback on geolocation errors', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockError = {
        code: 1,
        message: 'Permission denied'
      };

      mockGeolocation.watchPosition.mockImplementation((callback, errorCallback) => {
        // Simulate error
        setTimeout(() => errorCallback(mockError), 100);
        return 123;
      });

      // Act
      geolocationService.watchPosition(mockCallback, mockErrorCallback);
      vi.advanceTimersByTime(100);

      // Assert
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.stringContaining('Permisos de geolocalización denegados')
      );
    });

    it('should filter out positions outside Chile', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockPositionOutsideChile = {
        coords: {
          latitude: 40.7128, // New York
          longitude: -74.0060,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.watchPosition.mockImplementation((callback) => {
        setTimeout(() => callback(mockPositionOutsideChile), 100);
        return 123;
      });

      // Act
      geolocationService.watchPosition(mockCallback, mockErrorCallback);
      vi.advanceTimersByTime(100);

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockErrorCallback).toHaveBeenCalledWith(
        'La ubicación detectada está fuera de Chile. Verifica que estés en territorio chileno.'
      );
    });
  });

  describe('clearWatch', () => {
    it('should clear position watch', () => {
      // Arrange
      const mockWatchId = 123;

      // Act
      geolocationService.clearWatch(mockWatchId);

      // Assert
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });
  });

  describe('checkGeolocationPermission', () => {
    it('should return granted when permission is granted', async () => {
      // Arrange
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      // Act
      const result = await geolocationService.checkGeolocationPermission();

      // Assert
      expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
      expect(result).toBe('granted');
    });

    it('should return denied when permission is denied', async () => {
      // Arrange
      mockPermissions.query.mockResolvedValue({ state: 'denied' });

      // Act
      const result = await geolocationService.checkGeolocationPermission();

      // Assert
      expect(result).toBe('denied');
    });

    it('should return prompt when permission needs user prompt', async () => {
      // Arrange
      mockPermissions.query.mockResolvedValue({ state: 'prompt' });

      // Act
      const result = await geolocationService.checkGeolocationPermission();

      // Assert
      expect(result).toBe('prompt');
    });

    it('should handle unsupported permissions API', async () => {
      // Arrange
      Object.defineProperty(global.navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      // Act
      const result = await geolocationService.checkGeolocationPermission();

      // Assert
      expect(result).toBe('unsupported');
    });
  });

  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is supported', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      // Act
      const result = geolocationService.isGeolocationSupported();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when geolocation is not supported', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      // Act
      const result = geolocationService.isGeolocationSupported();

      // Assert
      expect(result).toBe(false);
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
        expect(geolocationService.isWithinChileBounds(coord)).toBe(true);
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
        expect(geolocationService.isWithinChileBounds(coord)).toBe(false);
      });
    });
  });

  describe('calculateAccuracyLevel', () => {
    it('should return high accuracy for accuracy <= 10m', () => {
      // Act
      const result = geolocationService.calculateAccuracyLevel(5);

      // Assert
      expect(result).toBe('high');
    });

    it('should return medium accuracy for accuracy 10-50m', () => {
      // Act
      const result = geolocationService.calculateAccuracyLevel(30);

      // Assert
      expect(result).toBe('medium');
    });

    it('should return low accuracy for accuracy > 50m', () => {
      // Act
      const result = geolocationService.calculateAccuracyLevel(100);

      // Assert
      expect(result).toBe('low');
    });
  });

  describe('error handling', () => {
    it('should handle unknown geolocation errors', async () => {
      // Arrange
      const mockError = {
        code: 999, // Unknown code
        message: 'Unknown error'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('Error desconocido al obtener la ubicación: Unknown error');
    });

    it('should handle missing geolocation API gracefully', async () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      // Act & Assert
      await expect(geolocationService.getCurrentPosition())
        .rejects.toThrow('Geolocalización no está soportada en este navegador');
    });
  });
});