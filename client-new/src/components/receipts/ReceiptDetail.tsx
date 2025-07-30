import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { receiptService } from '../../services/receiptService';
import { Receipt } from '../../types/receipt';
import toast from 'react-hot-toast';

// Funciones de formateo locales
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  
  // Determinamos si el usuario es administrador basado en su rol
  const isAdmin = auth.user?.role === 'admin';
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await receiptService.getReceiptById(id);
        setReceipt(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el recibo. Verifica que exista o inténtalo de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      setLoading(true);
      await receiptService.deleteReceipt(id);
      toast.success('Recibo eliminado correctamente');
      navigate('/app/receipts');
    } catch (err) {
      toast.error('Error al eliminar el recibo');
      console.error(err);
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'aceptada' | 'rechazada' | 'en_revision') => {
    if (!id) return;

    try {
      setLoading(true);
      await receiptService.updateReceiptStatus(id, { status });
      const response = await receiptService.getReceiptById(id);
      setReceipt(response.data);
      toast.success(`Recibo marcado como ${status === 'aceptada' ? 'aceptado' : status === 'rechazada' ? 'rechazado' : 'en revisión'}`);
    } catch (err) {
      toast.error('Error al cambiar el estado del recibo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptada':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            Aceptado
          </span>
        );
      case 'rechazada':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
            Rechazado
          </span>
        );
      case 'en_revision':
      default:
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
            En revisión
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error || 'Recibo no encontrado'}</span>
        <div className="mt-4">
          <Link
            to="/app/receipts"
            className="text-sm font-medium text-red-700 hover:text-red-600"
          >
            ← Volver a la lista de recibos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Encabezado */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Recibo #{receipt.folioNumber}
          </h1>
          <p className="mt-1 text-gray-500">
            Creado el {formatDate(receipt.createdAt)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(receipt.status)}
        </div>
      </div>

      {/* Contenido del recibo */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Detalles</h2>
            <dl className="mt-2 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                <dd className="text-sm text-gray-900">{receipt.companyName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                <dd className="text-sm text-gray-900">{new Date(receipt.date).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Monto Total</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(receipt.totalAmount)}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-gray-900">Descripción</h2>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {receipt.description}
              </p>
            </div>
          </div>
        </div>

        {/* Imagen del comprobante */}
        {receipt.imageUrl && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Comprobante</h2>
            <div className="max-w-md mx-auto">
              <img
                src={receipt.imageUrl}
                alt="Comprobante del gasto"
                className="rounded-lg shadow-md object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link
            to="/app/receipts"
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            ← Volver a la lista de recibos
          </Link>
          
          <div className="flex space-x-3">
            {/* Solo mostrar botón de editar si está en revisión y es el creador o admin */}
            {receipt.status === 'en_revision' && (
              <Link
                to={`/app/receipts/${receipt.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Editar
              </Link>
            )}

            {/* Botón para eliminar (solo para el creador o admin) */}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Eliminar
            </button>

            {/* Botones de cambio de estado (solo para admin) */}
            {isAdmin && (
              <div className="flex space-x-2">
                {receipt.status !== 'aceptada' && (
                  <button
                    onClick={() => handleStatusChange('aceptada')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Aprobar
                  </button>
                )}
                {receipt.status !== 'rechazada' && (
                  <button
                    onClick={() => handleStatusChange('rechazada')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Rechazar
                  </button>
                )}
                {receipt.status !== 'en_revision' && (
                  <button
                    onClick={() => handleStatusChange('en_revision')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Revisión
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {deleteConfirmOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar recibo
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar este recibo? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDetail;
