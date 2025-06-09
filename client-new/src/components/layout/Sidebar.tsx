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
  
  // Get user's full name
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Usuario' : 'Usuario';

  // Elementos de navegación comunes para todos los usuarios
  const commonNavigation = [
    { 
      name: 'Reuniones', 
      href: '/app/meetings', 
      iconName: 'CalendarIcon',
      description: 'Programa y gestiona reuniones'
    }
  ];

  // Elementos de navegación para administradores
  const adminNavigation = [
    { 
      name: 'Gestión de Solicitudes', 
      href: '/app/requests', 
      iconName: 'ClipboardDocumentListIcon',
      description: 'Administra todas las solicitudes'
    },
    { 
      name: 'Proyectos Informáticos', 
      href: '/app/projects/admin', 
      iconName: 'ComputerDesktopIcon',
      description: 'Panel de administración de proyectos'
    },
  ];

  // Elementos de navegación para clientes
  const clientNavigation = [
    { 
      name: 'Mis Solicitudes', 
      href: '/app/requests', 
      iconName: 'DocumentTextIcon',
      description: 'Revisa tus solicitudes de proyecto'
    },
    { 
      name: 'Mis Proyectos', 
      href: '/app/projects', 
      iconName: 'FolderIcon',
      description: 'Explora tus proyectos activos'
    }
  ];

  // Determinar la navegación según el rol del usuario
  const navigation = user?.role === 'admin' 
    ? [...adminNavigation, ...commonNavigation]
    : [...clientNavigation, ...commonNavigation];

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
    // Para rutas específicas como '/app/requests/new', verificar una coincidencia exacta
    if (href === '/app/requests/new' || href === '/app/projects/request/new') {
      return location.pathname === href;
    }
    
    // Para rutas base como '/app/requests', verificar que empiece con esta ruta
    // pero no coincida con subrutas específicas que tienen sus propias entradas
    if (href === '/app/requests') {
      return location.pathname === href || 
             (location.pathname.startsWith(href + '/') && 
              location.pathname !== '/app/requests/new');
    }
    
    // Para el resto de rutas, verificar coincidencia exacta o que empiece con la ruta + '/'
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Obtener badge del rol
  const getRoleBadge = () => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
      client: { label: 'Cliente', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' }
    };
    
    return roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.client;
  };

  const roleBadge = getRoleBadge();

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
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
            <div className="relative flex-1 flex flex-col max-w-xs w-full">
              {/* Fondo con glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-white/5"></div>
              
              {/* Contenido del sidebar móvil */}
              <div className="relative z-10 flex flex-col h-full">
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
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Cerrar sidebar</span>
                      <Icon name="XMarkIcon" className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Header del sidebar */}
                <div className="flex-shrink-0 pt-6 pb-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                      <Icon name="CommandLineIcon" className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-white text-lg font-bold">
                        <span className="text-blue-300">Encoder</span>Group
                      </h1>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                        ${isActive(item.href) 
                          ? 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-lg backdrop-blur-sm' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
                        }
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-9 h-9 rounded-lg mr-3 transition-all duration-200
                        ${isActive(item.href) 
                          ? 'bg-white/20 shadow-sm' 
                          : 'bg-white/10 group-hover:bg-white/20'
                        }
                      `}>
                        <Icon 
                          name={item.iconName}
                          className="h-5 w-5 text-white"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </nav>

                {/* Footer con perfil de usuario */}
                <div className="flex-shrink-0 p-4">
                  <Link 
                    to="/app/profile" 
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        {user?.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover border-2 border-white/20"
                            src={user.profileImage}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20">
                            <Icon name="UserIcon" className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {fullName}
                        </p>
                        <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
                          Ver perfil
                        </p>
                      </div>
                    </div>
                    <Icon name="ChevronRightIcon" className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors duration-200" />
                  </Link>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14"></div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar estático para desktop */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-20">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Fondo con glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-white/5 border-r border-white/10"></div>
          
          {/* Contenido del sidebar */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header del sidebar */}
            <div className="flex-shrink-0 pt-8 pb-6 px-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Icon name="CommandLineIcon" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold">
                    <span className="text-blue-300">Encoder</span>Group
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${roleBadge.color} shadow-sm`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive(item.href) 
                      ? 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-lg backdrop-blur-sm transform scale-[1.02]' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm hover:scale-[1.01]'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-xl mr-4 transition-all duration-200
                    ${isActive(item.href) 
                      ? 'bg-white/20 shadow-sm' 
                      : 'bg-white/10 group-hover:bg-white/20'
                    }
                  `}>
                    <Icon 
                      name={item.iconName}
                      className="h-5 w-5 text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  {isActive(item.href) && (
                    <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* Footer con perfil de usuario */}
            <div className="flex-shrink-0 p-4">
              <Link 
                to="/app/profile" 
                className="flex items-center p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    {user?.profileImage ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-white/20 shadow-md"
                        src={user.profileImage}
                        alt=""
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20 shadow-md">
                        <Icon name="UserIcon" className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
                      Ver perfil completo
                    </p>
                  </div>
                </div>
                <Icon name="ChevronRightIcon" className="h-5 w-5 text-white/40 group-hover:text-white/80 transition-all duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;