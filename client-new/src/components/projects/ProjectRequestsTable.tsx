import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RequestSummary, RequestStatus, RequestStatusLabels, RequestStatusColors, ProjectType, ProjectTypeLabels } from '../../types/request';
import { Icon } from '../ui';

interface ProjectRequestsTableProps {
  requests: RequestSummary[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: RequestStatus | null) => void;
  onSearch: (term: string) => void;
  onRequestClick: (id: string) => void;
  filterStatus: RequestStatus | null;
  searchTerm: string;
  isAdmin: boolean;
}

/**
 * Tabla para mostrar y administrar solicitudes de proyectos informáticos
 * Optimizada para evitar scroll horizontal y mejorar la experiencia de usuario
 */
const ProjectRequestsTable: React.FC<ProjectRequestsTableProps> = ({
  requests,
  loading,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onStatusFilterChange,
  onSearch,
  onRequestClick,
  filterStatus,
  searchTerm,
  isAdmin
}) => {
  const [sortColumn, setSortColumn] = useState<keyof RequestSummary>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState(searchTerm);

  // Calcular número total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Manejar cambio de ordenación
  const handleSort = (column: keyof RequestSummary) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Manejar búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  // Manejar reseteo de filtros
  const handleResetFilters = () => {
    setSearchInput('');
    onSearch('');
    onStatusFilterChange(null);
  };

  // Renderizar el estado con el color correspondiente
  const renderStatus = (status: RequestStatus, statusLabel: string) => {
    const color = RequestStatusColors[status] || 'gray';
    
    type ColorKey = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray' | 'orange';
    
    const colorClasses: Record<ColorKey, string> = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800', 
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800',
      orange: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colorClasses[color as ColorKey] || colorClasses.gray
      }`}>
        {statusLabel}
      </span>
    );
  };
  // Renderizar el tipo de proyecto
  const renderProjectType = (type: ProjectType) => {
    const label = Object.prototype.hasOwnProperty.call(ProjectTypeLabels, type)
      ? ProjectTypeLabels[type]
      : type;
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {label}
      </span>
    );
  };

  // Renderizar las etiquetas
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-gray-400 text-xs">Sin etiquetas</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 2).map((tag, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
          >
            {tag}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
            +{tags.length - 2}
          </span>
        )}
      </div>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Renderizar indicador de ordenación
  const renderSortIndicator = (column: keyof RequestSummary) => {
    if (column !== sortColumn) return null;
    
    return sortDirection === 'asc' 
      ? <Icon name="ChevronUpIcon" className="w-4 h-4 ml-1" /> 
      : <Icon name="ChevronDownIcon" className="w-4 h-4 ml-1" />;
  };

  // Manejar paginación
  const handlePrevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  // Renderizar filtros de estado - Mejorado para evitar scroll hacia arriba
  const renderStatusFilters = () => {
    const handleFilterClick = (status: RequestStatus | null) => {
      onStatusFilterChange(status);
      // Evitar el comportamiento de scroll hacia arriba
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    return (
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por estado:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterClick(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              filterStatus === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {Object.entries(RequestStatusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => handleFilterClick(status as RequestStatus)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Controles de búsqueda y filtrado - Mejorados */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="MagnifyingGlassIcon" className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Buscar por título o descripción..."
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Buscar
            </button>
            {(searchTerm || filterStatus) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filtros de estado */}
      {renderStatusFilters()}

      {/* Tabla de solicitudes - Diseño responsive sin scroll horizontal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Vista desktop */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ minWidth: '300px' }}
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Título
                      {renderSortIndicator('title')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ minWidth: '120px' }}
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Estado
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ minWidth: '140px' }}
                    onClick={() => handleSort('projectType')}
                  >
                    <div className="flex items-center">
                      Tipo
                      {renderSortIndicator('projectType')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ minWidth: '150px' }}
                  >
                    Etiquetas
                  </th>
                  {isAdmin && (
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      style={{ minWidth: '200px' }}
                      onClick={() => handleSort('client')}
                    >
                      <div className="flex items-center">
                        Cliente
                        {renderSortIndicator('client')}
                      </div>
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ minWidth: '100px' }}
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Fecha
                      {renderSortIndicator('createdAt')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ minWidth: '80px' }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-sm text-gray-500">Cargando solicitudes...</span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center">
                      <div>
                        <Icon name="InboxIcon" className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-2 text-base font-medium text-gray-900">No hay solicitudes disponibles</p>
                        <p className="text-gray-500">
                          {searchTerm || filterStatus
                            ? 'Prueba a cambiar los filtros de búsqueda'
                            : 'Crea una nueva solicitud para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => onRequestClick(request.id)}
                    >
                      <td className="px-4 py-4" style={{ minWidth: '300px' }}>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {request.title}
                          </div>
                          {request.progress !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${request.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                        {renderStatus(request.status, request.statusLabel || RequestStatusLabels[request.status])}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                        {renderProjectType(request.projectType)}
                      </td>
                      <td className="px-4 py-4" style={{ minWidth: '150px' }}>
                        <div className="w-full">
                          {renderTags(request.tags || [])}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4" style={{ minWidth: '200px' }}>
                          <div className="w-full">
                            {request.client?.name ? (
                              <div className="space-y-1">
                                <div 
                                  className="text-sm text-gray-900 font-medium"
                                  title={request.client.name}
                                >
                                  {request.client.name}
                                </div>
                                {request.client.email && (
                                  <div 
                                    className="text-xs text-gray-500 break-all"
                                    title={request.client.email}
                                  >
                                    {request.client.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic">
                                Sin cliente asignado
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" style={{ minWidth: '100px' }}>
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ minWidth: '80px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestClick(request.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors duration-150"
                          title="Ver detalles"
                        >
                          <span className="sr-only">Ver detalles</span>
                          <Icon name="EyeIcon" className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista móvil y tablet - Cards responsive */}
        <div className="lg:hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-sm text-gray-500">Cargando solicitudes...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="InboxIcon" className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-base font-medium text-gray-900">No hay solicitudes disponibles</p>
              <p className="text-gray-500">
                {searchTerm || filterStatus
                  ? 'Prueba a cambiar los filtros de búsqueda'
                  : 'Crea una nueva solicitud para comenzar'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => onRequestClick(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStatus(request.status, request.statusLabel || RequestStatusLabels[request.status])}
                        {renderProjectType(request.projectType)}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                        {request.title}
                      </h3>
                      {request.progress !== undefined && (
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${request.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <div className="mb-2">
                        {renderTags(request.tags || [])}
                      </div>
                      {isAdmin && request.client && (
                        <div className="text-xs text-gray-500 mb-2">
                          <div className="font-medium truncate" title={request.client.name}>
                            {request.client.name}
                          </div>
                          {request.client.email && (
                            <div className="truncate" title={request.client.email}>
                              {request.client.email}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestClick(request.id);
                      }}
                      className="ml-4 p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150"
                    >
                      <Icon name="EyeIcon" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginación mejorada */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 self-center">
                Página {currentPage + 1} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{Math.min(currentPage * itemsPerPage + 1, totalItems)}</span> a{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * itemsPerPage, totalItems)}
                  </span>{' '}
                  de <span className="font-medium">{totalItems}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <span className="sr-only">Anterior</span>
                    <Icon name="ChevronLeftIcon" className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i;
                    } else if (currentPage < 3) {
                      pageNumber = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNumber = totalPages - 5 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <span className="sr-only">Siguiente</span>
                    <Icon name="ChevronRightIcon" className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRequestsTable;