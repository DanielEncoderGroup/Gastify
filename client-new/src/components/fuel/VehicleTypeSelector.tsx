import React from 'react';
import { VehicleType } from '@types/fuel';
import { vehicleConstants, VEHICLE_COLORS, VEHICLE_CSS_CLASSES } from '@utils/vehicleConstants';

interface VehicleTypeSelectorProps {
  selectedType: VehicleType | null;
  onTypeChange: (type: VehicleType) => void;
  disabled?: boolean;
  showDetails?: boolean;
  className?: string;
}

/**
 * Selector de tipo de vehículo con información detallada
 * Muestra opciones visuales con consumo y características
 */
export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
  showDetails = true,
  className = ''
}) => {
  const vehicleTypes = vehicleConstants.getAllVehicleTypes();

  const handleTypeSelect = (type: VehicleType) => {
    if (!disabled) {
      onTypeChange(type);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, type: VehicleType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTypeSelect(type);
    }
  };

  return (
    <div className={`vehicle-type-selector ${className}`} role="radiogroup" aria-label="Selección de tipo de vehículo">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Vehículo *
      </label>
      
      <div className="space-y-3">
        {vehicleTypes.map((type) => {
          const info = vehicleConstants.getVehicleInfo(type);
          const isSelected = selectedType === type;
          const baseClasses = `relative flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
          const selectedClasses = isSelected 
            ? `${VEHICLE_CSS_CLASSES[type]} border-2 shadow-md selected` 
            : 'border-gray-300 bg-white hover:border-gray-400';
          const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

          return (
            <div
              key={type}
              className={`${baseClasses} ${selectedClasses} ${disabledClasses}`}
              onClick={() => handleTypeSelect(type)}
              onKeyDown={(e) => handleKeyDown(e, type)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              data-testid={`vehicle-option-${type}`}
            >
              {/* Radio button visual */}
              <div className="flex-shrink-0 mr-3 mt-1">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'border-current bg-current' 
                    : 'border-gray-400'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2" role="img" aria-label={info.displayName}>
                      {info.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {info.displayName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {info.consumption} km/litro
                      </p>
                    </div>
                  </div>
                  
                  {/* Badge de categoría */}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    info.category === 'economico' ? 'bg-green-100 text-green-800' :
                    info.category === 'intermedio' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {info.category}
                  </span>
                </div>

                {/* Detalles adicionales */}
                {showDetails && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {info.description}
                    </p>
                    
                    {/* Ejemplos de vehículos */}
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Ejemplos: </span>
                      {info.examples.slice(0, 3).join(', ')}
                      {info.examples.length > 3 && '...'}
                    </div>

                    {/* Pros principales */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {info.pros.slice(0, 2).map((pro, index) => (
                        <span 
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          ✓ {pro}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional del vehículo seleccionado */}
      {selectedType && showDetails && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 text-sm font-medium">
              {vehicleConstants.getVehicleInfo(selectedType).displayName} seleccionado
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Consumo:</span>
              <span className="ml-1 text-gray-600">
                {vehicleConstants.getConsumption(selectedType)} km/litro
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Categoría:</span>
              <span className="ml-1 text-gray-600 capitalize">
                {vehicleConstants.getVehicleInfo(selectedType).category}
              </span>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="mt-2">
            <span className="font-medium text-gray-700 text-sm">Recomendado para:</span>
            <ul className="mt-1 text-xs text-gray-600">
              {vehicleConstants.getVehicleInfo(selectedType).recommendedFor.map((rec, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-500 mr-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ayuda contextual */}
      <div className="mt-3 text-xs text-gray-500">
        <p>
          <span className="font-medium">💡 Consejo:</span> Los vehículos económicos son más eficientes para distancias cortas, 
          mientras que los SUV son mejores para viajes largos o con carga pesada.
        </p>
      </div>
    </div>
  );
};

export default VehicleTypeSelector;