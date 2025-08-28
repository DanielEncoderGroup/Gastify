import { useState, useEffect, useCallback } from 'react';
import { 
  FuelExpense, 
  CreateFuelExpenseData, 
  CreateFuelExpenseResponse,
  FuelExpenseFilters,
  FuelExpenseStats
} from '@types/fuel';
import { fuelService } from '@services/fuelService';

/**
 * Hook personalizado para gestión de gastos de combustible
 * Proporciona funciones CRUD y estado de loading/error
 */
export const useFuelExpenses = () => {
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FuelExpenseStats | null>(null);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Crear un nuevo gasto de combustible
   */
  const createExpense = useCallback(async (data: CreateFuelExpenseData): Promise<CreateFuelExpenseResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fuelService.createFuelExpense(data);
      
      if (response.success && response.fuelExpense) {
        // Agregar el nuevo gasto al estado local
        setExpenses(prev => [response.fuelExpense, ...prev]);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creando gasto de combustible';
      setError(errorMessage);
      console.error('Error creating fuel expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener lista de gastos de combustible con filtros
   */
  const fetchExpenses = useCallback(async (filters?: FuelExpenseFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedExpenses = await fuelService.getFuelExpenses(filters);
      setExpenses(fetchedExpenses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo gastos de combustible';
      setError(errorMessage);
      console.error('Error fetching fuel expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener un gasto de combustible por ID
   */
  const getExpenseById = useCallback(async (id: string): Promise<FuelExpense | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const expense = await fuelService.getFuelExpenseById(id);
      return expense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo gasto de combustible';
      setError(errorMessage);
      console.error('Error fetching fuel expense by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar un gasto de combustible
   */
  const updateExpense = useCallback(async (
    id: string, 
    data: Partial<CreateFuelExpenseData>
  ): Promise<FuelExpense | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedExpense = await fuelService.updateFuelExpense(id, data);
      
      // Actualizar en el estado local
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
      
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando gasto de combustible';
      setError(errorMessage);
      console.error('Error updating fuel expense:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar un gasto de combustible
   */
  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await fuelService.deleteFuelExpense(id);
      
      // Remover del estado local
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando gasto de combustible';
      setError(errorMessage);
      console.error('Error deleting fuel expense:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar estado de un gasto de combustible
   */
  const updateExpenseStatus = useCallback(async (
    id: string,
    status: 'submitted' | 'approved' | 'rejected',
    reason?: string
  ): Promise<FuelExpense | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedExpense = await fuelService.updateFuelExpenseStatus(id, status, reason);
      
      // Actualizar en el estado local
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
      
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando estado del gasto';
      setError(errorMessage);
      console.error('Error updating fuel expense status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de gastos de combustible
   */
  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedStats = await fuelService.getFuelExpenseStats();
      setStats(fetchedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo estadísticas';
      setError(errorMessage);
      console.error('Error fetching fuel expense stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subir archivo adjunto a un gasto
   */
  const uploadAttachment = useCallback(async (
    id: string, 
    file: File
  ): Promise<{ url: string; name: string } | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const attachment = await fuelService.uploadAttachment(id, file);
      
      // Actualizar el gasto en el estado local con el nuevo adjunto
      setExpenses(prev => 
        prev.map(expense => {
          if (expense.id === id) {
            const updatedAttachments = expense.attachments || [];
            return {
              ...expense,
              attachments: [
                ...updatedAttachments,
                {
                  type: file.type.startsWith('image/') ? 'image' : 'document',
                  url: attachment.url,
                  name: attachment.name
                }
              ]
            };
          }
          return expense;
        })
      );
      
      return attachment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error subiendo archivo adjunto';
      setError(errorMessage);
      console.error('Error uploading attachment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filtrar gastos localmente (para búsquedas rápidas)
   */
  const filterExpensesLocally = useCallback((searchTerm: string): FuelExpense[] => {
    if (!searchTerm.trim()) return expenses;
    
    const term = searchTerm.toLowerCase();
    return expenses.filter(expense => 
      expense.businessPurpose.toLowerCase().includes(term) ||
      expense.description?.toLowerCase().includes(term) ||
      expense.routeData.origin.address.toLowerCase().includes(term) ||
      expense.routeData.destination.address.toLowerCase().includes(term) ||
      expense.vehicleType.toLowerCase().includes(term) ||
      expense.fuelType.toLowerCase().includes(term)
    );
  }, [expenses]);

  /**
   * Obtener gastos por estado
   */
  const getExpensesByStatus = useCallback((status: FuelExpense['status']): FuelExpense[] => {
    return expenses.filter(expense => expense.status === status);
  }, [expenses]);

  /**
   * Obtener gasto más reciente
   */
  const getMostRecentExpense = useCallback((): FuelExpense | null => {
    if (expenses.length === 0) return null;
    
    return expenses.reduce((mostRecent, current) => {
      const currentDate = new Date(current.createdAt);
      const mostRecentDate = new Date(mostRecent.createdAt);
      return currentDate > mostRecentDate ? current : mostRecent;
    });
  }, [expenses]);

  /**
   * Calcular totales locales (para mostrar resúmenes rápidos)
   */
  const getLocalTotals = useCallback(): {
    totalExpenses: number;
    totalAmount: number;
    totalDistance: number;
    totalFuelLiters: number;
  } => {
    const totals = expenses.reduce(
      (acc, expense) => ({
        totalExpenses: acc.totalExpenses + 1,
        totalAmount: acc.totalAmount + expense.calculation.totalCost,
        totalDistance: acc.totalDistance + expense.routeData.distance,
        totalFuelLiters: acc.totalFuelLiters + expense.calculation.fuelNeeded
      }),
      { totalExpenses: 0, totalAmount: 0, totalDistance: 0, totalFuelLiters: 0 }
    );

    return {
      ...totals,
      totalDistance: Math.round(totals.totalDistance * 100) / 100,
      totalFuelLiters: Math.round(totals.totalFuelLiters * 100) / 100
    };
  }, [expenses]);

  // Cargar gastos inicialmente
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    // Estado
    expenses,
    loading,
    error,
    stats,
    
    // Funciones CRUD
    createExpense,
    fetchExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    updateExpenseStatus,
    uploadAttachment,
    
    // Estadísticas
    fetchStats,
    
    // Utilidades
    clearError,
    filterExpensesLocally,
    getExpensesByStatus,
    getMostRecentExpense,
    getLocalTotals,
    
    // Propiedades computadas
    hasExpenses: expenses.length > 0,
    expenseCount: expenses.length
  };
};

export default useFuelExpenses;