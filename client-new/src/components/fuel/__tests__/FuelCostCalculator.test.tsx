import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FuelCostCalculator } from '../FuelCostCalculator';
import { VehicleType, FuelType, FuelCalculation, RouteData } from '@types/fuel';

// Mock hooks
vi.mock('@hooks/useFuelPrices', () => ({
  useFuelPrices: () => ({
    prices: [
      {
        fuelType: FuelType.GASOLINA_93,
        price: 850,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      },
      {
        fuelType: FuelType.GASOLINA_95,
        price: 890,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      },
      {
        fuelType: FuelType.DIESEL,
        price: 780,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      }
    ],
    loading: false,
    error: null,
    getPriceByRegion: vi.fn(),
    isDataFresh: vi.fn(() => true)
  })
}));

vi.mock('@utils/fuelCalculations', () => ({
  fuelCalculations: {
    calculateTripCost: vi.fn(),
    calculateFuelNeeded: vi.fn(),
    calculateFuelCost: vi.fn(),
    compareTripCosts: vi.fn()
  }
}));

describe('FuelCostCalculator', () => {
  const mockRouteData: RouteData = {
    origin: {
      coordinates: { lat: -33.4489, lng: -70.6693 },
      address: 'Plaza de Armas, Santiago',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    destination: {
      coordinates: { lat: -33.3745, lng: -70.5728 },
      address: 'Las Condes, Santiago',
      city: 'Santiago',
      region: 'Metropolitana',
      country: 'Chile'
    },
    distance: 15.5,
    duration: 25
  };

  const mockCalculation: FuelCalculation = {
    routeData: mockRouteData,
    vehicleType: VehicleType.ECONOMICO,
    fuelType: FuelType.GASOLINA_93,
    fuelPrice: 850,
    fuelNeeded: 1.03,
    totalCost: 876,
    consumption: 15
  };

  const defaultProps = {
    routeData: mockRouteData,
    vehicleType: VehicleType.ECONOMICO,
    fuelType: FuelType.GASOLINA_93,
    calculation: mockCalculation,
    onCalculationChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render calculation summary', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/resumen del cálculo/i)).toBeInTheDocument();
      expect(screen.getByText(/distancia total: 15\.5 km/i)).toBeInTheDocument();
      expect(screen.getByText(/combustible necesario: 1\.03 litros/i)).toBeInTheDocument();
      expect(screen.getByText(/precio por litro: \$850/i)).toBeInTheDocument();
      expect(screen.getByText(/costo total: \$876/i)).toBeInTheDocument();
    });

    it('should render vehicle and fuel type information', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/tipo de vehículo: económico/i)).toBeInTheDocument();
      expect(screen.getByText(/tipo de combustible: gasolina 93/i)).toBeInTheDocument();
      expect(screen.getByText(/consumo: 15 km\/l/i)).toBeInTheDocument();
    });

    it('should render cost breakdown', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/desglose de costos/i)).toBeInTheDocument();
      expect(screen.getByText(/costo de combustible/i)).toBeInTheDocument();
      expect(screen.getByText(/\$876/)).toBeInTheDocument();
      expect(screen.getByText(/costo por kilómetro: \$56\.52/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      // Arrange
      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: true,
        error: null,
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => true)
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} calculation={null} />);

      // Assert
      expect(screen.getByText(/calculando costos/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render empty state when no calculation available', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} calculation={null} />);

      // Assert
      expect(screen.getByText(/no hay cálculo disponible/i)).toBeInTheDocument();
      expect(screen.getByText(/seleccione origen, destino y tipo de vehículo/i)).toBeInTheDocument();
    });

    it('should render error state when calculation fails', () => {
      // Arrange
      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: 'Error al obtener precios de combustible',
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => false)
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/error al calcular costos/i)).toBeInTheDocument();
      expect(screen.getByText(/error al obtener precios de combustible/i)).toBeInTheDocument();
    });
  });

  describe('interactive features', () => {
    it('should allow manual price override', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelCostCalculator {...defaultProps} allowManualPrice />);

      const priceInput = screen.getByLabelText(/precio manual por litro/i);

      // Act
      await user.clear(priceInput);
      await user.type(priceInput, '900');
      await user.tab(); // Trigger blur/calculation

      // Assert
      expect(defaultProps.onCalculationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fuelPrice: 900,
          totalCost: 1.03 * 900 // Should recalculate with new price
        })
      );
    });

    it('should validate manual price input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelCostCalculator {...defaultProps} allowManualPrice />);

      const priceInput = screen.getByLabelText(/precio manual por litro/i);

      // Act - Enter invalid price
      await user.clear(priceInput);
      await user.type(priceInput, '-100');
      await user.tab();

      // Assert
      expect(screen.getByText(/el precio debe ser mayor a cero/i)).toBeInTheDocument();
      expect(priceInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should show price comparison with market price', () => {
      // Act
      render(
        <FuelCostCalculator 
          {...defaultProps} 
          calculation={{
            ...mockCalculation,
            fuelPrice: 900 // Manual price higher than market
          }}
          allowManualPrice
          showPriceComparison
        />
      );

      // Assert
      expect(screen.getByText(/precio de mercado: \$850/i)).toBeInTheDocument();
      expect(screen.getByText(/precio actual: \$900/i)).toBeInTheDocument();
      expect(screen.getByText(/diferencia: \+\$50 \(\+5\.88%\)/i)).toBeInTheDocument();
    });

    it('should calculate round trip costs when enabled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelCostCalculator {...defaultProps} showRoundTrip />);

      const roundTripToggle = screen.getByLabelText(/calcular viaje de ida y vuelta/i);

      // Act
      await user.click(roundTripToggle);

      // Assert
      expect(screen.getByText(/ida y vuelta/i)).toBeInTheDocument();
      expect(screen.getByText(/distancia total: 31\.0 km/i)).toBeInTheDocument(); // 15.5 * 2
      expect(screen.getByText(/costo total: \$1,752/i)).toBeInTheDocument(); // 876 * 2
    });
  });

  describe('cost breakdown', () => {
    it('should show detailed cost breakdown when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelCostCalculator {...defaultProps} showDetailedBreakdown />);

      const expandButton = screen.getByRole('button', { name: /ver desglose detallado/i });

      // Act
      await user.click(expandButton);

      // Assert
      expect(screen.getByText(/costo base de combustible/i)).toBeInTheDocument();
      expect(screen.getByText(/\$876/)).toBeInTheDocument();
      expect(screen.getByText(/peajes estimados/i)).toBeInTheDocument();
      expect(screen.getByText(/desgaste del vehículo/i)).toBeInTheDocument();
      expect(screen.getByText(/costo total estimado/i)).toBeInTheDocument();
    });

    it('should calculate vehicle wear cost based on distance', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} showDetailedBreakdown includeWearCost />);

      // Assert
      // Vehicle wear typically calculated as ~$0.50-$1.00 per km
      expect(screen.getByText(/desgaste del vehículo/i)).toBeInTheDocument();
      expect(screen.getByText(/\$\d+/)).toBeInTheDocument(); // Should show some wear cost
    });

    it('should estimate toll costs for highways', () => {
      // Arrange
      const routeWithTolls: RouteData = {
        ...mockRouteData,
        tollCost: 2500 // Toll cost included
      };

      // Act
      render(
        <FuelCostCalculator 
          {...defaultProps} 
          routeData={routeWithTolls}
          showDetailedBreakdown 
          includeTollCosts 
        />
      );

      // Assert
      expect(screen.getByText(/peajes/i)).toBeInTheDocument();
      expect(screen.getByText(/\$2,500/)).toBeInTheDocument();
    });
  });

  describe('comparison features', () => {
    it('should compare costs across different vehicle types', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} showVehicleComparison />);

      // Assert
      expect(screen.getByText(/comparación de vehículos/i)).toBeInTheDocument();
      expect(screen.getByText(/económico/i)).toBeInTheDocument();
      expect(screen.getByText(/intermedio/i)).toBeInTheDocument();
      expect(screen.getByText(/suv/i)).toBeInTheDocument();
    });

    it('should compare costs across different fuel types', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} showFuelComparison />);

      // Assert
      expect(screen.getByText(/comparación de combustibles/i)).toBeInTheDocument();
      expect(screen.getByText(/gasolina 93/i)).toBeInTheDocument();
      expect(screen.getByText(/gasolina 95/i)).toBeInTheDocument();
      expect(screen.getByText(/diésel/i)).toBeInTheDocument();
    });

    it('should highlight most economical option in comparison', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} showVehicleComparison />);

      // Assert
      const cheapestOption = screen.getByText(/más económico/i).closest('div');
      expect(cheapestOption).toHaveClass('highlight-best');
    });
  });

  describe('data freshness indicators', () => {
    it('should show fresh data indicator when prices are recent', () => {
      // Arrange
      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: null,
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => true)
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('data-freshness-indicator')).toHaveClass('fresh');
      expect(screen.getByText(/precios actualizados/i)).toBeInTheDocument();
    });

    it('should show stale data warning when prices are old', () => {
      // Arrange
      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: null,
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => false)
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('data-freshness-indicator')).toHaveClass('stale');
      expect(screen.getByText(/precios pueden estar desactualizados/i)).toBeInTheDocument();
    });

    it('should provide refresh option when data is stale', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRefreshPrices = vi.fn();

      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: null,
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => false),
        refreshPrices: mockRefreshPrices
      });

      render(<FuelCostCalculator {...defaultProps} />);

      const refreshButton = screen.getByRole('button', { name: /actualizar precios/i });

      // Act
      await user.click(refreshButton);

      // Assert
      expect(mockRefreshPrices).toHaveBeenCalled();
    });
  });

  describe('formatting and display', () => {
    it('should format currency values correctly', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      // Should use Chilean peso formatting
      expect(screen.getByText(/\$876/)).toBeInTheDocument();
      expect(screen.getByText(/\$850/)).toBeInTheDocument(); // Price per liter
    });

    it('should format distance values correctly', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/15\.5 km/i)).toBeInTheDocument();
    });

    it('should format fuel volume correctly', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/1\.03 litros/i)).toBeInTheDocument();
    });

    it('should display consumption rate with proper units', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/15 km\/l/i)).toBeInTheDocument();
    });
  });

  describe('calculations accuracy', () => {
    it('should recalculate when vehicle type changes', async () => {
      // Arrange
      const mockCalculateTripCost = vi.fn().mockReturnValue({
        distance: 15.5,
        vehicleType: VehicleType.INTERMEDIO,
        consumption: 10,
        fuelNeeded: 1.55,
        pricePerLiter: 850,
        totalCost: 1318,
        costPerKm: 85
      });

      vi.mocked(require('@utils/fuelCalculations').fuelCalculations).calculateTripCost = mockCalculateTripCost;

      const { rerender } = render(<FuelCostCalculator {...defaultProps} />);

      // Act
      rerender(
        <FuelCostCalculator 
          {...defaultProps} 
          vehicleType={VehicleType.INTERMEDIO}
          calculation={null} // Trigger recalculation
        />
      );

      // Assert
      await waitFor(() => {
        expect(mockCalculateTripCost).toHaveBeenCalledWith(
          15.5, 
          VehicleType.INTERMEDIO, 
          850
        );
      });
    });

    it('should recalculate when fuel type changes', async () => {
      // Arrange
      const mockGetPriceByRegion = vi.fn().mockReturnValue({
        fuelType: FuelType.GASOLINA_95,
        price: 890,
        region: 'Metropolitana de Santiago',
        lastUpdated: '2024-01-15T10:00:00Z',
        source: 'CNE'
      });

      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: null,
        getPriceByRegion: mockGetPriceByRegion,
        isDataFresh: vi.fn(() => true)
      });

      const { rerender } = render(<FuelCostCalculator {...defaultProps} />);

      // Act
      rerender(
        <FuelCostCalculator 
          {...defaultProps} 
          fuelType={FuelType.GASOLINA_95}
          calculation={null}
        />
      );

      // Assert
      expect(mockGetPriceByRegion).toHaveBeenCalledWith(
        FuelType.GASOLINA_95,
        'Metropolitana de Santiago'
      );
    });

    it('should handle calculation errors gracefully', () => {
      // Arrange
      vi.mocked(require('@utils/fuelCalculations').fuelCalculations).calculateTripCost = vi.fn(() => {
        throw new Error('Calculation error');
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} calculation={null} />);

      // Assert
      expect(screen.getByText(/error en el cálculo/i)).toBeInTheDocument();
      expect(screen.getByText(/calculation error/i)).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should allow exporting calculation as JSON', async () => {
      // Arrange
      const user = userEvent.setup();
      const downloadSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {}
          } as any;
        }
        return document.createElement(tag);
      });

      render(<FuelCostCalculator {...defaultProps} allowExport />);

      const exportButton = screen.getByRole('button', { name: /exportar cálculo/i });

      // Act
      await user.click(exportButton);

      // Assert
      expect(downloadSpy).toHaveBeenCalledWith('a');
    });

    it('should allow copying calculation to clipboard', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn();
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true
      });

      render(<FuelCostCalculator {...defaultProps} allowCopy />);

      const copyButton = screen.getByRole('button', { name: /copiar cálculo/i });

      // Act
      await user.click(copyButton);

      // Assert
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Distancia: 15.5 km')
      );
      
      await waitFor(() => {
        expect(screen.getByText(/cálculo copiado al portapapeles/i)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      const calculator = screen.getByRole('region');
      expect(calculator).toHaveAttribute('aria-label', 'Calculadora de costos de combustible');

      const summary = screen.getByRole('group');
      expect(summary).toHaveAttribute('aria-label', 'Resumen del cálculo');

      expect(screen.getByRole('table')).toBeInTheDocument(); // Cost breakdown table
    });

    it('should provide live region updates for calculation changes', async () => {
      // Arrange
      const { rerender } = render(<FuelCostCalculator {...defaultProps} />);

      const newCalculation: FuelCalculation = {
        ...mockCalculation,
        totalCost: 1200,
        fuelNeeded: 1.5
      };

      // Act
      rerender(<FuelCostCalculator {...defaultProps} calculation={newCalculation} />);

      // Assert
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/cálculo actualizado/i);
      });
    });

    it('should support keyboard navigation for interactive elements', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelCostCalculator {...defaultProps} allowManualPrice allowExport allowCopy />);

      // Act & Assert
      await user.tab(); // Manual price input
      expect(screen.getByLabelText(/precio manual/i)).toHaveFocus();

      await user.tab(); // Export button
      expect(screen.getByRole('button', { name: /exportar/i })).toHaveFocus();

      await user.tab(); // Copy button
      expect(screen.getByRole('button', { name: /copiar/i })).toHaveFocus();
    });

    it('should provide clear error messages with suggestions', () => {
      // Arrange
      vi.mocked(require('@hooks/useFuelPrices').useFuelPrices).mockReturnValue({
        prices: [],
        loading: false,
        error: 'No se pudieron obtener los precios de CNE',
        getPriceByRegion: vi.fn(),
        isDataFresh: vi.fn(() => false)
      });

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      expect(screen.getByText(/no se pudieron obtener los precios de cne/i)).toBeInTheDocument();
      expect(screen.getByText(/puede ingresar un precio manual/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /usar precio manual/i })).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for mobile devices', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      const container = screen.getByRole('region');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should use compact display on small screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelCostCalculator {...defaultProps} />);

      // Assert
      const container = screen.getByRole('region');
      expect(container).toHaveClass('compact-mode');
      
      // Some detailed information should be hidden
      expect(screen.queryByText(/desglose de costos/i)).not.toBeInTheDocument();
    });

    it('should show full layout on desktop', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelCostCalculator {...defaultProps} showDetailedBreakdown />);

      // Assert
      const container = screen.getByRole('region');
      expect(container).toHaveClass('desktop-layout');
      expect(screen.getByText(/desglose de costos/i)).toBeInTheDocument();
    });
  });
});