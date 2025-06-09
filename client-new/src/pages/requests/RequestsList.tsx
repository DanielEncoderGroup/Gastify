import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services/requestService';
import {
  RequestSummary,
  RequestStatus,
  RequestStatusLabels,
  StatusBadgeClasses
} from '../../types/request';
import { toast } from 'react-hot-toast';
import {
  ComputerDesktopIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  ClockIcon,
  InboxArrowDownIcon,
  DocumentMagnifyingGlassIcon,
  CalendarDaysIcon,
  CalculatorIcon,
  PresentationChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  MinusCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import HeaderActions from '../../components/layout/HeaderActions';

const RequestsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 10;

  const isAdmin = user?.role === 'admin';

  // Iconos para cada estado
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.DRAFT:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case RequestStatus.SUBMITTED:
        return <InboxArrowDownIcon className="w-5 h-5 text-blue-500" />;
      case RequestStatus.REQUIREMENTS_ANALYSIS:
        return <DocumentMagnifyingGlassIcon className="w-5 h-5 text-purple-500" />;
      case RequestStatus.PLANNING:
        return <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />;
      case RequestStatus.ESTIMATION:
        return <CalculatorIcon className="w-5 h-5 text-orange-500" />;
      case RequestStatus.PROPOSAL_READY:
        return <PresentationChartBarIcon className="w-5 h-5 text-cyan-500" />;
      case RequestStatus.APPROVED:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case RequestStatus.REJECTED:
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case RequestStatus.IN_DEVELOPMENT:
        return <ComputerDesktopIcon className="w-5 h-5 text-teal-500" />;
      case RequestStatus.COMPLETED:
        return <FlagIcon className="w-5 h-5 text-emerald-500" />;
      case RequestStatus.CANCELED:
        return <MinusCircleIcon className="w-5 h-5 text-gray-500" />;
      case RequestStatus.IN_PROCESS:
        return <ArrowRightIcon className="w-5 h-5 text-blue-500" />;
      case RequestStatus.IN_REVIEW:
        return <MagnifyingGlassIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const loadRequests = async (reset = false) => {
    try {
      setLoading(true);
      const page = reset ? 0 : currentPage;
      const status = selectedStatus !== 'all' ? selectedStatus : undefined;
      const search = searchTerm.trim() || undefined;

      const response = await requestService.getAll(
        status as RequestStatus | undefined,
        isAdmin ? undefined : user?.id,
        search,
        page * itemsPerPage,
        itemsPerPage
      );

      // Filtrar sólo los que tengan projectType definido
      const projectRequests = response.requests.filter(r => !!r.projectType);

      if (reset) {
        setRequests(projectRequests);
        setCurrentPage(0);
      } else {
        setRequests(prev => [...prev, ...projectRequests]);
      }

      setTotalRequests(response.total);
      setHasMore((page + 1) * itemsPerPage < response.total);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar solicitudes de proyecto:', error);
      toast.error('Error al cargar las solicitudes de proyecto');
      setLoading(false);
      if (reset) {
        setRequests([]);
        setTotalRequests(0);
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, user, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      loadRequests(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Título */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <RocketLaunchIcon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent break-words">
                    Solicitudes de Proyectos
                  </h1>
                  <p className="text-gray-600 mt-1 break-words">
                    {isAdmin
                      ? 'Gestiona y revisa las solicitudes de proyectos de los clientes'
                      : 'Revisa el estado de tus solicitudes de proyectos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Header Actions + CTA */}
            <div className="flex items-center space-x-4">
              {/* Botón CTA */}
              {!isAdmin && (
                <button
                  onClick={() => navigate('/app/projects/request/new')}
                  className="
                    inline-flex items-center justify-center px-6 py-3 text-white font-medium
                    bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg whitespace-nowrap
                    hover:shadow-xl hover:scale-105 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  "
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Solicitar Proyecto IT
                </button>
              )}
              
              {/* Header Actions */}
              <HeaderActions />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal - Con padding-top para compensar el header sticky */}
      <main className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Banner Informativo para Usuarios */}
          {!isAdmin && (
            <div className="relative overflow-hidden rounded-2xl p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-10 translate-x-10 blur-xl"></div>
              <div className="relative z-10 flex items-start space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-sm">
                  <ComputerDesktopIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Solicita tu Proyecto IT
                  </h3>
                  <p className="text-blue-800 leading-relaxed">
                    Utiliza nuestro formulario especializado para solicitar proyectos informáticos. 
                    Incluye todos los campos necesarios para entender tus necesidades técnicas y de negocio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Panel de Filtros */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Filtro de Estado */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <FunnelIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Estado
                  </label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as RequestStatus | 'all')}
                    className="
                      block w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm
                      focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                      transition-all duration-200 hover:bg-white
                    "
                  >
                    <option value="all">Todos los Estados</option>
                    {Object.entries(RequestStatusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buscador */}
              <div className="flex-1 lg:max-w-md">
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar solicitudes..."
                    className="
                      w-full pl-12 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm
                      focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                      transition-all duration-200 hover:bg-white
                    "
                  />
                  <button
                    type="submit"
                    className="
                      absolute inset-y-0 right-0 flex items-center px-4
                      text-blue-600 hover:text-blue-700 transition-colors duration-200
                    "
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Lista de Solicitudes */}
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl mb-6 shadow-lg">
                  <DocumentTextIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No hay solicitudes de proyecto
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {isAdmin
                    ? 'No se encontraron solicitudes de proyecto que coincidan con los filtros.'
                    : 'Aún no has creado ninguna solicitud de proyecto. ¡Empieza creando tu primera solicitud!'}
                </p>
                {!isAdmin && (
                  <button
                    onClick={() => navigate('/app/projects/request/new')}
                    className="
                      inline-flex items-center px-6 py-3 text-white font-medium
                      bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg
                      hover:shadow-xl hover:scale-105 transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    "
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crear nueva solicitud
                  </button>
                )}
              </div>
            ) : (
              <>
                {requests.map((request, index) => (
                  <Link
                    key={request.id}
                    to={`/app/requests/${request.id}`}
                    className="block group"
                  >
                    <div className="
                      bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6
                      hover:shadow-xl hover:bg-white/90 hover:scale-[1.02]
                      transition-all duration-300 group-hover:border-blue-200
                    ">
                      <div className="flex items-start justify-between">
                        {/* Contenido Principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-white/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200">
                              {getStatusIcon(request.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors duration-200">
                                {request.title}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {request.description.substring(0, 120)}
                                {request.description.length > 120 ? '...' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Metadatos */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {request.budget !== undefined && (
                              <div className="flex items-center space-x-1">
                                <CurrencyDollarIcon className="w-4 h-4" />
                                <span className="font-medium">${request.budget.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Creado {new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                            {isAdmin && request.client && (
                              <div className="flex items-center space-x-1">
                                <UserIcon className="w-4 h-4" />
                                <span>{request.client.firstName} {request.client.lastName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badge de Estado */}
                        <div className="ml-4 flex-shrink-0">
                          <span className={`
                            px-3 py-1.5 text-xs font-semibold rounded-full
                            ${StatusBadgeClasses[request.status]}
                            shadow-sm
                          `}>
                            {request.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Botón Cargar Más */}
                {hasMore && (
                  <div className="text-center pt-8">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="
                        inline-flex items-center px-6 py-3 text-gray-700 font-medium
                        bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm
                        hover:bg-white hover:shadow-md hover:border-gray-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                      "
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="w-5 h-5 mr-2" />
                          Cargar más solicitudes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
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
            Administra eficientemente todas tus solicitudes de proyectos desde un solo lugar.
            Mantén el control y seguimiento de cada etapa del proceso.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RequestsList;