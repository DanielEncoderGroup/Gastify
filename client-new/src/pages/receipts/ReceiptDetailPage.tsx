import React from 'react';
import ReceiptDetail from '../../components/receipts/ReceiptDetail';

const ReceiptDetailPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Detalle del Gasto</h1>
      <ReceiptDetail />
    </div>
  );
};

export default ReceiptDetailPage;
