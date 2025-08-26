import React, { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  PencilIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalculatorIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { ReceiptProduct, ReceiptPDFData } from '../../../types/receipt';
import { pdfService } from '../../../services/pdfService';

export interface ProductListProps {
  products: ReceiptProduct[];
  declaredTotal: number;
  receiptId?: string;
  receiptData?: {
    id: string;
    companyName: string;
    folioNumber: string;
    date: string;
    totalAmount: number;
    description: string;
    ocrData?: any;
    geolocation?: any;
  };
  onProductUpdate?: (productId: string, updates: Partial<ReceiptProduct>) => void;
  onValidationComplete?: (isValid: boolean, difference: number) => void;
  readOnly?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  declaredTotal,
  receiptId,
  receiptData,
  onProductUpdate,
  onValidationComplete,
  readOnly = false
}) => {
  const [validationStatus, setValidationStatus] = useState<{isValid: boolean, difference: number} | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReceiptProduct>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validar totales
  const validateTotals = React.useCallback(() => {
    const calculatedTotal = products.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const difference = Math.abs(calculatedTotal - declaredTotal);
    const isValid = difference <= (declaredTotal * 0.05); // 5% tolerancia
    
    const status = { isValid, difference };
    setValidationStatus(status);
    
    if (onValidationComplete) {
      onValidationComplete(isValid, difference);
    }
  }, [products, declaredTotal, onValidationComplete]);

  useEffect(() => {
    if (products.length > 0) {
      validateTotals();
    }
  }, [products, declaredTotal, validateTotals]);

  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    if (!receiptData) {
      console.error('No hay datos del recibo disponibles para generar PDF');
      return;
    }

    try {
      setIsLoading(true);
      
      const pdfData: ReceiptPDFData = {
        id: receiptData.id,
        companyName: receiptData.companyName,
        folioNumber: receiptData.folioNumber,
        date: receiptData.date,
        totalAmount: receiptData.totalAmount,
        description: receiptData.description,
        products: products,
        ocrData: receiptData.ocrData,
        geolocation: receiptData.geolocation
      };

      await pdfService.generateReceiptPDF(pdfData);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de edición
  const startEditing = (product: ReceiptProduct) => {
    if (readOnly) return;
    
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      quantity: product.quantity,
      unit_price: product.unit_price,
      total_price: product.total_price,
      barcode: product.barcode
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveProduct = async () => {
    if (!editingId || !onProductUpdate) return;
    
    try {
      onProductUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error actualizando producto:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationStatus = () => {
    if (!validationStatus) return null;
    
    if (validationStatus.isValid) {
      return (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="text-green-800 font-medium">Totales validados correctamente</p>
            <p className="text-green-600 text-sm">
              Diferencia: ${validationStatus.difference.toFixed(0)} ({((validationStatus.difference / declaredTotal) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <p className="text-yellow-800 font-medium">Diferencia en totales detectada</p>
            <p className="text-yellow-600 text-sm">
              Calculado: ${(products.reduce((sum, p) => sum + (p.total_price || 0), 0)).toFixed(0)} | 
              Declarado: ${declaredTotal.toFixed(0)} | 
              Diferencia: {((validationStatus.difference / declaredTotal) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No se encontraron productos extraídos</p>
        <p className="text-gray-500 text-sm">
          Los productos se extraerán automáticamente durante el procesamiento OCR
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos Extraídos ({products.length})
          </h3>
          {validationStatus && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              validationStatus.isValid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {validationStatus.isValid ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Totales válidos
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Diferencia: ${Math.abs(validationStatus.difference).toLocaleString('es-CL')}
                </>
              )}
            </span>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          {receiptData && (
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Descargar PDF
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <CalculatorIcon className="w-4 h-4 mr-2" />
            {showValidation ? 'Ocultar' : 'Validar'} Totales
          </button>
        </div>
      </div>

      {/* Validación de totales */}
      {showValidation && getValidationStatus()}

      {/* Lista de productos */}
      <div className="space-y-2">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            {editingId === product.id ? (
              /* Modo edición */
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.quantity || ''}
                      onChange={(e) => setEditForm({...editForm, quantity: parseFloat(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Total</label>
                    <input
                      type="number"
                      value={editForm.total_price || ''}
                      onChange={(e) => setEditForm({...editForm, total_price: parseFloat(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveProduct}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              /* Modo visualización */
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Cantidad: {product.quantity}</span>
                        {product.unit_price && (
                          <span>Precio Unit: ${product.unit_price.toLocaleString()}</span>
                        )}
                        <span className="font-medium">Total: ${(product.total_price || 0).toLocaleString()}</span>
                      </div>
                      {product.barcode && (
                        <p className="text-xs text-gray-400 mt-1">Código: {product.barcode}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Indicador de confianza */}
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className={`text-xs font-medium ${getConfidenceColor(product.confidence)}`}>
                      {(product.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Método de extracción */}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.extraction_method === 'advanced_parser' ? 'bg-blue-100 text-blue-800' :
                    product.extraction_method === 'manual_correction' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.extraction_method === 'advanced_parser' ? 'IA' : 
                     product.extraction_method === 'manual_correction' ? 'Corregido' : 'Manual'}
                  </span>
                  
                  {/* Botón editar */}
                  {!readOnly && (
                    <button
                      onClick={() => startEditing(product)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen total */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Calculado:</span>
          <span className="font-bold text-lg text-gray-900">
            ${products.reduce((sum, p) => sum + (p.total_price || 0), 0).toLocaleString()}
          </span>
        </div>
        {validationStatus && (
          <div className="text-sm text-gray-600 mt-1">
            <span>Declarado: ${declaredTotal.toLocaleString()}</span>
            {validationStatus.difference > 0 && (
              <span className="ml-2 text-yellow-600">
                (Diferencia: ${validationStatus.difference.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;