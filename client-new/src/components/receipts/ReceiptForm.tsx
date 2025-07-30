import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { receiptService } from '../../services/receiptService';
import { Receipt, ReceiptCreate, ReceiptUpdate } from '../../types/receipt';
import toast from 'react-hot-toast';

interface ReceiptFormProps {
  initialValues?: Receipt;
  isEditing?: boolean;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({ initialValues, isEditing = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.imageUrl || null);
  const { id } = useParams<{ id: string }>();

  // Schema de validación usando Yup
  const validationSchema = Yup.object({
    companyName: Yup.string()
      .required('El nombre de la empresa es obligatorio')
      .max(100, 'El nombre de la empresa no puede exceder los 100 caracteres'),
    folioNumber: Yup.string()
      .required('El número de folio es obligatorio')
      .max(50, 'El número de folio no puede exceder los 50 caracteres'),
    date: Yup.date()
      .required('La fecha es obligatoria')
      .max(new Date(), 'La fecha no puede ser en el futuro'),
    description: Yup.string()
      .required('La descripción es obligatoria')
      .max(500, 'La descripción no puede exceder los 500 caracteres'),
    totalAmount: Yup.string()
      .required('El monto total es requerido')
      .matches(/^[1-9]\d*(\.\d+)?$/, 'El monto debe ser un número positivo'),
  });

  // Configuración inicial del formulario
  const formik = useFormik({
    initialValues: initialValues ? {
      companyName: initialValues.companyName,
      folioNumber: initialValues.folioNumber,
      date: initialValues.date.substring(0, 10), // Formato YYYY-MM-DD para input date
      description: initialValues.description,
      totalAmount: initialValues.totalAmount,
      image: undefined as File | undefined,
    } : {
      companyName: '',
      folioNumber: '',
      date: new Date().toISOString().substring(0, 10), // Fecha actual en formato YYYY-MM-DD
      description: '',
      totalAmount: 0,
      image: undefined as File | undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        if (isEditing && id) {
          // Actualizar recibo existente
          const updateData: ReceiptUpdate = {
            companyName: values.companyName,
            folioNumber: values.folioNumber,
            date: new Date(values.date).toISOString(),
            description: values.description,
            totalAmount: values.totalAmount,
          };
          
          await receiptService.updateReceipt(id, updateData);
          toast.success('Recibo actualizado correctamente');
        } else {
          // Crear nuevo recibo
          const receiptData: ReceiptCreate = {
            companyName: values.companyName,
            folioNumber: values.folioNumber,
            date: new Date(values.date).toISOString(),
            description: values.description,
            totalAmount: values.totalAmount,
            image: values.image,
          };
          
          await receiptService.createReceipt(receiptData);
          toast.success('Recibo creado correctamente');
        }
        
        // Redireccionar a la lista de recibos
        navigate('/app/receipts');
      } catch (error) {
        console.error('Error:', error);
        toast.error(isEditing 
          ? 'Error al actualizar el recibo. Inténtalo de nuevo.' 
          : 'Error al crear el recibo. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Manejar la carga de imágenes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      formik.setFieldValue('image', file);
      
      // Crear URL para previsualización de imagen
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Editar Recibo' : 'Nuevo Recibo'}
      </h2>
      
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre de la empresa */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Empresa
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              className={`mt-1 block w-full px-3 py-2 border ${
                formik.touched.companyName && formik.errors.companyName
                  ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
              } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.companyName}
            />
            {formik.touched.companyName && formik.errors.companyName ? (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.companyName)}</p>
            ) : null}
          </div>

          {/* Número de Folio */}
          <div>
            <label htmlFor="folioNumber" className="block text-sm font-medium text-gray-700">
              Número de Folio
            </label>
            <input
              type="text"
              id="folioNumber"
              name="folioNumber"
              className={`mt-1 block w-full px-3 py-2 border ${
                formik.touched.folioNumber && formik.errors.folioNumber
                  ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
              } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.folioNumber}
            />
            {formik.touched.folioNumber && formik.errors.folioNumber ? (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.folioNumber)}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              name="date"
              className={`mt-1 block w-full px-3 py-2 border ${
                formik.touched.date && formik.errors.date
                  ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
              } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.date}
              max={new Date().toISOString().substring(0, 10)}
            />
            {formik.touched.date && formik.errors.date ? (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.date)}</p>
            ) : null}
          </div>

          {/* Monto Total */}
          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
              Monto Total
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                className={`block w-full pl-7 pr-12 py-2 border ${
                  formik.touched.totalAmount && formik.errors.totalAmount
                    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.totalAmount}
                step="0.01"
                min="0"
              />
            </div>
            {formik.touched.totalAmount && formik.errors.totalAmount ? (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.totalAmount)}</p>
            ) : null}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className={`mt-1 block w-full px-3 py-2 border ${
              formik.touched.description && formik.errors.description
                ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            } rounded-md shadow-sm focus:outline-none sm:text-sm`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description}
          />
          {formik.touched.description && formik.errors.description ? (
            <p className="mt-2 text-sm text-red-600">{String(formik.errors.description)}</p>
          ) : null}
        </div>

        {/* Carga de imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Comprobante (Imagen)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <div className="mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Vista previa del comprobante" 
                    className="mx-auto h-32 object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      formik.setFieldValue('image', undefined);
                    }}
                    className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Eliminar imagen
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Sube un archivo</span>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        className="sr-only"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/receipts')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              <>{isEditing ? 'Actualizar Recibo' : 'Guardar Recibo'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptForm;
