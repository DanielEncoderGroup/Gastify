import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Task, TaskPriority, TaskFormData } from '../../types/project';
import { 
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface TaskFormProps {
  task?: Task;
  projectId: string;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
  onCancel: () => void;
  assignableUsers?: { id: string; name: string }[];
  readOnly?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  projectId, 
  onSubmit, 
  onCancel,
  assignableUsers = [],
  readOnly = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValues: TaskFormData = {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || TaskPriority.MEDIUM,
    assignee: task?.assignee || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : ''
  };

  // Esquema de validación simplificado para evitar errores de TypeScript
  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required('El título es obligatorio')
      .max(100, 'El título no puede tener más de 100 caracteres'),
    description: Yup.string()
      .required('La descripción es obligatoria')
      .max(500, 'La descripción no puede tener más de 500 caracteres'),
    priority: Yup.string()
      .required('La prioridad es obligatoria')
      .oneOf(
        Object.values(TaskPriority),
        'La prioridad debe ser válida'
      ),
    // Campos opcionales sin validación adicional
    assignee: Yup.string(),
    dueDate: Yup.string()
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
      } catch (error) {
        console.error('Error al guardar la tarea:', error);
        setIsSubmitting(false);
      }
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {readOnly ? 'Detalles de la tarea' : (task ? 'Editar tarea' : 'Nueva tarea')}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <div className="mt-1 relative">
              <input
                id="title"
                name="title"
                type="text"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                readOnly={readOnly}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${formik.touched.title && formik.errors.title ? 'border-red-300' : ''}
                  ${readOnly ? 'bg-gray-50' : ''}`}
              />
              {formik.touched.title && formik.errors.title && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {formik.touched.title && formik.errors.title && (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.title || '')}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <div className="mt-1 relative">
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                readOnly={readOnly}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${formik.touched.description && formik.errors.description ? 'border-red-300' : ''}
                  ${readOnly ? 'bg-gray-50' : ''}`}
              />
              {formik.touched.description && formik.errors.description && (
                <div className="absolute top-0 right-0 pr-3 pt-3 flex items-start pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {formik.touched.description && formik.errors.description && (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.description || '')}</p>
            )}
          </div>

          {/* Prioridad */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Prioridad
            </label>
            <div className="mt-1">
              <select
                id="priority"
                name="priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={readOnly}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${readOnly ? 'bg-gray-50' : ''}`}
              >
                <option value={TaskPriority.LOW}>Baja</option>
                <option value={TaskPriority.MEDIUM}>Media</option>
                <option value={TaskPriority.HIGH}>Alta</option>
                <option value={TaskPriority.URGENT}>Urgente</option>
              </select>
            </div>
            {formik.touched.priority && formik.errors.priority && (
              <p className="mt-2 text-sm text-red-600">{String(formik.errors.priority || '')}</p>
            )}
          </div>

          {/* Asignado a */}
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
              Asignado a
            </label>
            <div className="mt-1">
              <select
                id="assignee"
                name="assignee"
                value={formik.values.assignee}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={readOnly}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${readOnly ? 'bg-gray-50' : ''}`}
              >
                <option value="">Sin asignar</option>
                {assignableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Fecha de vencimiento
            </label>
            <div className="mt-1">
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formik.values.dueDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                readOnly={readOnly}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${readOnly ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
