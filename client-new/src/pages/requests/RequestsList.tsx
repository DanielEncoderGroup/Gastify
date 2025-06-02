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
import { Icon } from '../../components/ui';
import { toast } from 'react-hot-toast';

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
        return <Icon name="ClockIcon" className="text-gray-500" />;
      case RequestStatus.SUBMITTED:
        return <Icon name="InboxArrowDownIcon" className="text-blue-500" />;
      case RequestStatus.REQUIREMENTS_ANALYSIS:
        return <Icon name="DocumentSearchIcon" className="text-purple-500" />;
      case RequestStatus.PLANNING:
        return <Icon name="CalendarDaysIcon" className="text-indigo-500" />;
      case RequestStatus.ESTIMATION:
        return <Icon name="CalculatorIcon" className="text-orange-500" />;
      case RequestStatus.PROPOSAL_READY:
        return <Icon name="PresentationChartBarIcon" className="text-cyan-500" />;
      case RequestStatus.APPROVED:
        return <Icon name="CheckCircleIcon" className="text-green-500" />;
      case RequestStatus.REJECTED:
        return <Icon name="XCircleIcon" className="text-red-500" />;
      case RequestStatus.IN_DEVELOPMENT:
        return <Icon name="ComputerDesktopIcon" className="text-teal-500" />;
      case RequestStatus.COMPLETED:
        return <Icon name="FlagIcon" className="text-emerald-500" />;
      case RequestStatus.CANCELED:
        return <Icon name="MinusCircleIcon" className="text-gray-500" />;
      // Legacy:
      case RequestStatus.IN_PROCESS:
        return <Icon name="ArrowRightIcon" className="text-blue-500" />;
      case RequestStatus.IN_REVIEW:
        return <Icon name="MagnifyingGlassIcon" className="text-yellow-500" />;
      default:
        return <Icon name="ClockIcon" className="text-gray-500" />;
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

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {!isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon name="ComputerDesktopIcon" className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Solicita tu Proyecto IT</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Utiliza nuestro formulario especializado para solicitar proyectos informáticos. Incluye todos los campos necesarios para entender tus necesidades técnicas y de negocio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Proyectos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Gestiona y revisa las solicitudes de proyectos de los clientes'
              : 'Revisa el estado de tus solicitudes de proyectos'}
          </p>
        </div>
        {!isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/app/projects/request/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icon name="ComputerDesktopIcon" className="mr-2 h-5 w-5" />
              Solicitar Proyecto IT
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <Icon name="FunnelIcon" className="text-gray-400" />
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RequestStatus | 'all')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos</option>
                {Object.entries(RequestStatusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <form onSubmit={handleSearch} className="flex rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar solicitudes..."
                className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon name="MagnifyingGlassIcon" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes de proyecto */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading && requests.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="DocumentTextIcon" className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay solicitudes de proyecto</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin
                ? 'No se encontraron solicitudes de proyecto.'
                : 'Aún no has creado ninguna solicitud de proyecto.'}
            </p>
            {!isAdmin && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/app/projects/request/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Icon name="PlusIcon" className="mr-2 h-5 w-5" />
                  Crear nueva solicitud de proyecto
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  to={`/app/requests/${request.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <p className="ml-2 text-sm font-medium text-blue-600 truncate">
                          {request.title}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${StatusBadgeClasses[request.status]}`}
                        >
                          {request.statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 truncate">
                          {request.description.substring(0, 100)}
                          {request.description.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <div className="flex space-x-4">
                          {request.budget !== undefined && (
                            <span className="flex items-center">
                              <Icon name="CurrencyDollarIcon" className="flex-shrink-0 mr-1.5 text-gray-400" />
                              ${request.budget.toLocaleString()}
                            </span>
                          )}
                          {/* Ya no hay tags */}
                        </div>
                      </div>
                    </div>
                    {isAdmin && request.client && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Cliente: {request.client.firstName} {request.client.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Botón “Cargar más” */}
        {hasMore && (
          <div className="px-4 py-3 bg-gray-50 text-center sm:px-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              ) : (
                <Icon name="ArrowRightIcon" className="mr-2 text-gray-400" />
              )}
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsList;
