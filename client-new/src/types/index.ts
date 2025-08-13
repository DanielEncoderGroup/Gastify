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
  department?: string;        // Departamento del empleado
  position?: string;          // Cargo/posición del empleado
  
  // Mantener compatibilidad retroactiva
  company?: string;           // Para retrocompatibilidad con código existente
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

// Form error types
export interface FormErrors {
  [key: string]: string;
}