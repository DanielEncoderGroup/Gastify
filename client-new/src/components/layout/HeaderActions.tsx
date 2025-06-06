import React from 'react';
import {
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HeaderActions: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Notifications */}
      <button
        type="button"
        className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        title="Notificaciones"
      >
        <BellIcon className="h-6 w-6" />
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          3
        </span>
      </button>

      {/* User info and logout */}
      <div className="flex items-center space-x-3">
        {user && (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        )}
        
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-2 p-3 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          title="Cerrar Sesión"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          <span className="hidden sm:inline text-sm font-medium">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderActions;