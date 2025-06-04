import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  CubeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  LightBulbIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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

// Esquema de validación
const ProjectRequestSchema = Yup.object().shape({
  title: Yup.string()
    .required('El título del proyecto es obligatorio')
    .min(5, 'Mínimo 5 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  description: Yup.string()
    .required('La descripción del proyecto es obligatoria')
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  projectType: Yup.string().required('El tipo de proyecto es obligatorio'),
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

// Componente ModernInput
const ModernInput: React.FC<{
  name: string;
  type?: string;
  placeholder?: string;
  icon: React.ReactNode;
  required?: boolean;
  rows?: number;
  as?: string;
  children?: React.ReactNode;
  maxLength?: number;
}> = ({ name, type = "text", placeholder, icon, required = false, rows, as, children, maxLength }) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');

  return (
    <div className="relative group">
      <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 text-gray-400 group-focus-within:text-blue-600">
          {icon}
        </div>
        <Field name={name}>
          {({ field, meta }: any) => (
            <>
              {as === 'textarea' ? (
                <textarea
                  {...field}
                  rows={rows}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue(e.target.value);
                  }}
                  className={`
                    w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white/70 backdrop-blur-sm
                    transition-all duration-200 focus:outline-none
                    ${meta.error && meta.touched
                      ? 'border-red-300 bg-red-50'
                      : focused
                        ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
                        : 'border-gray-200'}
                    hover:bg-white/90 hover:border-gray-300
                  `}
                />
              ) : as === 'select' ? (
                <select
                  {...field}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className={`
                    w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white/70 backdrop-blur-sm
                    transition-all duration-200 focus:outline-none
                    ${meta.error && meta.touched
                      ? 'border-red-300 bg-red-50'
                      : focused
                        ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
                        : 'border-gray-200'}
                    hover:bg-white/90 hover:border-gray-300
                  `}
                >
                  {children}
                </select>
              ) : (
                <input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue(e.target.value);
                  }}
                  className={`
                    w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white/70 backdrop-blur-sm
                    transition-all duration-200 focus:outline-none
                    ${meta.error && meta.touched
                      ? 'border-red-300 bg-red-50'
                      : focused
                        ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
                        : 'border-gray-200'}
                    hover:bg-white/90 hover:border-gray-300
                  `}
                />
              )}
              {/* Contador */}
              {maxLength && as === 'textarea' && (
                <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {value.length}/{maxLength}
                </div>
              )}
              {/* Requerido */}
              {required && !meta.error && (
                <div className="absolute top-2 right-3">
                  <span className="w-2 h-2 bg-red-400 rounded-full inline-block animate-pulse"></span>
                </div>
              )}
            </>
          )}
        </Field>
      </div>
      {/* Mensaje de error */}
      <ErrorMessage name={name}>
        {(msg: string) => (
          <div className="flex items-center mt-2 text-sm text-red-600">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            {msg}
          </div>
        )}
      </ErrorMessage>
    </div>
  );
};

