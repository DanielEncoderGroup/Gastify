import { Receipt, BackendProduct } from '../types/receipt';
import api from './api';

// Interface for createReceiptWithImage response
export interface CreateReceiptWithImageResponse {
  success: boolean;
  receipt: Receipt;
  analysis?: {
    confidence: number;
    ocrData?: unknown;
    category?: string;
  };
  message: string;
}

export interface CreateReceiptData {
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
  // Campos adicionales para productos y análisis
  products?: BackendProduct[];
  analysisData?: {
    ocrData?: unknown;
    parserResults?: unknown;
    suggestedFormData?: unknown;
    confidence?: number;
    rawText?: string;
  } | null;
}

class ReceiptService {
  /**
   * Crear un nuevo recibo desde JSON (método corregido)
   */
  async createReceipt(receiptData: CreateReceiptData): Promise<Receipt> {
    const response = await api.post('/receipts/json', receiptData);
    
    // El backend devuelve {success: true, receipt: {...}}, extraer solo el receipt
    if (response.data && response.data.success && response.data.receipt) {
      return response.data.receipt;
    }
    
    // Si la estructura es diferente, intentar devolver los datos directamente
    throw new Error('Respuesta del servidor inválida: no se encontró el recibo creado');
  }

  /**
   * Crear un nuevo recibo con imagen (FLUJO AUTOMÁTICO)
   * Este método envía la imagen al backend que automáticamente:
   * 1. Procesa OCR
   * 2. Categoriza con ML
   * 3. Extrae geolocalización
   * 4. Guarda en base de datos
   */
  async createReceiptWithImage(imageFile: File, additionalData?: Record<string, unknown>): Promise<CreateReceiptWithImageResponse> {
    const formDataToSend = new FormData();
    
    // Agregar imagen
    formDataToSend.append('image', imageFile);
    // No products found
    // Si se proporcionan datos del formulario, usarlos
    // Si no, el backend los extraerá automáticamente con OCR
    formDataToSend.append('companyName', (additionalData?.companyName as string) || 'Auto-detectado');
    formDataToSend.append('folioNumber', (additionalData?.folioNumber as string) || 'Auto-detectado');
    formDataToSend.append('date', (additionalData?.date as string) || new Date().toISOString().split('T')[0]);
    formDataToSend.append('description', (additionalData?.description as string) || 'Procesado automáticamente con IA');
    
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
  }

  /**
   * Obtener todos los recibos del usuario con estadísticas
   */
  async getReceipts(): Promise<Receipt[]> {
    const response = await api.get('/receipts');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Obtener recibos y estadísticas en una sola llamada (optimizado)
   */
  async getReceiptsWithStats(): Promise<{
    receipts: Receipt[];
    stats: {
      totalReceipts: number;
      totalAmount: number;
      enRevision: number;
      aceptadas: number;
      rechazadas: number;
    };
  }> {
    const response = await api.get('/receipts');
    if (response.data && response.data.success) {
      return {
        receipts: response.data.data || [],
        stats: response.data.stats || {
          totalReceipts: 0,
          totalAmount: 0,
          enRevision: 0,
          aceptadas: 0,
          rechazadas: 0
        }
      };
    }
    throw new Error('Invalid response structure');
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
    const response = await api.get('/receipts/stats');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return {
      totalReceipts: 0,
      totalAmount: 0,
      enRevision: 0,
      aceptadas: 0,
      rechazadas: 0
    };
  }

  /**
   * Obtener un recibo por ID
   */
  async getReceiptById(id: string): Promise<Receipt> {
    const response = await api.get(`/receipts/${id}`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format from server');
  }

  /**
   * Actualizar un recibo
   */
  async updateReceipt(id: string, receiptData: Partial<CreateReceiptData>): Promise<Receipt> {
    const response = await api.put(`/receipts/${id}`, receiptData);
    return response.data;
  }

  /**
   * Eliminar un recibo
   */
  async deleteReceipt(id: string): Promise<void> {
    await api.delete(`/receipts/${id}`);
  }
}

export const receiptService = new ReceiptService();
