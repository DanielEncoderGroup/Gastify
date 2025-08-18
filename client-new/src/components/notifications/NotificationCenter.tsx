/**
 * Centro de notificaciones con filtros avanzados y gestión inteligente
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import notificationsService, { 
  Notification, 
  NotificationStats,
  IntelligentAlert 
} from '../../services/notificationsService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  compact?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  compact = false
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [intelligentAlerts, setIntelligentAlerts] = useState<IntelligentAlert[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    type: 'all',
    is_read: 'all'
  });
  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts' | 'stats'>('notifications');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsData, alertsData, statsData] = await Promise.all([
        notificationsService.getNotifications({
          category: filters.category !== 'all' ? filters.category : undefined,
          priority: filters.priority !== 'all' ? filters.priority : undefined,
          type: filters.type !== 'all' ? filters.type : undefined,
          is_read: filters.is_read !== 'all' ? filters.is_read === 'true' : undefined,
          limit: 50
        }),
        notificationsService.getIntelligentAlerts({ resolved: false }),
        notificationsService.getNotificationStats()
      ]);

      setNotifications(notificationsData.notifications);
      setIntelligentAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (isOpen) {
      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setStats(prev => prev ? {
          ...prev,
          total_notifications: prev.total_notifications + 1,
          unread_count: prev.unread_count + 1
        } : null);
      };

      notificationsService.startRealTimeNotifications('current_user', handleNewNotification);

      return () => {
        notificationsService.stopRealTimeNotifications();
      };
    }
  }, [isOpen]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filters.category !== 'all' && notification.category !== filters.category) return false;
      if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
      if (filters.type !== 'all' && notification.type !== filters.type) return false;
      if (filters.is_read !== 'all') {
        const isRead = filters.is_read === 'true';
        if (notification.is_read !== isRead) return false;
      }
      return true;
    });
  }, [notifications, filters]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setStats(prev => prev ? { ...prev, unread_count: prev.unread_count - 1 } : null);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead(
        filters.category !== 'all' ? filters.category : undefined
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setStats(prev => prev ? { ...prev, unread_count: 0 } : null);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (selectedNotifications.size === 0) return;

    try {
      const notificationIds = Array.from(selectedNotifications);
      
      if (action === 'read') {
        await notificationsService.markMultipleAsRead(notificationIds);
        setNotifications(prev => prev.map(n => 
          selectedNotifications.has(n.id) ? { ...n, is_read: true } : n
        ));
        toast.success(`${notificationIds.length} notificaciones marcadas como leídas`);
      } else {
        await notificationsService.deleteMultiple(notificationIds);
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
        toast.success(`${notificationIds.length} notificaciones eliminadas`);
      }
      
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      toast.error(`Error en acción masiva`);
    }
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(notificationId);
      } else {
        newSet.delete(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await notificationsService.resolveIntelligentAlert(alertId);
      setIntelligentAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta resuelta');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver alerta');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-white rounded-lg shadow-xl ${
            compact ? 'max-w-md w-full max-h-96' : 'max-w-4xl w-full max-h-[80vh]'
          } flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <BellIcon className="w-6 h-6 text-emerald-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Centro de Notificaciones</h2>
                {stats && (
                  <p className="text-sm text-gray-500">
                    {stats.unread_count} sin leer de {stats.total_notifications} total
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={onClose} className="p-2">
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              Notificaciones
              {stats && stats.unread_count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  {stats.unread_count}
                </span>
              )}
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'alerts'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('alerts')}
            >
              Alertas Inteligentes
              {intelligentAlerts.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  {intelligentAlerts.length}
                </span>
              )}
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'stats'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              Estadísticas
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {activeTab === 'notifications' && (
                  <NotificationsTab
                    notifications={filteredNotifications}
                    selectedNotifications={selectedNotifications}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onBulkAction={handleBulkAction}
                    onSelectNotification={handleSelectNotification}
                    onSelectAll={handleSelectAll}
                  />
                )}

                {activeTab === 'alerts' && (
                  <AlertsTab
                    alerts={intelligentAlerts}
                    onResolveAlert={handleResolveAlert}
                  />
                )}

                {activeTab === 'stats' && stats && (
                  <StatsTab stats={stats} />
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Tab de Notificaciones
const NotificationsTab: React.FC<{
  notifications: Notification[];
  selectedNotifications: Set<string>;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onBulkAction: (action: 'read' | 'delete') => void;
  onSelectNotification: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}> = ({
  notifications,
  selectedNotifications,
  filters,
  onFiltersChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onBulkAction,
  onSelectNotification,
  onSelectAll
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <select
              value={filters.category}
              onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">Todas las categorías</option>
              <option value="workflow">Workflows</option>
              <option value="spending">Gastos</option>
              <option value="system">Sistema</option>
              <option value="receipt">Recibos</option>
              <option value="reminder">Recordatorios</option>
              <option value="alert">Alertas</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <select
              value={filters.is_read}
              onChange={(e) => onFiltersChange({ ...filters, is_read: e.target.value })}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">Todas</option>
              <option value="false">Sin leer</option>
              <option value="true">Leídas</option>
            </select>
          </div>

          <Button size="sm" onClick={onMarkAllAsRead} className="flex items-center">
            <CheckIcon className="w-4 h-4 mr-1" />
            Marcar todas como leídas
          </Button>
        </div>

        {/* Acciones masivas */}
        {selectedNotifications.size > 0 && (
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
            <span className="text-sm text-blue-800">
              {selectedNotifications.size} notificaciones seleccionadas
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => onBulkAction('read')}>
                Marcar como leídas
              </Button>
              <Button size="sm" variant="outline" onClick={() => onBulkAction('delete')}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label className="ml-2 text-sm text-gray-600">Seleccionar todas</label>
            </div>

            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.has(notification.id)}
                onSelect={(checked) => onSelectNotification(notification.id, checked)}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Tab de Alertas Inteligentes