// Sección de formulario con estilo moderno
const FormSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient?: string;
}> = ({ title, icon, children, gradient = "from-blue-50 to-indigo-50" }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 border border-white/20 shadow-md hover:shadow-xl
      bg-gradient-to-br ${gradient}
      backdrop-blur-sm transition-transform duration-300 hover:scale-[1.01]
    `}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-xl"></div>
      <div className="relative z-10">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-white/80 rounded-xl mr-3 shadow-sm">
            <div className="w-5 h-5 text-blue-600">{icon}</div>
          </div>
          <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        </div>
        {children}
      </div>
    </div>
  );
};

// Formulario principal
const ProjectRequestForm: React.FC<ProjectRequestFormProps> = ({
  requestId,
  initialData,
  onSaved,
  onCancel
}) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const isEditMode = !!requestId;

  // Validación adicional
  const validateProjectData = (values: any) => {
    const errors: Record<string, string> = {};
    if (values.budget !== undefined && values.budget !== '') {
      const num = parseFloat(values.budget.toString());
      if (isNaN(num)) errors.budget = 'Debe ser un número válido';
      else if (num < 0) errors.budget = 'No puede ser negativo';
    }
    if (values.businessGoals && values.businessGoals.length > 0 && values.businessGoals.length < 10) {
      errors.businessGoals = 'Describe mejor tus objetivos';
    }
    return errors;
  };

  // Submit
  const handleSubmit = async (values: any) => {
    const validationErrors = validateProjectData(values);
    if (Object.keys(validationErrors).length > 0) {
      for (const [field, message] of Object.entries(validationErrors)) {
        toast.error(message);
      }
      return;
    }

    const requestData = {
      ...values,
      budget: values.budget ? parseFloat(values.budget.toString()) : undefined
    };

    try {
      setSaving(true);
      if (isEditMode && requestId) {
        await requestService.update(requestId, requestData as RequestUpdate);
        toast.success('Proyecto actualizado correctamente');
        if (onSaved) onSaved(requestId);
        else navigate(`/app/requests/${requestId}`);
      } else {
        const response = await requestService.create(requestData);
        toast.success('Solicitud enviada correctamente');
        if (response.requestId) {
          if (onSaved) onSaved(response.requestId);
          else navigate(`/app/requests/${response.requestId}`);
        }
      }
    } catch (error) {
      console.error('Error al guardar la solicitud:', error);
      toast.error('Hubo un problema al enviar tu solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(isEditMode && requestId ? `/app/requests/${requestId}` : '/app/requests');
  };

  const initialValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    projectType: initialData?.projectType || ProjectType.WEB_APP,
    priority: initialData?.priority || ProjectPriority.MEDIUM,
    budget: initialData?.budget ? initialData.budget.toString() : '',
    timeframe: initialData?.timeframe || '',
    businessGoals: initialData?.businessGoals || '',
    targetAudience: initialData?.targetAudience || '',
    additionalInfo: initialData?.additionalInfo || ''
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 mb-2">
            {isEditMode ? 'Editar Solicitud' : 'Nueva Solicitud'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Completa los detalles de tu proyecto. Los campos marcados son obligatorios.
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={ProjectRequestSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ handleSubmit: formikSubmit }) => (
            <Form className="space-y-8" onSubmit={formikSubmit}>
              {/* Información Básica */}
              <FormSection title="Información Básica" icon={<DocumentTextIcon />} gradient="from-blue-50 to-cyan-50">
                <div className="space-y-6">
                  <ModernInput name="title" placeholder="Nombre descriptivo" icon={<DocumentTextIcon />} required maxLength={100} />
                  <ModernInput name="description" as="textarea" rows={4} placeholder="Descripción del proyecto" icon={<DocumentTextIcon />} required maxLength={2000} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ModernInput name="projectType" as="select" icon={<CubeIcon />} required>
                      {Object.entries(ProjectTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </ModernInput>
                    <ModernInput name="priority" as="select" icon={<ExclamationTriangleIcon />}>
                      {Object.entries(PriorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </ModernInput>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ModernInput name="budget" type="number" placeholder="Ej: 50000" icon={<CurrencyDollarIcon />} />
                    <ModernInput name="timeframe" placeholder="Ej: 3 meses" icon={<ClockIcon />} />
                  </div>
                </div>
              </FormSection>

              {/* Objetivos y Público */}
              <FormSection title="Objetivos y Público Objetivo" icon={<LightBulbIcon />} gradient="from-emerald-50 to-teal-50">
                <div className="space-y-6">
                  <ModernInput name="businessGoals" as="textarea" rows={3} placeholder="¿Qué quieres lograr?" icon={<LightBulbIcon />} />
                  <ModernInput name="targetAudience" as="textarea" rows={2} placeholder="¿Quién usará el producto?" icon={<UserGroupIcon />} />
                </div>
              </FormSection>

              {/* Información Adicional */}
              <FormSection title="Información Adicional" icon={<InformationCircleIcon />} gradient="from-purple-50 to-pink-50">
                <ModernInput name="additionalInfo" as="textarea" rows={3} placeholder="Notas adicionales..." icon={<InformationCircleIcon />} />
              </FormSection>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-700 font-medium bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 hover:shadow transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      {isEditMode ? 'Actualizar' : 'Enviar'}
                    </>
                  )}
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