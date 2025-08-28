import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGoogleMaps } from '../useGoogleMaps';
import { GoogleMapsConfig } from '@types/fuel';

// Mock Google Maps API
const mockGoogleMaps = {
  maps: {
    Map: vi.fn(),
    Marker: vi.fn(),
    DirectionsRenderer: vi.fn(),
    DirectionsService: vi.fn(),
    Geocoder: vi.fn(),
    InfoWindow: vi.fn(),
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      clearListeners: vi.fn()
    },
    LatLng: vi.fn(),
    Size: vi.fn(),
    Point: vi.fn(),
    MapTypeId: {
      ROADMAP: 'roadmap',
      SATELLITE: 'satellite',
      HYBRID: 'hybrid',
      TERRAIN: 'terrain'
    },
    ControlPosition: {
      TOP_CENTER: 1,
      TOP_LEFT: 2,
      TOP_RIGHT: 3,
      LEFT_TOP: 4,
      RIGHT_TOP: 5,
      LEFT_CENTER: 6,
      RIGHT_CENTER: 7,
      LEFT_BOTTOM: 8,
      RIGHT_BOTTOM: 9,
      BOTTOM_CENTER: 10,
      BOTTOM_LEFT: 11,
      BOTTOM_RIGHT: 12
    },
    places: {
      PlacesService: vi.fn(),
      PlaceResult: vi.fn()
    }
  }
};

// Mock window.google
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true,
  configurable: true
});

