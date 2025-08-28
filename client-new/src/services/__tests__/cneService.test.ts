import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cneService } from '../cneService';
import { FuelType, FuelPrice } from '@types/fuel';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CNEService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getCurrentFuelPrices', () => {
    it('should fetch current fuel prices from CNE API successfully', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [
          {
            region: 'Metropolitana de Santiago',
            gasolina_93: 850,
            gasolina_95: 890,
            gasolina_97: 920,
            diesel: 780,
            fecha_actualizacion: '2024-01-15T10:00:00Z'
          },
          {
            region: 'Valparaíso',
            gasolina_93: 860,
            gasolina_95: 900,
            gasolina_97: 930,
            diesel: 790,
            fecha_actualizacion: '2024-01-15T10:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const expectedPrices: FuelPrice[] = [
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
        },
        {
          fuelType: FuelType.GASOLINA_97,
          price: 930,
          region: 'Valparaíso',
          lastUpdated: '2024-01-15T10:00:00Z',
          source: 'CNE'
        },
        {
          fuelType: FuelType.DIESEL,
          price: 790,
          region: 'Valparaíso',
          lastUpdated: '2024-01-15T10:00:00Z',
          source: 'CNE'
        }
      ];

      // Act
      const result = await cneService.getCurrentFuelPrices();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('cne.cl'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': expect.stringContaining('Gastify')
          })
        })
      );
      expect(result).toEqual(expectedPrices);
      expect(result).toHaveLength(8); // 4 fuel types x 2 regions
    });

    it('should handle CNE API error gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Error fetching fuel prices from CNE API');
    });

    it('should handle invalid response format', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'format' })
      });

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Invalid response format from CNE API');
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('CNE API returned error: 500 Internal Server Error');
    });
  });

  describe('getFuelPriceByRegion', () => {
    beforeEach(() => {
      // Setup mock successful response for getCurrentFuelPrices
      const mockApiResponse = {
        precios: [
          {
            region: 'Metropolitana de Santiago',
            gasolina_93: 850,
            gasolina_95: 890,
            gasolina_97: 920,
            diesel: 780,
            fecha_actualizacion: '2024-01-15T10:00:00Z'
          },
          {
            region: 'Valparaíso',
            gasolina_93: 860,
            gasolina_95: 900,
            gasolina_97: 930,
            diesel: 790,
            fecha_actualizacion: '2024-01-15T10:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });
    });

    it('should get fuel price for specific fuel type and region', async () => {
      // Arrange
      const fuelType = FuelType.GASOLINA_93;
      const region = 'Metropolitana de Santiago';

      const expectedPrice: FuelPrice = {
        fuelType: FuelType.GASOLINA_93,
        price: 850,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      };

      // Act
      const result = await cneService.getFuelPriceByRegion(fuelType, region);

      // Assert
      expect(result).toEqual(expectedPrice);
    });

    it('should handle case insensitive region matching', async () => {
      // Arrange
      const fuelType = FuelType.GASOLINA_93;
      const region = 'metropolitana de santiago'; // lowercase

      // Act
      const result = await cneService.getFuelPriceByRegion(fuelType, region);

      // Assert
      expect(result.region).toBe('Metropolitana de Santiago');
      expect(result.price).toBe(850);
    });

    it('should throw error for non-existent region', async () => {
      // Arrange
      const fuelType = FuelType.GASOLINA_93;
      const region = 'Región Inexistente';

      // Act & Assert
      await expect(cneService.getFuelPriceByRegion(fuelType, region))
        .rejects.toThrow('Fuel price not found for region: Región Inexistente');
    });

    it('should get all fuel types for a specific region', async () => {
      // Arrange
      const region = 'Valparaíso';

      const expectedPrices: FuelPrice[] = [
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
        },
        {
          fuelType: FuelType.GASOLINA_97,
          price: 930,
          region: 'Valparaíso',
          lastUpdated: '2024-01-15T10:00:00Z',
          source: 'CNE'
        },
        {
          fuelType: FuelType.DIESEL,
          price: 790,
          region: 'Valparaíso',
          lastUpdated: '2024-01-15T10:00:00Z',
          source: 'CNE'
        }
      ];

      // Act
      const result = await cneService.getFuelPricesByRegion(region);

      // Assert
      expect(result).toEqual(expectedPrices);
      expect(result).toHaveLength(4);
    });
  });

  describe('caching functionality', () => {
    beforeEach(() => {
      // Clear cache before each test
      cneService.clearCache();
    });

    it('should cache fuel prices for 10 minutes', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: 850,
          gasolina_95: 890,
          gasolina_97: 920,
          diesel: 780,
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act - First call
      await cneService.getCurrentFuelPrices();
      
      // Act - Second call within cache time
      await cneService.getCurrentFuelPrices();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should only call API once
    });

    it('should refresh cache after 10 minutes', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: 850,
          gasolina_95: 890,
          gasolina_97: 920,
          diesel: 780,
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act - First call
      await cneService.getCurrentFuelPrices();
      
      // Advance time by 11 minutes
      vi.advanceTimersByTime(11 * 60 * 1000);
      
      // Act - Second call after cache expiry
      await cneService.getCurrentFuelPrices();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2); // Should call API twice
    });

    it('should allow manual cache clearing', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: 850,
          gasolina_95: 890,
          gasolina_97: 920,
          diesel: 780,
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act
      await cneService.getCurrentFuelPrices(); // First call
      cneService.clearCache(); // Clear cache manually
      await cneService.getCurrentFuelPrices(); // Second call

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2); // Should call API twice
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed requests up to 3 times', async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            precios: [{
              region: 'Metropolitana de Santiago',
              gasolina_93: 850,
              gasolina_95: 890,
              gasolina_97: 920,
              diesel: 780,
              fecha_actualizacion: '2024-01-15T10:00:00Z'
            }]
          })
        });

      // Act
      const result = await cneService.getCurrentFuelPrices();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(4); // Should succeed on third try
    });

    it('should fail after 3 retry attempts', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Error fetching fuel prices from CNE API');
      
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should try 3 times
    });
  });

  describe('data validation', () => {
    it('should validate price ranges are reasonable', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: 50000, // Unreasonably high price
          gasolina_95: 890,
          gasolina_97: 920,
          diesel: 780,
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Invalid fuel price data received from CNE API');
    });

    it('should validate required fields are present', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: 850,
          // Missing other required fields
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Invalid response format from CNE API');
    });

    it('should handle null or undefined prices', async () => {
      // Arrange
      const mockApiResponse = {
        precios: [{
          region: 'Metropolitana de Santiago',
          gasolina_93: null,
          gasolina_95: undefined,
          gasolina_97: 920,
          diesel: 780,
          fecha_actualizacion: '2024-01-15T10:00:00Z'
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      // Act
      const result = await cneService.getCurrentFuelPrices();

      // Assert
      // Should only include valid prices (gasolina_97 and diesel)
      expect(result).toHaveLength(2);
      expect(result.find(p => p.fuelType === FuelType.GASOLINA_97)).toBeDefined();
      expect(result.find(p => p.fuelType === FuelType.DIESEL)).toBeDefined();
    });
  });
});