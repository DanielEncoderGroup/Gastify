import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ProductList from './ProductList';
import { ReceiptProduct, BackendProduct, ReceiptPDFData, ModalReceipt } from '../../../types/receipt';
import { pdfService } from '../../../services/pdfService';
import { ReceiptHeader, ReceiptInfo } from './ReceiptDetailsModalComponents';

interface ReceiptDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ModalReceipt | null;
}

export const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const convertBackendProducts = (backendProducts: BackendProduct[]): ReceiptProduct[] => {
    return backendProducts.map((product, index) => ({
      id: `${receipt?.id}-${index}`,
      name: product.name,
      barcode: product.barcode || undefined,
      quantity: product.quantity,
      unit_price: product.unit_price,
      total_price: product.total_price,
      confidence: product.confidence || 0.7,
      extraction_method: 'ocr_parsing',
      created_at: new Date().toISOString()
    }));
  };

  const fetchReceiptProducts = React.useCallback(async () => {
    if (!receipt) return;
    
    setIsLoading(true);
    
    try {
      const { receiptService } = await import('../../../services/receiptService');
      const fullReceipt = await receiptService.getReceiptById(receipt.id);
      const backendProducts = fullReceipt.products || [];
      const finalProducts = backendProducts.length > 0 ? backendProducts : (receipt.products || []);
      setProducts(finalProducts);
    } catch {
      setProducts(receipt.products || []);
    } finally {
      setIsLoading(false);
    }
  }, [receipt]);

  useEffect(() => {
    if (isOpen && receipt) {
      fetchReceiptProducts();
    }
  }, [isOpen, receipt, fetchReceiptProducts]);

  const handleDownloadPDF = async () => {
    if (!receipt) return;

    try {
      const convertedForPDF = products.length > 0 ? convertBackendProducts(products) : [];
      
      const pdfData: ReceiptPDFData = {
        id: receipt.id,
        companyName: receipt.company_name,
        folioNumber: receipt.folio_number,
        date: receipt.date,
        totalAmount: receipt.total_amount,
        description: receipt.description,
        products: convertedForPDF,
        ocrData: receipt.ocr_data,
        geolocation: receipt.geolocation
      };

      await pdfService.generateReceiptPDF(pdfData);
    } catch {
      // Error generando PDF - manejado silenciosamente
    }
  };

  if (!receipt) return null;

  const convertedProducts = products.length > 0 ? convertBackendProducts(products) : [];

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
                <ReceiptHeader receipt={receipt} onClose={onClose} />

                <div className="max-h-[80vh] overflow-y-auto">
                  <ReceiptInfo receipt={receipt} />

                  <div className="px-6 py-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <span className="ml-2 text-gray-600">Cargando productos...</span>
                      </div>
                    ) : products.length > 0 ? (
                      <ProductList
                        products={convertedProducts}
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
                        <p className="text-gray-500">No se encontraron productos extraídos</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">ID: {receipt.id}</div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
