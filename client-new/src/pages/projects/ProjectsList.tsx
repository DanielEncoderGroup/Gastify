import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  RocketLaunchIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  CubeIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import HeaderActions from '../../components/layout/HeaderActions';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

// Componente de filtro moderno
const ModernFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  placeholder: string;
  icon: React.ReactNode;
}> = ({ value, onChange, options, placeholder, icon }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative group">
      <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 text-gray-400 group-focus-within:text-blue-600">
          {icon}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/70 backdrop-blur-sm
            transition-all duration-200 focus:outline-none
            ${focused
              ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
              : 'border-gray-200'}
            hover:bg-white/90 hover:border-gray-300
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Componente de búsqueda moderno
const ModernSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative group">
      <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 text-gray-400 group-focus-within:text-blue-600">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/70 backdrop-blur-sm
            transition-all duration-200 focus:outline-none
            ${focused
              ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
              : 'border-gray-200'}
            hover:bg-white/90 hover:border-gray-300
          `}
        />
      </div>
    </div>
  );
};

// Componente de tarjeta de proyecto rediseñado en fila
const ProjectRow: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Activo',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200',
          icon: <RocketLaunchIcon className="w-4 h-4" />
        };
      case 'pending':
        return {
          label: 'Pendiente',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200',
          icon: <ClockIcon className="w-4 h-4" />
        };
      case 'completed':
        return {
          label: 'Completado',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: <CheckCircleIcon className="w-4 h-4" />
        };
      default:
        return {
          label: 'Desconocido',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: <ExclamationTriangleIcon className="w-4 h-4" />
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  const handleClick = () => {
    navigate(`/app/projects/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group block relative overflow-hidden rounded-xl p-6 border border-white/20 shadow-sm hover:shadow-md bg-white/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 hover:border-blue-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Icono, título y descripción */}
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Icono */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Título y estado */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                {project.name}
              </h3>
              <div className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ml-4
                ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}
              `}>
                {statusConfig.icon}
                <span className="ml-1.5">{statusConfig.label}</span>
              </div>
            </div>
            
            {/* Descripción */}
            <p className="text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
            
            {/* Fechas */}
            <div className="flex items-center text-sm text-gray-500">
              <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Botón de acción */}
        <div className="flex items-center space-x-4 flex-shrink-0 ml-6">
          <div className="flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
            <EyeIcon className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Ver detalles</span>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
        </div>
      </div>
    </div>
  );
};

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Implementación ERP',
          description: 'Implementación de sistema ERP para gestión financiera y optimización de procesos empresariales',
          status: 'active',
          startDate: '2023-01-15',
          endDate: '2023-07-30',
        },
        {
          id: '2',
          name: 'Migración a la nube',
          description: 'Migración de infraestructura local a servicios en la nube para mejorar escalabilidad y reducir costos',
          status: 'active',
          startDate: '2023-03-01',
          endDate: '2023-09-15',
        },
        {
          id: '3',
          name: 'Desarrollo app móvil',
          description: 'Desarrollo de aplicación móvil para clientes con funcionalidades avanzadas y experiencia optimizada',
          status: 'pending',
          startDate: '2023-06-01',
          endDate: '2023-12-31',
        },
        {
          id: '4',
          name: 'Actualización infraestructura',
          description: 'Actualización de servidores y equipos de red para mejorar rendimiento y seguridad',
          status: 'completed',
          startDate: '2023-02-10',
          endDate: '2023-04-20',
        },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filtrar proyectos
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'active', label: 'Activos', color: 'text-emerald-600' },
    { value: 'pending', label: 'Pendientes', color: 'text-amber-600' },
    { value: 'completed', label: 'Completados', color: 'text-blue-600' }
  ];



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Título y descripción */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                  Gestión de Proyectos
                </h1>
                <p className="text-gray-600 mt-1">
                  Supervisa y administra todos los proyectos en curso
                </p>
              </div>
            </div>

            {/* Right side - Header Actions */}
            <HeaderActions />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <CubeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proyectos Activos</p>
                <p className="text-2xl font-bold text-emerald-600">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                <RocketLaunchIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md mb-8">
          <div className="flex items-center mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros y Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModernSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar proyectos por nombre o descripción..."
            />
            <ModernFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Filtrar por estado"
              icon={<FunnelIcon className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Lista de Proyectos en Filas */}
        <div className="space-y-6">
          {filteredProjects.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  Vista de lista
                </div>
              </div>
              
              {/* Lista vertical de proyectos */}
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
                <ComputerDesktopIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron proyectos</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No hay proyectos que coincidan con los criterios de búsqueda. Intenta ajustar los filtros.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Informativo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-800">¿Necesitas ayuda con tus proyectos?</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              Nuestro equipo está aquí para ayudarte a gestionar y optimizar todos tus proyectos tecnológicos.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div>📧 Soporte: soporte@empresa.com</div>
              <div className="hidden sm:block">|</div>
              <div>📞 Teléfono: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectsList;