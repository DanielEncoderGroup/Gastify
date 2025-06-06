import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { RequestStatus, RequestSummary } from '../../types/request';
import { requestService } from '../../services/requestService';
import ProjectRequestsTable from '../../components/projects/ProjectRequestsTable';

/**
 * Página de administración de solicitudes de proyectos informáticos
 * Para uso exclusivo de administradores
 */
const ProjectRequestsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar solicitudes al iniciar o cuando cambian los filtros
  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const response = await requestService.getAll(
          filterStatus || undefined,
          undefined,
          searchTerm || undefined,
          currentPage * itemsPerPage,
          itemsPerPage
        );
        // Usar response.requests (definido en la interfaz) y validar que no sea undefined
        setRequests(response.requests || response.items || []);
        setTotalItems(response.total);
      } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        toast.error('No se pudieron cargar las solicitudes');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [filterStatus, searchTerm, currentPage, itemsPerPage]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll suave al inicio de la tabla cuando cambie la página
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Manejar cambio de filtro de estado
  const handleStatusFilterChange = (status: RequestStatus | null) => {
    setFilterStatus(status);
    setCurrentPage(0); // Resetear a primera página al cambiar filtro
    
    // Mantener la posición en la tabla cuando cambie el filtro
    if (tableRef.current) {
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  // Manejar búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0); // Resetear a primera página al buscar
  };

  // Manejar clic en una solicitud
  const handleRequestClick = (requestId: string) => {
    navigate(`/app/requests/${requestId}`);
  };

  const getStatusStats = () => {
    const pending = requests.filter(r => r.status === RequestStatus.SUBMITTED).length;
    const approved = requests.filter(r => r.status === RequestStatus.APPROVED).length;
    const rejected = requests.filter(r => r.status === RequestStatus.REJECTED).length;
    return { pending, approved, rejected };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                Administración de Solicitudes
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona y revisa las solicitudes de proyectos informáticos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner informativo para administradores */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md mb-8 border border-white/20">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <InformationCircleIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Panel de Administración Avanzada</h3>
              <p className="text-gray-600 leading-relaxed">
                Esta sección permite gestionar todas las solicitudes de proyectos informáticos de manera centralizada.
                Puedes cambiar estados, asignar prioridades y comunicarte con los clientes directamente.
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de solicitudes - Ahora con referencia para scroll */}
        <div 
          ref={tableRef}
          className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {totalItems} solicitud{totalItems !== 1 ? 'es' : ''} encontrada{totalItems !== 1 ? 's' : ''}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                Vista administrativa
              </div>
            </div>
          </div>
          
          {/* Container con overflow controlado para la tabla */}
          <div className="relative">
            <ProjectRequestsTable 
              requests={requests}
              loading={loading}
              totalItems={totalItems}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onStatusFilterChange={handleStatusFilterChange}
              onSearch={handleSearch}
              onRequestClick={handleRequestClick}
              filterStatus={filterStatus}
              searchTerm={searchTerm}
              isAdmin={true}
            />
          </div>
        </div>
      </main>

      {/* Footer Informativo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <span className="text-lg font-semibold text-gray-800">¿Necesitas ayuda con la administración?</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              El panel de administración te permite gestionar eficientemente todas las solicitudes de proyectos.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div>📧 Soporte: admin@encodergroup.cl</div>
              <div className="hidden sm:block">|</div>
              <div>📞 Teléfono: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectRequestsAdmin;