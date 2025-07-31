import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

// Componente temporal para visualizar el detalle de un recibo
const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const mockReceipt = {
      id: parseInt(id || '0', 10),
      vendor: 'Restaurante El Gourmet',
      amount: '235.50',
      date: '2025-07-15',
      category: 'Comida',
      status: 'approved',
      description: 'Cena con cliente para discusión de proyecto',
      location: 'Madrid, España',
      receiptUrl: '/assets/images/sample-receipt.jpg',
      items: [
        { description: 'Entrante - Tabla de quesos', amount: '24.50' },
        { description: 'Plato principal - Paella para 2', amount: '58.00' },
        { description: 'Bebidas - Vino Rioja', amount: '32.00' },
        { description: 'Postres variados', amount: '18.00' },
      ],
      tax: '37.68',
      subtotal: '132.50',
      additionalCharges: '65.32',
      paymentMethod: 'Tarjeta Corporativa',
      approvedBy: 'Ana López',
      approvedDate: '2025-07-18',
      notes: 'Cliente quedó satisfecho con la presentación del producto. Se cerró acuerdo para fase 2.',
    };

    setTimeout(() => {
      setReceipt(mockReceipt);
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <Icon name="ExclamationTriangleIcon" className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Recibo no encontrado</h2>
          <p className="mt-1 text-sm text-gray-500">No se pudo encontrar el recibo solicitado.</p>
          <div className="mt-6">
            <Link
              to="/app/receipts"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Encabezado con acciones */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Recibo #{receipt.id} - {receipt.vendor}
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Icon name="CalendarIcon" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {new Date(receipt.date).toLocaleDateString()}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Icon name="CurrencyDollarIcon" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                ${receipt.amount}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Icon name="MapPinIcon" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {receipt.location}
              </div>
              <div className="mt-2 flex items-center text-sm">
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
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              to="/app/receipts"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Icon name="ArrowLeftIcon" className="mr-2 -ml-1 h-5 w-5 text-gray-400" />
              Volver
            </Link>
            <Link
              to={`/app/receipts/${receipt.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Icon name="PencilIcon" className="mr-2 -ml-1 h-5 w-5" />
              Editar
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recibo y detalles */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Información del recibo</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Detalles completos del gasto.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-primary-700">
                  <Icon name="CheckBadgeIcon" className="mr-1.5 h-5 w-5 text-primary-600" />
                  Procesado por IA
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                    <dd className="mt-1 text-sm text-gray-900">{receipt.category}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Método de pago</dt>
                    <dd className="mt-1 text-sm text-gray-900">{receipt.paymentMethod}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Aprobado por</dt>
                    <dd className="mt-1 text-sm text-gray-900">{receipt.approvedBy}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Fecha de aprobación</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(receipt.approvedDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                    <dd className="mt-1 text-sm text-gray-900">{receipt.description}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notas</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{receipt.notes}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Imagen del recibo */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Imagen del recibo</h3>
              </div>
              <div className="border-t border-gray-200 p-4 flex justify-center">
                <div className="rounded-lg overflow-hidden shadow-inner bg-gray-100 p-1">
                  <img
                    src={receipt.receiptUrl}
                    alt="Imagen del recibo"
                    className="max-h-96 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desglose y montos */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Desglose de conceptos</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Detalle de los conceptos detectados por la IA.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Descripción
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Importe
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipt.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen de importes */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Resumen de importes</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">${receipt.subtotal}</dd>
                  </div>
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Impuesto</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">${receipt.tax}</dd>
                  </div>
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Adicionales</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">${receipt.additionalCharges}</dd>
                  </div>
                </dl>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <dt className="text-base font-bold text-gray-900">Total</dt>
                    <dd className="text-2xl font-bold text-primary-700">${receipt.amount}</dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
