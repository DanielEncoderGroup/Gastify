import { http, HttpResponse } from 'msw';
import { FuelType } from '../../types/fuel';

// Mock data para CNE API
const mockCNEData = {
  precios: [
    {
      region: 'Metropolitana de Santiago',
      gasolina_93: 850,
      gasolina_95: 890,
      gasolina_97: 920,
      diesel: 780,
      fecha_actualizacion: '2024-01-15T10:00:00Z'
    },
    {
      region: 'Valparaíso',
      gasolina_93: 860,
      gasolina_95: 900,
      gasolina_97: 930,
      diesel: 790,
      fecha_actualizacion: '2024-01-15T10:00:00Z'
    },
    {
      region: 'Biobío',
      gasolina_93: 845,
      gasolina_95: 885,
      gasolina_97: 915,
      diesel: 775,
      fecha_actualizacion: '2024-01-15T10:00:00Z'
    },
    {
      region: 'Antofagasta',
      gasolina_93: 870,
      gasolina_95: 910,
      gasolina_97: 940,
      diesel: 800,
      fecha_actualizacion: '2024-01-15T10:00:00Z'
    }
  ]
};

// Mock data para Google Maps Directions API
const mockDirectionsResponse = {
  routes: [{
    legs: [{
      distance: { value: 15500, text: '15.5 km' },
      duration: { value: 1500, text: '25 min' },
      start_address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
      end_address: 'Las Condes, Santiago, Región Metropolitana, Chile'
    }],
    overview_polyline: {
      points: 'encoded_polyline_string_mock'
    },
    summary: 'Ruta Principal'
  }],
  status: 'OK'
};

// Mock data para Google Maps Geocoding API
const mockGeocodingResponse = {
  results: [{
    formatted_address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
    geometry: {
      location: {
        lat: -33.4489,
        lng: -70.6693
      }
    },
    address_components: [
      { long_name: 'Plaza de Armas', types: ['point_of_interest'] },
      { long_name: 'Santiago', types: ['locality'] },
      { long_name: 'Región Metropolitana', types: ['administrative_area_level_1'] },
      { long_name: 'Chile', types: ['country'] }
    ]
  }],
  status: 'OK'
};

// Handlers para las APIs externas
export const externalApiHandlers = [
  // CNE API - Precios de combustible
  http.get('https://www.cne.cl/api/precios-combustible', () => {
    return HttpResponse.json(mockCNEData);
  }),

  // CNE API - Error scenarios para testing
  http.get('https://www.cne.cl/api/precios-combustible-error', () => {
    return HttpResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }),

  // CNE API - Timeout scenario
  http.get('https://www.cne.cl/api/precios-combustible-timeout', () => {
    return new Promise((resolve) => {
      // Never resolve to simulate timeout
    });
  }),

  // Google Maps Directions API
  http.get('https://maps.googleapis.com/maps/api/directions/json', ({ request }) => {
    const url = new URL(request.url);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');

    // Simulate different responses based on coordinates
    if (origin?.includes('40.7128') || destination?.includes('40.7128')) {
      // Outside Chile - return error
      return HttpResponse.json({
        status: 'NOT_FOUND',
        error_message: 'No se pudo encontrar una ruta'
      }, { status: 404 });
    }

    if (origin === destination) {
      // Same origin and destination
      return HttpResponse.json({
        status: 'ZERO_RESULTS',
        error_message: 'Origen y destino son el mismo punto'
      }, { status: 400 });
    }

    // Success response
    return HttpResponse.json(mockDirectionsResponse);
  }),

  // Google Maps Geocoding API
  http.get('https://maps.googleapis.com/maps/api/geocode/json', ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const latlng = url.searchParams.get('latlng');

    if (address?.includes('Dirección Inexistente')) {
      return HttpResponse.json({
        results: [],
        status: 'ZERO_RESULTS'
      });
    }

    if (latlng?.includes('40.7128')) {
      // Outside Chile
      return HttpResponse.json({
        results: [{
          formatted_address: 'Times Square, New York, NY, USA',
          geometry: {
            location: { lat: 40.7128, lng: -74.0060 }
          },
          address_components: [
            { long_name: 'Times Square', types: ['point_of_interest'] },
            { long_name: 'New York', types: ['locality'] },
            { long_name: 'New York', types: ['administrative_area_level_1'] },
            { long_name: 'United States', types: ['country'] }
          ]
        }],
        status: 'OK'
      });
    }

    // Success response for Chile locations
    return HttpResponse.json(mockGeocodingResponse);
  }),

  // Google Maps API Key validation
  http.get('https://maps.googleapis.com/maps/api/js', ({ request }) => {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');

    if (!apiKey || apiKey === 'invalid-key') {
      return HttpResponse.text('Invalid API key', { status: 400 });
    }

    // Mock successful JS API load
    return HttpResponse.text(`
      window.google = {
        maps: {
          DirectionsService: function() {},
          DirectionsStatus: { OK: 'OK', NOT_FOUND: 'NOT_FOUND' },
          TravelMode: { DRIVING: 'DRIVING' },
          UnitSystem: { METRIC: 'METRIC' },
          Geocoder: function() {},
          GeocoderStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
          Map: function() {},
          Marker: function() {},
          LatLng: function(lat, lng) {
            return { lat: () => lat, lng: () => lng };
          }
        }
      };
    `);
  })
];

