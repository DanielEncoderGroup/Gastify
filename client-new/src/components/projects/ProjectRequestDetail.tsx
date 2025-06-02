// src/components/projects/ProjectRequestDetail.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  RequestDetail,
  RequestStatus,
  ProjectType,
  ProjectTypeLabels,
  ProjectPriority,
  PriorityLabels,
  CommentCreate
} from '../../types/request';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services/requestService';
import { toast } from 'react-hot-toast';
import { Icon } from '../ui';
import { Link, useNavigate } from 'react-router-dom'; // <-- Importamos Link y useNavigate

interface ProjectRequestDetailProps {
  request: RequestDetail;
  onRefresh: () => void;
  isAdmin: boolean;
}

/**
 * Componente para mostrar los detalles de una solicitud de proyecto
 * Incluye información detallada, comentarios, archivos y acciones disponibles según el rol
 */
const ProjectRequestDetail: React.FC<ProjectRequestDetailProps> = ({
  request,
  onRefresh,
  isAdmin
}) => {
  const { user } = useAuth();
  const navigate = useNavigate(); // <-- Para volver a lista si se desea
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changing, setChanging] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState<RequestStatus | null>(null);

  // Verificar si es el creador de la solicitud
  const isOwner = user?.id === request.clientId;
  // Verificar si la solicitud está en borrador
  const isDraft = request.status === RequestStatus.DRAFT;
  // Verificar si la solicitud puede ser enviada
  const canSubmit = isOwner && isDraft;
  // Verificar si la solicitud puede ser editada
  const canEdit = isOwner && isDraft;

  // Enviar un comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setSubmittingComment(true);

      const commentData: CommentCreate = {
        content: newComment.trim()
      };

      await requestService.addComment(request.id, commentData);
      setNewComment('');
      toast.success('Comentario añadido correctamente');
      onRefresh();
    } catch (error) {
      console.error('Error al añadir comentario:', error);
      toast.error('Error al añadir el comentario. Inténtelo de nuevo.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Enviar solicitud para revisión
  const handleSubmitRequest = async () => {
    try {
      setChanging(true);
      await requestService.submitRequest(request.id);
      toast.success('Solicitud enviada para revisión');
      onRefresh();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      toast.error('Error al enviar la solicitud. Inténtelo de nuevo.');
    } finally {
      setChanging(false);
    }
  };

  // Cambiar estado de la solicitud (solo admin)
  const handleChangeStatus = async () => {
    if (!newStatus || !statusReason.trim()) {
      toast.error('Debe seleccionar un estado y proporcionar una razón');
      return;
    }

    try {
      setChanging(true);

      await requestService.changeStatus(request.id, {
        status: newStatus,
        reason: statusReason.trim()
      });

      setNewStatus(null);
      setStatusReason('');
      toast.success('Estado actualizado correctamente');
      onRefresh();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar el estado. Inténtelo de nuevo.');
    } finally {
      setChanging(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Renderizar el estado con el color correspondiente
  const renderStatus = (status: RequestStatus, label: string) => {
    const colors = {
      [RequestStatus.DRAFT]: 'gray',
      [RequestStatus.SUBMITTED]: 'yellow',
      [RequestStatus.REQUIREMENTS_ANALYSIS]: 'blue',
      [RequestStatus.PLANNING]: 'indigo',
      [RequestStatus.ESTIMATION]: 'orange',
      [RequestStatus.PROPOSAL_READY]: 'cyan',
      [RequestStatus.APPROVED]: 'emerald',
      [RequestStatus.IN_DEVELOPMENT]: 'teal',
      [RequestStatus.IN_PROCESS]: 'purple',
      [RequestStatus.IN_REVIEW]: 'pink',
      [RequestStatus.COMPLETED]: 'green',
      [RequestStatus.REJECTED]: 'red',
      [RequestStatus.CANCELED]: 'gray'
    };

    const color = (colors as any)[status] || 'gray';

    return (
      <span
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          bg-${color}-100 text-${color}-800
        `}
      >
        {label}
      </span>
    );
  };

  // Renderizar el tipo de proyecto
  const renderProjectType = (type: ProjectType) => {
    // Verificar de manera segura si el tipo existe en ProjectTypeLabels
    const label = Object.prototype.hasOwnProperty.call(ProjectTypeLabels, type)
      ? (ProjectTypeLabels as any)[type]
      : type;

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {label}
      </span>
    );
  };

  // Renderizar la prioridad
  const renderPriority = (priority?: ProjectPriority) => {
    if (!priority) return null;

    const colors: Record<ProjectPriority, string> = {
      [ProjectPriority.LOW]: 'green',
      [ProjectPriority.MEDIUM]: 'yellow',
      [ProjectPriority.HIGH]: 'orange',
      [ProjectPriority.URGENT]: 'red'
    };

    const color = colors[priority] || 'gray';
    const label = (PriorityLabels as any)[priority] || priority;

    return (
      <span
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          bg-${color}-100 text-${color}-800
        `}
      >
        {label}
      </span>
    );
  };

  // Renderizar las etiquetas
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0)
      return <span className="text-gray-500">Sin etiquetas</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Encabezado */}
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {request.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Solicitud #{request.id} - Creada el {formatDate(request.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {renderStatus(request.status, request.statusLabel || '')}
            {request.priority && renderPriority(request.priority)}
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          {/* Tipo de proyecto */}
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Tipo de proyecto</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {renderProjectType(request.projectType)}
            </dd>
          </div>

          {/* Cliente */}
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Cliente</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {request.client?.name} ({request.client?.email})
            </dd>
          </div>

          {/* Descripción */}
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
              {request.description}
            </dd>
          </div>

          {/* Requisitos técnicos */}
          {request.technicalRequirements && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Requisitos técnicos
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.technicalRequirements}
              </dd>
            </div>
          )}

          {/* Objetivos de negocio */}
          {request.businessGoals && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Objetivos de negocio
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.businessGoals}
              </dd>
            </div>
          )}

          {/* Integraciones necesarias */}
          {request.integrationsNeeded && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Integraciones necesarias
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.integrationsNeeded}
              </dd>
            </div>
          )}

          {/* Público objetivo */}
          {request.targetAudience && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Público objetivo
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.targetAudience}
              </dd>
            </div>
          )}

          {/* Información adicional */}
          {request.additionalInfo && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Información adicional
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.additionalInfo}
              </dd>
            </div>
          )}

          {/* Presupuesto */}
          {request.budget !== undefined && (
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Presupuesto estimado
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {typeof request.budget === 'number'
                  ? request.budget.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })
                  : request.budget}
              </dd>
            </div>
          )}

          {/* Plazo */}
          {request.timeframe && (
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Plazo estimado</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.timeframe}</dd>
            </div>
          )}

          {/* Etiquetas */}
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Etiquetas</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {renderTags(request.tags || [])}
            </dd>
          </div>
        </dl>
      </div>

      {/* Acciones */}
      {(canSubmit || canEdit || isAdmin) && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap justify-end space-x-3">
            {canEdit && (
              <Link
                to={`/app/requests/${request.id}/edit`}
                className="
                  inline-flex items-center px-4 py-2 border border-gray-300 rounded-md
                  shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                "
              >
                <Icon name="PencilIcon" className="mr-2 h-4 w-4" />
                Editar
              </Link>
            )}

            {canSubmit && (
              <button
                onClick={handleSubmitRequest}
                disabled={changing}
                className="
                  inline-flex items-center px-4 py-2 border border-transparent rounded-md
                  shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  disabled:opacity-50
                "
              >
                {changing ? (
                  <div className="inline-flex items-center">
                    <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <>
                    <Icon name="PaperAirplaneIcon" className="mr-2 h-4 w-4" />
                    Enviar para revisión
                  </>
                )}
              </button>
            )}

            {isAdmin && (
              <div className="flex items-center space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
                <select
                  value={newStatus || ''}
                  onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                  className="
                    mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    sm:text-sm rounded-md
                  "
                  disabled={changing}
                >
                  <option value="">Seleccionar estado...</option>
                  {Object.entries(RequestStatus).map(([key, value]) => (
                    <option key={key} value={value} disabled={value === request.status}>
                      {RequestStatus[key as keyof typeof RequestStatus]}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Razón del cambio..."
                  className="
                    mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    sm:text-sm rounded-md
                  "
                  disabled={changing}
                />

                <button
                  onClick={handleChangeStatus}
                  disabled={changing || !newStatus || !statusReason.trim()}
                  className="
                    inline-flex items-center px-4 py-2 border border-transparent rounded-md
                    shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    disabled:opacity-50
                  "
                >
                  {changing ? (
                    <div className="inline-flex items-center">
                      <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      Actualizando...
                    </div>
                  ) : (
                    <>
                      <Icon name="ArrowPathIcon" className="mr-2 h-4 w-4" />
                      Actualizar estado
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de cambios de estado */}
      <div className="border-t border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Historial de cambios
          </h3>

          <div className="mt-4 flow-root">
            <ul className="-mb-8">
              {request.statusHistory.map((statusChange, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== request.statusHistory.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <Icon name="ArrowPathIcon" className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {statusChange.fromStatusLabel ? (
                              <>
                                Cambió de{' '}
                                <span className="font-medium text-gray-900">
                                  {statusChange.fromStatusLabel}
                                </span>{' '}
                                a{' '}
                                <span className="font-medium text-gray-900">
                                  {statusChange.toStatusLabel}
                                </span>
                              </>
                            ) : (
                              <>
                                Estado inicial:{' '}
                                <span className="font-medium text-gray-900">
                                  {statusChange.toStatusLabel}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {statusChange.reason}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={statusChange.changedAt}>
                            {formatDate(statusChange.changedAt)}
                          </time>
                          <p className="text-xs text-gray-400">
                            por {statusChange.changedBy?.name || 'Sistema'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comentarios */}
      <div className="border-t border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Comentarios
          </h3>

          {/* Lista de comentarios */}
          <div className="mt-4 space-y-6">
            {request.comments.length === 0 ? (
              <p className="text-sm text-gray-500">No hay comentarios todavía.</p>
            ) : (
              request.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        {comment.user?.firstName?.charAt(0) || '?'}
                        {comment.user?.lastName?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {comment.user?.name || 'Usuario'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulario para nuevo comentario */}
          <div className="mt-6">
            <form onSubmit={handleSubmitComment}>
              <div>
                <label htmlFor="comment" className="sr-only">
                  Añadir comentario
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={3}
                  className="
                    shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500
                    sm:text-sm border border-gray-300 rounded-md
                  "
                  placeholder="Añadir un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submittingComment}
                ></textarea>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="
                    inline-flex items-center px-4 py-2 border border-transparent text-sm
                    font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    disabled:opacity-50
                  "
                >
                  {submittingComment ? (
                    <div className="inline-flex items-center">
                      <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    <>
                      <Icon name="ChatBubbleLeftIcon" className="mr-2 h-4 w-4" />
                      Comentar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* BOTÓN “VOLVER A MIS SOLICITUDES” */}
      <div className="mt-6 px-4 py-4 sm:px-6 bg-gray-50 text-right">
        <button
          onClick={() => navigate('/app/requests')}
          className="
            inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
            text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none
            focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          "
        >
          Volver a Mis Solicitudes
        </button>
      </div>
    </div>
  );
};

export default ProjectRequestDetail;
