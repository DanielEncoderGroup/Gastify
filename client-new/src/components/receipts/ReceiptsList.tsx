import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { receiptService } from '../../services/receiptService';
import { Receipt, ReceiptStats } from '../../types/receipt';
// Creamos funciones formatadoras localmente hasta que el módulo sea accesible
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

const ReceiptsList: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const response = await receiptService.getReceipts();
        setReceipts(response.data);
        
        const statsResponse = await receiptService.getReceiptStats();
        setStats(statsResponse.data);
        
        setError(null);
      } catch (err) {
        setError('Error al cargar los recibos. Inténtalo de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptada':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Aceptado
          </span>
        );
      case 'rechazada':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rechazado
          </span>
        );
      case 'en_revision':
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Recibos</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalReceipts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">En Revisión</h3>
            <p className="mt-1 text-3xl font-semibold text-yellow-500">{stats.enRevision}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Aceptados</h3>
            <p className="mt-1 text-3xl font-semibold text-green-500">{stats.aceptadas}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Aprobado</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Mis Recibos</h2>
        <Link
          to="/app/receipts/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Nuevo Recibo
        </Link>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium text-gray-900">No tienes recibos registrados</h3>
          <p className="mt-1 text-gray-500">Comienza agregando tu primer recibo de gastos.</p>
          <Link
            to="/app/receipts/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Agregar Recibo
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white divide-y divide-gray-200 shadow rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Folio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {receipt.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receipt.folioNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(receipt.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(receipt.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(receipt.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/app/receipts/${receipt.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Ver
                    </Link>
                    {receipt.status === 'en_revision' && (
                      <Link
                        to={`/app/receipts/${receipt.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Editar
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReceiptsList;
