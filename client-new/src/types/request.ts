import { User } from './index';

/**
 *  Estados posibles de una solicitud
 */
export enum RequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REQUIREMENTS_ANALYSIS = 'requirements_analysis',
  PLANNING = 'planning',
  ESTIMATION = 'estimation',
  PROPOSAL_READY = 'proposal_ready',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_DEVELOPMENT = 'in_development',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  // Legacy / compatibilidad
  IN_PROCESS = 'in_process',
  IN_REVIEW = 'in_review',
}

/**
 * Etiquetas legibles para cada estado
 */
export const RequestStatusLabels: Record<RequestStatus, string> = {
  [RequestStatus.DRAFT]: 'Borrador',
  [RequestStatus.SUBMITTED]: 'Enviado',
  [RequestStatus.REQUIREMENTS_ANALYSIS]: 'Análisis de Requisitos',
  [RequestStatus.PLANNING]: 'Planificación',
  [RequestStatus.ESTIMATION]: 'Estimación',
  [RequestStatus.PROPOSAL_READY]: 'Propuesta Lista',
  [RequestStatus.APPROVED]: 'Aprobado',
  [RequestStatus.REJECTED]: 'Rechazado',
  [RequestStatus.IN_DEVELOPMENT]: 'En Desarrollo',
  [RequestStatus.COMPLETED]: 'Completado',
  [RequestStatus.CANCELED]: 'Cancelado',
  // Legacy
  [RequestStatus.IN_PROCESS]: 'En Proceso',
  [RequestStatus.IN_REVIEW]: 'En Revisión',
};

/**
 * Colores base (sin sufijo -100 / -800) para cada estado
 * Útil si alguna lógica necesita solo el color base, pero no suele usarse en el JSX directamente.
 */
export const RequestStatusColors: Record<RequestStatus, string> = {
  [RequestStatus.DRAFT]: 'gray',
  [RequestStatus.SUBMITTED]: 'blue',
  [RequestStatus.REQUIREMENTS_ANALYSIS]: 'purple',
  [RequestStatus.PLANNING]: 'indigo',
  [RequestStatus.ESTIMATION]: 'orange',
  [RequestStatus.PROPOSAL_READY]: 'cyan',
  [RequestStatus.APPROVED]: 'green',
  [RequestStatus.REJECTED]: 'red',
  [RequestStatus.IN_DEVELOPMENT]: 'teal',
  [RequestStatus.COMPLETED]: 'emerald',
  [RequestStatus.CANCELED]: 'gray',
  // Legacy
  [RequestStatus.IN_PROCESS]: 'blue',
  [RequestStatus.IN_REVIEW]: 'purple',
};

/**
 * Mapeo de cada estado a las clases completas de Tailwind para el badge.
 * - bg-<color>-100  (fondo claro)
 * - text-<color>-800 (texto oscuro)
 */
