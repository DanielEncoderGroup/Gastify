import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

// Componente temporal para la lista de recibos
const ReceiptsListPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const mockReceipts = [
      { id: 1, vendor: 'Restaurante El Gourmet', amount: '235.50', date: '2025-07-15', category: 'Comida', status: 'approved' },
      { id: 2, vendor: 'Hotel Continental', amount: '890.00', date: '2025-07-10', category: 'Alojamiento', status: 'pending' },
      { id: 3, vendor: 'Taxi Ciudad', amount: '45.75', date: '2025-07-12', category: 'Transporte', status: 'approved' },
      { id: 4, vendor: 'Papelería Moderna', amount: '127.80', date: '2025-07-08', category: 'Material Oficina', status: 'rejected' },
    ];

    setTimeout(() => {
      setReceipts(mockReceipts);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Recibos y Gastos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Listado de todos tus recibos y gastos procesados por la IA de Gastify.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/app/receipts/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Icon name="PlusIcon" className="mr-2 h-4 w-4" />
            Nuevo Recibo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Proveedor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Importe
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fecha
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Categoría
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Estado
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {receipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {receipt.vendor}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${receipt.amount}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(receipt.date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{receipt.category}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              receipt.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : receipt.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {receipt.status === 'approved'
                              ? 'Aprobado'
                              : receipt.status === 'pending'
                              ? 'Pendiente'
                              : 'Rechazado'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/app/receipts/${receipt.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Ver<span className="sr-only">, {receipt.vendor}</span>
                          </Link>
                          <Link
                            to={`/app/receipts/${receipt.id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Editar<span className="sr-only">, {receipt.vendor}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsListPage;
