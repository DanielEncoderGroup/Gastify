import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui';

// Utilidad para combinar clases condicionales
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface NavbarProps {
  sidebarOpen?: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Componente Navbar que muestra la barra de navegación superior
 * Incluye botón para mostrar/ocultar sidebar en móvil y menú de usuario
 */
const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  
  // Elementos del menú de usuario
  const userNavigation = [
    { name: 'Mi Perfil', href: '/app/profile' },
    { name: 'Configuración', href: '/app/settings' },
  ];

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Abrir sidebar</span>
        <Icon name="Bars3Icon" className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          {/* Espacio para búsqueda u otros elementos en el futuro */}
          <div className="md:hidden flex items-center">
            <Icon 
              name="ReceiptRefundIcon" 
              className="h-8 w-8 text-green-600" 
            />
            <span className="ml-2 text-xl font-bold text-green-700">Gastify</span>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Saludo al usuario */}
          <span className="hidden md:inline-block text-sm text-gray-700 mr-4">
            Hola, {user?.name || 'Usuario'}
          </span>
          
          {/* Menú desplegable de usuario */}
          <div className="ml-3 relative">
            <Menu as="div">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Abrir menú de usuario</span>
                {user?.profileImage ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user?.profileImage || '/assets/avatar-placeholder.png'}
                    alt=""
                  />
                ) : (
                  <Icon name="UserCircleIcon" className="h-8 w-8 text-gray-400" />
                )}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                {userNavigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }: { active: boolean }) => (
                      <Link
                        to={item.href}
                        className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        {item.name}
                      </Link>
                    )}
                  </Menu.Item>
                ))}
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={logout}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block w-full text-left px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      Cerrar sesión
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;