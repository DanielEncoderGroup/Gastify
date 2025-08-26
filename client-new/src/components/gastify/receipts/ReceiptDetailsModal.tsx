import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import ProductList from './ProductList';
import { ReceiptProduct, ReceiptPDFData, Receipt } from '../../../types/receipt';
import { pdfService } from '../../../services/pdfService';

interface ReceiptDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  const [products, setProducts] = useState<ReceiptProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceiptProducts = React.useCallback(async () => {
    if (!receipt) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/receipt-products/receipt/${receipt.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('No se pudieron cargar los productos del recibo');
    } finally {
      setIsLoading(false);
    }
  }, [receipt]);

  // Cargar productos cuando se abre el modal
  useEffect(() => {
    if (isOpen && receipt) {
      fetchReceiptProducts();
    }
  }, [isOpen, receipt, fetchReceiptProducts]);

  const handleDownloadPDF = async () => {
    if (!receipt) return;

    try {
      const pdfData: ReceiptPDFData = {
        id: receipt.id,
        companyName: receipt.company_name,
        folioNumber: receipt.folio_number,
        date: receipt.date,
        totalAmount: receipt.total_amount,
        description: receipt.description,
        products: products,
        ocrData: receipt.ocr_data,
        geolocation: receipt.geolocation
      };

      await pdfService.generateReceiptPDF(pdfData);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  if (!receipt) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog open={isOpen} as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Detalles del Recibo
                        </h3>
                        <p className="text-emerald-100 text-sm">
                          {receipt.company_name} • Folio {receipt.folio_number}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-md p-2 text-emerald-200 hover:text-white hover:bg-emerald-600 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Contenido del Modal */}
                <div className="max-h-[80vh] overflow-y-auto">
                  {/* Información General */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Empresa y Fecha */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Empresa</p>
                            <p className="font-medium text-gray-900">{receipt.company_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Fecha</p>
                            <p className="font-medium text-gray-900">
                              {new Date(receipt.date).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total y Folio */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            ${receipt.total_amount.toLocaleString('es-CL')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Folio</p>
                          <p className="font-medium text-gray-900">{receipt.folio_number}</p>
                        </div>
                      </div>

                      {/* Estado y Confianza */}
                      <div className="space-y-3">
                        {receipt.workflow_data && (
                          <div>
                            <p className="text-sm text-gray-500">Estado</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              receipt.workflow_data.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : receipt.workflow_data.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {receipt.workflow_data.status === 'approved' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                              {receipt.workflow_data.status === 'rejected' && <XCircleIcon className="w-3 h-3 mr-1" />}
                              {receipt.workflow_data.status === 'pending' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                              {receipt.workflow_data.status === 'approved' ? 'Aprobado' :
                               receipt.workflow_data.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                          </div>
                        )}
                        
                        {receipt.ocr_data?.confidence && (
                          <div>
                            <p className="text-sm text-gray-500">Confianza OCR</p>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    receipt.ocr_data.confidence >= 0.8 ? 'bg-green-500' :
                                    receipt.ocr_data.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${receipt.ocr_data.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {(receipt.ocr_data.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    {receipt.description && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Descripción</p>
                        <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{receipt.description}</p>
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos OCR Chile */}
                      {receipt.ocr_data?.chile_metadata && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-900 mb-2">Datos OCR Chile</p>
                          <div className="space-y-1 text-sm text-blue-800">
                            {receipt.ocr_data.chile_metadata.rut_emisor && (
                              <p>RUT: {receipt.ocr_data.chile_metadata.rut_emisor}</p>
                            )}
                            {receipt.ocr_data.chile_metadata.subtotal && (
                              <p>Subtotal: ${receipt.ocr_data.chile_metadata.subtotal.toLocaleString('es-CL')}</p>
                            )}
                            {receipt.ocr_data.chile_metadata.iva_amount && (
                              <p>IVA: ${receipt.ocr_data.chile_metadata.iva_amount.toLocaleString('es-CL')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Geolocalización */}
                      {receipt.geolocation && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center mb-2">
                            <MapPinIcon className="h-4 w-4 text-green-600 mr-1" />
                            <p className="text-sm font-medium text-green-900">Ubicación</p>
                          </div>
                          <div className="space-y-1 text-sm text-green-800">
                            {receipt.geolocation.address && <p>{receipt.geolocation.address}</p>}
                            {receipt.geolocation.city && <p>{receipt.geolocation.city}, {receipt.geolocation.region || 'Chile'}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de Productos */}
                  <div className="px-6 py-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <span className="ml-2 text-gray-600">Cargando productos...</span>
                      </div>
                    ) : error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                          <p className="text-red-800">{error}</p>
                        </div>
                      </div>
                    ) : products.length > 0 ? (
                      <ProductList
                        products={products}
                        declaredTotal={receipt.total_amount}
                        receiptId={receipt.id}
                        receiptData={{
                          id: receipt.id,
                          companyName: receipt.company_name,
                          folioNumber: receipt.folio_number,
                          date: receipt.date,
                          totalAmount: receipt.total_amount,
                          description: receipt.description,
                          ocrData: receipt.ocr_data,
                          geolocation: receipt.geolocation
                        }}
                        readOnly={true}
                      />
                    ) : (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No se encontraron productos extraídos para este recibo</p>
                        <p className="text-gray-400 text-sm mt-1">Es posible que el OCR no haya detectado productos individuales</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    ID: {receipt.id}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
