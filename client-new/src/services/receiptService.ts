import api from './api';
import { 
  ReceiptCreate, 
  ReceiptUpdate, 
  ReceiptStatusUpdate, 
  ReceiptsResponse, 
  ReceiptResponse, 
  ReceiptStatsResponse 
} from '../types/receipt';

/**
 * Servicio para gestionar los recibos (receipts) en la aplicación
 */
export const receiptService = {
  /**
   * Obtiene todos los recibos del usuario actual
   */
  async getReceipts(): Promise<ReceiptsResponse> {
    try {
      const response = await api.get('/receipts');
      return response.data;
    } catch (error) {
      console.error('Error al obtener los recibos:', error);
      throw error;
    }
  },

  /**
   * Obtiene un recibo específico por su ID
   */
  async getReceiptById(id: string): Promise<ReceiptResponse> {
    try {
      const response = await api.get(`/receipts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el recibo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo recibo
   * Nota: Este método utiliza FormData para permitir la carga de archivos
   */
  async createReceipt(receipt: ReceiptCreate): Promise<ReceiptResponse> {
    try {
      const formData = new FormData();
      formData.append('companyName', receipt.companyName);
      formData.append('folioNumber', receipt.folioNumber);
      formData.append('date', receipt.date);
      formData.append('description', receipt.description);
      formData.append('totalAmount', receipt.totalAmount.toString());
      
      if (receipt.image) {
        formData.append('image', receipt.image);
      }

      const response = await api.post('/receipts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear el recibo:', error);
      throw error;
    }
  },

  /**
   * Actualiza un recibo existente
   */
  async updateReceipt(id: string, receipt: ReceiptUpdate): Promise<ReceiptResponse> {
    try {
      const response = await api.put(`/receipts/${id}`, receipt);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el recibo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un recibo
   */
  async updateReceiptStatus(id: string, statusUpdate: ReceiptStatusUpdate): Promise<ReceiptResponse> {
    try {
      const response = await api.patch(`/receipts/${id}/status`, statusUpdate);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el estado del recibo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un recibo
   */
  async deleteReceipt(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/receipts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el recibo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de los recibos del usuario actual
   */
  async getReceiptStats(): Promise<ReceiptStatsResponse> {
    try {
      const response = await api.get('/receipts/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener las estadísticas de recibos:', error);
      throw error;
    }
  }
};
