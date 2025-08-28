import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRouteCalculation } from '../useRouteCalculation';
import { mapsService } from '@services/mapsService';
import { cneService } from '@services/cneService';
import { 
  Coordinates, 
  RouteData, 
  FuelCalculation,
  VehicleType,
  FuelType 
} from '@types/fuel';

// Mock de servicios
vi.mock('@services/mapsService', () => ({
  mapsService: {
    calculateRoute: vi.fn(),
    geocodeAddress: vi.fn(),
    reverseGeocode: vi.fn(),
    isWithinChileBounds: vi.fn(),
    calculateDistance: vi.fn()
  }
}));

vi.mock('@services/cneService', () => ({
  cneService: {
    getFuelPriceByRegion: vi.fn(),
    getCurrentFuelPrices: vi.fn()
  }
}));

describe('useRouteCalculation', () => {
  const mockOrigin: Coordinates = { lat: -33.4489, lng: -70.6693 }; // Santiago Centro
  const mockDestination: Coordinates = { lat: -33.3745, lng: -70.5728 }; // Las Condes

  const mockRouteData: RouteData = {
    origin: {
      coordinates: mockOrigin,
      address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    destination: {
      coordinates: mockDestination,
      address: 'Las Condes, Santiago, Región Metropolitana, Chile',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    distance: 15.5,
    duration: 25,
    polyline: 'encoded_polyline_data'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      // Act
      const { result } = renderHook(() => useRouteCalculation());

      // Assert
      expect(result.current.routeData).toBeNull();
      expect(result.current.calculation).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('calculateRoute', () => {
    it('should calculate route successfully', async () => {
      // Arrange
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Assert
      expect(mapsService.calculateRoute).toHaveBeenCalledWith(mockOrigin, mockDestination, undefined);
      expect(result.current.routeData).toEqual(mockRouteData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should calculate route with waypoints', async () => {
      // Arrange
      const waypoints = [{ lat: -33.4372, lng: -70.6506 }];
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination, waypoints);
      });

      // Assert
      expect(mapsService.calculateRoute).toHaveBeenCalledWith(mockOrigin, mockDestination, waypoints);
      expect(result.current.routeData).toEqual(mockRouteData);
    });

    it('should handle route calculation error', async () => {
      // Arrange
      const errorMessage = 'No se pudo calcular la ruta';
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Assert
      expect(result.current.routeData).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during calculation', async () => {
      // Arrange
      let resolvePromise: (value: RouteData) => void;
      const promise = new Promise<RouteData>((resolve) => {
        resolvePromise = resolve;
      });
      
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockReturnValue(promise);

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      act(() => {
        result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Assert - Loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve promise
      act(() => {
        resolvePromise!(mockRouteData);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.routeData).toEqual(mockRouteData);
      });
    });

    it('should clear previous error when starting new calculation', async () => {
      // Arrange
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockRouteData);

      const { result } = renderHook(() => useRouteCalculation());

      // Act - First calculation with error
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      expect(result.current.error).toBe('First error');

      // Act - Second calculation successful
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.routeData).toEqual(mockRouteData);
    });
  });

  describe('calculateFuelCost', () => {
    it('should calculate fuel cost for economical vehicle', async () => {
      // Arrange
      const vehicleType = VehicleType.ECONOMICO;
      const fuelType = FuelType.GASOLINA_93;
      const mockFuelPrice = { 
        fuelType, 
        price: 850, 
        region: 'Metropolitana', 
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE' as const
      };

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);
      (cneService.getFuelPriceByRegion as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrice);

      const { result } = renderHook(() => useRouteCalculation());

      // First calculate route
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Act - Calculate fuel cost
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType);
      });

      // Assert
      const expectedCalculation: FuelCalculation = {
        routeData: mockRouteData,
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        fuelPrice: 850,
        fuelNeeded: 1.03, // 15.5 km / 15 km/l
        totalCost: 876, // 1.03 * 850 (rounded)
        consumption: 15
      };

      expect(cneService.getFuelPriceByRegion).toHaveBeenCalledWith(fuelType, 'Metropolitana');
      expect(result.current.calculation).toEqual(expectedCalculation);
      expect(result.current.loading).toBe(false);
    });

    it('should calculate fuel cost for intermediate vehicle', async () => {
      // Arrange
      const vehicleType = VehicleType.INTERMEDIO;
      const fuelType = FuelType.GASOLINA_95;
      const mockFuelPrice = { 
        fuelType, 
        price: 890, 
        region: 'Metropolitana', 
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE' as const
      };

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);
      (cneService.getFuelPriceByRegion as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrice);

      const { result } = renderHook(() => useRouteCalculation());

      // First calculate route
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Act - Calculate fuel cost
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType);
      });

      // Assert
      expect(result.current.calculation?.fuelNeeded).toBe(1.55); // 15.5 km / 10 km/l
      expect(result.current.calculation?.consumption).toBe(10);
      expect(result.current.calculation?.totalCost).toBe(1380); // 1.55 * 890
    });

    it('should calculate fuel cost for SUV', async () => {
      // Arrange
      const vehicleType = VehicleType.SUV;
      const fuelType = FuelType.DIESEL;
      const mockFuelPrice = { 
        fuelType, 
        price: 780, 
        region: 'Metropolitana', 
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE' as const
      };

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);
      (cneService.getFuelPriceByRegion as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrice);

      const { result } = renderHook(() => useRouteCalculation());

      // First calculate route
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Act - Calculate fuel cost
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType);
      });

      // Assert
      expect(result.current.calculation?.fuelNeeded).toBe(1.94); // 15.5 km / 8 km/l
      expect(result.current.calculation?.consumption).toBe(8);
      expect(result.current.calculation?.totalCost).toBe(1513); // 1.94 * 780
    });

    it('should handle fuel cost calculation without route', async () => {
      // Arrange
      const vehicleType = VehicleType.ECONOMICO;
      const fuelType = FuelType.GASOLINA_93;

      const { result } = renderHook(() => useRouteCalculation());

      // Act - Try to calculate fuel cost without route
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType);
      });

      // Assert
      expect(result.current.calculation).toBeNull();
      expect(result.current.error).toBe('Debe calcular la ruta antes de calcular el costo de combustible');
    });

    it('should handle fuel price API error', async () => {
      // Arrange
      const vehicleType = VehicleType.ECONOMICO;
      const fuelType = FuelType.GASOLINA_93;

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);
      (cneService.getFuelPriceByRegion as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('CNE API error')
      );

      const { result } = renderHook(() => useRouteCalculation());

      // First calculate route
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Act - Calculate fuel cost with API error
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType);
      });

      // Assert
      expect(result.current.calculation).toBeNull();
      expect(result.current.error).toBe('CNE API error');
    });

    it('should use manual price when provided', async () => {
      // Arrange
      const vehicleType = VehicleType.ECONOMICO;
      const fuelType = FuelType.GASOLINA_93;
      const manualPrice = 900;

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);

      const { result } = renderHook(() => useRouteCalculation());

      // First calculate route
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
      });

      // Act - Calculate fuel cost with manual price
      await act(async () => {
        await result.current.calculateFuelCost(vehicleType, fuelType, manualPrice);
      });

      // Assert
      expect(cneService.getFuelPriceByRegion).not.toHaveBeenCalled();
      expect(result.current.calculation?.fuelPrice).toBe(manualPrice);
      expect(result.current.calculation?.totalCost).toBe(927); // 1.03 * 900
    });
  });

  describe('calculateAlternativeRoutes', () => {
    it('should calculate multiple alternative routes', async () => {
      // Arrange
      const alternativeRoute1 = { ...mockRouteData, distance: 18.2, duration: 30 };
      const alternativeRoute2 = { ...mockRouteData, distance: 12.8, duration: 35 };

      (mapsService.calculateRoute as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRouteData) // Main route
        .mockResolvedValueOnce(alternativeRoute1) // Alternative 1
        .mockResolvedValueOnce(alternativeRoute2); // Alternative 2

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      await act(async () => {
        await result.current.calculateAlternativeRoutes(mockOrigin, mockDestination);
      });

      // Assert
      expect(mapsService.calculateRoute).toHaveBeenCalledTimes(3);
      expect(result.current.alternativeRoutes).toHaveLength(2);
      expect(result.current.alternativeRoutes?.[0]).toEqual(alternativeRoute1);
      expect(result.current.alternativeRoutes?.[1]).toEqual(alternativeRoute2);
    });

    it('should handle errors in alternative route calculation', async () => {
      // Arrange
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRouteData) // Main route succeeds
        .mockRejectedValueOnce(new Error('Alternative route 1 failed'))
        .mockResolvedValueOnce({ ...mockRouteData, distance: 12.8 }); // Alternative 2 succeeds

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      await act(async () => {
        await result.current.calculateAlternativeRoutes(mockOrigin, mockDestination);
      });

      // Assert
      expect(result.current.alternativeRoutes).toHaveLength(1); // Only successful alternative
      expect(result.current.error).toBeNull(); // Should not fail completely
    });
  });

  describe('compareRoutes', () => {
    it('should compare routes by different criteria', async () => {
      // Arrange
      const route1 = { ...mockRouteData, distance: 15.5, duration: 25 };
      const route2 = { ...mockRouteData, distance: 18.2, duration: 20 };
      const route3 = { ...mockRouteData, distance: 12.8, duration: 30 };

      const { result } = renderHook(() => useRouteCalculation());

      // Act
      const shortestRoute = result.current.compareRoutes([route1, route2, route3], 'distance');
      const fastestRoute = result.current.compareRoutes([route1, route2, route3], 'duration');

      // Assert
      expect(shortestRoute).toEqual(route3); // 12.8 km
      expect(fastestRoute).toEqual(route2); // 20 min
    });

    it('should return null for empty routes array', () => {
      // Arrange
      const { result } = renderHook(() => useRouteCalculation());

      // Act
      const result1 = result.current.compareRoutes([], 'distance');
      const result2 = result.current.compareRoutes([], 'duration');

      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('resetCalculation', () => {
    it('should reset all calculation data', async () => {
      // Arrange
      (mapsService.calculateRoute as ReturnType<typeof vi.fn>).mockResolvedValue(mockRouteData);
      (cneService.getFuelPriceByRegion as ReturnType<typeof vi.fn>).mockResolvedValue({
        fuelType: FuelType.GASOLINA_93,
        price: 850,
        region: 'Metropolitana',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      });

      const { result } = renderHook(() => useRouteCalculation());

      // Setup some data
      await act(async () => {
        await result.current.calculateRoute(mockOrigin, mockDestination);
        await result.current.calculateFuelCost(VehicleType.ECONOMICO, FuelType.GASOLINA_93);
      });

      expect(result.current.routeData).not.toBeNull();
      expect(result.current.calculation).not.toBeNull();

      // Act
      act(() => {
        result.current.resetCalculation();
      });

      // Assert
      expect(result.current.routeData).toBeNull();
      expect(result.current.calculation).toBeNull();
      expect(result.current.alternativeRoutes).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should calculate estimated time with traffic', () => {
      // Arrange
      const { result } = renderHook(() => useRouteCalculation());

      // Act
      const timeWithTraffic = result.current.calculateEstimatedTimeWithTraffic(25, 'rush_hour');
      const timeWithoutTraffic = result.current.calculateEstimatedTimeWithTraffic(25, 'normal');

      // Assert
      expect(timeWithTraffic).toBeGreaterThan(25); // Should be longer during rush hour
      expect(timeWithoutTraffic).toBe(25); // Should be same during normal hours
    });

    it('should format distance correctly', () => {
      // Arrange
      const { result } = renderHook(() => useRouteCalculation());

      // Act
      const shortDistance = result.current.formatDistance(0.8);
      const longDistance = result.current.formatDistance(15.5);
      const veryLongDistance = result.current.formatDistance(150.5);

      // Assert
      expect(shortDistance).toBe('800 m');
      expect(longDistance).toBe('15.5 km');
      expect(veryLongDistance).toBe('150.5 km');
    });

    it('should format duration correctly', () => {
      // Arrange
      const { result } = renderHook(() => useRouteCalculation());

      // Act
      const shortDuration = result.current.formatDuration(5);
      const mediumDuration = result.current.formatDuration(25);
      const longDuration = result.current.formatDuration(125);

      // Assert
      expect(shortDuration).toBe('5 min');
      expect(mediumDuration).toBe('25 min');
      expect(longDuration).toBe('2h 5min');
    });
  });
});