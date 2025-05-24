import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(`/app/${path}`);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar for mobile */}
      <div
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } fixed inset-0 flex z-40 md:hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary-800 to-primary-700 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-center px-4 py-8">
              <div className="flex items-center space-x-2">
                <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center overflow-hidden p-1 shadow-sm">
                  <img src="/logo_encoder_group.png" alt="EncoderGroup Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-white text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">EncoderGroup</h1>
              </div>
            </div>
            <nav className="mt-6 px-4 space-y-2">


              <Link
                to="/app/requests"
                className={`${
                  isActive('requests')
                    ? 'bg-primary-800 text-white'
                    : 'text-white hover:bg-primary-600'
                } group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 hover:scale-105`}
              >
                <svg
                  className="mr-4 h-6 w-6 text-primary-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Solicitudes
              </Link>

              <Link
                to="/app/projects"
                className={`${
                  isActive('projects')
                    ? 'bg-primary-800 text-white'
                    : 'text-white hover:bg-primary-600'
                } group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 hover:scale-105`}
              >
                <svg
                  className="mr-4 h-6 w-6 text-secondary-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Proyectos
              </Link>

              <Link
                to="/app/meetings"
                className={`${
                  isActive('meetings')
                    ? 'bg-primary-800 text-white'
                    : 'text-white hover:bg-primary-600'
                } group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 hover:scale-105`}
              >
                <svg
                  className="mr-4 h-6 w-6 text-primary-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Reuniones
              </Link>


            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
            <Link
              to="/app/profile"
              className="flex-shrink-0 group block"
            >
              <div className="flex items-center">
                <div>
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {user?.name || 'Usuario'}
                  </p>
                  <p className="text-sm font-medium text-primary-200 group-hover:text-white">
                    Ver perfil
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Force sidebar to shrink to fit close icon */}
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-primary-800 to-primary-700 shadow-lg">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-primary-900">
              <div className="flex items-center justify-center flex-shrink-0 px-4 py-6">
                <div className="flex items-center space-x-2">
                  <div className="w-11 h-11 bg-white rounded-md flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                    <img src="/logo_encoder_group.png" alt="EncoderGroup Logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-white text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">EncoderGroup</h1>
                </div>
              </div>
              <nav className="mt-6 flex-1 px-3 space-y-1.5">


                <Link
                  to="/app/requests"
                  className={`${
                    isActive('requests')
                      ? 'bg-primary-800 text-white'
                      : 'text-white hover:bg-primary-600'
                  } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md`}
                >
                  <svg
                    className="mr-3 h-6 w-6 text-primary-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Solicitudes
                </Link>

                <Link
                  to="/app/projects"
                  className={`${
                    isActive('projects')
                      ? 'bg-primary-800 text-white'
                      : 'text-white hover:bg-primary-600'
                  } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md`}
                >
                  <svg
                    className="mr-3 h-6 w-6 text-primary-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Proyectos
                </Link>

                <Link
                  to="/app/meetings"
                  className={`${
                    isActive('meetings')
                      ? 'bg-primary-800 text-white'
                      : 'text-white hover:bg-primary-600'
                  } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md`}
                >
                  <svg
                    className="mr-3 h-6 w-6 text-primary-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Reuniones
                </Link>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-primary-600/30 p-4 mt-4 mx-3 rounded-md">
              <Link to="/app/profile" className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs font-medium text-primary-200 group-hover:text-white">
                      Ver perfil
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {location.pathname === '/app'
                      ? 'Dashboard'
                      : isActive('projects')
                      ? 'Proyectos'
                      : isActive('meetings')
                      ? 'Reuniones'
                      : isActive('requests')
                      ? 'Solicitudes'
                      : isActive('profile')
                      ? 'Perfil'
                      : ''}
                  </h1>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">Ver notificaciones</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={handleLogout}
                  >
                    <span className="sr-only">Cerrar sesión</span>
                    <svg
                      className="h-6 w-6 text-gray-400 hover:text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;