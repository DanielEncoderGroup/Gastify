import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteMapViewer } from '../RouteMapViewer';
import { RouteData, Coordinates } from '@types/fuel';

// Mock Google Maps hook
vi.mock('@hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    map: {},
    isLoaded: true,
    loadError: null,
    initializeMap: vi.fn(),
    addMarker: vi.fn(() => 'marker-id'),
    updateMarker: vi.fn(),
    removeMarker: vi.fn(),
    clearAllMarkers: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    fitBounds: vi.fn(),
    calculateAndDisplayRoute: vi.fn(),
    clearDirections: vi.fn(),
    initializeDirections: vi.fn(),
    directionsRenderer: {},
    showInfoWindow: vi.fn(),
    closeInfoWindow: vi.fn()
  })
}));

describe('RouteMapViewer', () => {
  const mockRouteData: RouteData = {
    origin: {
      coordinates: { lat: -33.4489, lng: -70.6693 },
      address: 'Plaza de Armas, Santiago, Región Metropolitana, Chile',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    destination: {
      coordinates: { lat: -33.3745, lng: -70.5728 },
      address: 'Las Condes, Santiago, Región Metropolitana, Chile',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    distance: 15.5,
    duration: 25,
    polyline: 'encoded_polyline_data'
  };

  const defaultProps = {
    routeData: mockRouteData,
    height: '400px',
    width: '100%'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render map container with correct dimensions', () => {
      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      const mapContainer = screen.getByTestId('route-map-container');
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer).toHaveStyle({ height: '400px', width: '100%' });
    });

    it('should render route information panel', () => {
      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      expect(screen.getByText(/información de la ruta/i)).toBeInTheDocument();
      expect(screen.getByText(/distancia: 15\.5 km/i)).toBeInTheDocument();
      expect(screen.getByText(/duración: 25 minutos/i)).toBeInTheDocument();
      expect(screen.getByText(/origen:/i)).toBeInTheDocument();
      expect(screen.getByText(/plaza de armas, santiago/i)).toBeInTheDocument();
      expect(screen.getByText(/destino:/i)).toBeInTheDocument();
      expect(screen.getByText(/las condes, santiago/i)).toBeInTheDocument();
    });

    it('should render loading state when Google Maps is not loaded', () => {
      // Arrange
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: null,
        isLoaded: false,
        loadError: null,
        initializeMap: vi.fn()
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      expect(screen.getByText(/cargando mapa/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render error state when Google Maps fails to load', () => {
      // Arrange
      const loadError = 'Google Maps API key invalid';
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: null,
        isLoaded: false,
        loadError,
        initializeMap: vi.fn()
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      expect(screen.getByText(/error al cargar el mapa/i)).toBeInTheDocument();
      expect(screen.getByText(loadError)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('error');
    });

    it('should render empty state when no route data provided', () => {
      // Act
      render(<RouteMapViewer routeData={null} height="400px" width="100%" />);

      // Assert
      expect(screen.getByText(/no hay datos de ruta para mostrar/i)).toBeInTheDocument();
      expect(screen.getByText(/calcule una ruta para ver el mapa/i)).toBeInTheDocument();
    });
  });

  describe('map initialization', () => {
    it('should initialize map when Google Maps is loaded', async () => {
      // Arrange
      const mockInitializeMap = vi.fn();
      const mockInitializeDirections = vi.fn();
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: null,
        isLoaded: true,
        loadError: null,
        initializeMap: mockInitializeMap,
        initializeDirections: mockInitializeDirections,
        calculateAndDisplayRoute: vi.fn(),
        addMarker: vi.fn(),
        fitBounds: vi.fn()
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(mockInitializeMap).toHaveBeenCalled();
        expect(mockInitializeDirections).toHaveBeenCalled();
      });
    });

    it('should display route on map when route data is available', async () => {
      // Arrange
      const mockCalculateAndDisplayRoute = vi.fn();
      const mockAddMarker = vi.fn();
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        initializeDirections: vi.fn(),
        calculateAndDisplayRoute: mockCalculateAndDisplayRoute,
        addMarker: mockAddMarker,
        fitBounds: vi.fn()
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(mockCalculateAndDisplayRoute).toHaveBeenCalledWith(
          mockRouteData.origin.coordinates,
          mockRouteData.destination.coordinates
        );
        
        expect(mockAddMarker).toHaveBeenCalledWith(
          mockRouteData.origin.coordinates,
          expect.objectContaining({
            title: 'Origen',
            icon: expect.objectContaining({
              fillColor: '#22c55e',
              strokeColor: '#16a34a'
            })
          })
        );
        
        expect(mockAddMarker).toHaveBeenCalledWith(
          mockRouteData.destination.coordinates,
          expect.objectContaining({
            title: 'Destino',
            icon: expect.objectContaining({
              fillColor: '#ef4444',
              strokeColor: '#dc2626'
            })
          })
        );
      });
    });

    it('should fit map bounds to show entire route', async () => {
      // Arrange
      const mockFitBounds = vi.fn();
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        initializeDirections: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        addMarker: vi.fn(),
        fitBounds: mockFitBounds
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledWith(
          expect.objectContaining({
            north: Math.max(mockRouteData.origin.coordinates.lat, mockRouteData.destination.coordinates.lat),
            south: Math.min(mockRouteData.origin.coordinates.lat, mockRouteData.destination.coordinates.lat),
            east: Math.max(mockRouteData.origin.coordinates.lng, mockRouteData.destination.coordinates.lng),
            west: Math.min(mockRouteData.origin.coordinates.lng, mockRouteData.destination.coordinates.lng)
          })
        );
      });
    });
  });

  describe('route updates', () => {
    it('should update map when route data changes', async () => {
      // Arrange
      const mockClearAllMarkers = vi.fn();
      const mockCalculateAndDisplayRoute = vi.fn();
      const mockAddMarker = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        initializeDirections: vi.fn(),
        calculateAndDisplayRoute: mockCalculateAndDisplayRoute,
        addMarker: mockAddMarker,
        clearAllMarkers: mockClearAllMarkers,
        fitBounds: vi.fn()
      });

      const { rerender } = render(<RouteMapViewer {...defaultProps} />);

      // Act - Update route data
      const newRouteData: RouteData = {
        ...mockRouteData,
        destination: {
          coordinates: { lat: -33.4372, lng: -70.6506 },
          address: 'Providencia, Santiago',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile'
        },
        distance: 8.2,
        duration: 15
      };

      rerender(<RouteMapViewer routeData={newRouteData} height="400px" width="100%" />);

      // Assert
      await waitFor(() => {
        expect(mockClearAllMarkers).toHaveBeenCalled();
        expect(mockCalculateAndDisplayRoute).toHaveBeenCalledWith(
          newRouteData.origin.coordinates,
          newRouteData.destination.coordinates
        );
      });
    });

    it('should clear map when route data is removed', async () => {
      // Arrange
      const mockClearAllMarkers = vi.fn();
      const mockClearDirections = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        clearAllMarkers: mockClearAllMarkers,
        clearDirections: mockClearDirections,
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      const { rerender } = render(<RouteMapViewer {...defaultProps} />);

      // Act - Remove route data
      rerender(<RouteMapViewer routeData={null} height="400px" width="100%" />);

      // Assert
      await waitFor(() => {
        expect(mockClearAllMarkers).toHaveBeenCalled();
        expect(mockClearDirections).toHaveBeenCalled();
      });
    });
  });

  describe('interactive features', () => {
    it('should show info window when marker is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockShowInfoWindow = vi.fn();
      let clickListener: (e: any) => void;

      const mockAddMarker = vi.fn().mockImplementation((position, options) => {
        if (options.onClick) {
          clickListener = options.onClick;
        }
        return 'marker-id';
      });

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        initializeDirections: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        addMarker: mockAddMarker,
        showInfoWindow: mockShowInfoWindow,
        fitBounds: vi.fn()
      });

      render(<RouteMapViewer {...defaultProps} />);

      // Wait for map to initialize
      await waitFor(() => {
        expect(mockAddMarker).toHaveBeenCalled();
      });

      // Act - Simulate marker click
      if (clickListener!) {
        clickListener({ latLng: { lat: () => -33.4489, lng: () => -70.6693 } });
      }

      // Assert
      expect(mockShowInfoWindow).toHaveBeenCalledWith(
        expect.stringContaining('Origen'),
        expect.objectContaining({
          lat: -33.4489,
          lng: -70.6693
        })
      );
    });

    it('should allow toggling between map types', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetOptions = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: { setOptions: mockSetOptions },
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      render(<RouteMapViewer {...defaultProps} />);

      const mapTypeButton = screen.getByRole('button', { name: /tipo de mapa/i });

      // Act
      await user.click(mapTypeButton);
      await user.click(screen.getByText(/satélite/i));

      // Assert
      expect(mockSetOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          mapTypeId: 'satellite'
        })
      );
    });

    it('should center map on user location when available', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetCenter = vi.fn();
      const mockCurrentPosition = { lat: -33.4489, lng: -70.6693 };

      vi.mocked(require('@services/geolocationService').geolocationService).getCurrentPosition = vi.fn().mockResolvedValue({
        coordinates: mockCurrentPosition,
        accuracy: 10
      });

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        setCenter: mockSetCenter,
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      render(<RouteMapViewer {...defaultProps} />);

      const centerButton = screen.getByRole('button', { name: /centrar en mi ubicación/i });

      // Act
      await user.click(centerButton);

      // Assert
      await waitFor(() => {
        expect(mockSetCenter).toHaveBeenCalledWith(mockCurrentPosition);
      });
    });
  });

  describe('alternative routes', () => {
    it('should display alternative routes when available', () => {
      // Arrange
      const alternativeRoutes = [
        { ...mockRouteData, distance: 18.2, duration: 30 },
        { ...mockRouteData, distance: 12.8, duration: 35 }
      ];

      // Act
      render(<RouteMapViewer {...defaultProps} alternativeRoutes={alternativeRoutes} />);

      // Assert
      expect(screen.getByText(/rutas alternativas/i)).toBeInTheDocument();
      expect(screen.getByText(/ruta 1: 18\.2 km \(30 min\)/i)).toBeInTheDocument();
      expect(screen.getByText(/ruta 2: 12\.8 km \(35 min\)/i)).toBeInTheDocument();
    });

    it('should allow selecting alternative routes', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnRouteSelect = vi.fn();
      const alternativeRoutes = [
        { ...mockRouteData, distance: 18.2, duration: 30 },
        { ...mockRouteData, distance: 12.8, duration: 35 }
      ];

      // Act
      render(
        <RouteMapViewer 
          {...defaultProps} 
          alternativeRoutes={alternativeRoutes}
          onRouteSelect={mockOnRouteSelect}
        />
      );

      // Click on alternative route
      await user.click(screen.getByText(/ruta 1: 18\.2 km/i));

      // Assert
      expect(mockOnRouteSelect).toHaveBeenCalledWith(alternativeRoutes[0], 0);
    });

    it('should highlight selected alternative route', async () => {
      // Arrange
      const user = userEvent.setup();
      const alternativeRoutes = [
        { ...mockRouteData, distance: 18.2, duration: 30 },
        { ...mockRouteData, distance: 12.8, duration: 35 }
      ];

      render(<RouteMapViewer {...defaultProps} alternativeRoutes={alternativeRoutes} />);

      // Act
      await user.click(screen.getByText(/ruta 1: 18\.2 km/i));

      // Assert
      expect(screen.getByText(/ruta 1: 18\.2 km/i).closest('div')).toHaveClass('selected');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      const mapContainer = screen.getByRole('region');
      expect(mapContainer).toHaveAttribute('aria-label', 'Mapa de la ruta');

      const routeInfo = screen.getByRole('complementary');
      expect(routeInfo).toHaveAttribute('aria-label', 'Información de la ruta');

      const mapControls = screen.getByRole('toolbar');
      expect(mapControls).toHaveAttribute('aria-label', 'Controles del mapa');
    });

    it('should support keyboard navigation for map controls', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RouteMapViewer {...defaultProps} />);

      // Act
      await user.tab(); // Map type button
      expect(screen.getByRole('button', { name: /tipo de mapa/i })).toHaveFocus();

      await user.tab(); // Center location button
      expect(screen.getByRole('button', { name: /centrar en mi ubicación/i })).toHaveFocus();

      await user.tab(); // Zoom in button
      expect(screen.getByRole('button', { name: /acercar/i })).toHaveFocus();

      await user.tab(); // Zoom out button
      expect(screen.getByRole('button', { name: /alejar/i })).toHaveFocus();
    });

    it('should provide screen reader announcements for route updates', async () => {
      // Arrange
      const { rerender } = render(<RouteMapViewer {...defaultProps} />);

      // Act - Update route data
      const newRouteData = { ...mockRouteData, distance: 20.3, duration: 35 };
      rerender(<RouteMapViewer routeData={newRouteData} height="400px" width="100%" />);

      // Assert
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/ruta actualizada: 20\.3 km, 35 minutos/i);
      });
    });
  });

  describe('map controls', () => {
    it('should provide zoom controls', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetZoom = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: { getZoom: () => 13 },
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        setZoom: mockSetZoom,
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      render(<RouteMapViewer {...defaultProps} />);

      // Act
      await user.click(screen.getByRole('button', { name: /acercar/i }));
      await user.click(screen.getByRole('button', { name: /alejar/i }));

      // Assert
      expect(mockSetZoom).toHaveBeenCalledWith(14); // Zoom in
      expect(mockSetZoom).toHaveBeenCalledWith(12); // Zoom out
    });

    it('should toggle traffic layer', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RouteMapViewer {...defaultProps} showTraffic />);

      const trafficButton = screen.getByRole('button', { name: /mostrar tráfico/i });

      // Act
      await user.click(trafficButton);

      // Assert
      expect(trafficButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle satellite view', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetOptions = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: { setOptions: mockSetOptions },
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      render(<RouteMapViewer {...defaultProps} />);

      const satelliteButton = screen.getByRole('button', { name: /vista satelital/i });

      // Act
      await user.click(satelliteButton);

      // Assert
      expect(mockSetOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          mapTypeId: 'satellite'
        })
      );
    });
  });

  describe('responsive design', () => {
    it('should adapt to mobile viewport', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      const container = screen.getByTestId('route-map-container').parentElement;
      expect(container).toHaveClass('mobile-layout');
      
      // Route info should be collapsible on mobile
      expect(screen.getByRole('button', { name: /mostrar\/ocultar información/i })).toBeInTheDocument();
    });

    it('should show full layout on desktop', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      const container = screen.getByTestId('route-map-container').parentElement;
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('error handling', () => {
    it('should display error message when map fails to initialize', () => {
      // Arrange
      const mapError = 'Failed to initialize Google Maps';
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: null,
        isLoaded: false,
        loadError: mapError,
        initializeMap: vi.fn()
      });

      // Act
      render(<RouteMapViewer {...defaultProps} />);

      // Assert
      expect(screen.getByText(/error al cargar el mapa/i)).toBeInTheDocument();
      expect(screen.getByText(mapError)).toBeInTheDocument();
    });

    it('should provide retry option when map fails to load', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockInitializeMap = vi.fn();
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: null,
        isLoaded: false,
        loadError: 'Network error',
        initializeMap: mockInitializeMap
      });

      render(<RouteMapViewer {...defaultProps} />);

      const retryButton = screen.getByRole('button', { name: /reintentar/i });

      // Act
      await user.click(retryButton);

      // Assert
      expect(mockInitializeMap).toHaveBeenCalled();
    });
  });

  describe('performance optimizations', () => {
    it('should not re-render when props have not changed', () => {
      // Arrange
      const mockInitializeMap = vi.fn();
      
      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: mockInitializeMap,
        addMarker: vi.fn(),
        calculateAndDisplayRoute: vi.fn(),
        fitBounds: vi.fn()
      });

      const { rerender } = render(<RouteMapViewer {...defaultProps} />);

      // Act - Re-render with same props
      rerender(<RouteMapViewer {...defaultProps} />);

      // Assert
      // Should not call initialize again for same props
      expect(mockInitializeMap).toHaveBeenCalledTimes(1);
    });

    it('should debounce map updates when route data changes rapidly', async () => {
      // Arrange
      const mockCalculateAndDisplayRoute = vi.fn();

      vi.mocked(require('@hooks/useGoogleMaps').useGoogleMaps).mockReturnValue({
        map: {},
        isLoaded: true,
        loadError: null,
        initializeMap: vi.fn(),
        calculateAndDisplayRoute: mockCalculateAndDisplayRoute,
        addMarker: vi.fn(),
        fitBounds: vi.fn()
      });

      const { rerender } = render(<RouteMapViewer {...defaultProps} />);

      // Act - Multiple rapid updates
      for (let i = 0; i < 5; i++) {
        const newRouteData = { ...mockRouteData, distance: 15.5 + i };
        rerender(<RouteMapViewer routeData={newRouteData} height="400px" width="100%" />);
      }

      // Assert - Should debounce and only call once after delay
      await waitFor(() => {
        expect(mockCalculateAndDisplayRoute).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });
});