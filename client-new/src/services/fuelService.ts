import api from './api';
import { 
  CreateFuelExpenseData, 
  CreateFuelExpenseResponse,
  FuelExpense,
  FuelExpenseFilters,
  FuelExpenseStats
} from '../types/fuel';

/**
 * Servicio para gestión de gastos de combustible
 * Sigue el patrón establecido por receiptService
 */
export const fuelService = {
  /**
   * Crear un nuevo gasto de combustible
   */
  createFuelExpense: async (data: CreateFuelExpenseData): Promise<CreateFuelExpenseResponse> => {
    try {
      const response = await api.post('/fuel-expenses', data);
      return response.data;
    } catch (error) {
      console.error('Error creating fuel expense:', error);
      throw error;
    }
  },

  /**
   * Obtener lista de gastos de combustible con filtros opcionales
   */
  getFuelExpenses: async (filters: FuelExpenseFilters = {}): Promise<FuelExpense[]> => {
    try {
      const response = await api.get('/fuel-expenses', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel expenses:', error);
      throw error;
    }
  },

  /**
   * Obtener un gasto de combustible por ID
   */
  getFuelExpenseById: async (id: string): Promise<FuelExpense> => {
    try {
      const response = await api.get(`/fuel-expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel expense by ID:', error);
      throw error;
    }
  },

  /**
   * Actualizar un gasto de combustible existente
   */
  updateFuelExpense: async (id: string, data: Partial<CreateFuelExpenseData>): Promise<FuelExpense> => {
    try {
      const response = await api.put(`/fuel-expenses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating fuel expense:', error);
      throw error;
    }
  },

  /**
   * Eliminar un gasto de combustible
   */
  deleteFuelExpense: async (id: string): Promise<void> => {
    try {
      await api.delete(`/fuel-expenses/${id}`);
    } catch (error) {
      console.error('Error deleting fuel expense:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de gastos de combustible
   */
  getFuelExpenseStats: async (): Promise<FuelExpenseStats> => {
    try {
      const response = await api.get('/fuel-expenses/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel expense stats:', error);
      throw error;
    }
  },

  /**
   * Cambiar estado de un gasto de combustible (para workflow)
   */
  updateFuelExpenseStatus: async (
    id: string, 
    status: 'submitted' | 'approved' | 'rejected', 
    reason?: string
  ): Promise<FuelExpense> => {
    try {
      const response = await api.patch(`/fuel-expenses/${id}/status`, { status, reason });
      return response.data;
    } catch (error) {
      console.error('Error updating fuel expense status:', error);
      throw error;
    }
  },

  /**
   * Subir archivo adjunto a un gasto de combustible
   */
  uploadAttachment: async (id: string, file: File): Promise<{ url: string; name: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/fuel-expenses/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading fuel expense attachment:', error);
      throw error;
    }
  }
};

export default fuelService;