describe('useGoogleMaps', () => {
  const mockConfig: GoogleMapsConfig = {
    apiKey: 'test-api-key',
    region: 'cl',
    language: 'es',
    libraries: ['places', 'directions']
  };

  let mockMap: any;
  let mockDirectionsRenderer: any;
  let mockDirectionsService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Map mock
    mockMap = {
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      getCenter: vi.fn(),
      getZoom: vi.fn(),
      panTo: vi.fn(),
      fitBounds: vi.fn(),
      setOptions: vi.fn(),
      controls: {
        [mockGoogleMaps.maps.ControlPosition.TOP_CENTER]: { push: vi.fn() },
        [mockGoogleMaps.maps.ControlPosition.TOP_RIGHT]: { push: vi.fn() }
      }
    };
    mockGoogleMaps.maps.Map.mockImplementation(() => mockMap);

    // Setup DirectionsRenderer mock
    mockDirectionsRenderer = {
      setDirections: vi.fn(),
      setMap: vi.fn(),
      setOptions: vi.fn(),
      getDirections: vi.fn()
    };
    mockGoogleMaps.maps.DirectionsRenderer.mockImplementation(() => mockDirectionsRenderer);

    // Setup DirectionsService mock
    mockDirectionsService = {
      route: vi.fn()
    };
    mockGoogleMaps.maps.DirectionsService.mockImplementation(() => mockDirectionsService);

    // Mock LatLng
    mockGoogleMaps.maps.LatLng.mockImplementation((lat: number, lng: number) => ({
      lat: () => lat,
      lng: () => lng
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      // Act
      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      // Assert
      expect(result.current.map).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.loadError).toBeNull();
      expect(result.current.directionsRenderer).toBeNull();
    });

    it('should indicate loaded state when Google Maps is available', async () => {
      // Act
      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      await act(async () => {
        // Simulate Google Maps being loaded
        result.current.checkGoogleMapsLoaded();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });

    it('should handle Google Maps not loaded', async () => {
      // Arrange
      Object.defineProperty(window, 'google', {
        value: undefined,
        writable: true
      });

      // Act
      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      await act(async () => {
        result.current.checkGoogleMapsLoaded();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(false);
        expect(result.current.loadError).toBe('Google Maps API not loaded');
      });
    });
  });

  describe('map initialization', () => {
    it('should initialize map with default options', async () => {
      // Arrange
      const mapContainer = document.createElement('div');
      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      // Act
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Assert
      expect(mockGoogleMaps.maps.Map).toHaveBeenCalledWith(
        mapContainer,
        expect.objectContaining({
          center: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          zoom: 13,
          mapTypeId: 'roadmap',
          disableDefaultUI: false
        })
      );
      expect(result.current.map).toBe(mockMap);
    });

    it('should initialize map with custom options', async () => {
      // Arrange
      const mapContainer = document.createElement('div');
      const customOptions = {
        center: { lat: -33.4489, lng: -70.6693 },
        zoom: 15,
        mapTypeId: 'satellite' as google.maps.MapTypeId,
        disableDefaultUI: true
      };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      // Act
      await act(async () => {
        await result.current.initializeMap(mapContainer, customOptions);
      });

      // Assert
      expect(mockGoogleMaps.maps.Map).toHaveBeenCalledWith(
        mapContainer,
        expect.objectContaining({
          center: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          zoom: 15,
          mapTypeId: 'satellite',
          disableDefaultUI: true
        })
      );
    });

    it('should handle map initialization error', async () => {
      // Arrange
      const mapContainer = document.createElement('div');
      mockGoogleMaps.maps.Map.mockImplementation(() => {
        throw new Error('Map initialization failed');
      });

      const { result } = renderHook(() => useGoogleMaps(mockConfig));

      // Act
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Assert
      expect(result.current.map).toBeNull();
      expect(result.current.loadError).toBe('Map initialization failed');
    });
  });

  describe('directions functionality', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });
    });

    it('should initialize directions renderer', async () => {
      // Arrange
      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
        result.current.initializeDirections();
      });

      // Assert
      expect(mockGoogleMaps.maps.DirectionsRenderer).toHaveBeenCalled();
      expect(mockDirectionsRenderer.setMap).toHaveBeenCalledWith(mockMap);
      expect(result.current.directionsRenderer).toBe(mockDirectionsRenderer);
    });

    it('should calculate and display route', async () => {
      // Arrange
      const origin = { lat: -33.4489, lng: -70.6693 };
      const destination = { lat: -33.3745, lng: -70.5728 };
      
      const mockDirectionsResult = {
        routes: [{
          legs: [{
            distance: { value: 15500, text: '15.5 km' },
            duration: { value: 1500, text: '25 min' }
          }]
        }]
      };

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(mockDirectionsResult, 'OK');
      });

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
        result.current.initializeDirections();
      });

      // Act
      await act(async () => {
        await result.current.calculateAndDisplayRoute(origin, destination);
      });

      // Assert
      expect(mockDirectionsService.route).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          destination: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          travelMode: 'DRIVING'
        }),
        expect.any(Function)
      );
      expect(mockDirectionsRenderer.setDirections).toHaveBeenCalledWith(mockDirectionsResult);
    });

    it('should handle route calculation error', async () => {
      // Arrange
      const origin = { lat: -33.4489, lng: -70.6693 };
      const destination = { lat: 0, lng: 0 };

      mockDirectionsService.route.mockImplementation((request: any, callback: any) => {
        callback(null, 'NOT_FOUND');
      });

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
        result.current.initializeDirections();
      });

      // Act & Assert
      await act(async () => {
        await expect(result.current.calculateAndDisplayRoute(origin, destination))
          .rejects.toThrow('No se pudo encontrar una ruta');
      });
    });

    it('should clear directions', async () => {
      // Arrange
      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
        result.current.initializeDirections();
      });

      // Act
      act(() => {
        result.current.clearDirections();
      });

      // Assert
      expect(mockDirectionsRenderer.setDirections).toHaveBeenCalledWith(null);
    });
  });

  describe('markers functionality', () => {
    let mockMarker: any;

    beforeEach(() => {
      mockMarker = {
        setPosition: vi.fn(),
        setMap: vi.fn(),
        setVisible: vi.fn(),
        setTitle: vi.fn(),
        setIcon: vi.fn(),
        getPosition: vi.fn(() => ({ lat: () => -33.4489, lng: () => -70.6693 }))
      };
      mockGoogleMaps.maps.Marker.mockImplementation(() => mockMarker);
    });

    it('should add marker to map', async () => {
      // Arrange
      const position = { lat: -33.4489, lng: -70.6693 };
      const options = { title: 'Test Marker', draggable: true };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      const markerId = act(() => {
        return result.current.addMarker(position, options);
      });

      // Assert
      expect(mockGoogleMaps.maps.Marker).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.objectContaining({
            lat: expect.any(Function),
            lng: expect.any(Function)
          }),
          map: mockMap,
          title: 'Test Marker',
          draggable: true
        })
      );
      expect(markerId).toBeTruthy();
      expect(result.current.markers.size).toBe(1);
    });

    it('should update marker position', async () => {
      // Arrange
      const initialPosition = { lat: -33.4489, lng: -70.6693 };
      const newPosition = { lat: -33.3745, lng: -70.5728 };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      const markerId = act(() => {
        return result.current.addMarker(initialPosition);
      });

      // Act
      act(() => {
        result.current.updateMarker(markerId, { position: newPosition });
      });

      // Assert
      expect(mockMarker.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: expect.any(Function),
          lng: expect.any(Function)
        })
      );
    });

    it('should remove marker from map', async () => {
      // Arrange
      const position = { lat: -33.4489, lng: -70.6693 };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      const markerId = act(() => {
        return result.current.addMarker(position);
      });

      // Act
      act(() => {
        result.current.removeMarker(markerId);
      });

      // Assert
      expect(mockMarker.setMap).toHaveBeenCalledWith(null);
      expect(result.current.markers.size).toBe(0);
    });

    it('should clear all markers', async () => {
      // Arrange
      const positions = [
        { lat: -33.4489, lng: -70.6693 },
        { lat: -33.3745, lng: -70.5728 }
      ];

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      positions.forEach(position => {
        act(() => {
          result.current.addMarker(position);
        });
      });

      expect(result.current.markers.size).toBe(2);

      // Act
      act(() => {
        result.current.clearAllMarkers();
      });

      // Assert
      expect(result.current.markers.size).toBe(0);
    });
  });

  describe('info windows functionality', () => {
    let mockInfoWindow: any;

    beforeEach(() => {
      mockInfoWindow = {
        setContent: vi.fn(),
        setPosition: vi.fn(),
        open: vi.fn(),
        close: vi.fn()
      };
      mockGoogleMaps.maps.InfoWindow.mockImplementation(() => mockInfoWindow);
    });

    it('should create and show info window', async () => {
      // Arrange
      const position = { lat: -33.4489, lng: -70.6693 };
      const content = '<div>Test Info Window</div>';

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.showInfoWindow(content, position);
      });

      // Assert
      expect(mockGoogleMaps.maps.InfoWindow).toHaveBeenCalledWith({
        content,
        position: expect.objectContaining({
          lat: expect.any(Function),
          lng: expect.any(Function)
        })
      });
      expect(mockInfoWindow.open).toHaveBeenCalledWith(mockMap);
    });

    it('should close info window', async () => {
      // Arrange
      const position = { lat: -33.4489, lng: -70.6693 };
      const content = '<div>Test Info Window</div>';

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      act(() => {
        result.current.showInfoWindow(content, position);
      });

      // Act
      act(() => {
        result.current.closeInfoWindow();
      });

      // Assert
      expect(mockInfoWindow.close).toHaveBeenCalled();
    });
  });

  describe('map controls', () => {
    it('should set map center', async () => {
      // Arrange
      const newCenter = { lat: -33.3745, lng: -70.5728 };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.setCenter(newCenter);
      });

      // Assert
      expect(mockMap.setCenter).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: expect.any(Function),
          lng: expect.any(Function)
        })
      );
    });

    it('should set map zoom', async () => {
      // Arrange
      const newZoom = 15;

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.setZoom(newZoom);
      });

      // Assert
      expect(mockMap.setZoom).toHaveBeenCalledWith(newZoom);
    });

    it('should pan to location', async () => {
      // Arrange
      const location = { lat: -33.3745, lng: -70.5728 };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.panTo(location);
      });

      // Assert
      expect(mockMap.panTo).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: expect.any(Function),
          lng: expect.any(Function)
        })
      );
    });

    it('should fit bounds', async () => {
      // Arrange
      const bounds = {
        north: -33.3,
        south: -33.5,
        east: -70.5,
        west: -70.7
      };

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.fitBounds(bounds);
      });

      // Assert
      expect(mockMap.fitBounds).toHaveBeenCalledWith(bounds);
    });
  });

  describe('cleanup', () => {
    it('should cleanup map and remove all listeners on unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
        result.current.addMarker({ lat: -33.4489, lng: -70.6693 });
      });

      // Act
      unmount();

      // Assert
      expect(mockGoogleMaps.maps.event.clearListeners).toHaveBeenCalled();
    });

    it('should handle cleanup when map is not initialized', () => {
      // Arrange & Act
      const { result, unmount } = renderHook(() => useGoogleMaps(mockConfig));

      // Should not throw error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('event handling', () => {
    it('should add click listener to map', async () => {
      // Arrange
      const clickHandler = vi.fn();

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      // Act
      act(() => {
        result.current.addClickListener(clickHandler);
      });

      // Assert
      expect(mockGoogleMaps.maps.event.addListener).toHaveBeenCalledWith(
        mockMap,
        'click',
        expect.any(Function)
      );
    });

    it('should remove click listener from map', async () => {
      // Arrange
      const clickHandler = vi.fn();
      const mockListener = { remove: vi.fn() };
      mockGoogleMaps.maps.event.addListener.mockReturnValue(mockListener);

      const { result } = renderHook(() => useGoogleMaps(mockConfig));
      const mapContainer = document.createElement('div');
      
      await act(async () => {
        await result.current.initializeMap(mapContainer);
      });

      act(() => {
        result.current.addClickListener(clickHandler);
      });

      // Act
      act(() => {
        result.current.removeClickListener();
      });

      // Assert
      expect(mockGoogleMaps.maps.event.removeListener).toHaveBeenCalledWith(mockListener);
    });
  });
});