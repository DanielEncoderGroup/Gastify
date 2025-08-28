import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFuelExpenses } from '../useFuelExpenses';
import { fuelService } from '@services/fuelService';
import { 
  FuelExpense, 
  CreateFuelExpenseData, 
  FuelExpenseFilters,
  VehicleType,
  FuelType 
} from '@types/fuel';

// Mock del servicio
vi.mock('@services/fuelService', () => ({
  fuelService: {
    getFuelExpenses: vi.fn(),
    createFuelExpense: vi.fn(),
    updateFuelExpense: vi.fn(),
    deleteFuelExpense: vi.fn(),
    getFuelExpenseById: vi.fn(),
    getFuelExpenseStats: vi.fn()
  }
}));

describe('useFuelExpenses', () => {
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
      businessPurpose: 'Visita cliente importante',
      status: 'approved',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'fuel-2',
      userId: 'user-123',
      routeData: {
        origin: {
          coordinates: { lat: -33.3745, lng: -70.5728 },
          address: 'Las Condes',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile'
        },
        destination: {
          coordinates: { lat: -33.4489, lng: -70.6693 },
          address: 'Santiago Centro',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile'
        },
        distance: 15.5,
        duration: 30
      },
      vehicleType: VehicleType.INTERMEDIO,
      fuelType: FuelType.GASOLINA_95,
      calculation: {
        routeData: {
          origin: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 30
        },
        vehicleType: VehicleType.INTERMEDIO,
        fuelType: FuelType.GASOLINA_95,
        fuelPrice: 890,
        fuelNeeded: 1.55,
        totalCost: 1380,
        consumption: 10
      },
      businessPurpose: 'Reunión estratégica',
      status: 'pending',
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-16T09:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty expenses and loading false', async () => {
      // Arrange
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useFuelExpenses());

      // Assert
      expect(result.current.expenses).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should auto-fetch expenses on mount', async () => {
      // Arrange
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      // Act
      const { result } = renderHook(() => useFuelExpenses());

      // Assert
      await waitFor(() => {
        expect(fuelService.getFuelExpenses).toHaveBeenCalledOnce();
        expect(result.current.expenses).toEqual(mockFuelExpenses);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('fetchExpenses', () => {
    it('should fetch expenses with filters', async () => {
      // Arrange
      const filters: FuelExpenseFilters = {
        status: 'approved',
        vehicleType: VehicleType.ECONOMICO
      };
      
      const filteredExpenses = [mockFuelExpenses[0]];
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(filteredExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Act
      await act(async () => {
        await result.current.fetchExpenses(filters);
      });

      // Assert
      expect(fuelService.getFuelExpenses).toHaveBeenCalledWith(filters);
      expect(result.current.expenses).toEqual(filteredExpenses);
    });

    it('should handle fetch error gracefully', async () => {
      // Arrange
      const errorMessage = 'Network error';
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useFuelExpenses());

      // Act
      await act(async () => {
        await result.current.fetchExpenses();
      });

      // Assert
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.expenses).toEqual([]);
    });

    it('should set loading state during fetch', async () => {
      // Arrange
      let resolvePromise: (value: FuelExpense[]) => void;
      const promise = new Promise<FuelExpense[]>((resolve) => {
        resolvePromise = resolve;
      });
      
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockReturnValue(promise);

      const { result } = renderHook(() => useFuelExpenses());

      // Act
      act(() => {
        result.current.fetchExpenses();
      });

      // Assert - Loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve promise
      act(() => {
        resolvePromise!(mockFuelExpenses);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });
    });
  });

  describe('createExpense', () => {
    it('should create expense successfully', async () => {
      // Arrange
      const newExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Nueva visita cliente'
      };

      const createdExpense = { ...mockFuelExpenses[0], id: 'fuel-new' };
      (fuelService.createFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        fuelExpense: createdExpense,
        message: 'Success'
      });
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { result } = renderHook(() => useFuelExpenses());

      // Act
      await act(async () => {
        const response = await result.current.createExpense(newExpenseData);
        expect(response.success).toBe(true);
      });

      // Assert
      expect(fuelService.createFuelExpense).toHaveBeenCalledWith(newExpenseData);
    });

    it('should handle create expense error', async () => {
      // Arrange
      const newExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Nueva visita cliente'
      };

      (fuelService.createFuelExpense as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Creation failed')
      );
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { result } = renderHook(() => useFuelExpenses());

      // Act & Assert
      await act(async () => {
        await expect(result.current.createExpense(newExpenseData))
          .rejects.toThrow('Creation failed');
      });
    });

    it('should refresh expenses list after creation', async () => {
      // Arrange
      const newExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Nueva visita cliente'
      };

      const createdExpense = { ...mockFuelExpenses[0], id: 'fuel-new' };
      (fuelService.createFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        fuelExpense: createdExpense,
        message: 'Success'
      });
      
      // Mock initial empty list, then list with new expense
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createdExpense]);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual([]);
      });

      // Act
      await act(async () => {
        await result.current.createExpense(newExpenseData);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.expenses).toEqual([createdExpense]);
      });
      expect(fuelService.getFuelExpenses).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateExpense', () => {
    it('should update expense successfully', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      const updateData = { businessPurpose: 'Propósito actualizado' };
      const updatedExpense = { ...mockFuelExpenses[0], ...updateData };

      (fuelService.updateFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue(updatedExpense);
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      await act(async () => {
        const response = await result.current.updateExpense(expenseId, updateData);
        expect(response).toEqual(updatedExpense);
      });

      // Assert
      expect(fuelService.updateFuelExpense).toHaveBeenCalledWith(expenseId, updateData);
    });

    it('should handle update expense error', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      const updateData = { businessPurpose: 'Propósito actualizado' };

      (fuelService.updateFuelExpense as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Update failed')
      );
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Act & Assert
      await act(async () => {
        await expect(result.current.updateExpense(expenseId, updateData))
          .rejects.toThrow('Update failed');
      });
    });

    it('should refresh expenses list after update', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      const updateData = { businessPurpose: 'Propósito actualizado' };
      const updatedExpense = { ...mockFuelExpenses[0], ...updateData };
      const updatedList = [updatedExpense, mockFuelExpenses[1]];

      (fuelService.updateFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue(updatedExpense);
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockFuelExpenses)
        .mockResolvedValueOnce(updatedList);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      await act(async () => {
        await result.current.updateExpense(expenseId, updateData);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.expenses).toEqual(updatedList);
      });
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      
      (fuelService.deleteFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      await act(async () => {
        await result.current.deleteExpense(expenseId);
      });

      // Assert
      expect(fuelService.deleteFuelExpense).toHaveBeenCalledWith(expenseId);
    });

    it('should handle delete expense error', async () => {
      // Arrange
      const expenseId = 'fuel-1';

      (fuelService.deleteFuelExpense as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Act & Assert
      await act(async () => {
        await expect(result.current.deleteExpense(expenseId))
          .rejects.toThrow('Delete failed');
      });
    });

    it('should refresh expenses list after deletion', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      const remainingExpenses = [mockFuelExpenses[1]];

      (fuelService.deleteFuelExpense as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockFuelExpenses)
        .mockResolvedValueOnce(remainingExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      await act(async () => {
        await result.current.deleteExpense(expenseId);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.expenses).toEqual(remainingExpenses);
      });
    });
  });

  describe('getExpenseById', () => {
    it('should get expense by ID successfully', async () => {
      // Arrange
      const expenseId = 'fuel-1';
      const expectedExpense = mockFuelExpenses[0];

      (fuelService.getFuelExpenseById as ReturnType<typeof vi.fn>).mockResolvedValue(expectedExpense);
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { result } = renderHook(() => useFuelExpenses());

      // Act
      const expense = await act(async () => {
        return await result.current.getExpenseById(expenseId);
      });

      // Assert
      expect(fuelService.getFuelExpenseById).toHaveBeenCalledWith(expenseId);
      expect(expense).toEqual(expectedExpense);
    });

    it('should handle get expense by ID error', async () => {
      // Arrange
      const expenseId = 'non-existent';

      (fuelService.getFuelExpenseById as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Expense not found')
      );
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { result } = renderHook(() => useFuelExpenses());

      // Act & Assert
      await act(async () => {
        await expect(result.current.getExpenseById(expenseId))
          .rejects.toThrow('Expense not found');
      });
    });
  });

  describe('filtering and search', () => {
    it('should provide filtered expenses based on status', async () => {
      // Arrange
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      const approvedExpenses = result.current.getExpensesByStatus('approved');
      const pendingExpenses = result.current.getExpensesByStatus('pending');

      // Assert
      expect(approvedExpenses).toEqual([mockFuelExpenses[0]]);
      expect(pendingExpenses).toEqual([mockFuelExpenses[1]]);
    });

    it('should provide filtered expenses based on vehicle type', async () => {
      // Arrange
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      const economicoExpenses = result.current.getExpensesByVehicleType(VehicleType.ECONOMICO);
      const intermedioExpenses = result.current.getExpensesByVehicleType(VehicleType.INTERMEDIO);

      // Assert
      expect(economicoExpenses).toEqual([mockFuelExpenses[0]]);
      expect(intermedioExpenses).toEqual([mockFuelExpenses[1]]);
    });

    it('should calculate total amounts by status', async () => {
      // Arrange
      (fuelService.getFuelExpenses as ReturnType<typeof vi.fn>).mockResolvedValue(mockFuelExpenses);

      const { result } = renderHook(() => useFuelExpenses());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.expenses).toEqual(mockFuelExpenses);
      });

      // Act
      const totalAmount = result.current.getTotalAmount();
      const approvedAmount = result.current.getTotalAmountByStatus('approved');
      const pendingAmount = result.current.getTotalAmountByStatus('pending');

      // Assert
      expect(totalAmount).toBe(876 + 1380); // Sum of both expenses
      expect(approvedAmount).toBe(876);
      expect(pendingAmount).toBe(1380);
    });
  });
});