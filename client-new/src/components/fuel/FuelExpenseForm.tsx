import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CreateFuelExpenseData, 
  VehicleType, 
  FuelType, 
  Coordinates,
  RouteData,
  FuelCalculation 
} from '../../types/fuel';
import { useFuelExpenses } from '../../hooks/useFuelExpenses';
import { useRouteCalculation } from '../../hooks/useRouteCalculation';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { geolocationService } from '../../services/geolocationService';
import { mapsService } from '../../services/mapsService';
import VehicleTypeSelector from './VehicleTypeSelector';
import FuelCostCalculator from './FuelCostCalculator';
import RouteMapViewer from './RouteMapViewer';

interface FormData {
  originAddress: string;
  destinationAddress: string;
  originCoordinates: Coordinates | null;
  destinationCoordinates: Coordinates | null;
  vehicleType: VehicleType | null;
  fuelType: FuelType | null;
  businessPurpose: string;
  description: string;
  manualFuelPrice?: number;
}

interface FormErrors {
  originAddress?: string;
  destinationAddress?: string;
  vehicleType?: string;
  fuelType?: string;
  businessPurpose?: string;
  description?: string;
  general?: string;
}

interface FuelExpenseFormProps {
  onSubmit: (data: CreateFuelExpenseData) => void;
  onCancel: () => void;
  initialData?: Partial<CreateFuelExpenseData>;
  disabled?: boolean;
}

/**
 * Formulario completo para crear gastos de combustible
 * Integra mapa, cálculos y validaciones
 */
