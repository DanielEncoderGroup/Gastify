import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleTypeSelector } from '../VehicleTypeSelector';
import { VehicleType } from '@types/fuel';

describe('VehicleTypeSelector', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    value: null as VehicleType | null,
    onChange: mockOnChange,
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render all vehicle type options', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      expect(screen.getByText('Económico')).toBeInTheDocument();
      expect(screen.getByText('Intermedio')).toBeInTheDocument();
      expect(screen.getByText('SUV')).toBeInTheDocument();
    });

    it('should show consumption information for each vehicle type', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      expect(screen.getByText('15 km/l')).toBeInTheDocument(); // Económico
      expect(screen.getByText('10 km/l')).toBeInTheDocument(); // Intermedio
      expect(screen.getByText('8 km/l')).toBeInTheDocument(); // SUV
    });

    it('should show vehicle descriptions', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      expect(screen.getByText(/vehículos compactos y eficientes/i)).toBeInTheDocument();
      expect(screen.getByText(/sedanes y hatchbacks de tamaño mediano/i)).toBeInTheDocument();
      expect(screen.getByText(/vehículos utilitarios deportivos/i)).toBeInTheDocument();
    });

    it('should display vehicle examples when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} showExamples />);

      // Act
      await user.click(screen.getByText('Económico'));

      // Assert
      expect(screen.getByText(/chevrolet spark/i)).toBeInTheDocument();
      expect(screen.getByText(/suzuki swift/i)).toBeInTheDocument();
      expect(screen.getByText(/hyundai grand i10/i)).toBeInTheDocument();
    });

    it('should highlight selected vehicle type', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} value={VehicleType.ECONOMICO} />);

      // Assert
      const economicoOption = screen.getByText('Económico').closest('div');
      expect(economicoOption).toHaveClass('selected');
      expect(economicoOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should show no selection when value is null', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} value={null} />);

      // Assert
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).not.toHaveClass('selected');
        expect(option).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('user interactions', () => {
    it('should call onChange when vehicle type is selected', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.click(screen.getByText('Intermedio'));

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(VehicleType.INTERMEDIO);
    });

    it('should allow deselection when clicking selected option', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} value={VehicleType.ECONOMICO} allowDeselect />);

      // Act
      await user.click(screen.getByText('Económico'));

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('should not allow deselection when allowDeselect is false', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} value={VehicleType.ECONOMICO} allowDeselect={false} />);

      // Act
      await user.click(screen.getByText('Económico'));

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled(); // Should not deselect
    });

    it('should not respond to clicks when disabled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} disabled />);

      // Act
      await user.click(screen.getByText('Económico'));

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should show disabled state visually', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} disabled />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('disabled');
      expect(container).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('keyboard navigation', () => {
    it('should support keyboard selection with Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.tab(); // Focus first option
      await user.keyboard('{Enter}'); // Select with Enter

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(VehicleType.ECONOMICO);
    });

    it('should support keyboard selection with Space key', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.tab(); // Focus first option
      await user.keyboard(' '); // Select with Space

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(VehicleType.ECONOMICO);
    });

    it('should support arrow key navigation', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.tab(); // Focus first option (Económico)
      expect(screen.getByText('Económico').closest('div')).toHaveFocus();

      await user.keyboard('{ArrowDown}'); // Move to next option
      expect(screen.getByText('Intermedio').closest('div')).toHaveFocus();

      await user.keyboard('{ArrowDown}'); // Move to next option
      expect(screen.getByText('SUV').closest('div')).toHaveFocus();

      await user.keyboard('{ArrowUp}'); // Move back
      expect(screen.getByText('Intermedio').closest('div')).toHaveFocus();
    });

    it('should wrap around at boundaries with arrow keys', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.tab(); // Focus first option
      await user.keyboard('{ArrowUp}'); // Should wrap to last option

      // Assert
      expect(screen.getByText('SUV').closest('div')).toHaveFocus();

      // Act
      await user.keyboard('{ArrowDown}'); // Should wrap to first option

      // Assert
      expect(screen.getByText('Económico').closest('div')).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-label', 'Seleccionar tipo de vehículo');
      expect(container).toHaveAttribute('aria-required', 'true');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      
      options.forEach(option => {
        expect(option).toHaveAttribute('tabindex');
        expect(option).toHaveAttribute('role', 'option');
        expect(option).toHaveAttribute('aria-selected');
      });
    });

    it('should provide proper focus management', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.tab(); // Focus container

      // Assert
      expect(screen.getByText('Económico').closest('div')).toHaveFocus();
    });

    it('should announce selection changes to screen readers', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} />);

      // Act
      await user.click(screen.getByText('Intermedio'));

      // Assert
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/seleccionado: intermedio/i);
    });

    it('should have descriptive labels for each option', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const economicoOption = screen.getByText('Económico').closest('div');
      expect(economicoOption).toHaveAttribute('aria-label', 'Vehículo económico: 15 km por litro');

      const intermedioOption = screen.getByText('Intermedio').closest('div');
      expect(intermedioOption).toHaveAttribute('aria-label', 'Vehículo intermedio: 10 km por litro');

      const suvOption = screen.getByText('SUV').closest('div');
      expect(suvOption).toHaveAttribute('aria-label', 'Vehículo SUV: 8 km por litro');
    });
  });

  describe('layout variants', () => {
    it('should render in horizontal layout by default', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('horizontal-layout');
    });

    it('should render in vertical layout when specified', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} layout="vertical" />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('vertical-layout');
    });

    it('should render in grid layout when specified', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} layout="grid" />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('grid-layout');
    });
  });

  describe('size variants', () => {
    it('should render in default size', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveClass('size-default');
      });
    });

    it('should render in small size', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} size="small" />);

      // Assert
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveClass('size-small');
      });
    });

    it('should render in large size', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} size="large" />);

      // Assert
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveClass('size-large');
      });
    });
  });

  describe('custom styling and theming', () => {
    it('should apply custom className', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} className="custom-vehicle-selector" />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('custom-vehicle-selector');
    });

    it('should support custom styles', () => {
      // Arrange
      const customStyle = { backgroundColor: 'red', padding: '20px' };

      // Act
      render(<VehicleTypeSelector {...defaultProps} style={customStyle} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveStyle('background-color: red');
      expect(container).toHaveStyle('padding: 20px');
    });

    it('should render with dark theme', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} theme="dark" />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('theme-dark');
    });

    it('should render with light theme by default', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('theme-light');
    });
  });

  describe('validation and error states', () => {
    it('should show error state when hasError is true', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} hasError />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('error');
      expect(container).toHaveAttribute('aria-invalid', 'true');
    });

    it('should display custom error message', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} hasError errorMessage="Debe seleccionar un tipo de vehículo" />);

      // Assert
      expect(screen.getByText('Debe seleccionar un tipo de vehículo')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show required indicator when specified', () => {
      // Act
      render(<VehicleTypeSelector {...defaultProps} required />);

      // Assert
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
      
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-required', 'true');
    });

    it('should clear error state when valid selection is made', async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <VehicleTypeSelector {...defaultProps} hasError errorMessage="Error message" />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();

      // Act - Make valid selection
      await user.click(screen.getByText('Económico'));
      
      // Re-render without error
      rerender(<VehicleTypeSelector {...defaultProps} value={VehicleType.ECONOMICO} />);

      // Assert
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('tooltip functionality', () => {
    it('should show tooltip on hover with vehicle details', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} showTooltips />);

      const economicoOption = screen.getByText('Económico');

      // Act
      await user.hover(economicoOption);

      // Assert
      await screen.findByRole('tooltip');
      expect(screen.getByText(/ideal para ciudad/i)).toBeInTheDocument();
      expect(screen.getByText(/mayor eficiencia de combustible/i)).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} showTooltips />);

      const economicoOption = screen.getByText('Económico');

      // Act
      await user.hover(economicoOption);
      await screen.findByRole('tooltip');
      
      await user.unhover(economicoOption);

      // Assert
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should show tooltip with keyboard focus', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<VehicleTypeSelector {...defaultProps} showTooltips />);

      // Act
      await user.tab(); // Focus first option
      
      // Assert
      await screen.findByRole('tooltip');
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should stack vertically on small screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('responsive-mobile');
    });

    it('should use horizontal layout on large screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('responsive-desktop');
    });

    it('should hide detailed descriptions on very small screens', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Act
      render(<VehicleTypeSelector {...defaultProps} />);

      // Assert
      expect(screen.queryByText(/vehículos compactos y eficientes/i)).not.toBeInTheDocument();
      // Only consumption should be visible
      expect(screen.getByText('15 km/l')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily when props have not changed', () => {
      // Arrange
      const renderSpy = vi.fn();
      const MockComponent = vi.fn(() => {
        renderSpy();
        return <VehicleTypeSelector {...defaultProps} />;
      });

      const { rerender } = render(<MockComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Act - Re-render with same props
      rerender(<MockComponent />);

      // Assert - Should not re-render due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render only when relevant props change', () => {
      // Arrange
      const { rerender } = render(<VehicleTypeSelector {...defaultProps} />);

      // Act - Change value prop
      rerender(<VehicleTypeSelector {...defaultProps} value={VehicleType.ECONOMICO} />);

      // Assert
      const selectedOption = screen.getByText('Económico').closest('div');
      expect(selectedOption).toHaveClass('selected');
    });
  });

  describe('integration with form libraries', () => {
    it('should work with React Hook Form register', () => {
      // Arrange
      const mockRegister = vi.fn(() => ({
        onChange: mockOnChange,
        name: 'vehicleType',
        ref: vi.fn()
      }));

      // Act
      render(<VehicleTypeSelector value={null} {...mockRegister('vehicleType')} />);

      // Assert
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('name', 'vehicleType');
    });

    it('should display validation errors from form library', () => {
      // Arrange
      const formError = {
        message: 'Vehicle type is required',
        type: 'required'
      };

      // Act
      render(<VehicleTypeSelector {...defaultProps} error={formError} />);

      // Assert
      expect(screen.getByText('Vehicle type is required')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});