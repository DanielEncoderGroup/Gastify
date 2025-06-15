import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskPriority, TaskStatus } from '../../types/project';
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  assignedUserName?: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
  assignedUserName
}) => {
  const { user } = useAuth();
  
  // Registrar información del usuario para depuración
  useEffect(() => {
    console.log('TaskDetail - Usuario actual:', user);
    console.log('TaskDetail - Rol del usuario:', user?.role);
    console.log('TaskDetail - ¿Es admin?', user?.role?.toLowerCase() === 'admin');
  }, [user]);
  const getStatusInfo = (status: string) => {
    switch (status) {
      case TaskStatus.TODO:
        return {
          label: 'Por hacer',
          icon: <ClockIcon className="w-5 h-5 text-gray-500" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
      case TaskStatus.IN_PROGRESS:
        return {
          label: 'En progreso',
          icon: <ArrowPathIcon className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case TaskStatus.IN_REVIEW:
        return {
          label: 'En revisión',
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800'
        };
      case TaskStatus.DONE:
        return {
          label: 'Completado',
          icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800'
        };
      default:
        return {
          label: 'Desconocido',
          icon: <ClockIcon className="w-5 h-5 text-gray-500" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case TaskPriority.LOW:
        return {
          label: 'Baja',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
      case TaskPriority.MEDIUM:
        return {
          label: 'Media',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case TaskPriority.HIGH:
        return {
          label: 'Alta',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800'
        };
      case TaskPriority.URGENT:
        return {
          label: 'Urgente',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      default:
        return {
          label: 'Media',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
    }
  };

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 truncate">{task.title}</h2>
        <div className="flex space-x-2">
          {user?.role?.toLowerCase() === 'admin' && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="text-gray-500 hover:text-blue-600"
                title="Editar tarea"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-gray-500 hover:text-red-600"
                title="Eliminar tarea"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Estado y prioridad */}
        <div className="flex flex-wrap gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.bgColor} ${priorityInfo.textColor}`}>
            <span>{priorityInfo.label}</span>
          </span>
        </div>

        {/* Descripción */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Descripción</h3>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* Metadatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asignado a */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Asignado a</h3>
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-800">
                {assignedUserName || 'No asignado'}
              </span>
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fecha de vencimiento</h3>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-800">
                {formattedDate || 'No establecida'}
              </span>
            </div>
          </div>
        </div>

        {/* Etiquetas */}
        {task.labels && task.labels.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fechas de creación/actualización */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
          <div>Creado: {new Date(task.createdAt).toLocaleString()}</div>
          <div>Última actualización: {new Date(task.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
