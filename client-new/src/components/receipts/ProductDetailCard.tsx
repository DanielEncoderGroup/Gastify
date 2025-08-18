import React from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { ReceiptProduct } from '../../types';

interface ProductDetailCardProps {
  product: ReceiptProduct;
  index: number;
}

const ProductDetailCard: React.FC<ProductDetailCardProps> = ({ product, index }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    return 'Baja';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header con índice y confianza */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          <span className="text-gray-400">📦</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(product.confidence || 0)}`}>
          {getConfidenceText(product.confidence || 0)} ({Math.round((product.confidence || 0) * 100)}%)
        </div>
      </div>

      {/* Nombre del producto */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-sm leading-tight">
          {product.name}
        </h3>
        {product.barcode && (
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-gray-400">🏷️</span>
            <span className="text-xs text-gray-500 font-mono">{product.barcode}</span>
          </div>
        )}
      </div>

      {/* Detalles de cantidad y precios */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cantidad */}
        <div className="space-y-1">
          <div className="text-xs text-gray-500 font-medium">Cantidad</div>
          <div className="text-sm font-medium text-gray-900">
            {product.quantity || 1} {product.unit ? `${product.unit}` : 'ud.'}
          </div>
        </div>

        {/* Precio unitario */}
        {product.unit_price && product.unit_price > 0 ? (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 font-medium">Precio Unit.</div>
            <div className="text-sm font-medium text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-3 w-3 text-gray-400 mr-1" />
              {product.unit_price.toLocaleString('es-CL')}
            </div>
          </div>
        ) : null}

        {/* Precio total */}
        <div className={`space-y-1 ${!product.unit_price || product.unit_price === 0 ? 'col-span-2' : 'col-span-2'}`}>
          <div className="text-xs text-gray-500 font-medium">Precio Total</div>
          <div className="text-base font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
            {product.total_price?.toLocaleString('es-CL') || '0'}
          </div>
        </div>
      </div>

      {/* Descuento si existe */}
      {product.discount && product.discount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Descuento aplicado</span>
            <span className="text-xs font-medium text-red-600">
              -${product.discount.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      )}

      {/* SKU si existe */}
      {product.sku && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            SKU: <span className="font-mono">{product.sku}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailCard;
