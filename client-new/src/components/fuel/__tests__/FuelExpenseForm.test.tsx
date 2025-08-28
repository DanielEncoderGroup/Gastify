import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FuelExpenseForm } from '../FuelExpenseForm';
import { VehicleType, FuelType, CreateFuelExpenseData } from '@types/fuel';

// Mock hooks and services
vi.mock('@hooks/useFuelExpenses', () => ({
  useFuelExpenses: () => ({
    createExpense: vi.fn(),
    loading: false,
    error: null
  })
}));

vi.mock('@hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({
    calculateRoute: vi.fn(),
    calculateFuelCost: vi.fn(),
    routeData: null,
    calculation: null,
    loading: false,
    error: null,
    resetCalculation: vi.fn()
  })
}));

vi.mock('@hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    map: null,
    isLoaded: true,
    loadError: null,
    initializeMap: vi.fn(),
    addMarker: vi.fn(),
    clearAllMarkers: vi.fn()
  })
}));

vi.mock('@services/geolocationService', () => ({
  geolocationService: {
    getCurrentPosition: vi.fn(),
    isGeolocationSupported: vi.fn(() => true),
    checkGeolocationPermission: vi.fn(() => Promise.resolve('granted'))
  }
}));

describe('FuelExpenseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render all form fields', () => {
      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByLabelText(/dirección de origen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dirección de destino/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de vehículo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de combustible/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/propósito del viaje/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción adicional/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByRole('button', { name: /calcular ruta/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /usar ubicación actual/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar gasto/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should render vehicle type options', () => {
      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByText('Económico')).toBeInTheDocument();
      expect(screen.getByText('Intermedio')).toBeInTheDocument();
      expect(screen.getByText('SUV')).toBeInTheDocument();
    });

    it('should render fuel type options', () => {
      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByText('Gasolina 93')).toBeInTheDocument();
      expect(screen.getByText('Gasolina 95')).toBeInTheDocument();
      expect(screen.getByText('Gasolina 97')).toBeInTheDocument();
      expect(screen.getByText('Diésel')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Formulario de gasto de combustible');

      const originInput = screen.getByLabelText(/dirección de origen/i);
      expect(originInput).toHaveAttribute('aria-required', 'true');
      expect(originInput).toHaveAttribute('aria-describedby');

      const destinationInput = screen.getByLabelText(/dirección de destino/i);
      expect(destinationInput).toHaveAttribute('aria-required', 'true');

      const purposeInput = screen.getByLabelText(/propósito del viaje/i);
      expect(purposeInput).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('user interactions', () => {
    it('should handle origin address input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const originInput = screen.getByLabelText(/dirección de origen/i);

      // Act
      await user.type(originInput, 'Plaza de Armas, Santiago');

      // Assert
      expect(originInput).toHaveValue('Plaza de Armas, Santiago');
    });

    it('should handle destination address input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const destinationInput = screen.getByLabelText(/dirección de destino/i);

      // Act
      await user.type(destinationInput, 'Las Condes, Santiago');

      // Assert
      expect(destinationInput).toHaveValue('Las Condes, Santiago');
    });

    it('should handle vehicle type selection', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      // Act
      await user.click(screen.getByText('Intermedio'));

      // Assert
      expect(screen.getByText('Intermedio')).toHaveClass('selected');
    });

    it('should handle fuel type selection', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      // Act
      await user.click(screen.getByText('Gasolina 95'));

      // Assert
      expect(screen.getByText('Gasolina 95')).toHaveClass('selected');
    });

    it('should handle business purpose input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const purposeInput = screen.getByLabelText(/propósito del viaje/i);

      // Act
      await user.type(purposeInput, 'Visita importante al cliente');

      // Assert
      expect(purposeInput).toHaveValue('Visita importante al cliente');
    });

    it('should handle description input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/descripción adicional/i);

      // Act
      await user.type(descriptionInput, 'Reunión estratégica trimestral');

      // Assert
      expect(descriptionInput).toHaveValue('Reunión estratégica trimestral');
    });
  });

  describe('form validation', () => {
    it('should show validation errors for empty required fields', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /guardar gasto/i });

      // Act
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/la dirección de origen es requerida/i)).toBeInTheDocument();
        expect(screen.getByText(/la dirección de destino es requerida/i)).toBeInTheDocument();
        expect(screen.getByText(/debe seleccionar un tipo de vehículo/i)).toBeInTheDocument();
        expect(screen.getByText(/debe seleccionar un tipo de combustible/i)).toBeInTheDocument();
        expect(screen.getByText(/el propósito del viaje es requerido/i)).toBeInTheDocument();
      });
    });

    it('should validate origin and destination are different', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const originInput = screen.getByLabelText(/dirección de origen/i);
      const destinationInput = screen.getByLabelText(/dirección de destino/i);
      const submitButton = screen.getByRole('button', { name: /guardar gasto/i });

      // Act
      await user.type(originInput, 'Plaza de Armas, Santiago');
      await user.type(destinationInput, 'Plaza de Armas, Santiago');
      await user.click(screen.getByText('Económico'));
      await user.click(screen.getByText('Gasolina 93'));
      await user.type(screen.getByLabelText(/propósito del viaje/i), 'Viaje de negocios');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/el origen y destino deben ser diferentes/i)).toBeInTheDocument();
      });
    });

    it('should validate business purpose length', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const purposeInput = screen.getByLabelText(/propósito del viaje/i);

      // Act
      await user.type(purposeInput, 'a'); // Too short (less than 5 characters)
      await user.tab(); // Trigger blur event

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/el propósito debe tener al menos 5 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should validate description length if provided', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/descripción adicional/i);

      // Act
      await user.type(descriptionInput, 'a'.repeat(501)); // Too long (more than 500 characters)
      await user.tab();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/la descripción no puede exceder 500 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user corrects input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const originInput = screen.getByLabelText(/dirección de origen/i);
      const submitButton = screen.getByRole('button', { name: /guardar gasto/i });

      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/la dirección de origen es requerida/i)).toBeInTheDocument();
      });

      // Act - Correct the input
      await user.type(originInput, 'Plaza de Armas, Santiago');

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/la dirección de origen es requerida/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('route calculation', () => {
    it('should trigger route calculation when both addresses are filled', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockCalculateRoute = vi.fn();
      
      vi.mocked(require('@hooks/useRouteCalculation').useRouteCalculation).mockReturnValue({
        calculateRoute: mockCalculateRoute,
        routeData: null,
        calculation: null,
        loading: false,
        error: null,
        resetCalculation: vi.fn()
      });

      render(<FuelExpenseForm {...defaultProps} />);

      const originInput = screen.getByLabelText(/dirección de origen/i);
      const destinationInput = screen.getByLabelText(/dirección de destino/i);
      const calculateButton = screen.getByRole('button', { name: /calcular ruta/i });

      // Act
      await user.type(originInput, 'Plaza de Armas, Santiago');
      await user.type(destinationInput, 'Las Condes, Santiago');
      await user.click(calculateButton);

      // Assert
      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalledWith(
          expect.any(Object), // origin coordinates
          expect.any(Object)  // destination coordinates
        );
      });
    });

    it('should show route calculation loading state', async () => {
      // Arrange
      vi.mocked(require('@hooks/useRouteCalculation').useRouteCalculation).mockReturnValue({
        calculateRoute: vi.fn(),
        routeData: null,
        calculation: null,
        loading: true, // Loading state
        error: null,
        resetCalculation: vi.fn()
      });

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByText(/calculando ruta/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calcular ruta/i })).toBeDisabled();
    });

    it('should display route calculation results', async () => {
      // Arrange
      const mockRouteData = {
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

      const mockCalculation = {
        routeData: mockRouteData,
        vehicleType: VehicleType.ECONOMICO,
        fuelType: FuelType.GASOLINA_93,
        fuelPrice: 850,
        fuelNeeded: 1.03,
        totalCost: 876,
        consumption: 15
      };

      vi.mocked(require('@hooks/useRouteCalculation').useRouteCalculation).mockReturnValue({
        calculateRoute: vi.fn(),
        calculateFuelCost: vi.fn(),
        routeData: mockRouteData,
        calculation: mockCalculation,
        loading: false,
        error: null,
        resetCalculation: vi.fn()
      });

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByText(/distancia: 15\.5 km/i)).toBeInTheDocument();
      expect(screen.getByText(/duración: 25 minutos/i)).toBeInTheDocument();
      expect(screen.getByText(/combustible necesario: 1\.03 litros/i)).toBeInTheDocument();
      expect(screen.getByText(/costo estimado: \$876/i)).toBeInTheDocument();
    });

    it('should show route calculation error', async () => {
      // Arrange
      const errorMessage = 'No se pudo calcular la ruta';
      
      vi.mocked(require('@hooks/useRouteCalculation').useRouteCalculation).mockReturnValue({
        calculateRoute: vi.fn(),
        calculateFuelCost: vi.fn(),
        routeData: null,
        calculation: null,
        loading: false,
        error: errorMessage,
        resetCalculation: vi.fn()
      });

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('error');
    });
  });

  describe('geolocation functionality', () => {
    it('should use current location for origin', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockGetCurrentPosition = vi.fn().mockResolvedValue({
        coordinates: { lat: -33.4489, lng: -70.6693 },
        accuracy: 10
      });

      vi.mocked(require('@services/geolocationService').geolocationService).getCurrentPosition = mockGetCurrentPosition;

      render(<FuelExpenseForm {...defaultProps} />);

      const useLocationButton = screen.getByRole('button', { name: /usar ubicación actual/i });

      // Act
      await user.click(useLocationButton);

      // Assert
      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
        expect(screen.getByDisplayValue(/santiago/i)).toBeInTheDocument();
      });
    });

    it('should handle geolocation error gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockGetCurrentPosition = vi.fn().mockRejectedValue(
        new Error('Permisos de geolocalización denegados')
      );

      vi.mocked(require('@services/geolocationService').geolocationService).getCurrentPosition = mockGetCurrentPosition;

      render(<FuelExpenseForm {...defaultProps} />);

      const useLocationButton = screen.getByRole('button', { name: /usar ubicación actual/i });

      // Act
      await user.click(useLocationButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/permisos de geolocalización denegados/i)).toBeInTheDocument();
      });
    });

    it('should show geolocation loading state', async () => {
      // Arrange
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(require('@services/geolocationService').geolocationService).getCurrentPosition = vi.fn().mockReturnValue(promise);

      render(<FuelExpenseForm {...defaultProps} />);

      const useLocationButton = screen.getByRole('button', { name: /usar ubicación actual/i });

      // Act
      await user.click(useLocationButton);

      // Assert
      expect(screen.getByText(/obteniendo ubicación/i)).toBeInTheDocument();
      expect(useLocationButton).toBeDisabled();

      // Resolve
      resolvePromise!({
        coordinates: { lat: -33.4489, lng: -70.6693 },
        accuracy: 10
      });
    });
  });

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockCreateExpense = vi.fn().mockResolvedValue({
        success: true,
        fuelExpense: { id: 'fuel-123' },
        message: 'Gasto creado exitosamente'
      });

      vi.mocked(require('@hooks/useFuelExpenses').useFuelExpenses).mockReturnValue({
        createExpense: mockCreateExpense,
        loading: false,
        error: null
      });

      render(<FuelExpenseForm {...defaultProps} />);

      // Fill form
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas, Santiago');
      await user.type(screen.getByLabelText(/dirección de destino/i), 'Las Condes, Santiago');
      await user.click(screen.getByText('Económico'));
      await user.click(screen.getByText('Gasolina 93'));
      await user.type(screen.getByLabelText(/propósito del viaje/i), 'Visita cliente importante');

      // Act
      await user.click(screen.getByRole('button', { name: /guardar gasto/i }));

      // Assert
      await waitFor(() => {
        expect(mockCreateExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            originCoordinates: expect.any(Object),
            destinationCoordinates: expect.any(Object),
            vehicleType: VehicleType.ECONOMICO,
            fuelType: FuelType.GASOLINA_93,
            businessPurpose: 'Visita cliente importante'
          })
        );
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should prevent submission when form is invalid', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockCreateExpense = vi.fn();

      vi.mocked(require('@hooks/useFuelExpenses').useFuelExpenses).mockReturnValue({
        createExpense: mockCreateExpense,
        loading: false,
        error: null
      });

      render(<FuelExpenseForm {...defaultProps} />);

      // Act - Submit without filling required fields
      await user.click(screen.getByRole('button', { name: /guardar gasto/i }));

      // Assert
      expect(mockCreateExpense).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle submission error gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockCreateExpense = vi.fn().mockRejectedValue(
        new Error('Error al crear el gasto')
      );

      vi.mocked(require('@hooks/useFuelExpenses').useFuelExpenses).mockReturnValue({
        createExpense: mockCreateExpense,
        loading: false,
        error: null
      });

      render(<FuelExpenseForm {...defaultProps} />);

      // Fill valid form
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas, Santiago');
      await user.type(screen.getByLabelText(/dirección de destino/i), 'Las Condes, Santiago');
      await user.click(screen.getByText('Económico'));
      await user.click(screen.getByText('Gasolina 93'));
      await user.type(screen.getByLabelText(/propósito del viaje/i), 'Visita cliente importante');

      // Act
      await user.click(screen.getByRole('button', { name: /guardar gasto/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/error al crear el gasto/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should show submission loading state', async () => {
      // Arrange
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(require('@hooks/useFuelExpenses').useFuelExpenses).mockReturnValue({
        createExpense: vi.fn().mockReturnValue(promise),
        loading: true,
        error: null
      });

      render(<FuelExpenseForm {...defaultProps} />);

      // Fill valid form
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas, Santiago');
      await user.type(screen.getByLabelText(/dirección de destino/i), 'Las Condes, Santiago');
      await user.click(screen.getByText('Económico'));
      await user.click(screen.getByText('Gasolina 93'));
      await user.type(screen.getByLabelText(/propósito del viaje/i), 'Visita cliente importante');

      // Act
      await user.click(screen.getByRole('button', { name: /guardar gasto/i }));

      // Assert
      expect(screen.getByText(/guardando/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar gasto/i })).toBeDisabled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      // Act
      await user.click(cancelButton);

      // Assert
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should confirm cancellation when form has unsaved changes', async () => {
      // Arrange
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<FuelExpenseForm {...defaultProps} />);

      // Make some changes
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas');
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      // Act
      await user.click(cancelButton);

      // Assert
      expect(confirmSpy).toHaveBeenCalledWith(
        '¿Estás seguro que deseas cancelar? Se perderán los cambios no guardados.'
      );
      expect(mockOnCancel).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should not cancel if user chooses to continue editing', async () => {
      // Arrange
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<FuelExpenseForm {...defaultProps} />);

      // Make some changes
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas');
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      // Act
      await user.click(cancelButton);

      // Assert
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('keyboard navigation', () => {
    it('should support tab navigation through form fields', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      // Act
      await user.tab(); // Origin input
      expect(screen.getByLabelText(/dirección de origen/i)).toHaveFocus();

      await user.tab(); // Destination input
      expect(screen.getByLabelText(/dirección de destino/i)).toHaveFocus();

      await user.tab(); // Vehicle type section
      await user.tab(); // Fuel type section
      await user.tab(); // Purpose input
      expect(screen.getByLabelText(/propósito del viaje/i)).toHaveFocus();

      await user.tab(); // Description input
      expect(screen.getByLabelText(/descripción adicional/i)).toHaveFocus();
    });

    it('should support Enter key for form submission', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockCreateExpense = vi.fn().mockResolvedValue({
        success: true,
        fuelExpense: { id: 'fuel-123' },
        message: 'Success'
      });

      vi.mocked(require('@hooks/useFuelExpenses').useFuelExpenses).mockReturnValue({
        createExpense: mockCreateExpense,
        loading: false,
        error: null
      });

      render(<FuelExpenseForm {...defaultProps} />);

      // Fill form
      await user.type(screen.getByLabelText(/dirección de origen/i), 'Plaza de Armas, Santiago');
      await user.type(screen.getByLabelText(/dirección de destino/i), 'Las Condes, Santiago');
      await user.click(screen.getByText('Económico'));
      await user.click(screen.getByText('Gasolina 93'));
      await user.type(screen.getByLabelText(/propósito del viaje/i), 'Visita cliente');

      // Act - Press Enter in the form
      await user.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(mockCreateExpense).toHaveBeenCalled();
      });
    });

    it('should support Escape key for cancellation', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FuelExpenseForm {...defaultProps} />);

      // Act
      await user.keyboard('{Escape}');

      // Assert
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('responsive behavior', () => {
    it('should adapt layout for mobile screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      const form = screen.getByRole('form');
      expect(form).toHaveClass('mobile-layout');
    });

    it('should adapt layout for tablet screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      const form = screen.getByRole('form');
      expect(form).toHaveClass('tablet-layout');
    });

    it('should adapt layout for desktop screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<FuelExpenseForm {...defaultProps} />);

      // Assert
      const form = screen.getByRole('form');
      expect(form).toHaveClass('desktop-layout');
    });
  });
});