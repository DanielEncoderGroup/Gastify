import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Icon from '../../components/ui/Icon';

// Componente para creación/edición de recibos
const ReceiptFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(!!id);
  const isEditing = !!id;

  // Validación del formulario
  const validationSchema = Yup.object({
    vendor: Yup.string().required('El nombre del proveedor es obligatorio'),
    amount: Yup.number().positive('El importe debe ser positivo').required('El importe es obligatorio'),
    date: Yup.date().required('La fecha es obligatoria'),
    category: Yup.string().required('La categoría es obligatoria'),
    description: Yup.string().required('La descripción es obligatoria'),
    paymentMethod: Yup.string().required('El método de pago es obligatorio'),
  });

  // Valores iniciales del formulario
  const initialValues = {
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    status: 'pending',
    description: '',
    location: '',
    paymentMethod: '',
    notes: '',
  };

  // Simular carga de datos si estamos editando
  useEffect(() => {
    if (isEditing) {
      // Simulación de carga de datos
      setTimeout(() => {
        const mockReceipt = {
          id: parseInt(id || '0', 10),
          vendor: 'Restaurante El Gourmet',
          amount: '235.50',
          date: '2025-07-15',
          category: 'Comida',
          status: 'approved',
          description: 'Cena con cliente para discusión de proyecto',
          location: 'Madrid, España',
          paymentMethod: 'Tarjeta Corporativa',
          notes: 'Cliente quedó satisfecho con la presentación del producto. Se cerró acuerdo para fase 2.',
        };

        setReceipt(mockReceipt);
        setLoading(false);
      }, 800);
    }
  }, [id, isEditing]);

  // Categorías disponibles
  const categories = [
    'Comida',
    'Alojamiento',
    'Transporte',
    'Material Oficina',
    'Eventos',
    'Suscripciones',
    'Software',
    'Formación',
    'Marketing',
    'Otros',
  ];

  // Métodos de pago disponibles
  const paymentMethods = [
    'Efectivo',
    'Tarjeta Corporativa',
    'Tarjeta Personal',
    'Transferencia Bancaria',
    'PayPal',
    'Otros',
  ];

  // Estados de aprobación disponibles
  const statuses = [
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  ];

  // Manejar el envío del formulario
  const handleSubmit = (values: any, { setSubmitting }: any) => {
    // Simular envío de datos
    setTimeout(() => {
      console.log('Enviando valores:', values);
      toast.success(isEditing ? 'Recibo actualizado correctamente' : 'Recibo creado correctamente');
      setSubmitting(false);
      navigate('/app/receipts');
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isEditing ? 'Editar recibo' : 'Nuevo recibo'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? 'Actualiza los detalles de este recibo'
                : 'Introduce la información del nuevo recibo'}
            </p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <Formik
              initialValues={receipt || initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-6">
                  {/* Sección principal */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Proveedor */}
                    <div className="sm:col-span-3">
                      <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                        Proveedor
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <Field
                          type="text"
                          name="vendor"
                          id="vendor"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Nombre del proveedor"
                        />
                      </div>
                      <ErrorMessage name="vendor" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Importe */}
                    <div className="sm:col-span-3">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Importe
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <Field
                          type="number"
                          name="amount"
                          id="amount"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      <ErrorMessage name="amount" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Fecha */}
                    <div className="sm:col-span-3">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Fecha
                      </label>
                      <div className="mt-1">
                        <Field
                          type="date"
                          name="date"
                          id="date"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <ErrorMessage name="date" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Categoría */}
                    <div className="sm:col-span-3">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Categoría
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          id="category"
                          name="category"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Selecciona una categoría</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Field>
                      </div>
                      <ErrorMessage name="category" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Estado (solo administradores) */}
                    <div className="sm:col-span-3">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          id="status"
                          name="status"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </Field>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="sm:col-span-3">
                      <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                        Método de pago
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          id="paymentMethod"
                          name="paymentMethod"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Selecciona un método de pago</option>
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </Field>
                      </div>
                      <ErrorMessage name="paymentMethod" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <div className="mt-1">
                        <Field
                          as="textarea"
                          id="description"
                          name="description"
                          rows={3}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Breve descripción del gasto"
                        />
                      </div>
                      <ErrorMessage name="description" component="p" className="mt-2 text-sm text-red-600" />
                    </div>

                    {/* Ubicación */}
                    <div className="sm:col-span-6">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Ubicación
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="location"
                          id="location"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ciudad, País"
                        />
                      </div>
                    </div>

                    {/* Notas adicionales */}
                    <div className="sm:col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas adicionales
                      </label>
                      <div className="mt-1">
                        <Field
                          as="textarea"
                          id="notes"
                          name="notes"
                          rows={4}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Información adicional relevante para este gasto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subida de imagen - simulada */}
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Imagen del recibo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Icon name="PhotoIcon" className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Sube un archivo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={() => {
                                // Simulación - no hace nada realmente
                                toast.success('Archivo seleccionado');
                              }}
                            />
                          </label>
                          <p className="pl-1">o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                    <Link
                      to={isEditing ? `/app/receipts/${id}` : '/app/receipts'}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancelar
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isEditing ? 'Actualizando...' : 'Guardando...'}
                        </>
                      ) : isEditing ? (
                        'Actualizar recibo'
                      ) : (
                        'Crear recibo'
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptFormPage;
