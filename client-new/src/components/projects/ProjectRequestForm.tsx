import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Icon } from '../ui';
import { 
  RequestCreate, 
  RequestUpdate, 
  RequestDetail, 
  ProjectType, 
  ProjectTypeLabels, 
  ProjectPriority, 
  PriorityLabels 
} from '../../types/request';
import { requestService } from '../../services/requestService';

// Esquema de validación específico para proyectos
const ProjectRequestSchema = Yup.object().shape({
  title: Yup.string()
    .required('El título del proyecto es obligatorio')
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder los 100 caracteres'),
  description: Yup.string()
    .required('La descripción del proyecto es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder los 2000 caracteres'),
  projectType: Yup.string()
    .required('El tipo de proyecto es obligatorio'),
  // Campos opcionales con validación básica
  priority: Yup.string(),
  budget: Yup.string(),
  timeframe: Yup.string(),
  businessGoals: Yup.string(),
  targetAudience: Yup.string(),
  additionalInfo: Yup.string()
});

interface ProjectRequestFormProps {
  requestId?: string;
  initialData?: RequestDetail | null;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

/**
 * Formulario avanzado para solicitudes de proyectos informáticos
 * Soporta creación y edición de solicitudes con campos específicos para proyectos tecnológicos
 */
const ProjectRequestForm: React.FC<ProjectRequestFormProps> = ({ 
  requestId, 
  initialData, 
  onSaved, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const isEditMode = !!requestId;

  // Validación manual complementaria
  const validateProjectData = (values: any) => {
    const errors: Record<string, string> = {};
    
    // Validar presupuesto si existe
    if (values.budget !== undefined) {
      const num = parseFloat(values.budget.toString());
      if (isNaN(num)) {
        errors.budget = 'El presupuesto debe ser un número válido';
      } else if (num < 0) {
        errors.budget = 'El presupuesto no puede ser negativo';
      }
    }
    
    // Validaciones específicas para proyectos informáticos
    if (values.businessGoals && values.businessGoals.length < 10) {
      errors.businessGoals = 'Los objetivos de negocio deben ser más detallados';
    }
    
    return errors;
  };

  // Envío del formulario
  const handleSubmit = async (values: any) => {
    // Validar manualmente
    const validationErrors = validateProjectData(values);
    if (Object.keys(validationErrors).length > 0) {
      // Mostrar errores
      for (const [field, message] of Object.entries(validationErrors)) {
        toast.error(message);
      }
      return;
    }
    
    // Formatear datos para envío
    const requestData = {
      ...values,
      // Asegurar que los campos numéricos se envíen como números
      budget: values.budget ? parseFloat(values.budget.toString()) : undefined
    };

    try {
      setSaving(true);
      
      if (isEditMode && requestId) {
        // Actualizar solicitud existente
        await requestService.update(requestId, requestData as RequestUpdate);
        toast.success('Proyecto actualizado correctamente');
        
        if (onSaved) {
          onSaved(requestId);
        } else {
          navigate(`/app/requests/${requestId}`);
        }
      } else {
        // Crear nueva solicitud de proyecto
        const response = await requestService.create(requestData);
        toast.success('Solicitud de proyecto enviada correctamente');
        
        if (response.requestId) {
          if (onSaved) {
            onSaved(response.requestId);
          } else {
            navigate(`/app/requests/${response.requestId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error al guardar la solicitud de proyecto:', error);
      toast.error('Error al enviar la solicitud de proyecto');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar y volver
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(isEditMode && requestId ? `/app/requests/${requestId}` : '/app/requests');
    }
  };

  // Valores iniciales para el formulario
  const initialValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    projectType: initialData?.projectType || ProjectType.WEB_APP,
    priority: initialData?.priority || ProjectPriority.MEDIUM,
    budget: initialData?.budget ? initialData.budget.toString() : '',
    timeframe: initialData?.timeframe || '',
    businessGoals: initialData?.businessGoals || '',
    targetAudience: initialData?.targetAudience || '',
    additionalInfo: initialData?.additionalInfo || '',
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {isEditMode ? 'Editar Solicitud de Proyecto' : 'Nueva Solicitud de Proyecto'}
        </h3>
        
        <Formik
          initialValues={initialValues}
          validationSchema={ProjectRequestSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ handleSubmit: formikSubmit }) => (
            <Form className="space-y-6" onSubmit={formikSubmit}>
              {/* Sección de información básica */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-base font-medium text-gray-700 mb-3">Información Básica</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Título del Proyecto *
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="title"
                        id="title"
                        placeholder="Nombre descriptivo para el proyecto"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <ErrorMessage name="title" component="div" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción del Proyecto *
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="description"
                        id="description"
                        rows={4}
                        placeholder="Describe el proyecto y sus objetivos principales"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
                        Tipo de Proyecto *
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          name="projectType"
                          id="projectType"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          {Object.entries(ProjectTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="projectType" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Prioridad
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          name="priority"
                          id="priority"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          {Object.entries(PriorityLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                        Presupuesto Estimado
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <Field
                          type="number"
                          name="budget"
                          id="budget"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                        <ErrorMessage name="budget" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                        Plazo Deseado
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="timeframe"
                          id="timeframe"
                          placeholder="Ej: 3 meses, antes de diciembre, etc."
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de objetivos y público objetivo */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-base font-medium text-gray-700 mb-3">Objetivos y Público Objetivo</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="businessGoals" className="block text-sm font-medium text-gray-700">
                      Objetivos del Proyecto
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="businessGoals"
                        id="businessGoals"
                        rows={3}
                        placeholder="¿Qué objetivos busca lograr con este proyecto?"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                      Público Objetivo
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="targetAudience"
                        id="targetAudience"
                        rows={2}
                        placeholder="¿Quiénes serán los usuarios finales del proyecto?"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de información adicional */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-base font-medium text-gray-700 mb-3">Información Adicional</h4>
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                    Notas Adicionales
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      name="additionalInfo"
                      id="additionalInfo"
                      rows={3}
                      placeholder="Cualquier otra información que considere relevante para su proyecto"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : isEditMode ? 'Actualizar Proyecto' : 'Enviar Solicitud'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ProjectRequestForm;
