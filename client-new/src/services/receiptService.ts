import api from './api';

export interface Receipt {
  id: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptData {
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
}

class ReceiptService {
  /**
   * Crear un nuevo recibo (método legacy)
   */
  async createReceipt(receiptData: CreateReceiptData): Promise<Receipt> {
    try {
      const response = await api.post('/receipts', receiptData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear un nuevo recibo con imagen (FLUJO AUTOMÁTICO)
   * Este método envía la imagen al backend que automáticamente:
   * 1. Procesa OCR
   * 2. Categoriza con ML
   * 3. Extrae geolocalización
   * 4. Guarda en base de datos
   */
  async createReceiptWithImage(
    imageFile: File,
    formData?: Partial<CreateReceiptData>
  ): Promise<{
    success: boolean;
    receipt: Receipt;
    analysis: any;
    message: string;
  }> {
    try {
      const formDataToSend = new FormData();
      
      // Agregar imagen
      formDataToSend.append('image', imageFile);
      
      // Si se proporcionan datos del formulario, usarlos
      // Si no, el backend los extraerá automáticamente con OCR
      formDataToSend.append('companyName', formData?.companyName || 'Auto-detectado');
      formDataToSend.append('folioNumber', formData?.folioNumber || 'Auto-detectado');
      formDataToSend.append('date', formData?.date || new Date().toISOString().split('T')[0]);
      formDataToSend.append('description', formData?.description || 'Procesado automáticamente con IA');
      formDataToSend.append('totalAmount', formData?.totalAmount?.toString() || '0');
      
      const response = await api.post('/receipts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        receipt: response.data.receipt,
        analysis: response.data.analysis,
        message: 'Recibo procesado automáticamente con IA'
      };
    } catch (error: any) {
      console.error('Error creating receipt with image:', error);
      const errorMessage = error.response?.data?.detail || 'Error al procesar el recibo';
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener todos los recibos del usuario
   */
  async getReceipts(): Promise<Receipt[]> {
    try {
      const response = await api.get('/receipts');
      // El backend devuelve {success: boolean, count: number, data: Receipt[]}
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Fallback: si la respuesta no tiene la estructura esperada, devolver array vacío
      console.warn('Unexpected response structure from /receipts endpoint:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching receipts:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de recibos del usuario
   */
  async getReceiptStats(): Promise<{
    totalReceipts: number;
    totalAmount: number;
    enRevision: number;
    aceptadas: number;
    rechazadas: number;
  }> {
    try {
      const response = await api.get('/receipts/stats');
      // El backend devuelve {success: boolean, data: {...}}
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      // Fallback: devolver estadísticas vacías si la estructura no es la esperada
      console.warn('Unexpected response structure from /receipts/stats endpoint:', response.data);
      return {
        totalReceipts: 0,
        totalAmount: 0,
        enRevision: 0,
        aceptadas: 0,
        rechazadas: 0
      };
    } catch (error) {
      console.error('Error fetching receipt stats:', error);
      console.warn('Stats endpoint not available, will calculate locally');
      throw error;
    }
  }

  /**
   * Obtener un recibo por ID
   */
  async getReceiptById(id: string): Promise<Receipt> {
    try {
      const response = await api.get(`/receipts/${id}`);
      // El backend devuelve {success: boolean, data: Receipt}
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      // Si la estructura no es la esperada, lanzar error
      console.error('Unexpected response structure from /receipts/{id} endpoint:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error fetching receipt by ID:', error);
      throw error;
    }
  }

  /**
   * Actualizar un recibo
   */
  async updateReceipt(id: string, receiptData: Partial<CreateReceiptData>): Promise<Receipt> {
    try {
      const response = await api.put(`/receipts/${id}`, receiptData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar un recibo
   */
  async deleteReceipt(id: string): Promise<void> {
    try {
      await api.delete(`/receipts/${id}`);
    } catch (error) {
      throw error;
    }
  }
}

export const receiptService = new ReceiptService();
