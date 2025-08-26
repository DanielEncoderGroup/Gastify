// Tipos centralizados para evitar duplicación y importaciones circulares
export interface ReceiptProduct {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  confidence: number;
  extraction_method: string;
  created_at: string;
}

export interface ProductValidation {
  is_valid: boolean;
  declared_total: number;
  calculated_total: number;
  difference: number;
  difference_percentage: number;
  products_count: number;
  average_confidence: number;
  issues: string[];
  recommendation: 'auto_approve' | 'manual_review';
}

export interface Receipt {
  _id: string;
  id: string;
  company_name: string;
  folio_number: string;
  date: string;
  total_amount: number;
  description: string;
  ocr_data?: {
    confidence: number;
    vendor?: string;
    chile_metadata?: {
      rut_emisor?: string;
      iva_amount?: number;
      subtotal?: number;
    };
  };
  geolocation?: {
    address?: string;
    city?: string;
    region?: string;
  };
  workflow_data?: {
    status: 'pending' | 'approved' | 'rejected';
    approval_level: number;
  };
}

export interface ReceiptPDFData {
  id: string;
  companyName: string;
  folioNumber: string;
  date: string;
  totalAmount: number;
  description: string;
  products: ReceiptProduct[];
  ocrData?: {
    confidence: number;
    vendor?: string;
    chile_metadata?: {
      rut_emisor?: string;
      iva_amount?: number;
      subtotal?: number;
    };
  };
  geolocation?: {
    address?: string;
    city?: string;
    region?: string;
  };
}

// Para compatibilidad con páginas existentes
export interface LegacyReceipt {
  id: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  // Campos adicionales para el modal
  company_name: string;
  folio_number: string;
  total_amount: number;
  ocr_data?: Receipt['ocr_data'];
  geolocation?: Receipt['geolocation'];
  workflow_data?: Receipt['workflow_data'];
}

// Tipo específico para el modal de detalles
export interface ModalReceipt {
  _id: string;
  id: string;
  company_name: string;
  folio_number: string;
  date: string;
  total_amount: number;
  description: string;
  ocr_data?: {
    confidence: number;
    vendor?: string;
    chile_metadata?: {
      rut_emisor?: string;
      iva_amount?: number;
      subtotal?: number;
    };
  };
  geolocation?: {
    address?: string;
    city?: string;
    region?: string;
  };
  workflow_data?: {
    status: 'pending' | 'approved' | 'rejected';
    approval_level: number;
  };
}

// Interfaz unificada para Receipt (compatible con ambos formatos)
export interface UnifiedReceipt {
  id: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category?: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  // Campos del modal
  company_name?: string;
  folio_number?: string;
  total_amount?: number;
  ocr_data?: {
    confidence: number;
    vendor?: string;
    chile_metadata?: {
      rut_emisor?: string;
      iva_amount?: number;
      subtotal?: number;
    };
  };
  geolocation?: {
    address?: string;
    city?: string;
    region?: string;
  };
  workflow_data?: {
    status: 'pending' | 'approved' | 'rejected';
    approval_level: number;
  };
}
