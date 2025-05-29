import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/ui';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0,
    upcomingMeetings: 0
  });

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary({
        pendingRequests: 5,
        approvedRequests: 12,
        rejectedRequests: 2,
        totalAmount: 3245.67,
        upcomingMeetings: 3
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          {user ? `Bienvenido, ${user.firstName || ''} ${user.lastName || user.name || ''}`.trim() : 'Bienvenido'}. Aquí tienes un resumen de tu actividad reciente.
        </p>
      </div>

      {/* Tarjetas de acceso rápido - solo visible para usuarios (clientes) */}
      {user?.role === 'user' && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tarjeta para solicitudes regulares */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Icon name="DocumentTextIcon" className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Servicios generales</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">Solicitar servicio o consultoría</div>
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/app/requests/new" className="font-medium text-blue-600 hover:text-blue-900">
                    Solicitar ahora <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Tarjeta para proyectos informáticos con indicador de novedad */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Icon name="ComputerDesktopIcon" className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                      Proyectos Informáticos
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nuevo
                      </span>
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">Solicitar proyecto IT</div>
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/app/projects/request/new" className="font-medium text-blue-600 hover:text-blue-900">
                    Solicitar ahora <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Tarjeta para ver solicitudes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                    <Icon name="ClipboardDocumentListIcon" className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Gestionar solicitudes</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">Ver todas mis solicitudes</div>
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/app/requests" className="font-medium text-gray-600 hover:text-gray-900">
                    Ver listado <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner promocional para nueva funcionalidad - visible solo para clientes */}
      {user?.role === 'client' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg mb-8 overflow-hidden">
          <div className="px-6 py-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">¡Nueva funcionalidad disponible!</h3>
              <p className="mt-1 text-sm text-blue-100">
                Prueba nuestro nuevo formulario mejorado para solicitudes de proyectos informáticos. Diseñado para capturar todos los detalles de tu proyecto tecnológico.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/app/projects/request/new"
                className="inline-flex items-center px-4 py-2 border border-white rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Solicitud Avanzada
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Solicitudes pendientes */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Solicitudes Pendientes</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{summary.pendingRequests}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/app/requests" className="font-medium text-indigo-600 hover:text-indigo-500">
                Ver todas
              </Link>
            </div>
          </div>
        </div>

        {/* Solicitudes aprobadas */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Solicitudes Aprobadas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{summary.approvedRequests}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/app/requests" className="font-medium text-indigo-600 hover:text-indigo-500">
                Ver todas
              </Link>
            </div>
          </div>
        </div>

        {/* Total gastado */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Gastado</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">${summary.totalAmount.toFixed(2)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/app/stats" className="font-medium text-indigo-600 hover:text-indigo-500">
                Ver estadísticas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones rápidas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/app/requests"
            className="relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <span className="absolute inset-0 rounded-lg bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="ml-3 text-base font-medium text-gray-900">Nueva solicitud</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Crea una nueva solicitud de viáticos o reembolso.
              </p>
            </div>
          </Link>

          <Link
            to="/app/meetings"
            className="relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <span className="absolute inset-0 rounded-lg bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="ml-3 text-base font-medium text-gray-900">Programar reunión</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Programa una nueva reunión o revisa las próximas.
              </p>
            </div>
          </Link>

          <Link
            to="/app/projects"
            className="relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <span className="absolute inset-0 rounded-lg bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="ml-3 text-base font-medium text-gray-900">Ver proyectos</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Revisa el estado de los proyectos en curso.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad reciente</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Solicitud #12345 aprobada
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Aprobada
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Viáticos para viaje a Monterrey
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p>
                      Hace 3 días
                    </p>
                  </div>
                </div>
              </div>
            </li>

            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Nueva reunión programada
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Pendiente
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Revisión de presupuesto Q2
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p>
                      Mañana a las 10:00 AM
                    </p>
                  </div>
                </div>
              </div>
            </li>

            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Solicitud #12344 rechazada
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Rechazada
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Reembolso de equipo de oficina
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p>
                      Hace 5 días
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;