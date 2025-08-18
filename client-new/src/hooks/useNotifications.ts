import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import notificationsService, { 
  Notification, 
  NotificationStats,
  IntelligentAlert 
} from '../services/notificationsService';

interface UseNotificationsReturn {
  notifications: Notification[];
  intelligentAlerts: IntelligentAlert[];
  stats: NotificationStats | null;
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [intelligentAlerts, setIntelligentAlerts] = useState<IntelligentAlert[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Conectar notificaciones en tiempo real
  const connectRealTime = useCallback(() => {
    if (!user?.id) return;

    try {
      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setStats(prev => prev ? {
          ...prev,
          total_notifications: prev.total_notifications + 1,
          unread_count: prev.unread_count + 1
        } : null);
      };

      notificationsService.startRealTimeNotifications(user.id, handleNewNotification);
      setIsConnected(true);
    } catch (error) {
      console.error('❌ [useNotifications] Error conectando:', error);
      setIsConnected(false);
    }
  }, [user?.id]);

  // Desconectar notificaciones en tiempo real
  const disconnectRealTime = useCallback(() => {
    notificationsService.stopRealTimeNotifications();
    setIsConnected(false);
  }, []);

  // Cargar notificaciones y datos
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const [notificationsData, alertsData, statsData] = await Promise.all([
        notificationsService.getNotifications({ limit: 50 }),
        notificationsService.getIntelligentAlerts({ resolved: false }),
        notificationsService.getNotificationStats()
      ]);
      
      setNotifications(notificationsData.notifications);
      setIntelligentAlerts(alertsData);
      setStats(statsData);
      setUnreadCount(statsData.unread_count);
    } catch (error) {
      console.error('❌ [useNotifications] Error cargando notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      setStats(prev => prev ? { ...prev, unread_count: Math.max(0, prev.unread_count - 1) } : null);
    } catch (error) {
      console.error('❌ [useNotifications] Error marcando como leída:', error);
      throw error;
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      setStats(prev => prev ? { ...prev, unread_count: 0 } : null);
    } catch (error) {
      console.error('❌ [useNotifications] Error marcando todas como leídas:', error);
      throw error;
    }
  }, []);

  // Resolver alerta inteligente
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await notificationsService.resolveIntelligentAlert(alertId);
      setIntelligentAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('❌ [useNotifications] Error resolviendo alerta:', error);
      throw error;
    }
  }, []);

  // Efectos
  useEffect(() => {
    if (user?.id) {
      refreshNotifications();
      connectRealTime();
    }

    return () => {
      disconnectRealTime();
    };
  }, [user?.id, refreshNotifications, connectRealTime, disconnectRealTime]);

  return {
    notifications,
    intelligentAlerts,
    stats,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    resolveAlert,
  };
};
