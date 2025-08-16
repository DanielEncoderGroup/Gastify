import api from './api';

export interface OCRAnalysisResult {
  success: boolean;
  message: string;
  analysis: {
    ocr: {
      vendor: string | null;
      total_amount: number | null;
      date: string | null;
      items: Array<{
        name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
      raw_text: string;
      confidence: number;
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
      items: Array<any>;
    };
  };
  confidence_summary: {
    ocr_confidence: number;
    category_confidence: number;
    location_confidence: number;
    overall_confidence: number;
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
   * Analiza automáticamente un recibo usando OCR, ML y geolocalización
   */
  async analyzeReceipt(imageFile: File): Promise<OCRAnalysisResult> {
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
}

export const ocrService = new OCRService();
