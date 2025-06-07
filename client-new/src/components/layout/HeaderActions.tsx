import React, { useState, useRef } from 'react';
import {
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../notifications/NotificationDropdown';

const HeaderActions: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount, isConnected } = useNotifications();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Notifications */}
      <div className="relative">
        <button
          ref={notificationButtonRef}
          type="button"
          onClick={toggleNotifications}
          className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          title="Notificaciones"
          aria-label="Notificaciones"
          aria-expanded={isNotificationOpen}
          aria-haspopup="true"
        >
          <BellIcon className="h-6 w-6" />
          {/* Notification badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {/* Connection indicator */}
          <span 
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isConnected ? 'Conectado' : 'Desconectado'}
          ></span>
        </button>
        
        {/* Notification Dropdown */}
        <NotificationDropdown
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          anchorRef={notificationButtonRef}
        />
      </div>

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