import { describe, it, expect } from 'vitest';
import { fuelCalculations } from '../fuelCalculations';
import { VehicleType, FuelType } from '@types/fuel';
import { VEHICLE_CONSUMPTION } from '@types/fuel';

describe('fuelCalculations', () => {
  describe('calculateFuelNeeded', () => {
    it('should calculate fuel needed for economical vehicle', () => {
      // Arrange
      const distance = 150; // km
      const vehicleType = VehicleType.ECONOMICO;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBe(10); // 150 km / 15 km/l = 10 liters
    });

    it('should calculate fuel needed for intermediate vehicle', () => {
      // Arrange
      const distance = 100; // km
      const vehicleType = VehicleType.INTERMEDIO;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBe(10); // 100 km / 10 km/l = 10 liters
    });

    it('should calculate fuel needed for SUV', () => {
      // Arrange
      const distance = 80; // km
      const vehicleType = VehicleType.SUV;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBe(10); // 80 km / 8 km/l = 10 liters
    });

    it('should handle decimal distances', () => {
      // Arrange
      const distance = 15.5; // km
      const vehicleType = VehicleType.ECONOMICO;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBeCloseTo(1.033, 2); // 15.5 km / 15 km/l = 1.033 liters
    });

    it('should return 0 for zero distance', () => {
      // Arrange
      const distance = 0;
      const vehicleType = VehicleType.ECONOMICO;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBe(0);
    });

    it('should handle negative distance by returning 0', () => {
      // Arrange
      const distance = -10;
      const vehicleType = VehicleType.ECONOMICO;

      // Act
      const fuelNeeded = fuelCalculations.calculateFuelNeeded(distance, vehicleType);

      // Assert
      expect(fuelNeeded).toBe(0);
    });

    it('should use correct consumption rates for each vehicle type', () => {
      // Arrange
      const distance = 30; // km

      // Act
      const economicoFuel = fuelCalculations.calculateFuelNeeded(distance, VehicleType.ECONOMICO);
      const intermedioFuel = fuelCalculations.calculateFuelNeeded(distance, VehicleType.INTERMEDIO);
      const suvFuel = fuelCalculations.calculateFuelNeeded(distance, VehicleType.SUV);

      // Assert
      expect(economicoFuel).toBe(2); // 30/15 = 2
      expect(intermedioFuel).toBe(3); // 30/10 = 3
      expect(suvFuel).toBe(3.75); // 30/8 = 3.75
    });
  });

  describe('calculateFuelCost', () => {
    it('should calculate total fuel cost', () => {
      // Arrange
      const fuelNeeded = 10; // liters
      const pricePerLiter = 850; // CLP

      // Act
      const totalCost = fuelCalculations.calculateFuelCost(fuelNeeded, pricePerLiter);

      // Assert
      expect(totalCost).toBe(8500); // 10 * 850 = 8500
    });

    it('should handle decimal fuel amounts', () => {
      // Arrange
      const fuelNeeded = 1.033; // liters
      const pricePerLiter = 850; // CLP

      // Act
      const totalCost = fuelCalculations.calculateFuelCost(fuelNeeded, pricePerLiter);

      // Assert
      expect(totalCost).toBeCloseTo(878.05, 2); // 1.033 * 850 = 878.05
    });

    it('should return 0 for zero fuel needed', () => {
      // Arrange
      const fuelNeeded = 0;
      const pricePerLiter = 850;

      // Act
      const totalCost = fuelCalculations.calculateFuelCost(fuelNeeded, pricePerLiter);

      // Assert
      expect(totalCost).toBe(0);
    });

    it('should return 0 for zero price per liter', () => {
      // Arrange
      const fuelNeeded = 10;
      const pricePerLiter = 0;

      // Act
      const totalCost = fuelCalculations.calculateFuelCost(fuelNeeded, pricePerLiter);

      // Assert
      expect(totalCost).toBe(0);
    });

    it('should handle negative values by returning 0', () => {
      // Arrange
      const negativeFuel = -5;
      const negativePrice = -850;
      const positiveFuel = 10;
      const positivePrice = 850;

      // Act
      const result1 = fuelCalculations.calculateFuelCost(negativeFuel, positivePrice);
      const result2 = fuelCalculations.calculateFuelCost(positiveFuel, negativePrice);
      const result3 = fuelCalculations.calculateFuelCost(negativeFuel, negativePrice);

      // Assert
      expect(result1).toBe(0);
      expect(result2).toBe(0);
      expect(result3).toBe(0);
    });
  });

  describe('calculateTripCost', () => {
    it('should calculate complete trip cost for economical vehicle', () => {
      // Arrange
      const distance = 150; // km
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850; // CLP

      // Act
      const tripCost = fuelCalculations.calculateTripCost(distance, vehicleType, pricePerLiter);

      // Assert
      expect(tripCost).toEqual({
        distance: 150,
        vehicleType: VehicleType.ECONOMICO,
        consumption: 15, // km/l
        fuelNeeded: 10, // 150/15 = 10 liters
        pricePerLiter: 850,
        totalCost: 8500, // 10 * 850 = 8500
        costPerKm: 56.67 // 8500 / 150 = 56.67 rounded
      });
    });

    it('should calculate complete trip cost for SUV', () => {
      // Arrange
      const distance = 80; // km
      const vehicleType = VehicleType.SUV;
      const pricePerLiter = 780; // CLP (diesel)

      // Act
      const tripCost = fuelCalculations.calculateTripCost(distance, vehicleType, pricePerLiter);

      // Assert
      expect(tripCost).toEqual({
        distance: 80,
        vehicleType: VehicleType.SUV,
        consumption: 8, // km/l
        fuelNeeded: 10, // 80/8 = 10 liters
        pricePerLiter: 780,
        totalCost: 7800, // 10 * 780 = 7800
        costPerKm: 97.5 // 7800 / 80 = 97.5
      });
    });

    it('should handle decimal distances in complete trip calculation', () => {
      // Arrange
      const distance = 15.5; // km
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850; // CLP

      // Act
      const tripCost = fuelCalculations.calculateTripCost(distance, vehicleType, pricePerLiter);

      // Assert
      expect(tripCost.distance).toBe(15.5);
      expect(tripCost.fuelNeeded).toBeCloseTo(1.033, 3);
      expect(tripCost.totalCost).toBeCloseTo(878.05, 2);
      expect(tripCost.costPerKm).toBeCloseTo(56.65, 2);
    });

    it('should return zero cost for zero distance', () => {
      // Arrange
      const distance = 0;
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850;

      // Act
      const tripCost = fuelCalculations.calculateTripCost(distance, vehicleType, pricePerLiter);

      // Assert
      expect(tripCost).toEqual({
        distance: 0,
        vehicleType: VehicleType.ECONOMICO,
        consumption: 15,
        fuelNeeded: 0,
        pricePerLiter: 850,
        totalCost: 0,
        costPerKm: 0
      });
    });
  });

  describe('compareTripCosts', () => {
    it('should compare costs between different vehicle types', () => {
      // Arrange
      const distance = 150; // km
      const priceGasolina93 = 850; // CLP
      const priceGasolina95 = 890; // CLP
      const priceDiesel = 780; // CLP

      const vehicleConfigs = [
        { vehicleType: VehicleType.ECONOMICO, pricePerLiter: priceGasolina93 },
        { vehicleType: VehicleType.INTERMEDIO, pricePerLiter: priceGasolina95 },
        { vehicleType: VehicleType.SUV, pricePerLiter: priceDiesel }
      ];

      // Act
      const comparison = fuelCalculations.compareTripCosts(distance, vehicleConfigs);

      // Assert
      expect(comparison).toHaveLength(3);
      expect(comparison[0].vehicleType).toBe(VehicleType.ECONOMICO);
      expect(comparison[0].totalCost).toBe(8500); // 150/15 * 850 = 8500
      
      expect(comparison[1].vehicleType).toBe(VehicleType.INTERMEDIO);
      expect(comparison[1].totalCost).toBe(13350); // 150/10 * 890 = 13350
      
      expect(comparison[2].vehicleType).toBe(VehicleType.SUV);
      expect(comparison[2].totalCost).toBe(14625); // 150/8 * 780 = 14625

      // Should be sorted by total cost (cheapest first)
      expect(comparison[0].totalCost).toBeLessThanOrEqual(comparison[1].totalCost);
      expect(comparison[1].totalCost).toBeLessThanOrEqual(comparison[2].totalCost);
    });

    it('should handle empty vehicle configs array', () => {
      // Arrange
      const distance = 100;
      const vehicleConfigs: any[] = [];

      // Act
      const comparison = fuelCalculations.compareTripCosts(distance, vehicleConfigs);

      // Assert
      expect(comparison).toEqual([]);
    });

    it('should sort by total cost ascending', () => {
      // Arrange - Setup so SUV is cheapest (using very cheap diesel price)
      const distance = 100;
      const vehicleConfigs = [
        { vehicleType: VehicleType.ECONOMICO, pricePerLiter: 1000 }, // Expensive gas
        { vehicleType: VehicleType.INTERMEDIO, pricePerLiter: 1100 }, // Very expensive gas
        { vehicleType: VehicleType.SUV, pricePerLiter: 500 } // Cheap diesel
      ];

      // Act
      const comparison = fuelCalculations.compareTripCosts(distance, vehicleConfigs);

      // Assert
      // SUV should be first (cheapest): 100/8 * 500 = 6250
      // Economico second: 100/15 * 1000 = 6667
      // Intermedio last: 100/10 * 1100 = 11000
      expect(comparison[0].vehicleType).toBe(VehicleType.SUV);
      expect(comparison[1].vehicleType).toBe(VehicleType.ECONOMICO);
      expect(comparison[2].vehicleType).toBe(VehicleType.INTERMEDIO);
    });
  });

  describe('calculateFuelEfficiency', () => {
    it('should calculate fuel efficiency for different vehicle types', () => {
      // Arrange & Act
      const economicoEfficiency = fuelCalculations.calculateFuelEfficiency(VehicleType.ECONOMICO);
      const intermedioEfficiency = fuelCalculations.calculateFuelEfficiency(VehicleType.INTERMEDIO);
      const suvEfficiency = fuelCalculations.calculateFuelEfficiency(VehicleType.SUV);

      // Assert
      expect(economicoEfficiency).toEqual({
        vehicleType: VehicleType.ECONOMICO,
        kmPerLiter: 15,
        litersPerKm: 0.0667, // 1/15 = 0.0667 rounded
        efficiencyRating: 'high'
      });

      expect(intermedioEfficiency).toEqual({
        vehicleType: VehicleType.INTERMEDIO,
        kmPerLiter: 10,
        litersPerKm: 0.1, // 1/10 = 0.1
        efficiencyRating: 'medium'
      });

      expect(suvEfficiency).toEqual({
        vehicleType: VehicleType.SUV,
        kmPerLiter: 8,
        litersPerKm: 0.125, // 1/8 = 0.125
        efficiencyRating: 'low'
      });
    });
  });

  describe('calculateCO2Emissions', () => {
    it('should calculate CO2 emissions for gasoline vehicles', () => {
      // Arrange
      const distance = 100; // km
      const fuelType = FuelType.GASOLINA_93;

      // Act
      const emissions = fuelCalculations.calculateCO2Emissions(distance, fuelType);

      // Assert
      // Gasoline emits ~2.3 kg CO2 per liter
      // Assuming average consumption of 12 km/l for mixed calculations
      // 100 km / 12 km/l = 8.33 liters
      // 8.33 liters * 2.3 kg CO2/l = 19.17 kg CO2
      expect(emissions).toEqual({
        distance: 100,
        fuelType: FuelType.GASOLINA_93,
        co2PerLiter: 2.3, // kg
        estimatedFuelUsed: 8.33, // liters (using average consumption)
        totalCO2Emissions: 19.17 // kg
      });
    });

    it('should calculate CO2 emissions for diesel vehicles', () => {
      // Arrange
      const distance = 100; // km
      const fuelType = FuelType.DIESEL;

      // Act
      const emissions = fuelCalculations.calculateCO2Emissions(distance, fuelType);

      // Assert
      // Diesel emits ~2.7 kg CO2 per liter
      // Assuming average consumption of 12 km/l for mixed calculations
      // 100 km / 12 km/l = 8.33 liters
      // 8.33 liters * 2.7 kg CO2/l = 22.5 kg CO2
      expect(emissions).toEqual({
        distance: 100,
        fuelType: FuelType.DIESEL,
        co2PerLiter: 2.7, // kg
        estimatedFuelUsed: 8.33, // liters
        totalCO2Emissions: 22.5 // kg
      });
    });

    it('should return zero emissions for zero distance', () => {
      // Arrange
      const distance = 0;
      const fuelType = FuelType.GASOLINA_93;

      // Act
      const emissions = fuelCalculations.calculateCO2Emissions(distance, fuelType);

      // Assert
      expect(emissions.totalCO2Emissions).toBe(0);
      expect(emissions.estimatedFuelUsed).toBe(0);
    });
  });

  describe('calculateMonthlyFuelBudget', () => {
    it('should calculate monthly fuel budget based on daily usage', () => {
      // Arrange
      const dailyDistances = [25, 30, 0, 40, 35, 0, 0]; // Weekly pattern
      const vehicleType = VehicleType.ECONOMICO;
      const averageFuelPrice = 850;

      // Act
      const monthlyBudget = fuelCalculations.calculateMonthlyFuelBudget(
        dailyDistances,
        vehicleType,
        averageFuelPrice
      );

      // Assert
      const weeklyDistance = 130; // 25+30+0+40+35+0+0 = 130 km
      const monthlyDistance = weeklyDistance * 4.33; // ~563 km per month
      const monthlyFuelNeeded = monthlyDistance / 15; // ~37.5 liters
      const monthlyFuelCost = monthlyFuelNeeded * 850; // ~31,875 CLP

      expect(monthlyBudget).toEqual({
        weeklyPattern: dailyDistances,
        vehicleType: VehicleType.ECONOMICO,
        weeklyDistance: 130,
        monthlyDistance: 563, // rounded
        monthlyFuelNeeded: 37.53, // rounded
        averageFuelPrice: 850,
        monthlyFuelCost: 31901, // rounded
        dailyAverageCost: 1063 // monthly cost / 30 days
      });
    });

    it('should handle all-zero daily distances', () => {
      // Arrange
      const dailyDistances = [0, 0, 0, 0, 0, 0, 0]; // No travel
      const vehicleType = VehicleType.ECONOMICO;
      const averageFuelPrice = 850;

      // Act
      const monthlyBudget = fuelCalculations.calculateMonthlyFuelBudget(
        dailyDistances,
        vehicleType,
        averageFuelPrice
      );

      // Assert
      expect(monthlyBudget).toEqual({
        weeklyPattern: dailyDistances,
        vehicleType: VehicleType.ECONOMICO,
        weeklyDistance: 0,
        monthlyDistance: 0,
        monthlyFuelNeeded: 0,
        averageFuelPrice: 850,
        monthlyFuelCost: 0,
        dailyAverageCost: 0
      });
    });
  });

  describe('input validation', () => {
    it('should throw error for invalid vehicle type in calculateFuelNeeded', () => {
      // Arrange
      const distance = 100;
      const invalidVehicleType = 'invalid_type' as VehicleType;

      // Act & Assert
      expect(() => {
        fuelCalculations.calculateFuelNeeded(distance, invalidVehicleType);
      }).toThrow('Invalid vehicle type');
    });

    it('should handle null/undefined inputs gracefully', () => {
      // Arrange & Act & Assert
      expect(() => {
        fuelCalculations.calculateFuelNeeded(null as any, VehicleType.ECONOMICO);
      }).toThrow('Invalid distance value');

      expect(() => {
        fuelCalculations.calculateFuelCost(undefined as any, 850);
      }).toThrow('Invalid fuel amount or price');

      expect(() => {
        fuelCalculations.calculateTripCost(100, null as any, 850);
      }).toThrow('Invalid vehicle type');
    });

    it('should validate distance is a number', () => {
      // Arrange & Act & Assert
      expect(() => {
        fuelCalculations.calculateFuelNeeded('100' as any, VehicleType.ECONOMICO);
      }).toThrow('Distance must be a number');

      expect(() => {
        fuelCalculations.calculateTripCost(NaN, VehicleType.ECONOMICO, 850);
      }).toThrow('Distance must be a valid number');
    });

    it('should validate price is positive', () => {
      // Arrange & Act & Assert
      expect(() => {
        fuelCalculations.calculateTripCost(100, VehicleType.ECONOMICO, -850);
      }).toThrow('Price per liter must be positive');

      expect(() => {
        fuelCalculations.calculateFuelCost(10, 0);
      }).toThrow('Price per liter must be greater than zero');
    });
  });

  describe('edge cases', () => {
    it('should handle very large distances', () => {
      // Arrange
      const veryLargeDistance = 999999; // km
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850;

      // Act
      const result = fuelCalculations.calculateTripCost(veryLargeDistance, vehicleType, pricePerLiter);

      // Assert
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.fuelNeeded).toBe(veryLargeDistance / 15);
      expect(result.totalCost).toBe((veryLargeDistance / 15) * 850);
    });

    it('should handle very small distances with precision', () => {
      // Arrange
      const verySmallDistance = 0.001; // 1 meter
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850;

      // Act
      const result = fuelCalculations.calculateTripCost(verySmallDistance, vehicleType, pricePerLiter);

      // Assert
      expect(result.fuelNeeded).toBeCloseTo(0.0000667, 7); // Very small but precise
      expect(result.totalCost).toBeCloseTo(0.0567, 4);
      expect(result.costPerKm).toBe(56.67); // Should still calculate cost per km
    });

    it('should handle floating point precision correctly', () => {
      // Arrange
      const distance = 0.1; // Small decimal distance
      const vehicleType = VehicleType.ECONOMICO;
      const pricePerLiter = 850.5; // Decimal price

      // Act
      const result = fuelCalculations.calculateTripCost(distance, vehicleType, pricePerLiter);

      // Assert
      // Should not have floating point precision issues
      expect(result.fuelNeeded).toBeCloseTo(0.00667, 5);
      expect(result.totalCost).toBeCloseTo(5.67, 2);
      expect(Number.isFinite(result.totalCost)).toBe(true);
      expect(Number.isFinite(result.costPerKm)).toBe(true);
    });
  });
});