// Tipos para funcionalidad de gastos de combustible en Gastify

// Coordenadas geográficas
export interface Coordinates {
  lat: number;
  lng: number;
}

// Información de ubicación completa
export interface Location {
  coordinates: Coordinates;
  address: string;
  city: string;
  region: string;
  country: string;
}

// Tipos de vehículos soportados con sus respectivos consumos
export enum VehicleType {
  ECONOMICO = 'economico',
  INTERMEDIO = 'intermedio', 
  SUV = 'suv'
}

// Constantes de consumo por tipo de vehículo (km/litro)
export const VEHICLE_CONSUMPTION = {
  [VehicleType.ECONOMICO]: 15,
  [VehicleType.INTERMEDIO]: 10,
  [VehicleType.SUV]: 8
} as const;

// Tipos de combustible
export enum FuelType {
  GASOLINA_93 = 'gasolina_93',
  GASOLINA_95 = 'gasolina_95',
  GASOLINA_97 = 'gasolina_97',
  DIESEL = 'diesel'
}

// Precio de combustible desde diferentes fuentes
export interface FuelPrice {
  fuelType: FuelType;
  price: number; // Precio por litro en CLP
  region: string;
  lastUpdated: string;
  source: 'CNE' | 'manual' | 'fixed_prices';
}

// Datos de ruta calculados
export interface RouteData {
  origin: Location;
  destination: Location;
  distance: number; // Distancia en kilómetros
  duration: number; // Duración en minutos
  polyline?: string; // Polyline para mostrar en mapa
  tollCost?: number; // Costo de peajes si aplica
}

// Cálculos de combustible
export interface FuelCalculation {
  routeData: RouteData;
  vehicleType: VehicleType;
  fuelType: FuelType;
  fuelPrice: number; // Precio por litro
  fuelNeeded: number; // Litros necesarios
  totalCost: number; // Costo total de combustible
  consumption: number; // Consumo del vehículo (km/l)
}

// Gasto de combustible (entidad principal)
export interface FuelExpense {
  id?: string;
  userId: string;
  employerId?: string; // Para empleados
  
  // Datos de la ruta
  routeData: RouteData;
  
  // Datos del vehículo y combustible
  vehicleType: VehicleType;
  fuelType: FuelType;
  
  // Cálculos
  calculation: FuelCalculation;
  
  // Justificación del viaje
  businessPurpose: string;
  description?: string;
  
  // Estados
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
  
  // Workflow data
  workflowData?: {
    status: 'pending' | 'approved' | 'rejected';
    approvalLevel: number;
    approvedBy?: string;
    rejectionReason?: string;
  };
  
  // Archivos adjuntos opcionales
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  }[];
}

// Datos para crear/actualizar gasto de combustible
export interface CreateFuelExpenseData {
  // Coordenadas origen y destino
  originCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  
  // Información adicional de ubicaciones (opcional)
  originAddress?: string;
  destinationAddress?: string;
  
  // Tipo de vehículo y combustible
  vehicleType: VehicleType;
  fuelType: FuelType;
  
  // Justificación
  businessPurpose: string;
  description?: string;
  
  // Precio manual del combustible (opcional, si no se usa CNE)
  manualFuelPrice?: number;
}

// Respuesta de creación de gasto de combustible
export interface CreateFuelExpenseResponse {
  success: boolean;
  fuelExpense: FuelExpense;
  message: string;
  warnings?: string[];
}

// Filtros para listado de gastos de combustible
export interface FuelExpenseFilters {
  status?: FuelExpense['status'];
  vehicleType?: VehicleType;
  fuelType?: FuelType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  employeeId?: string; // Para empleadores
}

// Estadísticas de gastos de combustible
export interface FuelExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  totalDistance: number;
  totalFuelLiters: number;
  averageCostPerKm: number;
  byVehicleType: Record<VehicleType, {
    count: number;
    totalAmount: number;
    totalDistance: number;
  }>;
  byFuelType: Record<FuelType, {
    count: number;
    totalAmount: number;
    totalLiters: number;
  }>;
  byStatus: Record<FuelExpense['status'], number>;
}

// Error de validación
export interface FuelExpenseValidationError {
  field: string;
  message: string;
  code: string;
}

// Configuración de Google Maps
export interface GoogleMapsConfig {
  apiKey: string;
  region: string;
  language: string;
  libraries: string[];
}

// Estado de geolocalización
export interface GeolocationState {
  loading: boolean;
  error: string | null;
  currentPosition: Coordinates | null;
  accuracy: number | null;
}