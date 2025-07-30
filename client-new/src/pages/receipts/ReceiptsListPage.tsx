import React from 'react';
import ReceiptsList from '../../components/receipts/ReceiptsList';

const ReceiptsListPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Gastos</h1>
      <ReceiptsList />
    </div>
  );
};

export default ReceiptsListPage;
