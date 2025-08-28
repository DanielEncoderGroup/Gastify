import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFuelPrices } from '../useFuelPrices';
import { cneService } from '@services/cneService';
import { FuelType, FuelPrice } from '@types/fuel';

// Mock del servicio CNE
vi.mock('@services/cneService', () => ({
  cneService: {
    getCurrentFuelPrices: vi.fn(),
    getFuelPriceByRegion: vi.fn(),
    getFuelPricesByRegion: vi.fn(),
    clearCache: vi.fn()
  }
}));

describe('useFuelPrices', () => {
  const mockFuelPrices: FuelPrice[] = [
    {
      fuelType: FuelType.GASOLINA_93,
      price: 850,
      region: 'Metropolitana de Santiago',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    },
    {
      fuelType: FuelType.GASOLINA_95,
      price: 890,
      region: 'Metropolitana de Santiago',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    },
    {
      fuelType: FuelType.GASOLINA_97,
      price: 920,
      region: 'Metropolitana de Santiago',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    },
    {
      fuelType: FuelType.DIESEL,
      price: 780,
      region: 'Metropolitana de Santiago',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    },
    {
      fuelType: FuelType.GASOLINA_93,
      price: 860,
      region: 'Valparaíso',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    },
    {
      fuelType: FuelType.GASOLINA_95,
      price: 900,
      region: 'Valparaíso',
      lastUpdated: '2024-01-15T10:00:00Z',
      source: 'CNE'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with empty prices and loading false', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useFuelPrices());

      // Assert
      expect(result.current.prices).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });

    it('should auto-fetch prices on mount', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      // Act
      const { result } = renderHook(() => useFuelPrices());

      // Assert
      await waitFor(() => {
        expect(cneService.getCurrentFuelPrices).toHaveBeenCalledOnce();
        expect(result.current.prices).toEqual(mockFuelPrices);
        expect(result.current.loading).toBe(false);
        expect(result.current.lastUpdated).toBeTruthy();
      });
    });

    it('should not auto-fetch when autoFetch is disabled', () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      // Act
      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Assert
      expect(cneService.getCurrentFuelPrices).not.toHaveBeenCalled();
      expect(result.current.prices).toEqual([]);
    });
  });

  describe('fetchPrices', () => {
    it('should fetch fuel prices successfully', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act
      await act(async () => {
        await result.current.fetchPrices();
      });

      // Assert
      expect(cneService.getCurrentFuelPrices).toHaveBeenCalledOnce();
      expect(result.current.prices).toEqual(mockFuelPrices);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeTruthy();
    });

    it('should handle fetch error gracefully', async () => {
      // Arrange
      const errorMessage = 'CNE API error';
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act
      await act(async () => {
        await result.current.fetchPrices();
      });

      // Assert
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.prices).toEqual([]);
      expect(result.current.lastUpdated).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      // Arrange
      let resolvePromise: (value: FuelPrice[]) => void;
      const promise = new Promise<FuelPrice[]>((resolve) => {
        resolvePromise = resolve;
      });
      
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockReturnValue(promise);

      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act
      act(() => {
        result.current.fetchPrices();
      });

      // Assert - Loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve promise
      act(() => {
        resolvePromise!(mockFuelPrices);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.prices).toEqual(mockFuelPrices);
      });
    });

    it('should clear previous error when starting new fetch', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockFuelPrices);

      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act - First fetch with error
      await act(async () => {
        await result.current.fetchPrices();
      });

      expect(result.current.error).toBe('First error');

      // Act - Second fetch successful
      await act(async () => {
        await result.current.fetchPrices();
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.prices).toEqual(mockFuelPrices);
    });
  });

  describe('getPriceByRegion', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should get price for specific fuel type and region', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const price = result.current.getPriceByRegion(FuelType.GASOLINA_93, 'Metropolitana de Santiago');

      // Assert
      expect(price).toEqual(mockFuelPrices[0]);
    });

    it('should handle case insensitive region matching', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const price = result.current.getPriceByRegion(FuelType.GASOLINA_93, 'metropolitana de santiago');

      // Assert
      expect(price).toEqual(mockFuelPrices[0]);
    });

    it('should return null for non-existent region', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const price = result.current.getPriceByRegion(FuelType.GASOLINA_93, 'Región Inexistente');

      // Assert
      expect(price).toBeNull();
    });

    it('should return null for non-existent fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const price = result.current.getPriceByRegion('invalid_fuel' as FuelType, 'Metropolitana de Santiago');

      // Assert
      expect(price).toBeNull();
    });
  });

  describe('getPricesByRegion', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should get all fuel prices for a specific region', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const prices = result.current.getPricesByRegion('Metropolitana de Santiago');

      // Assert
      expect(prices).toHaveLength(4); // 4 fuel types for Santiago
      expect(prices.every(p => p.region === 'Metropolitana de Santiago')).toBe(true);
    });

    it('should return empty array for non-existent region', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const prices = result.current.getPricesByRegion('Región Inexistente');

      // Assert
      expect(prices).toEqual([]);
    });
  });

  describe('getAvailableRegions', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should return list of available regions', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const regions = result.current.getAvailableRegions();

      // Assert
      expect(regions).toEqual(['Metropolitana de Santiago', 'Valparaíso']);
      expect(regions).toHaveLength(2);
    });

    it('should return empty array when no prices available', () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act
      const regions = result.current.getAvailableRegions();

      // Assert
      expect(regions).toEqual([]);
    });
  });

  describe('getLowestPrice', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should find lowest price for specific fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const lowestPrice = result.current.getLowestPrice(FuelType.GASOLINA_93);

      // Assert
      expect(lowestPrice).toEqual(mockFuelPrices[0]); // 850 < 860
    });

    it('should return null for non-existent fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const lowestPrice = result.current.getLowestPrice('invalid_fuel' as FuelType);

      // Assert
      expect(lowestPrice).toBeNull();
    });
  });

  describe('getHighestPrice', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should find highest price for specific fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const highestPrice = result.current.getHighestPrice(FuelType.GASOLINA_93);

      // Assert
      expect(highestPrice).toEqual(mockFuelPrices[4]); // 860 > 850
    });
  });

  describe('auto-refresh functionality', () => {
    it('should auto-refresh prices every 10 minutes when enabled', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      const { result } = renderHook(() => useFuelPrices({ autoRefresh: true, refreshInterval: 10 }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(cneService.getCurrentFuelPrices).toHaveBeenCalledTimes(1);
      });

      // Act - Advance time by 10 minutes
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Assert
      await waitFor(() => {
        expect(cneService.getCurrentFuelPrices).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      const { result } = renderHook(() => useFuelPrices({ autoRefresh: false }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(cneService.getCurrentFuelPrices).toHaveBeenCalledTimes(1);
      });

      // Act - Advance time by 10 minutes
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Assert - Should not call again
      expect(cneService.getCurrentFuelPrices).toHaveBeenCalledTimes(1);
    });

    it('should clear auto-refresh interval on unmount', async () => {
      // Arrange
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      const { result, unmount } = renderHook(() => useFuelPrices({ autoRefresh: true }));

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      unmount();

      // Assert
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('manual refresh', () => {
    it('should manually refresh prices and clear cache', async () => {
      // Arrange
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);

      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      await act(async () => {
        await result.current.refreshPrices();
      });

      // Assert
      expect(cneService.clearCache).toHaveBeenCalled();
      expect(cneService.getCurrentFuelPrices).toHaveBeenCalledTimes(2); // Initial + manual refresh
    });
  });

  describe('price comparison utilities', () => {
    beforeEach(async () => {
      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelPrices);
    });

    it('should compare prices between regions for same fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const comparison = result.current.comparePricesBetweenRegions(
        FuelType.GASOLINA_93,
        'Metropolitana de Santiago',
        'Valparaíso'
      );

      // Assert
      expect(comparison).toEqual({
        fuelType: FuelType.GASOLINA_93,
        region1: {
          name: 'Metropolitana de Santiago',
          price: 850
        },
        region2: {
          name: 'Valparaíso',
          price: 860
        },
        difference: -10, // Santiago is 10 pesos cheaper
        cheaperRegion: 'Metropolitana de Santiago'
      });
    });

    it('should return null when comparing non-existent regions or fuel types', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const comparison = result.current.comparePricesBetweenRegions(
        FuelType.GASOLINA_93,
        'Metropolitana de Santiago',
        'Región Inexistente'
      );

      // Assert
      expect(comparison).toBeNull();
    });

    it('should calculate average price for fuel type across all regions', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const averagePrice = result.current.getAveragePrice(FuelType.GASOLINA_93);

      // Assert
      expect(averagePrice).toBe(855); // (850 + 860) / 2
    });

    it('should return 0 for average price of non-existent fuel type', async () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const averagePrice = result.current.getAveragePrice('invalid_fuel' as FuelType);

      // Assert
      expect(averagePrice).toBe(0);
    });
  });

  describe('data freshness', () => {
    it('should indicate if data is fresh (less than 30 minutes old)', async () => {
      // Arrange
      const recentTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minutes ago
      const recentPrices = mockFuelPrices.map(p => ({ ...p, lastUpdated: recentTime }));

      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(recentPrices);

      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const isFresh = result.current.isDataFresh();

      // Assert
      expect(isFresh).toBe(true);
    });

    it('should indicate if data is stale (more than 30 minutes old)', async () => {
      // Arrange
      const staleTime = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 minutes ago
      const stalePrices = mockFuelPrices.map(p => ({ ...p, lastUpdated: staleTime }));

      (cneService.getCurrentFuelPrices as ReturnType<typeof vi.fn>).mockResolvedValue(stalePrices);

      const { result } = renderHook(() => useFuelPrices());

      await waitFor(() => {
        expect(result.current.prices.length).toBeGreaterThan(0);
      });

      // Act
      const isFresh = result.current.isDataFresh();

      // Assert
      expect(isFresh).toBe(false);
    });

    it('should indicate stale data when no prices available', () => {
      // Arrange
      const { result } = renderHook(() => useFuelPrices({ autoFetch: false }));

      // Act
      const isFresh = result.current.isDataFresh();

      // Assert
      expect(isFresh).toBe(false);
    });
  });
});