export const FuelExpenseForm: React.FC<FuelExpenseFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  disabled = false
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    originAddress: initialData?.originAddress || '',
    destinationAddress: initialData?.destinationAddress || '',
    originCoordinates: initialData?.originCoordinates || null,
    destinationCoordinates: initialData?.destinationCoordinates || null,
    vehicleType: initialData?.vehicleType || null,
    fuelType: initialData?.fuelType || null,
    businessPurpose: initialData?.businessPurpose || '',
    description: initialData?.description || '',
    manualFuelPrice: initialData?.manualFuelPrice
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [geoLoading, setGeoLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Referencias para autocompletado
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const [originAutocomplete, setOriginAutocomplete] = useState<any>(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState<any>(null);

  // Hooks
  const { createExpense, loading: submitLoading, error: submitError } = useFuelExpenses();
  const {
    routeData,
    calculation,
    loading: routeLoading,
    error: routeError,
    calculateRoute,
    calculateFuelCost,
    resetCalculation
  } = useRouteCalculation();
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Limpiar errores cuando se corrige un campo
  const clearFieldError = useCallback((field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  // Inicializar Google Places Autocomplete
  useEffect(() => {
    if (mapsLoaded && window.google && window.google.maps.places) {
      // Autocomplete para origen
      if (originInputRef.current && !originAutocomplete) {
        const autocomplete = new window.google.maps.places.Autocomplete(originInputRef.current, {
          componentRestrictions: { country: 'CL' },
          fields: ['formatted_address', 'geometry'],
          types: ['address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            setFormData(prev => ({
              ...prev,
              originAddress: place.formatted_address || '',
              originCoordinates: coordinates
            }));
            setIsDirty(true);
            clearFieldError('originAddress');
          }
        });

        setOriginAutocomplete(autocomplete);
      }

      // Autocomplete para destino
      if (destinationInputRef.current && !destinationAutocomplete) {
        const autocomplete = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
          componentRestrictions: { country: 'CL' },
          fields: ['formatted_address', 'geometry'],
          types: ['address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            setFormData(prev => ({
              ...prev,
              destinationAddress: place.formatted_address || '',
              destinationCoordinates: coordinates
            }));
            setIsDirty(true);
            clearFieldError('destinationAddress');
          }
        });

        setDestinationAutocomplete(autocomplete);
      }
    }
  }, [mapsLoaded, originAutocomplete, destinationAutocomplete, clearFieldError]);

  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validar campos requeridos
    if (!formData.originAddress.trim()) {
      newErrors.originAddress = 'La dirección de origen es requerida';
    }

    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = 'La dirección de destino es requerida';
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Debe seleccionar un tipo de vehículo';
    }

    if (!formData.fuelType) {
      newErrors.fuelType = 'Debe seleccionar un tipo de combustible';
    }

    if (!formData.businessPurpose.trim()) {
      newErrors.businessPurpose = 'El propósito del viaje es requerido';
    }

    // Validar longitud de campos
    if (formData.businessPurpose.trim() && formData.businessPurpose.trim().length < 5) {
      newErrors.businessPurpose = 'El propósito debe tener al menos 5 caracteres';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar que origen y destino sean diferentes
    if (formData.originAddress.trim() && formData.destinationAddress.trim()) {
      if (formData.originAddress.trim().toLowerCase() === formData.destinationAddress.trim().toLowerCase()) {
        newErrors.general = 'El origen y destino deben ser diferentes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Manejar cambios en inputs
  const handleInputChange = useCallback((field: keyof FormData, value: string | VehicleType | FuelType | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    clearFieldError(field as keyof FormErrors);
  }, [clearFieldError]);

  // Geocodificar dirección
  const geocodeAddress = useCallback(async (address: string, isOrigin: boolean) => {
    if (!address.trim() || !mapsLoaded) return;

    try {
      const location = await mapsService.geocodeAddress(address);
      
      if (isOrigin) {
        setFormData(prev => ({ 
          ...prev, 
          originCoordinates: location.coordinates 
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          destinationCoordinates: location.coordinates 
        }));
      }

      clearFieldError(isOrigin ? 'originAddress' : 'destinationAddress');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error geocodificando dirección';
      setErrors(prev => ({
        ...prev,
        [isOrigin ? 'originAddress' : 'destinationAddress']: errorMessage
      }));
    }
  }, [mapsLoaded, clearFieldError]);

  // Usar ubicación actual
  const useCurrentLocation = useCallback(async () => {
    try {
      setGeoLoading(true);
      
      const position = await geolocationService.getCurrentPosition();
      const location = await mapsService.reverseGeocode(position.coordinates);
      
      setFormData(prev => ({
        ...prev,
        originAddress: location.address,
        originCoordinates: position.coordinates
      }));
      
      setIsDirty(true);
      clearFieldError('originAddress');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo ubicación';
      setErrors(prev => ({ ...prev, originAddress: errorMessage }));
    } finally {
      setGeoLoading(false);
    }
  }, [clearFieldError]);

  // Calcular ruta automáticamente
  useEffect(() => {
    if (formData.originCoordinates && formData.destinationCoordinates) {
      calculateRoute(formData.originCoordinates, formData.destinationCoordinates);
    }
  }, [formData.originCoordinates, formData.destinationCoordinates, calculateRoute]);

  // Calcular costo automáticamente
  useEffect(() => {
    if (routeData && formData.vehicleType && formData.fuelType) {
      calculateFuelCost(routeData, formData.vehicleType, formData.fuelType, formData.manualFuelPrice);
    }
  }, [routeData, formData.vehicleType, formData.fuelType, formData.manualFuelPrice, calculateFuelCost]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!formData.originCoordinates || !formData.destinationCoordinates) {
      setErrors({ general: 'Faltan coordenadas de origen o destino' });
      return;
    }

    try {
      const submitData: CreateFuelExpenseData = {
        originCoordinates: formData.originCoordinates,
        destinationCoordinates: formData.destinationCoordinates,
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        vehicleType: formData.vehicleType!,
        fuelType: formData.fuelType!,
        businessPurpose: formData.businessPurpose.trim(),
        description: formData.description.trim() || undefined,
        manualFuelPrice: formData.manualFuelPrice
      };

      await createExpense(submitData);
      setIsDirty(false);
      onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }, [validateForm, formData, createExpense, onSubmit]);

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        '¿Estás seguro que deseas cancelar? Se perderán los cambios no guardados.'
      );
      if (!confirmCancel) return;
    }
    
    resetCalculation();
    onCancel();
  }, [isDirty, resetCalculation, onCancel]);

  // Manejar teclas especiales
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLFormElement) {
      handleSubmit(e as any);
    }
    
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSubmit, handleCancel]);

  // Determinar clases responsivas
  const getResponsiveClasses = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile-layout';
    if (width < 1024) return 'tablet-layout';
    return 'desktop-layout';
  };

  return (
    <div className="fuel-expense-form max-w-6xl mx-auto">
      <form
        role="form"
        aria-label="Formulario de gasto de combustible"
        className={`space-y-6 ${getResponsiveClasses()}`}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        {/* Errores generales */}
        {(errors.general || submitError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-2">❌</span>
              <p className="text-sm text-red-700">{errors.general || submitError}</p>
            </div>
          </div>
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Formulario */}
          <div className="space-y-6">
            {/* Direcciones */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ubicaciones</h3>
              
              {/* Origen */}
              <div className="mb-4">
                <label htmlFor="originAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Origen *
                </label>
                <div className="flex space-x-2">
                  <input
                    ref={originInputRef}
                    id="originAddress"
                    type="text"
                    value={formData.originAddress}
                    onChange={(e) => handleInputChange('originAddress', e.target.value)}
                    onBlur={() => geocodeAddress(formData.originAddress, true)}
                    placeholder="Ingresa dirección de origen"
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.originAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    aria-required="true"
                    aria-describedby={errors.originAddress ? 'origin-error' : undefined}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={geoLoading || disabled}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {geoLoading ? 'Obteniendo ubicación...' : 'Usar ubicación actual'}
                  </button>
                </div>
                {errors.originAddress && (
                  <p id="origin-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.originAddress}
                  </p>
                )}
              </div>

              {/* Destino */}
              <div>
                <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Destino *
                </label>
                <input
                  ref={destinationInputRef}
                  id="destinationAddress"
                  type="text"
                  value={formData.destinationAddress}
                  onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                  onBlur={() => geocodeAddress(formData.destinationAddress, false)}
                  placeholder="Ingresa dirección de destino"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.destinationAddress ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-required="true"
                  disabled={disabled}
                />
                {errors.destinationAddress && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.destinationAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Selector de vehículo */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <VehicleTypeSelector
                selectedType={formData.vehicleType}
                onTypeChange={(type) => handleInputChange('vehicleType', type)}
                disabled={disabled}
              />
              {errors.vehicleType && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errors.vehicleType}
                </p>
              )}
            </div>

            {/* Tipo de combustible */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Combustible *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(FuelType).map((fuelType) => (
                  <label
                    key={fuelType}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      formData.fuelType === fuelType
                        ? 'border-blue-500 bg-blue-50 selected'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fuelType"
                      value={fuelType}
                      checked={formData.fuelType === fuelType}
                      onChange={(e) => handleInputChange('fuelType', e.target.value as FuelType)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className="flex-1 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {fuelType === FuelType.GASOLINA_93 && 'Gasolina 93'}
                        {fuelType === FuelType.GASOLINA_95 && 'Gasolina 95'}
                        {fuelType === FuelType.GASOLINA_97 && 'Gasolina 97'}
                        {fuelType === FuelType.DIESEL && 'Diésel'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.fuelType && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errors.fuelType}
                </p>
              )}
            </div>

            {/* Propósito y descripción */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Justificación</h3>
              
              <div className="mb-4">
                <label htmlFor="businessPurpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Propósito del Viaje *
                </label>
                <input
                  id="businessPurpose"
                  type="text"
                  value={formData.businessPurpose}
                  onChange={(e) => handleInputChange('businessPurpose', e.target.value)}
                  placeholder="Ej: Reunión con cliente, visita a proveedor..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.businessPurpose ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-required="true"
                  disabled={disabled}
                />
                {errors.businessPurpose && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.businessPurpose}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Adicional
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Información adicional sobre el viaje (opcional)"
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={disabled}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: Mapa y cálculos */}
          <div className="space-y-6">
            {/* Mapa */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ruta</h3>
              <RouteMapViewer
                routeData={routeData}
                loading={routeLoading}
                error={routeError}
                height="300px"
                showDetails={false}
                originCoordinates={formData.originCoordinates || undefined}
                destinationCoordinates={formData.destinationCoordinates || undefined}
                showMarkers={true}
                showRoute={true}
              />
              
              {/* Botón para calcular ruta */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.originCoordinates && formData.destinationCoordinates) {
                      calculateRoute(formData.originCoordinates, formData.destinationCoordinates);
                    }
                  }}
                  disabled={!formData.originCoordinates || !formData.destinationCoordinates || routeLoading || disabled}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {routeLoading ? 'Calculando ruta...' : 'Calcular ruta'}
                </button>
              </div>
            </div>

            {/* Calculadora de costos */}
            <FuelCostCalculator
              calculation={calculation}
              loading={routeLoading}
              error={routeError}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={disabled}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={submitLoading || !routeData || !calculation || disabled}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitLoading ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FuelExpenseForm;