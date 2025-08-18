// User type definitions
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  token?: string;
  profileImage?: string;
  name?: string; // Campo necesario para compatibilidad
  
  // ======================================
  // CAMPOS MULTI-TENANT
  // ======================================
  company_name?: string;      // Nombre de la empresa (FIX DIRECTO para el error)
  employer_id?: string;       // ID del empleador
  employer_name?: string;     // Nombre del empleador (para empleados)
  department?: string;        // Departamento del empleado
  position?: string;          // Cargo/posición del empleado
  
  // Mantener compatibilidad retroactiva
  company?: string;           // Para retrocompatibilidad con código existente
  
  // Estadísticas de recibos (para empleadores)
  receipts_count?: number;
  total_spent?: number;
  last_receipt_date?: string;
}

// Authentication related types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Project related types
export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  budget: number;
  technologies: string[];
  teamMembers?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

// Receipt related types
export interface Receipt {
  id: string;
  user: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  imageUrl?: string;
  status: 'en_revision' | 'aceptada' | 'rechazada';
  createdAt: string;
  updatedAt: string;
  ocrData?: {
    vendor?: string;
    total_amount?: number;
    date?: string;
    items: string[];
    raw_text: string;
    confidence: number;
  };
}

// Meeting related types
export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  description?: string;
  participants: string[];
  topics?: string[];
}

// Request related types
export interface Request {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'support' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  submittedBy: string;
  submittedOn: string;
  notes?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

// Respuesta de análisis OCR avanzado
export interface OCRAnalysisResponse {
  success: boolean;
  analysis: {
    ocr: OCRDataExpanded;
    categorization?: {
      category: string;
      confidence: number;
      subcategories?: string[];
    };
    geolocation?: {
      address?: string;
      city?: string;
      country?: string;
      confidence: number;
    };
    suggested_form_data: {
      companyName?: string;
      folioNumber?: string;
      date?: string;
      description?: string;
      totalAmount?: number;
      category?: string;
    };
  };
  confidence_summary: {
    ocr_confidence: number;
    categorization_confidence: number;
    geolocation_confidence: number;
    overall_confidence: number;
  };
}

// Form error types
export interface FormErrors {
  [key: string]: string;
}

// ======================================
// TIPOS PARA DATOS ESTRUCTURADOS DEL PARSER AVANZADO
// ======================================

// Producto extraído del recibo
export interface ReceiptProduct {
  name: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  barcode?: string;
  sku?: string;
  category?: string;
  confidence: number;
  raw_line?: string;
  unit?: string;
  discount?: number;
}

// Metadatos chilenos específicos
export interface ChileReceiptMetadata {
  rut_emisor?: string;
  folio?: string;
  subtotal?: number;
  iva_amount?: number;
  iva_percentage?: number;
  currency?: string;
  reconciliation_needed?: boolean;
  reconciliation_applied?: boolean;
  items_total_calculated?: number;
  difference?: number;
  parsing_confidence?: number;
  parsing_method?: string;
}

// Datos de transacción del recibo
export interface ReceiptTransaction {
  total_amount?: number;
  subtotal?: number;
  iva_amount?: number;
  iva_rate?: number;
  total_items?: number;
  confidence: number;
  payment_method?: string;
  change_amount?: number;
}

// Datos de ubicación y tienda
export interface ReceiptLocation {
  store_name?: string;
  address?: string;
  city?: string;
  receipt_number?: string;
  transaction_date?: string;
  transaction_time?: string;
  confidence: number;
  date?: string;
  time?: string;
}

// Datos OCR expandidos con parsing avanzado
export interface OCRDataExpanded {
  vendor?: string;
  total_amount?: number;
  date?: string;
  items: string[];
  raw_text: string;
  confidence: number;
  
  // Datos estructurados del parser avanzado
  detailed_items: ReceiptProduct[];
  total_items_count: number;
  chile_metadata?: ChileReceiptMetadata;
  transaction_data?: ReceiptTransaction;
  location_data?: ReceiptLocation;
  
  // Información de procesamiento
  ocr_engine_used: string;
  processing_time?: number;
  language_detected?: string;
  parsing_confidence?: number;
}

// Recibo con datos expandidos
export interface ReceiptExpanded {
  id: string;
  user: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  imageUrl?: string;
  status: 'en_revision' | 'aceptada' | 'rechazada';
  ocrData?: OCRDataExpanded;
  createdAt: string;
  updatedAt: string;
}