const AlertsTab: React.FC<{
  alerts: IntelligentAlert[];
  onResolveAlert: (id: string) => void;
}> = ({ alerts, onResolveAlert }) => {
  return (
    <div className="p-4 h-full overflow-y-auto">
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay alertas inteligentes pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity}
                </span>
              </div>

              {alert.recommendations.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Recomendaciones:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {alert.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-emerald-600 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <span>Confianza: {alert.confidence_score}%</span>
                  <span className="mx-2">•</span>
                  <span>{notificationsService.formatTimeAgo(alert.created_at)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => onResolveAlert(alert.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Resolver
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Tab de Estadísticas
const StatsTab: React.FC<{ stats: NotificationStats }> = ({ stats }) => {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen general */}
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4">Resumen General</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de notificaciones:</span>
              <span className="font-medium">{stats.total_notifications}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sin leer:</span>
              <span className="font-medium text-red-600">{stats.unread_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo promedio de lectura:</span>
              <span className="font-medium">{stats.response_times.average_read_time}m</span>
            </div>
          </div>
        </Card>

        {/* Por categoría */}
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4">Por Categoría</h3>
          <div className="space-y-2">
            {Object.entries(stats.by_category).map(([category, data]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{notificationsService.getNotificationIcon(category)}</span>
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{data.total}</span>
                  {data.unread > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                      {data.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Componente de notificación individual
const NotificationItem: React.FC<{
  notification: Notification;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onMarkAsRead: () => void;
}> = ({ notification, isSelected, onSelect, onMarkAsRead }) => {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead();
    }
  };

  return (
    <div className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0" onClick={handleClick}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">{notificationsService.getNotificationIcon(notification.category)}</span>
              <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                {notification.title}
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${notificationsService.getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </span>
              <span className="text-xs text-gray-500">
                {notificationsService.formatTimeAgo(notification.created_at)}
              </span>
            </div>
          </div>

          <p className={`text-sm ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.message}
          </p>

          {notification.is_actionable && notification.action_url && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = notification.action_url!;
                }}
              >
                {notification.action_label || 'Ver detalles'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
