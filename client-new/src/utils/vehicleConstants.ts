import { VehicleType, VEHICLE_CONSUMPTION } from '@types/fuel';

/**
 * Constantes y utilidades para tipos de vehículos en Gastify
 */
export const vehicleConstants = {
  /**
   * Información detallada de cada tipo de vehículo
   */
  VEHICLE_INFO: {
    [VehicleType.ECONOMICO]: {
      name: 'City Car',
      shortName: 'Económico',
      consumption: VEHICLE_CONSUMPTION[VehicleType.ECONOMICO],
      icon: '🚗',
      description: 'Vehículo urbano compacto y económico (15 km/L)',
      examples: ['Toyota Yaris', 'Nissan March', 'Hyundai Grand i10'],
      category: 'economy',
      carbonFootprint: 'Bajo'
    },
    [VehicleType.INTERMEDIO]: {
      name: 'Camioneta',
      shortName: 'Camioneta',
      consumption: VEHICLE_CONSUMPTION[VehicleType.INTERMEDIO],
      icon: '🚙',
      description: 'Camioneta para carga y uso comercial (10 km/L)',
      examples: ['Toyota Hilux', 'Ford Ranger', 'Chevrolet D-Max'],
      category: 'commercial',
      carbonFootprint: 'Medio'
    },
    [VehicleType.SUV]: {
      name: 'SUV',
      shortName: 'SUV',
      consumption: VEHICLE_CONSUMPTION[VehicleType.SUV],
      icon: '🚗',
      description: 'Vehículo utilitario deportivo de mayor tamaño (8 km/L)',
      examples: ['Toyota RAV4', 'Honda CR-V', 'Ford Escape'],
      category: 'luxury',
      carbonFootprint: 'Alto'
    }
  },

  /**
   * Obtiene información completa de un tipo de vehículo
   */
  getVehicleInfo: (type: VehicleType) => {
    return vehicleConstants.VEHICLE_INFO[type];
  },

  /**
   * Obtiene el nombre completo del vehículo
   */
  getVehicleName: (type: VehicleType): string => {
    return vehicleConstants.VEHICLE_INFO[type].name;
  },

  /**
   * Obtiene el nombre corto del vehículo
   */
  getVehicleShortName: (type: VehicleType): string => {
    return vehicleConstants.VEHICLE_INFO[type].shortName;
  },

  /**
   * Obtiene el icono del vehículo
   */
  getVehicleIcon: (type: VehicleType): string => {
    return vehicleConstants.VEHICLE_INFO[type].icon;
  },

  /**
   * Obtiene el consumo de combustible del vehículo
   */
  getVehicleConsumption: (type: VehicleType): number => {
    return vehicleConstants.VEHICLE_INFO[type].consumption;
  },

  /**
   * Obtiene la descripción del vehículo
   */
  getVehicleDescription: (type: VehicleType): string => {
    return vehicleConstants.VEHICLE_INFO[type].description;
  },

  /**
   * Obtiene ejemplos de modelos del tipo de vehículo
   */
  getVehicleExamples: (type: VehicleType): string[] => {
    return vehicleConstants.VEHICLE_INFO[type].examples;
  },

  /**
   * Formatea el consumo con unidades
   */
  formatConsumption: (type: VehicleType): string => {
    const consumption = vehicleConstants.getVehicleConsumption(type);
    return `${consumption} km/L`;
  },

  /**
   * Formatea el nombre del vehículo para mostrar
   */
  formatVehicleName: (type: VehicleType): string => {
    const info = vehicleConstants.getVehicleInfo(type);
    return `${info.icon} ${info.name} (${info.consumption} km/L)`;
  },

  /**
   * Formatea el nombre corto del vehículo
   */
  formatVehicleShortName: (type: VehicleType): string => {
    const info = vehicleConstants.getVehicleInfo(type);
    return `${info.shortName}`;
  },

  /**
   * Obtiene todos los tipos de vehículos disponibles
   */
  getAllVehicleTypes: (): VehicleType[] => {
    return Object.values(VehicleType);
  },

  /**
   * Obtiene el tipo de vehículo más eficiente
   */
  getMostEfficientVehicle: (): VehicleType => {
    return VehicleType.ECONOMICO;
  },

  /**
   * Obtiene el tipo de vehículo menos eficiente
   */
  getLeastEfficientVehicle: (): VehicleType => {
    return VehicleType.SUV;
  },

  /**
   * Compara dos tipos de vehículos por eficiencia
   */
  compareEfficiency: (type1: VehicleType, type2: VehicleType): {
    morEfficient: VehicleType;
    difference: number;
    percentageDiff: number;
  } => {
    const consumption1 = vehicleConstants.getVehicleConsumption(type1);
    const consumption2 = vehicleConstants.getVehicleConsumption(type2);
    
    const moreEfficient = consumption1 > consumption2 ? type1 : type2;
    const difference = Math.abs(consumption1 - consumption2);
    const percentageDiff = (difference / Math.min(consumption1, consumption2)) * 100;
    
    return {
      morEfficient: moreEfficient,
      difference,
      percentageDiff: Math.round(percentageDiff)
    };
  },

  /**
   * Calcula el impacto ambiental relativo
   */
  getCarbonFootprintLevel: (type: VehicleType): 'low' | 'medium' | 'high' => {
    const consumption = vehicleConstants.getVehicleConsumption(type);
    
    if (consumption >= 12) return 'low';
    if (consumption >= 9) return 'medium';
    return 'high';
  },

  /**
   * Obtiene color CSS asociado al tipo de vehículo
   */
  getVehicleColor: (type: VehicleType): string => {
    const colors = {
      [VehicleType.ECONOMICO]: '#10b981', // green-500
      [VehicleType.INTERMEDIO]: '#f59e0b', // amber-500
      [VehicleType.SUV]: '#ef4444' // red-500
    };
    
    return colors[type];
  },

  /**
   * Obtiene clases CSS de Tailwind para el tipo de vehículo
   */
  getVehicleTailwindClasses: (type: VehicleType): {
    bg: string;
    text: string;
    border: string;
    hover: string;
  } => {
    const classes = {
      [VehicleType.ECONOMICO]: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        hover: 'hover:bg-green-100'
      },
      [VehicleType.INTERMEDIO]: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        hover: 'hover:bg-amber-100'
      },
      [VehicleType.SUV]: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        hover: 'hover:bg-red-100'
      }
    };
    
    return classes[type];
  },

  /**
   * Valida que un string sea un tipo de vehículo válido
   */
  isValidVehicleType: (value: string): value is VehicleType => {
    return Object.values(VehicleType).includes(value as VehicleType);
  },

  /**
   * Convierte string a VehicleType si es válido
   */
  parseVehicleType: (value: string): VehicleType | null => {
    if (vehicleConstants.isValidVehicleType(value)) {
      return value as VehicleType;
    }
    return null;
  },

  /**
   * Obtiene sugerencias de uso para cada tipo de vehículo
   */
  getUsageSuggestions: (type: VehicleType): string[] => {
    const suggestions = {
      [VehicleType.ECONOMICO]: [
        'Ideal para viajes urbanos cortos',
        'Perfecto para reuniones en la ciudad',
        'Recomendado para distancias menores a 100km',
        'Óptimo para reducir costos de combustible'
      ],
      [VehicleType.INTERMEDIO]: [
        'Excelente para transporte de materiales',
        'Ideal para viajes a terreno',
        'Recomendado para visitas a obra',
        'Perfecto para zonas rurales o de difícil acceso'
      ],
      [VehicleType.SUV]: [
        'Ideal para viajes ejecutivos largos',
        'Perfecto para transporte de múltiples personas',
        'Recomendado para reuniones importantes',
        'Excelente para viajes interregionales'
      ]
    };
    
    return suggestions[type];
  },

  /**
   * Calcula ahorro potencial entre tipos de vehículo
   */
  calculatePotentialSavings: (
    currentType: VehicleType, 
    alternativeType: VehicleType, 
    distanceKm: number, 
    fuelPricePerLiter: number
  ): {
    savings: number;
    percentageSavings: number;
    recommendSwitching: boolean;
  } => {
    const currentConsumption = vehicleConstants.getVehicleConsumption(currentType);
    const alternativeConsumption = vehicleConstants.getVehicleConsumption(alternativeType);
    
    const currentFuelNeeded = distanceKm / currentConsumption;
    const alternativeFuelNeeded = distanceKm / alternativeConsumption;
    
    const currentCost = currentFuelNeeded * fuelPricePerLiter;
    const alternativeCost = alternativeFuelNeeded * fuelPricePerLiter;
    
    const savings = currentCost - alternativeCost;
    const percentageSavings = currentCost > 0 ? (savings / currentCost) * 100 : 0;
    
    return {
      savings: Math.abs(savings),
      percentageSavings: Math.abs(percentageSavings),
      recommendSwitching: savings > 0 && percentageSavings > 10
    };
  }
};

export default vehicleConstants;