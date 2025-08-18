/**
 * Componente de campana de notificaciones con contador en tiempo real
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon } from '@heroicons/react/24/outline';

import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
  showCenter?: boolean; // Si mostrar el centro completo o solo notificaciones recientes
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  showCenter = true
}) => {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead 
  } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  const handleBellClick = () => {
    if (showCenter) {
      setShowNotifications(true);
    } else {
      setShowRecentDropdown(!showRecentDropdown);
    }
  };

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    try {
      await markAsRead(notificationId);
      if (actionUrl) {
        window.location.href = actionUrl;
      }
      setShowRecentDropdown(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div className="relative">
      {/* Campana de notificaciones */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBellClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg transition-colors ${className}`}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        {/* Indicador de conexión */}
        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        } opacity-75`} />

        {/* Icono de campana */}
        <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'text-emerald-600' : ''}`} />

        {/* Contador de notificaciones no leídas */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full px-1.5"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Animación de pulso para notificaciones nuevas */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-lg bg-emerald-400 opacity-25 animate-ping" />
        )}
      </motion.button>

      {/* Dropdown de notificaciones recientes (modo compacto) */}
      <AnimatePresence>
        {showRecentDropdown && !showCenter && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notificaciones Recientes
                </h3>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Ver todas
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentNotifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="p-4 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          !notification.is_read ? 'bg-emerald-500' : 'bg-gray-300'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm ${
                              !notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                          
                          <p className={`text-sm ${
                            !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                          } line-clamp-2`}>
                            {notification.message}
                          </p>

                          {/* Indicadores de prioridad y categoría */}
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                              {getPriorityLabel(notification.priority)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(notification.category)}`}>
                              {getCategoryLabel(notification.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {recentNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowRecentDropdown(false);
                    setShowNotifications(true);
                  }}
                  className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar dropdown */}
      {showRecentDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowRecentDropdown(false)}
        />
      )}

      {/* Centro completo de notificaciones */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        compact={false}
      />
    </div>
  );
};

// Utilidades
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('es-CL');
};

const getPriorityColor = (priority: string): string => {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getPriorityLabel = (priority: string): string => {
  const labels = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
  return labels[priority as keyof typeof labels] || priority;
};

const getCategoryColor = (category: string): string => {
  const colors = {
    workflow: 'bg-purple-100 text-purple-800',
    spending: 'bg-green-100 text-green-800',
    system: 'bg-gray-100 text-gray-800',
    receipt: 'bg-blue-100 text-blue-800',
    reminder: 'bg-indigo-100 text-indigo-800',
    alert: 'bg-red-100 text-red-800'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getCategoryLabel = (category: string): string => {
  const labels = {
    workflow: 'Workflow',
    spending: 'Gastos',
    system: 'Sistema',
    receipt: 'Recibos',
    reminder: 'Recordatorio',
    alert: 'Alerta'
  };
  return labels[category as keyof typeof labels] || category;
};

export default NotificationBell;
