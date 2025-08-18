import React from 'react';
import { 
  CurrencyDollarIcon, 
  CalculatorIcon, 
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ReceiptTransaction, ReceiptLocation } from '../../types';

interface TransactionSummaryProps {
  transaction: ReceiptTransaction;
  location?: ReceiptLocation;
  confidence?: number;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ 
  transaction, 
  location, 
  confidence = 0 
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (conf >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'No especificada';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return 'No especificada';
    return timeStr;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Transacción</h3>
              <p className="text-sm text-gray-500">Datos extraídos automáticamente</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidence)}`}>
            Confianza: {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Información de ubicación */}
        {location && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-gray-400">🏢</span>
              <h4 className="font-medium text-blue-900">Información del Local</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {location.store_name && (
                <div>
                  <span className="text-blue-700 font-medium">Tienda:</span>
                  <span className="ml-2 text-blue-800">{location.store_name}</span>
                </div>
              )}
              {location.address && (
                <div>
                  <span className="text-blue-700 font-medium">Dirección:</span>
                  <span className="ml-2 text-blue-800">{location.address}</span>
                </div>
              )}
              {location.city && (
                <div>
                  <span className="text-blue-700 font-medium">Ciudad:</span>
                  <span className="ml-2 text-blue-800">{location.city}</span>
                </div>
              )}
              {location.receipt_number && (
                <div>
                  <span className="text-blue-700 font-medium">N° Boleta:</span>
                  <span className="ml-2 text-blue-800 font-mono">{location.receipt_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fecha y hora */}
        {(location?.date || location?.time) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ClockIcon className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Fecha y Hora</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-700 font-medium">Fecha:</span>
                <span className="ml-2 text-gray-800">{formatDate(location.date)}</span>
              </div>
              <div>
                <span className="text-gray-700 font-medium">Hora:</span>
                <span className="ml-2 text-gray-800">{formatTime(location.time)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resumen financiero */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Resumen Financiero</h4>
          </div>

          <div className="space-y-3">
            {/* Subtotal */}
            {transaction.subtotal && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-800">{formatCurrency(transaction.subtotal)}</span>
              </div>
            )}

            {/* IVA */}
            {transaction.iva_amount && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">
                  IVA {transaction.iva_rate ? `(${transaction.iva_rate}%)` : ''}:
                </span>
                <span className="font-medium text-gray-800">{formatCurrency(transaction.iva_amount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(transaction.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Artículos */}
          {transaction.total_items && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-emerald-600">🛍️</span>
                <h5 className="font-medium text-indigo-900">Artículos</h5>
              </div>
              <div className="text-2xl font-bold text-indigo-700">
                {transaction.total_items}
              </div>
              <div className="text-sm text-indigo-600">productos vendidos</div>
            </div>
          )}

          {/* Método de pago */}
          {transaction.payment_method && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400">💳</span>
                <h5 className="font-medium text-purple-900">Pago</h5>
              </div>
              <div className="text-lg font-semibold text-purple-700 capitalize">
                {transaction.payment_method}
              </div>
              {transaction.change_amount && transaction.change_amount > 0 && (
                <div className="text-sm text-purple-600 mt-1">
                  Vuelto: {formatCurrency(transaction.change_amount)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;
