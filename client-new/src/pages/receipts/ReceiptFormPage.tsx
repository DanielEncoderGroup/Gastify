import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReceiptForm from '../../components/receipts/ReceiptForm';
import { receiptService } from '../../services/receiptService';
import { Receipt } from '../../types/receipt';
import toast from 'react-hot-toast';

const ReceiptFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!id;

  useEffect(() => {
    // Si hay un ID, estamos editando un recibo existente
    // y necesitamos cargar sus datos
    if (id) {
      const fetchReceipt = async () => {
        try {
          setLoading(true);
          const response = await receiptService.getReceiptById(id);
          setReceipt(response.data);
          setError(null);
        } catch (err) {
          setError('Error al cargar el recibo para editar. Inténtalo de nuevo.');
          toast.error('No se pudo cargar el recibo para editar');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchReceipt();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
      </h1>
      <ReceiptForm initialValues={receipt} isEditing={isEditing} />
    </div>
  );
};

export default ReceiptFormPage;