// Handlers para Gastify API (backend propio)
export const gastifyApiHandlers = [
  // Fuel expenses endpoints
  http.post('/api/fuel-expenses', async ({ request }) => {
    const body = await request.json() as any;
    
    // Validate required fields
    if (!body.originCoordinates || !body.destinationCoordinates) {
      return HttpResponse.json(
        { error: 'Origin and destination coordinates are required' },
        { status: 400 }
      );
    }

    // Validate coordinates are within Chile
    if (body.originCoordinates.lat > 0 || body.originCoordinates.lat < -60) {
      return HttpResponse.json(
        { error: 'Coordinates must be within Chile bounds' },
        { status: 400 }
      );
    }

    // Mock successful creation
    return HttpResponse.json({
      success: true,
      fuelExpense: {
        id: 'fuel-' + Date.now(),
        userId: 'user-123',
        routeData: {
          origin: {
            coordinates: body.originCoordinates,
            address: 'Origin Address',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: body.destinationCoordinates,
            address: 'Destination Address',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 25
        },
        vehicleType: body.vehicleType,
        fuelType: body.fuelType,
        calculation: {
          routeData: {
            origin: {
              coordinates: body.originCoordinates,
              address: 'Origin Address',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: body.destinationCoordinates,
              address: 'Destination Address',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: body.vehicleType,
          fuelType: body.fuelType,
          fuelPrice: 850,
          fuelNeeded: 1.03,
          totalCost: 876,
          consumption: 15
        },
        businessPurpose: body.businessPurpose,
        description: body.description || '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      message: 'Fuel expense created successfully'
    });
  }),

  // Get fuel expenses
  http.get('/api/fuel-expenses', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const vehicleType = url.searchParams.get('vehicleType');

    // Mock filtered results
    let mockExpenses = [
      {
        id: 'fuel-1',
        userId: 'user-123',
        routeData: {
          origin: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 25
        },
        vehicleType: 'economico',
        fuelType: 'gasolina_93',
        calculation: {
          routeData: {
            origin: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: 'economico',
          fuelType: 'gasolina_93',
          fuelPrice: 850,
          fuelNeeded: 1.03,
          totalCost: 876,
          consumption: 15
        },
        businessPurpose: 'Visita cliente',
        status: 'approved',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'fuel-2',
        userId: 'user-123',
        routeData: {
          origin: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 30
        },
        vehicleType: 'intermedio',
        fuelType: 'gasolina_95',
        calculation: {
          routeData: {
            origin: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 30
          },
          vehicleType: 'intermedio',
          fuelType: 'gasolina_95',
          fuelPrice: 890,
          fuelNeeded: 1.55,
          totalCost: 1380,
          consumption: 10
        },
        businessPurpose: 'Reunión estratégica',
        status: 'pending',
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-16T09:00:00Z'
      }
    ];

    // Apply filters
    if (status) {
      mockExpenses = mockExpenses.filter(expense => expense.status === status);
    }
    
    if (vehicleType) {
      mockExpenses = mockExpenses.filter(expense => expense.vehicleType === vehicleType);
    }

    return HttpResponse.json({
      success: true,
      data: mockExpenses
    });
  }),

  // Get fuel expense by ID
  http.get('/api/fuel-expenses/:id', ({ params }) => {
    const { id } = params;
    
    if (id === 'non-existent-id') {
      return HttpResponse.json(
        { error: 'Fuel expense not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: id,
        userId: 'user-123',
        routeData: {
          origin: {
            coordinates: { lat: -33.4489, lng: -70.6693 },
            address: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          destination: {
            coordinates: { lat: -33.3745, lng: -70.5728 },
            address: 'Las Condes',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile'
          },
          distance: 15.5,
          duration: 25
        },
        vehicleType: 'economico',
        fuelType: 'gasolina_93',
        calculation: {
          routeData: {
            origin: {
              coordinates: { lat: -33.4489, lng: -70.6693 },
              address: 'Santiago Centro',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            destination: {
              coordinates: { lat: -33.3745, lng: -70.5728 },
              address: 'Las Condes',
              city: 'Santiago',
              region: 'Metropolitana',
              country: 'Chile'
            },
            distance: 15.5,
            duration: 25
          },
          vehicleType: 'economico',
          fuelType: 'gasolina_93',
          fuelPrice: 850,
          fuelNeeded: 1.03,
          totalCost: 876,
          consumption: 15
        },
        businessPurpose: 'Visita cliente importante',
        status: 'approved',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    });
  }),

  // Update fuel expense
  http.put('/api/fuel-expenses/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    
    if (id === 'non-existent-id') {
      return HttpResponse.json(
        { error: 'Fuel expense not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: id,
        userId: 'user-123',
        ...body,
        updatedAt: new Date().toISOString()
      }
    });
  }),

  // Delete fuel expense
  http.delete('/api/fuel-expenses/:id', ({ params }) => {
    const { id } = params;
    
    if (id === 'non-existent-id') {
      return HttpResponse.json(
        { error: 'Fuel expense not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Fuel expense deleted successfully'
    });
  }),

  // Get fuel expense statistics
  http.get('/api/fuel-expenses/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalExpenses: 25,
        totalAmount: 45000,
        totalDistance: 580.5,
        totalFuelLiters: 42.3,
        averageCostPerKm: 77.5,
        byVehicleType: {
          economico: {
            count: 15,
            totalAmount: 25000,
            totalDistance: 350.0
          },
          intermedio: {
            count: 7,
            totalAmount: 15000,
            totalDistance: 180.0
          },
          suv: {
            count: 3,
            totalAmount: 5000,
            totalDistance: 50.5
          }
        },
        byFuelType: {
          gasolina_93: {
            count: 18,
            totalAmount: 32000,
            totalLiters: 28.5
          },
          gasolina_95: {
            count: 5,
            totalAmount: 9000,
            totalLiters: 9.2
          },
          gasolina_97: {
            count: 1,
            totalAmount: 2000,
            totalLiters: 2.1
          },
          diesel: {
            count: 1,
            totalAmount: 2000,
            totalLiters: 2.5
          }
        },
        byStatus: {
          draft: 5,
          submitted: 8,
          approved: 10,
          rejected: 2
        }
      }
    });
  })
];

// Handlers para errores de red y casos especiales
export const errorHandlers = [
  // Network error
  http.get('https://www.cne.cl/api/precios-combustible-network-error', () => {
    throw new Error('Network Error');
  }),

  // Rate limiting
  http.get('https://maps.googleapis.com/maps/api/directions/json-rate-limited', () => {
    return HttpResponse.json(
      { 
        error_message: 'You have exceeded your rate-limit for this API.',
        status: 'OVER_QUERY_LIMIT'
      },
      { status: 429 }
    );
  }),

  // Invalid API key
  http.get('https://maps.googleapis.com/maps/api/geocode/json-invalid-key', () => {
    return HttpResponse.json(
      { 
        error_message: 'The provided API key is invalid.',
        status: 'REQUEST_DENIED'
      },
      { status: 403 }
    );
  })
];

// Todos los handlers combinados
export const handlers = [
  ...externalApiHandlers,
  ...gastifyApiHandlers,
  ...errorHandlers
];