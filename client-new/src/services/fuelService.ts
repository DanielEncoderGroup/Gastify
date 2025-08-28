import api from './api';
import { 
  CreateFuelExpenseData, 
  CreateFuelExpenseResponse,
  FuelExpense,
  FuelExpenseFilters,
  FuelExpenseStats,
  RouteData,
  FuelCalculation
} from '../types/fuel';

/**
 * Mapear respuesta del backend al formato frontend
 */
const mapFromBackendFormat = (backendExpense: any): FuelExpense => {
  return {
    id: backendExpense.id,
    userId: backendExpense.user_id,
    employerId: backendExpense.employer_id,
    
    // Reconstruir routeData desde campos planos
    routeData: {
      origin: {
        coordinates: {
          lat: backendExpense.origin_lat,
          lng: backendExpense.origin_lng
        },
        address: backendExpense.origin_address || '',
        city: '', // No disponible en backend actual
        region: '', // No disponible en backend actual  
        country: 'Chile'
      },
      destination: {
        coordinates: {
          lat: backendExpense.destination_lat,
          lng: backendExpense.destination_lng
        },
        address: backendExpense.destination_address || '',
        city: '', // No disponible en backend actual
        region: '', // No disponible en backend actual
        country: 'Chile'
      },
      distance: backendExpense.distance_km,
      duration: 0, // No disponible en backend actual
      polyline: undefined
    },
    
    // Datos del vehículo y combustible
    vehicleType: backendExpense.vehicle_type,
    fuelType: backendExpense.fuel_type,
    
    // Reconstruir calculation desde campos planos
    calculation: {
      routeData: {} as RouteData, // Se llenará con routeData de arriba
      vehicleType: backendExpense.vehicle_type,
      fuelType: backendExpense.fuel_type,
      fuelPrice: backendExpense.fuel_price_per_liter,
      fuelNeeded: backendExpense.fuel_needed_liters,
      totalCost: backendExpense.total_cost,
      consumption: 0 // Calcular si es necesario
    },
    
    // Justificación
    businessPurpose: backendExpense.business_purpose,
    description: backendExpense.description,
    
    // Estado
    status: backendExpense.status || 'submitted',
    
    // Metadatos
    createdAt: backendExpense.created_at,
    updatedAt: backendExpense.updated_at
  };
};

/**
 * Mapear datos del frontend al formato esperado por el backend
 */
const mapToBackendFormat = (
  frontendData: CreateFuelExpenseData, 
  routeData: RouteData, 
  calculation: FuelCalculation
) => {
  return {
    // Coordenadas planas
    origin_lat: frontendData.originCoordinates.lat,
    origin_lng: frontendData.originCoordinates.lng,
    destination_lat: frontendData.destinationCoordinates.lat,
    destination_lng: frontendData.destinationCoordinates.lng,
    
    // Direcciones
    origin_address: frontendData.originAddress || routeData.origin.address || '',
    destination_address: frontendData.destinationAddress || routeData.destination.address || '',
    
    // Datos del vehículo y combustible
    vehicle_type: frontendData.vehicleType,
    fuel_type: frontendData.fuelType,
    
    // Justificación
    business_purpose: frontendData.businessPurpose,
    description: frontendData.description || null,
    
    // Datos calculados
    distance_km: routeData.distance,
    fuel_needed_liters: calculation.fuelNeeded,
    fuel_price_per_liter: calculation.fuelPrice,
    total_cost: calculation.totalCost
  };
};

/**
 * Servicio para gestión de gastos de combustible
 * Sigue el patrón establecido por receiptService
 */
export const fuelService = {
  /**
   * Crear un nuevo gasto de combustible
   */
  createFuelExpense: async (
    data: CreateFuelExpenseData, 
    routeData: RouteData, 
    calculation: FuelCalculation
  ): Promise<CreateFuelExpenseResponse> => {
    try {
      const backendData = mapToBackendFormat(data, routeData, calculation);
      const response = await api.post('/fuel-expenses', backendData);
      
      // Mapear respuesta del backend al formato frontend
      const mappedExpense = mapFromBackendFormat(response.data);
      return {
        success: true,
        fuelExpense: mappedExpense,
        message: 'Gasto de combustible creado exitosamente'
      };
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
      // Mapear cada gasto del backend al formato frontend
      return response.data.map(mapFromBackendFormat);
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
      return mapFromBackendFormat(response.data);
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