// Tipos básicos para productos
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

export interface BackendProduct {
  name: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  confidence?: number;
  raw_line?: string | null;
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

// Tipos para diferentes formatos de recibo
export interface Receipt {
  _id: string;
  id: string;
  company_name: string;
  folio_number: string;
  date: string;
  total_amount: number;
  description: string;
  products?: BackendProduct[];
  analysis_data?: {
    ocrData?: unknown;
    parserResults?: unknown;
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
