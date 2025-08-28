import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fuelService } from '../fuelService';
import { 
  CreateFuelExpenseData, 
  FuelExpense, 
  FuelExpenseFilters, 
  FuelExpenseStats,
  VehicleType,
  FuelType,
  CreateFuelExpenseResponse
} from '@types/fuel';

// Mock del API
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

import api from '../api';

describe('FuelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFuelExpense', () => {
    it('should create fuel expense with valid data', async () => {
      // Arrange
      const mockFuelExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 }, // Santiago
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 }, // Las Condes
        originAddress: 'Plaza de Armas, Santiago',
        destinationAddress: 'Las Condes, Santiago',
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Visita cliente importante',
        description: 'Reunión con cliente estratégico'
      };

      const mockResponse: CreateFuelExpenseResponse = {
        success: true,
        fuelExpense: {
          id: 'fuel-123',
          userId: 'user-456',
          routeData: {
            origin: {
              coordinates: mockFuelExpenseData.originCoordinates,
              address: 'Plaza de Armas, Santiago',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: mockFuelExpenseData.destinationCoordinates,
              address: 'Las Condes, Santiago',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25,
            polyline: 'encoded_polyline_string'
          },
          vehicleType: VehicleType.ECONOMICO,
          fuelType: FuelType.GASOLINA_93,
          calculation: {
            routeData: {
              origin: {
                coordinates: mockFuelExpenseData.originCoordinates,
                address: 'Plaza de Armas, Santiago',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile'
              },
              destination: {
                coordinates: mockFuelExpenseData.destinationCoordinates,
                address: 'Las Condes, Santiago',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile'
              },
              distance: 15.5,
              duration: 25
            },
            vehicleType: VehicleType.ECONOMICO,
            fuelType: FuelType.GASOLINA_93,
            fuelPrice: 850,
            fuelNeeded: 1.03, // 15.5 km / 15 km/l
            totalCost: 876, // 1.03 * 850
            consumption: 15
          },
          businessPurpose: 'Visita cliente importante',
          description: 'Reunión con cliente estratégico',
          status: 'draft',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        message: 'Gasto de combustible creado exitosamente'
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResponse
      });

      // Act
      const result = await fuelService.createFuelExpense(mockFuelExpenseData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/fuel-expenses', mockFuelExpenseData);
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.fuelExpense.calculation.totalCost).toBe(876);
      expect(result.fuelExpense.calculation.fuelNeeded).toBe(1.03);
    });

    it('should handle API error when creating fuel expense', async () => {
      // Arrange
      const mockFuelExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Viaje de negocios'
      };

      (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(fuelService.createFuelExpense(mockFuelExpenseData))
        .rejects.toThrow('Network error');
    });

    it('should validate coordinates are within Chile bounds', async () => {
      // Arrange
      const invalidData: CreateFuelExpenseData = {
        originCoordinates: { lat: 40.7128, lng: -74.0060 }, // New York
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Viaje internacional'
      };

      (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Coordinates must be within Chile bounds')
      );

      // Act & Assert
      await expect(fuelService.createFuelExpense(invalidData))
        .rejects.toThrow('Coordinates must be within Chile bounds');
    });
  });

  describe('getFuelExpenses', () => {
    it('should fetch fuel expenses with filters', async () => {
      // Arrange
      const mockFilters: FuelExpenseFilters = {
        status: 'approved',
        vehicleType: VehicleType.ECONOMICO,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      };

      const mockFuelExpenses: FuelExpense[] = [
        {
          id: 'fuel-1',
          userId: 'user-123',
          routeData: {
            origin: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago', 
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: VehicleType.ECONOMICO,
          fuelType: FuelType.GASOLINA_93,
          calculation: {
            routeData: {
              origin: {
                coordinates: { lat: -33.4489, lng: -70.6693 },
                address: 'Santiago Centro',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile'
              },
              destination: {
                coordinates: { lat: -33.3745, lng: -70.5728 },
                address: 'Las Condes',
                city: 'Santiago',
                region: 'Metropolitana', 
                country: 'Chile'
              },
              distance: 15.5,
              duration: 25
            },
            vehicleType: VehicleType.ECONOMICO,
            fuelType: FuelType.GASOLINA_93,
            fuelPrice: 850,
            fuelNeeded: 1.03,
            totalCost: 876,
            consumption: 15
          },
          businessPurpose: 'Visita cliente',
          status: 'approved',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ];

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockFuelExpenses }
      });

      // Act
      const result = await fuelService.getFuelExpenses(mockFilters);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/fuel-expenses', { 
        params: mockFilters 
      });
      expect(result).toEqual(mockFuelExpenses);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
    });

    it('should fetch all fuel expenses when no filters provided', async () => {
      // Arrange
      const mockFuelExpenses: FuelExpense[] = [];
      
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockFuelExpenses }
      });

      // Act
      const result = await fuelService.getFuelExpenses();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/fuel-expenses', { params: {} });
      expect(result).toEqual(mockFuelExpenses);
    });
  });

  describe('getFuelExpenseById', () => {
    it('should fetch fuel expense by ID', async () => {
      // Arrange
      const mockId = 'fuel-123';
      const mockFuelExpense: FuelExpense = {
        id: mockId,
        userId: 'user-456',
        routeData: {
          origin: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 25
        },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        calculation: {
          routeData: {
            origin: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: VehicleType.ECONOMICO,
          fuelType: FuelType.GASOLINA_93,
          fuelPrice: 850,
          fuelNeeded: 1.03,
          totalCost: 876,
          consumption: 15
        },
        businessPurpose: 'Visita cliente importante',
        status: 'approved',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockFuelExpense }
      });

      // Act
      const result = await fuelService.getFuelExpenseById(mockId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/fuel-expenses/${mockId}`);
      expect(result).toEqual(mockFuelExpense);
    });

    it('should throw error when fuel expense not found', async () => {
      // Arrange
      const mockId = 'non-existent-id';
      
      (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Fuel expense not found')
      );

      // Act & Assert
      await expect(fuelService.getFuelExpenseById(mockId))
        .rejects.toThrow('Fuel expense not found');
    });
  });

  describe('updateFuelExpense', () => {
    it('should update fuel expense successfully', async () => {
      // Arrange
      const mockId = 'fuel-123';
      const updateData = {
        businessPurpose: 'Propósito actualizado',
        description: 'Descripción actualizada'
      };
      
      const updatedExpense: FuelExpense = {
        id: mockId,
        userId: 'user-456',
        routeData: {
          origin: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 25
        },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        calculation: {
          routeData: {
            origin: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: VehicleType.ECONOMICO,
          fuelType: FuelType.GASOLINA_93,
          fuelPrice: 850,
          fuelNeeded: 1.03,
          totalCost: 876,
          consumption: 15
        },
        businessPurpose: updateData.businessPurpose,
        description: updateData.description,
        status: 'draft',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z'
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: updatedExpense }
      });

      // Act
      const result = await fuelService.updateFuelExpense(mockId, updateData);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/fuel-expenses/${mockId}`, updateData);
      expect(result).toEqual(updatedExpense);
      expect(result.businessPurpose).toBe(updateData.businessPurpose);
      expect(result.description).toBe(updateData.description);
    });
  });

  describe('deleteFuelExpense', () => {
    it('should delete fuel expense successfully', async () => {
      // Arrange
      const mockId = 'fuel-123';
      
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, message: 'Fuel expense deleted successfully' }
      });

      // Act
      await fuelService.deleteFuelExpense(mockId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/fuel-expenses/${mockId}`);
    });

    it('should handle error when deleting non-existent fuel expense', async () => {
      // Arrange
      const mockId = 'non-existent-id';
      
      (api.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Fuel expense not found')
      );

      // Act & Assert
      await expect(fuelService.deleteFuelExpense(mockId))
        .rejects.toThrow('Fuel expense not found');
    });
  });

  describe('getFuelExpenseStats', () => {
    it('should fetch fuel expense statistics', async () => {
      // Arrange
      const mockStats: FuelExpenseStats = {
        totalExpenses: 25,
        totalAmount: 45000,
        totalDistance: 580.5,
        totalFuelLiters: 42.3,
        averageCostPerKm: 77.5,
        byVehicleType: {
          [VehicleType.ECONOMICO]: {
            count: 15,
            totalAmount: 25000,
            totalDistance: 350.0
          },
          [VehicleType.INTERMEDIO]: {
            count: 7,
            totalAmount: 15000,
            totalDistance: 180.0
          },
          [VehicleType.SUV]: {
            count: 3,
            totalAmount: 5000,
            totalDistance: 50.5
          }
        },
        byFuelType: {
          [FuelType.GASOLINA_93]: {
            count: 18,
            totalAmount: 32000,
            totalLiters: 28.5
          },
          [FuelType.GASOLINA_95]: {
            count: 5,
            totalAmount: 9000,
            totalLiters: 9.2
          },
          [FuelType.GASOLINA_97]: {
            count: 1,
            totalAmount: 2000,
            totalLiters: 2.1
          },
          [FuelType.DIESEL]: {
            count: 1,
            totalAmount: 2000,
            totalLiters: 2.5
          }
        },
        byStatus: {
          draft: 5,
          submitted: 8,
          approved: 10,
          rejected: 2
        }
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockStats }
      });

      // Act
      const result = await fuelService.getFuelExpenseStats();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/fuel-expenses/stats');
      expect(result).toEqual(mockStats);
      expect(result.totalExpenses).toBe(25);
      expect(result.totalAmount).toBe(45000);
      expect(result.averageCostPerKm).toBe(77.5);
    });
  });
});