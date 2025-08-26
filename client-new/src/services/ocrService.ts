import api from './api';
import type {
  ReceiptProduct,
  ChileReceiptMetadata,
  ReceiptTransaction,
  ReceiptLocation,
  OCRDataExpanded
} from '../types';

export interface OCRAnalysisResult {
  success: boolean;
  message: string;
  analysis: {
    ocr?: OCRDataExpanded;
    parser_results?: {
      raw_text: string;
      products: ReceiptProduct[];
      extraction_metadata: {
        products_found: number;
        parser_version: string;
        processing_date: string;
      };
      location?: any;
      transaction?: any;
    };
    categorization: {
      category: string;
      confidence: number;
      method: string;
      chile_specific: {
        rut_detected: boolean;
        document_type: string;
        iva_detected: boolean;
        known_brand: string | null;
      };
      all_probabilities: Record<string, number>;
    } | null;
    geolocation: {
      location: any;
      extraction_method: string;
      confidence: number;
    } | null;
    suggested_form_data: {
      companyName: string;
      totalAmount: number;
      date: string;
      category: string;
      description: string;
      folioNumber: string;
      // Datos estructurados del parser avanzado
      detailed_products?: ReceiptProduct[];
      transaction_data?: ReceiptTransaction;
      location_data?: ReceiptLocation;
      chile_metadata?: ChileReceiptMetadata;
    };
  };
  confidence_summary: {
    ocr_confidence?: number;
    category_confidence?: number;
    location_confidence?: number;
    overall_confidence: number;
    // Nuevas métricas de confianza del parser avanzado
    products_confidence?: number;
    transaction_confidence?: number;
    parsing_confidence?: number;
  };
}

export interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employer_id?: string;
  company_name?: string;
  department?: string;
  position?: string;
  createdAt: string;
}

export interface EmployeeReceipts {
  employee: {
    id: string;
    name: string;
    email: string;
    department?: string;
    position?: string;
  };
  receipts: Array<any>;
  total_receipts: number;
}

export interface AllEmployeeReceipts {
  employees: Array<{
    name: string;
    email: string;
    department?: string;
    position?: string;
  }>;
  receipts: Array<any>;
  total_receipts: number;
  summary: {
    total_employees: number;
    total_amount: number;
    receipts_by_employee: Record<string, {
      employee_name: string;
      count: number;
      total_amount: number;
    }>;
  };
}

class OCRService {
  /**
   * Procesa y estructura datos OCR crudos
   */
  private processOCRData(ocrData: any): OCRDataExpanded {
    return {
      vendor: ocrData.vendor || null,
      total_amount: ocrData.total_amount || null,
      date: ocrData.date || null,
      items: ocrData.items || [],
      raw_text: ocrData.raw_text || '',
      confidence: ocrData.confidence || 0,
      detailed_items: ocrData.detailed_items || [],
      total_items_count: ocrData.total_items_count || 0,
      chile_metadata: ocrData.chile_metadata || null,
      transaction_data: ocrData.transaction_data || null,
      location_data: ocrData.location_data || null,
      ocr_engine_used: ocrData.ocr_engine_used || 'tesseract',
      processing_time: ocrData.processing_time || null,
      language_detected: ocrData.language_detected || null,
      parsing_confidence: ocrData.parsing_confidence || null
    };
  }
  /**
   * Analiza automáticamente un recibo usando OCR avanzado, ML y geolocalización
   * Ahora incluye extracción detallada de productos con el parser chileno avanzado
   */
  async analyzeReceipt(imageFile: File): Promise<OCRAnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Usar el endpoint avanzado que incluye el parser estructurado
    const response = await api.post('/ocr/analyze-receipt-advanced', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Analiza un recibo con el método inteligente (fallback)
   */
  async analyzeReceiptIntelligent(imageFile: File): Promise<OCRAnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/ocr/analyze-receipt-intelligent', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Verifica el estado de los servicios OCR
   */
  async healthCheck(): Promise<any> {
    const response = await api.get('/ocr/health');
    return response.data;
  }

  /**
   * Obtiene la lista de empleados (para empleadores)
   */
  async getMyEmployees(): Promise<EmployeeInfo[]> {
    const response = await api.get('/employees/my-employees');
    return response.data;
  }

  /**
   * Obtiene información del empleador (para empleados)
   */
  async getMyEmployer(): Promise<EmployeeInfo | null> {
    const response = await api.get('/employees/my-employer');
    return response.data;
  }

  /**
   * Obtiene los recibos de un empleado específico (para empleadores)
   */
  async getEmployeeReceipts(employeeId: string): Promise<EmployeeReceipts> {
    const response = await api.get(`/employees/employee-receipts/${employeeId}`);
    return response.data;
  }

  /**
   * Obtiene todos los recibos de todos los empleados (para empleadores)
   */
  async getAllEmployeeReceipts(): Promise<AllEmployeeReceipts> {
    const response = await api.get('/employees/all-employee-receipts');
    return response.data;
  }

  /**
   * Extrae productos detallados de un texto OCR usando el parser avanzado
   */
  async extractDetailedProducts(rawText: string): Promise<ReceiptProduct[]> {
    const response = await api.post('/ocr/extract-products', {
      raw_text: rawText
    });
    return response.data.products || [];
  }

  /**
   * Valida la consistencia de datos extraídos
   */
  async validateReceiptData(products: ReceiptProduct[], totalAmount: number): Promise<{
    is_valid: boolean;
    discrepancies: string[];
    calculated_total: number;
    confidence: number;
  }> {
    const response = await api.post('/ocr/validate-receipt', {
      products,
      declared_total: totalAmount
    });
    return response.data;
  }
}

export const ocrService = new OCRService();
