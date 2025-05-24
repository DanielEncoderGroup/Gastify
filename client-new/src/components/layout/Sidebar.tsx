import React, { Fragment, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Componente Sidebar que muestra la navegación lateral
 * Incluye versión móvil (Dialog) y versión desktop
 */
const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Ruta del logo
  const logoIconPath = '/assets/encoder-logo.svg';
  
  // Elementos de navegación basados en el rol del usuario
  const baseNavigation = [
    { name: 'Solicitudes', href: '/app/requests', iconName: 'DocumentTextIcon' },
    { name: 'Proyectos', href: '/app/projects', iconName: 'FolderIcon' },
    { name: 'Reuniones', href: '/app/meetings', iconName: 'CalendarIcon' }
  ];

  // Elementos específicos para administradores
  const adminNavItems = [
    { name: 'Gestión de Solicitudes', href: '/app/requests', iconName: 'ClipboardDocumentListIcon' },
    { name: 'Proyectos Informáticos', href: '/app/projects/admin', iconName: 'ComputerDesktopIcon' },
  ];

  // Elementos específicos para clientes
  const clientNavItems = [
    { name: 'Mis Solicitudes', href: '/app/requests', iconName: 'ClipboardDocumentListIcon' },
    { name: 'Nueva Solicitud', href: '/app/requests/new', iconName: 'PlusCircleIcon' },
    { name: 'Solicitar Proyecto IT', href: '/app/projects/request/new', iconName: 'ComputerDesktopIcon', isNew: true },
  ];

  // Combinar elementos de navegación según el rol
  const navigation = [
    ...baseNavigation,
    ...(user?.role === 'admin' ? adminNavItems : clientNavItems)
  ];

  // Cerrar el sidebar con tecla Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [setSidebarOpen]);

  // Verificar si una ruta está activa (incluyendo subrutas)
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Sidebar para móviles (slide over) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 md:hidden"
          onClose={setSidebarOpen}
          open={sidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0066b3]">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-600"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Cerrar sidebar</span>
                    <Icon name="XMarkIcon" className="h-6 w-6 text-white" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <span className="flex items-center">
                    <div className="flex items-center justify-center bg-[#4285f4] w-10 h-10 mr-3 rounded">
                      <span className="text-white font-bold text-lg">&lt;/&gt;</span>
                    </div>
                    <span className="text-white font-bold text-lg">EncoderGroup</span>
                  </span>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                        ${isActive(item.href) ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                      `}
                    >
                      <Icon 
                        name={item.iconName}
                        className={`
                          mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200
                          ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                        `}
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      {user?.profileImage ? (
                        <img
                          className="inline-block h-9 w-9 rounded-full"
                          src={user.profileImage}
                          alt=""
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                          <Icon name="UserIcon" className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white group-hover:text-gray-300">
                        mario
                      </p>
                      <p className="text-xs font-medium text-white group-hover:text-gray-300">
                        Ver perfil
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">{/* Fuerza al sidebar a reducirse para ajustarse al ícono de cierre */}</div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar estático para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-800 bg-[#0066b3]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto bg-[#0066b3]">
            <div className="flex-shrink-0 flex items-center px-4">
              <span className="flex items-center">
                <div className="flex items-center justify-center bg-[#4285f4] w-10 h-10 mr-3 rounded">
                  <span className="text-white font-bold text-lg">&lt;/&gt;</span>
                </div>
                <span className="text-white font-bold text-lg">EncoderGroup</span>
              </span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200
                    ${isActive(item.href) ? 'bg-blue-500 text-white' : 'text-white hover:bg-blue-700 hover:text-white'}
                  `}
                >
                  <Icon 
                    name={item.iconName}
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200
                      ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                    `}
                  />
                  <div className="flex items-center">
                    {item.name}
                    {/* Mostrar etiqueta 'Nuevo' si corresponde */}
                    {(item as any).isNew && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                        Nuevo
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  {user?.profileImage ? (
                    <img
                      className="inline-block h-9 w-9 rounded-full"
                      src={user.profileImage}
                      alt=""
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white group-hover:text-gray-200">
                    mario
                  </p>
                  <p className="text-xs font-medium text-white group-hover:text-gray-300">
                    Ver perfil
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;