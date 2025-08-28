import { describe, it, expect } from 'vitest';
import { vehicleConstants } from '../vehicleConstants';
import { VehicleType, FuelType } from '@types/fuel';

describe('vehicleConstants', () => {
  describe('VEHICLE_CONSUMPTION', () => {
    it('should have correct consumption rates for all vehicle types', () => {
      // Act & Assert
      expect(vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.ECONOMICO]).toBe(15);
      expect(vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.INTERMEDIO]).toBe(10);
      expect(vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.SUV]).toBe(8);
    });

    it('should have all vehicle types defined', () => {
      // Act
      const definedTypes = Object.keys(vehicleConstants.VEHICLE_CONSUMPTION);

      // Assert
      expect(definedTypes).toContain(VehicleType.ECONOMICO);
      expect(definedTypes).toContain(VehicleType.INTERMEDIO);
      expect(definedTypes).toContain(VehicleType.SUV);
      expect(definedTypes).toHaveLength(3);
    });

    it('should have consumption rates as positive numbers', () => {
      // Act & Assert
      Object.values(vehicleConstants.VEHICLE_CONSUMPTION).forEach(consumption => {
        expect(consumption).toBeGreaterThan(0);
        expect(typeof consumption).toBe('number');
        expect(Number.isFinite(consumption)).toBe(true);
      });
    });

    it('should have realistic consumption rates', () => {
      // Act & Assert
      // Consumption should be between 5-20 km/l for realistic vehicles
      Object.values(vehicleConstants.VEHICLE_CONSUMPTION).forEach(consumption => {
        expect(consumption).toBeGreaterThanOrEqual(5);
        expect(consumption).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('VEHICLE_DISPLAY_NAMES', () => {
    it('should have display names for all vehicle types', () => {
      // Act & Assert
      expect(vehicleConstants.VEHICLE_DISPLAY_NAMES[VehicleType.ECONOMICO]).toBe('Económico');
      expect(vehicleConstants.VEHICLE_DISPLAY_NAMES[VehicleType.INTERMEDIO]).toBe('Intermedio');
      expect(vehicleConstants.VEHICLE_DISPLAY_NAMES[VehicleType.SUV]).toBe('SUV');
    });

    it('should have all vehicle types with display names', () => {
      // Act
      const definedTypes = Object.keys(vehicleConstants.VEHICLE_DISPLAY_NAMES);

      // Assert
      expect(definedTypes).toContain(VehicleType.ECONOMICO);
      expect(definedTypes).toContain(VehicleType.INTERMEDIO);
      expect(definedTypes).toContain(VehicleType.SUV);
      expect(definedTypes).toHaveLength(3);
    });

    it('should have non-empty string display names', () => {
      // Act & Assert
      Object.values(vehicleConstants.VEHICLE_DISPLAY_NAMES).forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('FUEL_TYPE_DISPLAY_NAMES', () => {
    it('should have display names for all fuel types', () => {
      // Act & Assert
      expect(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES[FuelType.GASOLINA_93]).toBe('Gasolina 93');
      expect(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES[FuelType.GASOLINA_95]).toBe('Gasolina 95');
      expect(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES[FuelType.GASOLINA_97]).toBe('Gasolina 97');
      expect(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES[FuelType.DIESEL]).toBe('Diésel');
    });

    it('should have all fuel types with display names', () => {
      // Act
      const definedTypes = Object.keys(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES);

      // Assert
      expect(definedTypes).toContain(FuelType.GASOLINA_93);
      expect(definedTypes).toContain(FuelType.GASOLINA_95);
      expect(definedTypes).toContain(FuelType.GASOLINA_97);
      expect(definedTypes).toContain(FuelType.DIESEL);
      expect(definedTypes).toHaveLength(4);
    });

    it('should have non-empty string display names', () => {
      // Act & Assert
      Object.values(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES).forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('CHILE_REGIONS', () => {
    it('should include all major Chilean regions', () => {
      // Act
      const regions = vehicleConstants.CHILE_REGIONS;

      // Assert
      const expectedRegions = [
        'Arica y Parinacota',
        'Tarapacá',
        'Antofagasta',
        'Atacama',
        'Coquimbo',
        'Valparaíso',
        'Metropolitana de Santiago',
        'O\'Higgins',
        'Maule',
        'Ñuble',
        'Biobío',
        'La Araucanía',
        'Los Ríos',
        'Los Lagos',
        'Aysén',
        'Magallanes'
      ];

      expectedRegions.forEach(region => {
        expect(regions).toContain(region);
      });
      
      expect(regions).toHaveLength(16); // Total Chilean regions
    });

    it('should have unique region names', () => {
      // Act
      const regions = vehicleConstants.CHILE_REGIONS;
      const uniqueRegions = [...new Set(regions)];

      // Assert
      expect(regions.length).toBe(uniqueRegions.length);
    });

    it('should have non-empty region names', () => {
      // Act & Assert
      vehicleConstants.CHILE_REGIONS.forEach(region => {
        expect(typeof region).toBe('string');
        expect(region.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('getVehicleConsumption', () => {
    it('should return correct consumption for valid vehicle types', () => {
      // Act & Assert
      expect(vehicleConstants.getVehicleConsumption(VehicleType.ECONOMICO)).toBe(15);
      expect(vehicleConstants.getVehicleConsumption(VehicleType.INTERMEDIO)).toBe(10);
      expect(vehicleConstants.getVehicleConsumption(VehicleType.SUV)).toBe(8);
    });

    it('should throw error for invalid vehicle type', () => {
      // Arrange
      const invalidType = 'invalid_type' as VehicleType;

      // Act & Assert
      expect(() => {
        vehicleConstants.getVehicleConsumption(invalidType);
      }).toThrow('Invalid vehicle type: invalid_type');
    });

    it('should handle null and undefined vehicle types', () => {
      // Act & Assert
      expect(() => {
        vehicleConstants.getVehicleConsumption(null as any);
      }).toThrow('Vehicle type is required');

      expect(() => {
        vehicleConstants.getVehicleConsumption(undefined as any);
      }).toThrow('Vehicle type is required');
    });
  });

  describe('getVehicleDisplayName', () => {
    it('should return correct display names for valid vehicle types', () => {
      // Act & Assert
      expect(vehicleConstants.getVehicleDisplayName(VehicleType.ECONOMICO)).toBe('Económico');
      expect(vehicleConstants.getVehicleDisplayName(VehicleType.INTERMEDIO)).toBe('Intermedio');
      expect(vehicleConstants.getVehicleDisplayName(VehicleType.SUV)).toBe('SUV');
    });

    it('should throw error for invalid vehicle type', () => {
      // Arrange
      const invalidType = 'invalid_type' as VehicleType;

      // Act & Assert
      expect(() => {
        vehicleConstants.getVehicleDisplayName(invalidType);
      }).toThrow('Invalid vehicle type: invalid_type');
    });
  });

  describe('getFuelTypeDisplayName', () => {
    it('should return correct display names for valid fuel types', () => {
      // Act & Assert
      expect(vehicleConstants.getFuelTypeDisplayName(FuelType.GASOLINA_93)).toBe('Gasolina 93');
      expect(vehicleConstants.getFuelTypeDisplayName(FuelType.GASOLINA_95)).toBe('Gasolina 95');
      expect(vehicleConstants.getFuelTypeDisplayName(FuelType.GASOLINA_97)).toBe('Gasolina 97');
      expect(vehicleConstants.getFuelTypeDisplayName(FuelType.DIESEL)).toBe('Diésel');
    });

    it('should throw error for invalid fuel type', () => {
      // Arrange
      const invalidType = 'invalid_fuel' as FuelType;

      // Act & Assert
      expect(() => {
        vehicleConstants.getFuelTypeDisplayName(invalidType);
      }).toThrow('Invalid fuel type: invalid_fuel');
    });
  });

  describe('isValidVehicleType', () => {
    it('should validate correct vehicle types', () => {
      // Act & Assert
      expect(vehicleConstants.isValidVehicleType(VehicleType.ECONOMICO)).toBe(true);
      expect(vehicleConstants.isValidVehicleType(VehicleType.INTERMEDIO)).toBe(true);
      expect(vehicleConstants.isValidVehicleType(VehicleType.SUV)).toBe(true);
    });

    it('should invalidate incorrect vehicle types', () => {
      // Arrange
      const invalidTypes = [
        'invalid_type',
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      // Act & Assert
      invalidTypes.forEach(type => {
        expect(vehicleConstants.isValidVehicleType(type as any)).toBe(false);
      });
    });
  });

  describe('isValidFuelType', () => {
    it('should validate correct fuel types', () => {
      // Act & Assert
      expect(vehicleConstants.isValidFuelType(FuelType.GASOLINA_93)).toBe(true);
      expect(vehicleConstants.isValidFuelType(FuelType.GASOLINA_95)).toBe(true);
      expect(vehicleConstants.isValidFuelType(FuelType.GASOLINA_97)).toBe(true);
      expect(vehicleConstants.isValidFuelType(FuelType.DIESEL)).toBe(true);
    });

    it('should invalidate incorrect fuel types', () => {
      // Arrange
      const invalidTypes = [
        'invalid_fuel',
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      // Act & Assert
      invalidTypes.forEach(type => {
        expect(vehicleConstants.isValidFuelType(type as any)).toBe(false);
      });
    });
  });

  describe('getAllVehicleTypes', () => {
    it('should return all available vehicle types', () => {
      // Act
      const vehicleTypes = vehicleConstants.getAllVehicleTypes();

      // Assert
      expect(vehicleTypes).toEqual([
        VehicleType.ECONOMICO,
        VehicleType.INTERMEDIO,
        VehicleType.SUV
      ]);
      expect(vehicleTypes).toHaveLength(3);
    });
  });

  describe('getAllFuelTypes', () => {
    it('should return all available fuel types', () => {
      // Act
      const fuelTypes = vehicleConstants.getAllFuelTypes();

      // Assert
      expect(fuelTypes).toEqual([
        FuelType.GASOLINA_93,
        FuelType.GASOLINA_95,
        FuelType.GASOLINA_97,
        FuelType.DIESEL
      ]);
      expect(fuelTypes).toHaveLength(4);
    });
  });

  describe('getRecommendedFuelType', () => {
    it('should recommend correct fuel type for each vehicle type', () => {
      // Act & Assert
      expect(vehicleConstants.getRecommendedFuelType(VehicleType.ECONOMICO)).toBe(FuelType.GASOLINA_93);
      expect(vehicleConstants.getRecommendedFuelType(VehicleType.INTERMEDIO)).toBe(FuelType.GASOLINA_95);
      expect(vehicleConstants.getRecommendedFuelType(VehicleType.SUV)).toBe(FuelType.DIESEL);
    });

    it('should throw error for invalid vehicle type', () => {
      // Arrange
      const invalidType = 'invalid_type' as VehicleType;

      // Act & Assert
      expect(() => {
        vehicleConstants.getRecommendedFuelType(invalidType);
      }).toThrow('Invalid vehicle type: invalid_type');
    });
  });

  describe('getVehicleTypesByFuelType', () => {
    it('should return vehicle types that use specific fuel type', () => {
      // Act & Assert
      expect(vehicleConstants.getVehicleTypesByFuelType(FuelType.GASOLINA_93))
        .toEqual([VehicleType.ECONOMICO]);
      
      expect(vehicleConstants.getVehicleTypesByFuelType(FuelType.GASOLINA_95))
        .toEqual([VehicleType.INTERMEDIO]);
        
      expect(vehicleConstants.getVehicleTypesByFuelType(FuelType.GASOLINA_97))
        .toEqual([]);
        
      expect(vehicleConstants.getVehicleTypesByFuelType(FuelType.DIESEL))
        .toEqual([VehicleType.SUV]);
    });

    it('should allow flexible fuel usage (vehicles can use different fuel types)', () => {
      // Act & Assert
      // In practice, most vehicles can use different gasoline grades
      const flexibleMapping = vehicleConstants.getFlexibleVehicleTypesByFuelType(FuelType.GASOLINA_95);
      
      expect(flexibleMapping).toContain(VehicleType.ECONOMICO); // Can use higher grade
      expect(flexibleMapping).toContain(VehicleType.INTERMEDIO); // Recommended
    });
  });

  describe('constants validation', () => {
    it('should ensure all constants are immutable', () => {
      // Act & Assert - These operations should not modify the original constants
      expect(() => {
        (vehicleConstants.VEHICLE_CONSUMPTION as any)[VehicleType.ECONOMICO] = 20;
      }).toThrow(); // Should be frozen/readonly

      expect(() => {
        (vehicleConstants.CHILE_REGIONS as any).push('New Region');
      }).toThrow(); // Should be frozen/readonly
    });

    it('should have consistent data types across constants', () => {
      // Act & Assert
      Object.values(vehicleConstants.VEHICLE_CONSUMPTION).forEach(value => {
        expect(typeof value).toBe('number');
      });

      Object.values(vehicleConstants.VEHICLE_DISPLAY_NAMES).forEach(value => {
        expect(typeof value).toBe('string');
      });

      Object.values(vehicleConstants.FUEL_TYPE_DISPLAY_NAMES).forEach(value => {
        expect(typeof value).toBe('string');
      });

      vehicleConstants.CHILE_REGIONS.forEach(value => {
        expect(typeof value).toBe('string');
      });
    });

    it('should have logical consumption order (economico > intermedio > suv)', () => {
      // Act
      const economicoConsumption = vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.ECONOMICO];
      const intermedioConsumption = vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.INTERMEDIO];
      const suvConsumption = vehicleConstants.VEHICLE_CONSUMPTION[VehicleType.SUV];

      // Assert
      expect(economicoConsumption).toBeGreaterThan(intermedioConsumption);
      expect(intermedioConsumption).toBeGreaterThan(suvConsumption);
    });
  });

  describe('CO2_EMISSIONS_FACTORS', () => {
    it('should have CO2 emission factors for all fuel types', () => {
      // Act & Assert
      expect(vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.GASOLINA_93]).toBe(2.3);
      expect(vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.GASOLINA_95]).toBe(2.3);
      expect(vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.GASOLINA_97]).toBe(2.3);
      expect(vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.DIESEL]).toBe(2.7);
    });

    it('should have realistic emission factors', () => {
      // Act & Assert
      Object.values(vehicleConstants.CO2_EMISSIONS_FACTORS).forEach(factor => {
        expect(factor).toBeGreaterThan(1); // kg CO2 per liter should be > 1
        expect(factor).toBeLessThan(5); // kg CO2 per liter should be < 5
      });
    });

    it('should have diesel emissions higher than gasoline', () => {
      // Act
      const gasolineEmissions = vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.GASOLINA_93];
      const dieselEmissions = vehicleConstants.CO2_EMISSIONS_FACTORS[FuelType.DIESEL];

      // Assert
      expect(dieselEmissions).toBeGreaterThan(gasolineEmissions);
    });
  });

  describe('VEHICLE_CATEGORIES', () => {
    it('should categorize vehicles correctly', () => {
      // Act & Assert
      expect(vehicleConstants.VEHICLE_CATEGORIES[VehicleType.ECONOMICO]).toEqual({
        category: 'economy',
        description: 'Vehículos compactos y eficientes en combustible',
        examples: ['Chevrolet Spark', 'Suzuki Swift', 'Hyundai Grand i10'],
        consumptionRange: { min: 13, max: 17 },
        recommendedFor: 'city_driving'
      });

      expect(vehicleConstants.VEHICLE_CATEGORIES[VehicleType.INTERMEDIO]).toEqual({
        category: 'intermediate',
        description: 'Sedanes y hatchbacks de tamaño mediano',
        examples: ['Toyota Corolla', 'Nissan Sentra', 'Chevrolet Cruze'],
        consumptionRange: { min: 8, max: 12 },
        recommendedFor: 'mixed_driving'
      });

      expect(vehicleConstants.VEHICLE_CATEGORIES[VehicleType.SUV]).toEqual({
        category: 'suv',
        description: 'Vehículos utilitarios deportivos y camionetas',
        examples: ['Toyota RAV4', 'Hyundai Tucson', 'Ford EcoSport'],
        consumptionRange: { min: 6, max: 10 },
        recommendedFor: 'highway_driving'
      });
    });

    it('should have consistent consumption ranges', () => {
      // Act & Assert
      Object.values(vehicleConstants.VEHICLE_CATEGORIES).forEach(category => {
        expect(category.consumptionRange.min).toBeLessThanOrEqual(category.consumptionRange.max);
        expect(category.consumptionRange.min).toBeGreaterThan(0);
        expect(category.consumptionRange.max).toBeLessThan(25); // Realistic upper bound
      });
    });

    it('should have realistic vehicle examples', () => {
      // Act & Assert
      Object.values(vehicleConstants.VEHICLE_CATEGORIES).forEach(category => {
        expect(Array.isArray(category.examples)).toBe(true);
        expect(category.examples.length).toBeGreaterThan(0);
        
        category.examples.forEach(example => {
          expect(typeof example).toBe('string');
          expect(example.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('utility functions', () => {
    it('should format consumption display correctly', () => {
      // Act & Assert
      expect(vehicleConstants.formatConsumptionDisplay(VehicleType.ECONOMICO))
        .toBe('15 km/l');
      expect(vehicleConstants.formatConsumptionDisplay(VehicleType.INTERMEDIO))
        .toBe('10 km/l');
      expect(vehicleConstants.formatConsumptionDisplay(VehicleType.SUV))
        .toBe('8 km/l');
    });

    it('should get consumption efficiency rating', () => {
      // Act & Assert
      expect(vehicleConstants.getEfficiencyRating(VehicleType.ECONOMICO)).toBe('high');
      expect(vehicleConstants.getEfficiencyRating(VehicleType.INTERMEDIO)).toBe('medium');
      expect(vehicleConstants.getEfficiencyRating(VehicleType.SUV)).toBe('low');
    });

    it('should validate consumption is within realistic range', () => {
      // Act
      const validConsumption = vehicleConstants.isValidConsumption(12);
      const invalidLowConsumption = vehicleConstants.isValidConsumption(2);
      const invalidHighConsumption = vehicleConstants.isValidConsumption(50);

      // Assert
      expect(validConsumption).toBe(true);
      expect(invalidLowConsumption).toBe(false);
      expect(invalidHighConsumption).toBe(false);
    });
  });
});