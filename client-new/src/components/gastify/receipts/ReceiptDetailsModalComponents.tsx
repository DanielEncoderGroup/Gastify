import React from 'react';
import { 
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ModalReceipt } from '../../../types/receipt';

interface ReceiptHeaderProps {
  receipt: ModalReceipt;
  onClose: () => void;
}

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({ receipt, onClose }) => (
  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="h-8 w-8 text-white" />
        <div>
          <h3 className="text-xl font-semibold text-white">
            Detalles del Recibo
          </h3>
          <p className="text-emerald-100">
            {receipt.company_name} • Folio {receipt.folio_number}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:bg-emerald-700 rounded-full p-2 transition-colors"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>
  </div>
);

interface ReceiptInfoProps {
  receipt: ModalReceipt;
}

export const ReceiptInfo: React.FC<ReceiptInfoProps> = ({ receipt }) => (
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
              <span className="text-sm font-medium text-gray-700">
                {Math.round(receipt.ocr_data.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ReceiptDescription: React.FC<ReceiptInfoProps> = ({ receipt }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    <div className="flex items-center space-x-2 mb-2">
      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
      <h4 className="font-medium text-gray-900">Descripción</h4>
    </div>
    <p className="text-gray-700 leading-relaxed">{receipt.description}</p>
  </div>
);

export const ReceiptLocation: React.FC<ReceiptInfoProps> = ({ receipt }) => (
  receipt.geolocation ? (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        <MapPinIcon className="h-5 w-5 text-gray-400" />
        <h4 className="font-medium text-gray-900">Ubicación</h4>
      </div>
      <div className="space-y-1">
        {receipt.geolocation.address && (
          <p className="text-gray-700">{receipt.geolocation.address}</p>
        )}
        {receipt.geolocation.city && (
          <p className="text-sm text-gray-500">
            {receipt.geolocation.city}{receipt.geolocation.region && `, ${receipt.geolocation.region}`}
          </p>
        )}
      </div>
    </div>
  ) : null
);
