// Re-export types from receiptTypes for backward compatibility
export * from './receiptTypes';

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

// Tipo específico para el modal de detalles
export interface ModalReceipt {
  _id: string;
  id: string;
  company_name: string;
  folio_number: string;
  date: string;
  total_amount: number;
  description: string;
  // Productos extraídos durante el análisis (usar estructura del backend)
  products?: {
    name: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
    barcode?: string | null;
    sku?: string | null;
    category?: string | null;
    confidence?: number;
    raw_line?: string | null;
  }[];
  // Datos del análisis completo
  analysis_data?: {
    ocrData?: unknown;
    parserResults?: unknown;
    suggestedFormData?: unknown;
    confidence?: number;
    rawText?: string;
  };
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
  // Productos y análisis (usar estructura del backend)
  products?: {
    name: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
    barcode?: string | null;
    sku?: string | null;
    category?: string | null;
    confidence?: number;
    raw_line?: string | null;
  }[];
  analysis_data?: {
    ocrData?: unknown;
    parserResults?: unknown;
    suggestedFormData?: unknown;
    confidence?: number;
    rawText?: string;
  };
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