export const StatusBadgeClasses: Record<RequestStatus, string> = {
  [RequestStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [RequestStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [RequestStatus.REQUIREMENTS_ANALYSIS]: 'bg-purple-100 text-purple-800',
  [RequestStatus.PLANNING]: 'bg-indigo-100 text-indigo-800',
  [RequestStatus.ESTIMATION]: 'bg-orange-100 text-orange-800',
  [RequestStatus.PROPOSAL_READY]: 'bg-cyan-100 text-cyan-800',
  [RequestStatus.APPROVED]: 'bg-green-100 text-green-800',
  [RequestStatus.REJECTED]: 'bg-red-100 text-red-800',
  [RequestStatus.IN_DEVELOPMENT]: 'bg-teal-100 text-teal-800',
  [RequestStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800',
  [RequestStatus.CANCELED]: 'bg-gray-100 text-gray-800',
  // Legacy
  [RequestStatus.IN_PROCESS]: 'bg-blue-100 text-blue-800',
  [RequestStatus.IN_REVIEW]: 'bg-purple-100 text-purple-800',
};

/**
 * Modelo para comentarios (parte del detalle)
 */
export interface RequestComment {
  id: string;
  content: string;
  createdAt: string;
  user?: User;
}

/**
 * Modelo para archivos adjuntos (parte del detalle)
 */
export interface RequestFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  user?: User;
}

/**
 * Modelo para cambios de estado (parte del detalle)
 */
export interface StatusChange {
  fromStatus: RequestStatus | null;
  fromStatusLabel?: string;
  toStatus: RequestStatus;
  toStatusLabel?: string;
  changedAt: string;
  reason?: string;
  changedBy?: User;
}

/**
 * Modelo de solicitud (resumido para listados)
 */
export interface RequestSummary {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  statusLabel: string;
  projectType: ProjectType;
  projectTypeLabel: string;
  priority?: ProjectPriority;
  priorityLabel?: string;
  clientId: string;
  client?: User;
  assignedTo?: string;
  assignedAdmin?: User;
  budget?: number;
  timeframe?: string;
  tags: string[];
  commentsCount: number;
  filesCount: number;
  createdAt: string;
  updatedAt?: string;
  progress?: number;
  technicalRequirements?: string;
  businessGoals?: string;
  integrationsNeeded?: string;
  targetAudience?: string;
  additionalInfo?: string;
  amount?: number;  // legacy
  dueDate?: string; // legacy
}

/**
 * Modelo de solicitud detallada (incluye arreglos de comentarios, archivos e historial)
 */
export interface RequestDetail extends RequestSummary {
  comments: RequestComment[];
  files: RequestFile[];
  statusHistory: StatusChange[];
}

/**
 * Tipos de proyectos tecnológicos
 */
export enum ProjectType {
  WEB_APP = 'web_app',
  MOBILE_APP = 'mobile_app',
  DESKTOP_APP = 'desktop_app',
  E_COMMERCE = 'e_commerce',
  INTEGRATION = 'integration',
  CLOUD_MIGRATION = 'cloud_migration',
  DATA_ANALYTICS = 'data_analytics',
  AUTOMATION = 'automation',
  CUSTOM = 'custom',
}

/**
 * Etiquetas legibles para cada tipo de proyecto
 */
export const ProjectTypeLabels: Record<ProjectType, string> = {
  [ProjectType.WEB_APP]: 'Aplicación Web',
  [ProjectType.MOBILE_APP]: 'Aplicación Móvil',
  [ProjectType.DESKTOP_APP]: 'Aplicación de Escritorio',
  [ProjectType.E_COMMERCE]: 'Comercio Electrónico',
  [ProjectType.INTEGRATION]: 'Integración de Sistemas',
  [ProjectType.CLOUD_MIGRATION]: 'Migración a la Nube',
  [ProjectType.DATA_ANALYTICS]: 'Análisis de Datos',
  [ProjectType.AUTOMATION]: 'Automatización de Procesos',
  [ProjectType.CUSTOM]: 'Proyecto Personalizado',
};

/**
 * Prioridades de proyecto
 */
export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Etiquetas legibles para prioridades
 */
export const PriorityLabels: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: 'Baja',
  [ProjectPriority.MEDIUM]: 'Media',
  [ProjectPriority.HIGH]: 'Alta',
  [ProjectPriority.URGENT]: 'Urgente',
};

/**
 * Modelo para crear una solicitud (RequestCreate)
 */
export interface RequestCreate {
  title: string;
  description: string;
  projectType: ProjectType;
  priority?: ProjectPriority;
  budget?: number;
  timeframe?: string;            // Plazo deseado
  technicalRequirements?: string;
  businessGoals?: string;
  integrationsNeeded?: string;
  targetAudience?: string;
  additionalInfo?: string;
  tags?: string[];
  amount?: number;               // legacy
  dueDate?: string;              // legacy (ISO string)
}

/**
 * Modelo para actualizar una solicitud (RequestUpdate)
 */
export interface RequestUpdate {
  title?: string;
  description?: string;
  status?: RequestStatus;
  assignedTo?: string;
  projectType?: ProjectType;
  priority?: ProjectPriority;
  budget?: number;
  timeframe?: string;
  technicalRequirements?: string;
  businessGoals?: string;
  integrationsNeeded?: string;
  targetAudience?: string;
  additionalInfo?: string;
  tags?: string[];
  amount?: number;               // legacy
  dueDate?: string;              // legacy (ISO string)
}

/**
 * Modelo para cambiar el estado (StatusChangeRequest)
 */
export interface StatusChangeRequest {
  status: RequestStatus;
  reason?: string;
}

/**
 * Modelo para crear un comentario (CommentCreate)
 */
export interface CommentCreate {
  content: string;
}

/**
 * Respuesta de listado de solicitudes (GET /api/requests)
 */
export interface RequestsListResponse {
  success: boolean;
  total: number;
  skip: number;
  limit: number;
  requests: RequestSummary[];
  items?: RequestSummary[];      // alias opcional (para compatibilidad)
  page?: number;                 // opcional
  pages?: number;                // opcional
}

/**
 * Respuesta de una solicitud individual (GET /api/requests/{id})
 */
export interface RequestResponse {
  success: boolean;
  request: RequestDetail;
}
