import React, { useState, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationSystemProps {
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ className = '' }) => {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <button
        ref={notificationButtonRef}
        type="button"
        onClick={toggleNotifications}
        className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        title="Notificaciones"
        aria-label="Notificaciones"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de conexión WebSocket */}
        <span 
          className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Conectado' : 'Desconectado'}
        />
      </button>

      {/* Lista simple de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Notificaciones</h3>
            {unreadCount === 0 ? (
              <p className="text-sm text-gray-500">No hay notificaciones</p>
            ) : (
              <p className="text-sm text-gray-600">{unreadCount} notificaciones sin leer</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
