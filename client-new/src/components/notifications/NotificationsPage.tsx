// src/pages/notifications/NotificationsPage.tsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BellIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
  } from '@heroicons/react/24/outline';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  if (loading) {
    return <div>Cargando notificaciones...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <button
          onClick={handleMarkAllAsRead}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay notificaciones
            </li>
          ) : (
            notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default NotificationsPage;