import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { fuelService } from '@services/fuelService';
import { cneService } from '@services/cneService';
import { mapsService } from '@services/mapsService';
import { 
  CreateFuelExpenseData, 
  VehicleType, 
  FuelType,
  FuelExpenseFilters 
} from '@types/fuel';

describe('Fuel API Integration Tests', () => {
  beforeEach(() => {
    // Reset any custom handlers before each test
    server.resetHandlers();
  });

  describe('CNE API Integration', () => {
    it('should successfully fetch fuel prices from CNE API', async () => {
      // Act
      const prices = await cneService.getCurrentFuelPrices();

      // Assert
      expect(prices).toHaveLength(16); // 4 fuel types × 4 regions
      
      // Verify structure of first price
      expect(prices[0]).toEqual(
        expect.objectContaining({
          fuelType: expect.any(String),
          price: expect.any(Number),
          region: expect.any(String),
          lastUpdated: expect.any(String),
          source: 'CNE'
        })
      );

      // Verify price ranges are realistic
      prices.forEach(price => {
        expect(price.price).toBeGreaterThan(700);
        expect(price.price).toBeLessThan(1200);
      });
    });

    it('should handle CNE API service unavailable', async () => {
      // Arrange
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
          );
        })
      );

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('CNE API returned error: 503');
    });

    it('should retry CNE API calls on failure', async () => {
      // Arrange
      let callCount = 0;
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          callCount++;
          if (callCount < 3) {
            throw new Error('Network error');
          }
          
          return HttpResponse.json({
            precios: [{
              region: 'Metropolitana de Santiago',
              gasolina_93: 850,
              gasolina_95: 890,
              gasolina_97: 920,
              diesel: 780,
              fecha_actualizacion: '2024-01-15T10:00:00Z'
            }]
          });
        })
      );

      // Act
      const prices = await cneService.getCurrentFuelPrices();

      // Assert
      expect(callCount).toBe(3); // Should retry 3 times
      expect(prices).toHaveLength(4);
    });

    it('should get specific fuel price by region', async () => {
      // Act
      const price = await cneService.getFuelPriceByRegion(
        FuelType.GASOLINA_93,
        'Metropolitana de Santiago'
      );

      // Assert
      expect(price).toEqual({
        fuelType: FuelType.GASOLINA_93,
        price: 850,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      });
    });
  });

  describe('Google Maps API Integration', () => {
    it('should calculate route using Google Directions API', async () => {
      // Arrange
      const origin = { lat: -33.4489, lng: -70.6693 };
      const destination = { lat: -33.3745, lng: -70.5728 };

      // Act
      const routeData = await mapsService.calculateRoute(origin, destination);

      // Assert
      expect(routeData).toEqual(
        expect.objectContaining({
          origin: expect.objectContaining({
            coordinates: origin
          }),
          destination: expect.objectContaining({
            coordinates: destination
          }),
          distance: expect.any(Number),
          duration: expect.any(Number)
        })
      );

      expect(routeData.distance).toBeGreaterThan(0);
      expect(routeData.duration).toBeGreaterThan(0);
    });

    it('should handle route not found error', async () => {
      // Arrange
      const origin = { lat: 40.7128, lng: -74.0060 }; // New York (outside Chile)
      const destination = { lat: -33.3745, lng: -70.5728 };

      // Act & Assert
      await expect(mapsService.calculateRoute(origin, destination))
        .rejects.toThrow('No se pudo encontrar una ruta');
    });

    it('should geocode addresses using Google Geocoding API', async () => {
      // Act
      const location = await mapsService.geocodeAddress('Plaza de Armas, Santiago, Chile');

      // Assert
      expect(location).toEqual({
        coordinates: { lat: -33.4489, lng: -70.6693 },
        address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile'
      });
    });

    it('should handle geocoding failures', async () => {
      // Act & Assert
      await expect(mapsService.geocodeAddress('Dirección Inexistente 12345'))
        .rejects.toThrow('No se pudo encontrar la dirección especificada');
    });
  });

  describe('Fuel Service Integration', () => {
    it('should create fuel expense with complete workflow', async () => {
      // Arrange
      const expenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        originAddress: 'Plaza de Armas, Santiago',
        destinationAddress: 'Las Condes, Santiago',
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Visita cliente importante',
        description: 'Reunión estratégica trimestral'
      };

      // Act
      const response = await fuelService.createFuelExpense(expenseData);

      // Assert
      expect(response.success).toBe(true);
      expect(response.fuelExpense).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId: expect.any(String),
          vehicleType: VehicleType.ECONOMICO,
          fuelType: FuelType.GASOLINA_93,
          businessPurpose: 'Visita cliente importante',
          status: 'draft'
        })
      );

      expect(response.fuelExpense.calculation).toEqual(
        expect.objectContaining({
          totalCost: expect.any(Number),
          fuelNeeded: expect.any(Number),
          consumption: 15 // Económico vehicle consumption
        })
      );
    });

    it('should validate coordinates are within Chile', async () => {
      // Arrange
      const invalidExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: 40.7128, lng: -74.0060 }, // New York
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Viaje internacional'
      };

      // Act & Assert
      await expect(fuelService.createFuelExpense(invalidExpenseData))
        .rejects.toThrow('Coordinates must be within Chile bounds');
    });

    it('should fetch fuel expenses with filters', async () => {
      // Arrange
      const filters: FuelExpenseFilters = {
        status: 'approved',
        vehicleType: VehicleType.ECONOMICO
      };

      // Act
      const expenses = await fuelService.getFuelExpenses(filters);

      // Assert
      expect(expenses).toHaveLength(1);
      expect(expenses[0]).toEqual(
        expect.objectContaining({
          status: 'approved',
          vehicleType: 'economico'
        })
      );
    });

    it('should get fuel expense by ID', async () => {
      // Act
      const expense = await fuelService.getFuelExpenseById('fuel-123');

      // Assert
      expect(expense).toEqual(
        expect.objectContaining({
          id: 'fuel-123',
          userId: 'user-123',
          status: 'approved'
        })
      );
    });

    it('should handle non-existent fuel expense', async () => {
      // Act & Assert
      await expect(fuelService.getFuelExpenseById('non-existent-id'))
        .rejects.toThrow('Fuel expense not found');
    });

    it('should update fuel expense successfully', async () => {
      // Arrange
      const updateData = {
        businessPurpose: 'Propósito actualizado',
        description: 'Descripción actualizada'
      };

      // Act
      const updatedExpense = await fuelService.updateFuelExpense('fuel-123', updateData);

      // Assert
      expect(updatedExpense).toEqual(
        expect.objectContaining({
          id: 'fuel-123',
          businessPurpose: 'Propósito actualizado',
          description: 'Descripción actualizada',
          updatedAt: expect.any(String)
        })
      );
    });

    it('should delete fuel expense successfully', async () => {
      // Act & Assert
      await expect(fuelService.deleteFuelExpense('fuel-123'))
        .resolves.not.toThrow();
    });

    it('should get fuel expense statistics', async () => {
      // Act
      const stats = await fuelService.getFuelExpenseStats();

      // Assert
      expect(stats).toEqual({
        totalExpenses: 25,
        totalAmount: 45000,
        totalDistance: 580.5,
        totalFuelLiters: 42.3,
        averageCostPerKm: 77.5,
        byVehicleType: expect.objectContaining({
          economico: expect.objectContaining({
            count: 15,
            totalAmount: 25000,
            totalDistance: 350.0
          })
        }),
        byFuelType: expect.objectContaining({
          gasolina_93: expect.objectContaining({
            count: 18,
            totalAmount: 32000,
            totalLiters: 28.5
          })
        }),
        byStatus: expect.objectContaining({
          draft: 5,
          submitted: 8,
          approved: 10,
          rejected: 2
        })
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          throw new Error('Network Error');
        })
      );

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Error fetching fuel prices from CNE API');
    });

    it('should handle rate limiting from Google Maps API', async () => {
      // Arrange
      server.use(
        http.get('https://maps.googleapis.com/maps/api/directions/json', () => {
          return HttpResponse.json(
            { 
              error_message: 'You have exceeded your rate-limit for this API.',
              status: 'OVER_QUERY_LIMIT'
            },
            { status: 429 }
          );
        })
      );

      const origin = { lat: -33.4489, lng: -70.6693 };
      const destination = { lat: -33.3745, lng: -70.5728 };

      // Act & Assert
      await expect(mapsService.calculateRoute(origin, destination))
        .rejects.toThrow('Se ha excedido el límite de consultas de la API');
    });

    it('should handle invalid API keys', async () => {
      // Arrange
      server.use(
        http.get('https://maps.googleapis.com/maps/api/geocode/json', () => {
          return HttpResponse.json(
            { 
              error_message: 'The provided API key is invalid.',
              status: 'REQUEST_DENIED'
            },
            { status: 403 }
          );
        })
      );

      // Act & Assert
      await expect(mapsService.geocodeAddress('Plaza de Armas, Santiago'))
        .rejects.toThrow('Clave de API inválida');
    });

    it('should handle malformed responses from external APIs', async () => {
      // Arrange
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          return HttpResponse.json({ malformed: 'data' });
        })
      );

      // Act & Assert
      await expect(cneService.getCurrentFuelPrices())
        .rejects.toThrow('Invalid response format from CNE API');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete fuel expense creation workflow', async () => {
      // Arrange - Simula el flujo completo desde frontend
      const expenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Visita cliente'
      };

      // Act - Paso 1: Crear gasto
      const createResponse = await fuelService.createFuelExpense(expenseData);
      
      // Assert - Verificar creación exitosa
      expect(createResponse.success).toBe(true);
      expect(createResponse.fuelExpense.id).toBeTruthy();

      // Act - Paso 2: Obtener el gasto creado
      const retrievedExpense = await fuelService.getFuelExpenseById(createResponse.fuelExpense.id!);
      
      // Assert - Verificar que se puede recuperar
      expect(retrievedExpense.id).toBe(createResponse.fuelExpense.id);
      expect(retrievedExpense.businessPurpose).toBe('Visita cliente');

      // Act - Paso 3: Actualizar el gasto
      const updatedExpense = await fuelService.updateFuelExpense(
        retrievedExpense.id!,
        { description: 'Actualización posterior' }
      );
      
      // Assert - Verificar actualización
      expect(updatedExpense.description).toBe('Actualización posterior');

      // Act - Paso 4: Eliminar el gasto
      await fuelService.deleteFuelExpense(retrievedExpense.id!);
      
      // Assert - Verificar eliminación
      await expect(fuelService.getFuelExpenseById(retrievedExpense.id!))
        .rejects.toThrow('Fuel expense not found');
    });

    it('should handle concurrent API calls without conflicts', async () => {
      // Arrange
      const promises = [
        cneService.getCurrentFuelPrices(),
        fuelService.getFuelExpenses({ status: 'approved' }),
        fuelService.getFuelExpenseStats(),
        mapsService.geocodeAddress('Santiago, Chile')
      ];

      // Act
      const results = await Promise.allSettled(promises);

      // Assert
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        }
      });
    });

    it('should handle partial API failures gracefully', async () => {
      // Arrange - CNE API falla pero fuel service funciona
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      // Act
      const fuelExpensesPromise = fuelService.getFuelExpenses();
      const cneDataPromise = cneService.getCurrentFuelPrices();

      // Assert
      await expect(fuelExpensesPromise).resolves.toBeDefined();
      await expect(cneDataPromise).rejects.toThrow();
    });

    it('should validate business logic constraints end-to-end', async () => {
      // Arrange
      const invalidExpenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.4489, lng: -70.6693 }, // Same as origin
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'x' // Too short
      };

      // Act & Assert
      await expect(fuelService.createFuelExpense(invalidExpenseData))
        .rejects.toThrow(); // Should fail business validation
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle multiple rapid requests without degradation', async () => {
      // Arrange
      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() => 
        fuelService.getFuelExpenses({ status: 'approved' })
      );

      // Act
      const results = await Promise.all(promises);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should cache CNE API responses appropriately', async () => {
      // Arrange
      let apiCallCount = 0;
      server.use(
        http.get('https://www.cne.cl/api/precios-combustible', () => {
          apiCallCount++;
          return HttpResponse.json({
            precios: [{
              region: 'Metropolitana de Santiago',
              gasolina_93: 850,
              gasolina_95: 890,
              gasolina_97: 920,
              diesel: 780,
              fecha_actualizacion: '2024-01-15T10:00:00Z'
            }]
          });
        })
      );

      // Act - Multiple calls within cache time
      await cneService.getCurrentFuelPrices();
      await cneService.getCurrentFuelPrices();
      await cneService.getCurrentFuelPrices();

      // Assert - Should only call API once due to caching
      expect(apiCallCount).toBe(1);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across service calls', async () => {
      // Arrange
      const expenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Consistencia test'
      };

      // Act
      const createResponse = await fuelService.createFuelExpense(expenseData);
      const allExpenses = await fuelService.getFuelExpenses();
      const specificExpense = await fuelService.getFuelExpenseById(createResponse.fuelExpense.id!);

      // Assert
      const createdExpenseInList = allExpenses.find(e => e.id === createResponse.fuelExpense.id);
      
      expect(createdExpenseInList).toBeDefined();
      expect(specificExpense).toEqual(
        expect.objectContaining({
          id: createResponse.fuelExpense.id,
          businessPurpose: 'Consistencia test'
        })
      );
    });

    it('should validate calculation consistency with external price data', async () => {
      // Act
      const fuelPrices = await cneService.getCurrentFuelPrices();
      const santiagoPriceG93 = fuelPrices.find(
        p => p.fuelType === FuelType.GASOLINA_93 && p.region === 'Metropolitana de Santiago'
      );

      const expenseData: CreateFuelExpenseData = {
        originCoordinates: { lat: -33.4489, lng: -70.6693 },
        destinationCoordinates: { lat: -33.3745, lng: -70.5728 },
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        businessPurpose: 'Test consistency'
      };

      const createResponse = await fuelService.createFuelExpense(expenseData);

      // Assert
      expect(santiagoPriceG93).toBeDefined();
      expect(createResponse.fuelExpense.calculation.fuelPrice).toBe(santiagoPriceG93!.price);
    });
  });
});