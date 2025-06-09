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
import { Link, useNavigate } from 'react-router-dom';
import {
  ComputerDesktopIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  SparklesIcon,
  ArrowLeftIcon,
  InboxArrowDownIcon,
  DocumentMagnifyingGlassIcon,
  CalendarDaysIcon,
  CalculatorIcon,
  PresentationChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  MinusCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import HeaderActions from '../../components/layout/HeaderActions';

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
  const navigate = useNavigate();
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

  // Iconos para cada estado
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.DRAFT:
        return <ClockIcon className="w-5 h-5" />;
      case RequestStatus.SUBMITTED:
        return <InboxArrowDownIcon className="w-5 h-5" />;
      case RequestStatus.REQUIREMENTS_ANALYSIS:
        return <DocumentMagnifyingGlassIcon className="w-5 h-5" />;
      case RequestStatus.PLANNING:
        return <CalendarDaysIcon className="w-5 h-5" />;
      case RequestStatus.ESTIMATION:
        return <CalculatorIcon className="w-5 h-5" />;
      case RequestStatus.PROPOSAL_READY:
        return <PresentationChartBarIcon className="w-5 h-5" />;
      case RequestStatus.APPROVED:
        return <CheckCircleIcon className="w-5 h-5" />;
      case RequestStatus.REJECTED:
        return <XCircleIcon className="w-5 h-5" />;
      case RequestStatus.IN_DEVELOPMENT:
        return <ComputerDesktopIcon className="w-5 h-5" />;
      case RequestStatus.COMPLETED:
        return <FlagIcon className="w-5 h-5" />;
      case RequestStatus.CANCELED:
        return <MinusCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

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
      [RequestStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-200',
      [RequestStatus.SUBMITTED]: 'bg-blue-100 text-blue-800 border-blue-200',
      [RequestStatus.REQUIREMENTS_ANALYSIS]: 'bg-purple-100 text-purple-800 border-purple-200',
      [RequestStatus.PLANNING]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [RequestStatus.ESTIMATION]: 'bg-orange-100 text-orange-800 border-orange-200',
      [RequestStatus.PROPOSAL_READY]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      [RequestStatus.APPROVED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      [RequestStatus.IN_DEVELOPMENT]: 'bg-teal-100 text-teal-800 border-teal-200',
      [RequestStatus.IN_PROCESS]: 'bg-purple-100 text-purple-800 border-purple-200',
      [RequestStatus.IN_REVIEW]: 'bg-pink-100 text-pink-800 border-pink-200',
      [RequestStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
      [RequestStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
      [RequestStatus.CANCELED]: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const colorClass = colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${colorClass} shadow-sm`}>
        <span className="mr-2">{getStatusIcon(status)}</span>
        {label}
      </span>
    );
  };

  // Renderizar el tipo de proyecto
  const renderProjectType = (type: ProjectType) => {
    const label = Object.prototype.hasOwnProperty.call(ProjectTypeLabels, type)
      ? (ProjectTypeLabels as any)[type]
      : type;

    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <ComputerDesktopIcon className="w-4 h-4 mr-2" />
        {label}
      </span>
    );
  };

  // Renderizar la prioridad
  const renderPriority = (priority?: ProjectPriority) => {
    if (!priority) return null;

    const colors: Record<ProjectPriority, string> = {
      [ProjectPriority.LOW]: 'bg-green-100 text-green-800 border-green-200',
      [ProjectPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [ProjectPriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
      [ProjectPriority.URGENT]: 'bg-red-100 text-red-800 border-red-200'
    };

    const colorClass = colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    const label = (PriorityLabels as any)[priority] || priority;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${colorClass} shadow-sm`}>
        <FlagIcon className="w-4 h-4 mr-2" />
        {label}
      </span>
    );
  };

  // Renderizar las etiquetas
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0)
      return <span className="text-gray-500 italic">Sin etiquetas</span>;

    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shadow-sm"
          >
            <TagIcon className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Título y Navegación */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start space-x-4">
                <button
                  onClick={() => navigate('/app/requests')}
                  className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <ArrowLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent break-words">
                    {request.title}
                  </h1>
                  <p className="text-gray-600 mt-1 break-words">
                    Solicitud #{request.id} • Creada el {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Status + Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {renderStatus(request.status, request.statusLabel || '')}
                {request.priority && renderPriority(request.priority)}
              </div>
              <HeaderActions />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Principal - Información del Proyecto */}
            <div className="lg:col-span-2 space-y-8">
              {/* Información Principal */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <DocumentTextIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Información del Proyecto</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de proyecto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Tipo de proyecto</label>
                    <div>{renderProjectType(request.projectType)}</div>
                  </div>

                  {/* Cliente */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{request.client?.name}</span>
                      <span className="text-gray-500">({request.client?.email})</span>
                    </div>
                  </div>

                  {/* Presupuesto */}
                  {request.budget !== undefined && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Presupuesto estimado</label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">
                          {typeof request.budget === 'number'
                            ? request.budget.toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR'
                              })
                            : request.budget}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Plazo */}
                  {request.timeframe && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Plazo estimado</label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <ClockIcon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{request.timeframe}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div className="mt-8 space-y-2">
                  <label className="text-sm font-medium text-gray-600">Descripción</label>
                  <div className="bg-gray-50/80 rounded-xl p-4 text-gray-900 leading-relaxed whitespace-pre-line border border-gray-200">
                    {request.description}
                  </div>
                </div>

                {/* Secciones opcionales */}
                {[
                  { key: 'technicalRequirements', label: 'Requisitos técnicos' },
                  { key: 'businessGoals', label: 'Objetivos de negocio' },
                  { key: 'integrationsNeeded', label: 'Integraciones necesarias' },
                  { key: 'targetAudience', label: 'Público objetivo' },
                  { key: 'additionalInfo', label: 'Información adicional' }
                ].map(({ key, label }) => {
                  const value = (request as any)[key];
                  if (!value) return null;
                  
                  return (
                    <div key={key} className="mt-6 space-y-2">
                      <label className="text-sm font-medium text-gray-600">{label}</label>
                      <div className="bg-gray-50/80 rounded-xl p-4 text-gray-900 leading-relaxed whitespace-pre-line border border-gray-200">
                        {value}
                      </div>
                    </div>
                  );
                })}

                {/* Etiquetas */}
                <div className="mt-8 space-y-2">
                  <label className="text-sm font-medium text-gray-600">Etiquetas</label>
                  <div>{renderTags(request.tags || [])}</div>
                </div>
              </div>

              {/* Acciones */}
              {(canSubmit || canEdit || isAdmin) && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                  
                  <div className="flex flex-wrap gap-4">
                    {canEdit && (
                      <Link
                        to={`/app/requests/${request.id}/edit`}
                        className="
                          inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl
                          shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                          hover:shadow-md transition-all duration-200
                        "
                      >
                        <PencilIcon className="mr-2 h-5 w-5" />
                        Editar
                      </Link>
                    )}

                    {canSubmit && (
                      <button
                        onClick={handleSubmitRequest}
                        disabled={changing}
                        className="
                          inline-flex items-center px-6 py-3 border border-transparent rounded-xl
                          shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600
                          hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50
                        "
                      >
                        {changing ? (
                          <div className="inline-flex items-center">
                            <div className="mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                            Enviando...
                          </div>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="mr-2 h-5 w-5" />
                            Enviar para revisión
                          </>
                        )}
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                        <select
                          value={newStatus || ''}
                          onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                          className="
                            block px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white/80
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            transition-all duration-200
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
                            block px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white/80
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            transition-all duration-200
                          "
                          disabled={changing}
                        />

                        <button
                          onClick={handleChangeStatus}
                          disabled={changing || !newStatus || !statusReason.trim()}
                          className="
                            inline-flex items-center px-6 py-3 border border-transparent rounded-xl
                            shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600
                            hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50
                          "
                        >
                          {changing ? (
                            <div className="inline-flex items-center">
                              <div className="mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                              Actualizando...
                            </div>
                          ) : (
                            <>
                              <ArrowPathIcon className="mr-2 h-5 w-5" />
                              Actualizar estado
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Columna Lateral - Historial y Comentarios */}
            <div className="space-y-8">
              {/* Historial de cambios de estado */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
                    <ArrowPathIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Historial de cambios</h3>
                </div>

                <div className="space-y-4">
                  {request.statusHistory.map((statusChange, index) => (
                    <div key={index} className="relative">
                      {index !== request.statusHistory.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                      )}
                      
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                            <ArrowPathIcon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-800 font-medium">
                              {statusChange.fromStatusLabel ? (
                                <>
                                  De <span className="text-gray-900">{statusChange.fromStatusLabel}</span> a{' '}
                                  <span className="text-blue-600 font-semibold">{statusChange.toStatusLabel}</span>
                                </>
                              ) : (
                                <>
                                  Estado inicial: <span className="text-blue-600 font-semibold">{statusChange.toStatusLabel}</span>
                                </>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{statusChange.reason}</p>
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                              <span>{statusChange.changedBy?.name || 'Sistema'}</span>
                              <time>{formatDate(statusChange.changedAt)}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comentarios */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Comentarios</h3>
                </div>

                {/* Lista de comentarios */}
                <div className="space-y-4 mb-6">
                  {request.comments.length === 0 ? (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 italic">No hay comentarios todavía.</p>
                    </div>
                  ) : (
                    request.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-md">
                              {comment.user?.firstName?.charAt(0) || '?'}
                              {comment.user?.lastName?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {comment.user?.name || 'Usuario'}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario para nuevo comentario */}
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Añadir comentario
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={4}
                      className="
                        block w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 resize-none
                      "
                      placeholder="Escribe tu comentario aquí..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="
                      w-full inline-flex items-center justify-center px-6 py-3 border border-transparent
                      text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600
                      hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50
                    "
                  >
                    {submittingComment ? (
                      <div className="inline-flex items-center">
                        <div className="mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
                        Comentar
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Botón Volver - Flotante en la parte inferior */}
          <div className="fixed bottom-8 right-8 z-20">
            <button
              onClick={() => navigate('/app/requests')}
              className="
                inline-flex items-center px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200
                rounded-full shadow-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-xl
                hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:ring-offset-2
              "
            >
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
              Volver a Mis Solicitudes
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-800">Gestión de Proyectos</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Seguimiento detallado de tu solicitud de proyecto. Mantente informado del progreso y colabora con el equipo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProjectRequestDetail;