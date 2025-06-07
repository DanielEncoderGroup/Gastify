import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, Notification } from '../services/notificationService';
import { toast } from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Función para limpiar completamente el estado
  const cleanupState = useCallback(() => {
    console.log('NotificationContext: Limpiando estado...');
    setIsCleaningUp(true);
    
    setNotifications([]);
    setUnreadCount(0);
    setIsConnected(false);
    setConnectionAttempts(0);
    setLoading(false);
    
    if (websocket) {
      console.log('NotificationContext: Cerrando WebSocket existente');
      websocket.close(1000, 'User logged out or cleanup');
      setWebsocket(null);
    }
    
    setIsCleaningUp(false);
  }, [websocket]);

  // Obtener notificaciones del servidor
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id || isCleaningUp) {
      console.log('NotificationContext: No se pueden obtener notificaciones - usuario no autenticado o limpiando');
      return;
    }

    try {
      setLoading(true);
      console.log('NotificationContext: Obteniendo notificaciones...');
      const fetchedNotifications = await notificationService.getUserNotifications(0, 50);
      setNotifications(fetchedNotifications);
      
      // Calcular notificaciones no leídas
      const unread = fetchedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      console.log(`NotificationContext: ${fetchedNotifications.length} notificaciones obtenidas, ${unread} no leídas`);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Solo mostrar toast si es un error real, no si es por autenticación
      if (isAuthenticated && user?.id) {
        toast.error('Error al cargar notificaciones');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, isCleaningUp]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated || !user?.id) return;

    try {
      await notificationService.markAsRead(notificationId);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Actualizar contador de no leídas
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (isAuthenticated && user?.id) {
        toast.error('Error al marcar notificación como leída');
      }
    }
  }, [isAuthenticated, user?.id]);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        // Actualizar estado local
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        
        setUnreadCount(0);
        toast.success(`${result.marked_read} notificaciones marcadas como leídas`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (isAuthenticated && user?.id) {
        toast.error('Error al marcar todas las notificaciones como leídas');
      }
    }
  }, [isAuthenticated, user?.id]);

  // Agregar nueva notificación (desde WebSocket)
  const addNotification = useCallback((notification: Notification) => {
    if (!isAuthenticated || !user?.id) return;
    
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Mostrar toast para notificaciones nuevas
    toast.success(`${notification.title}: ${notification.message}`, {
      duration: 4000,
    });
  }, [isAuthenticated, user?.id]);

  // Función para conectar WebSocket con validaciones estrictas
  const connectWebSocket = useCallback(() => {
    // Validaciones múltiples antes de intentar conectar
    if (!isAuthenticated) {
      console.log('NotificationContext: No conectando WebSocket - usuario no autenticado');
      return;
    }

    if (!user?.id) {
      console.log('NotificationContext: No conectando WebSocket - sin ID de usuario');
      return;
    }

    if (isCleaningUp) {
      console.log('NotificationContext: No conectando WebSocket - en proceso de limpieza');
      return;
    }

    // Verificar que hay un token válido
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('NotificationContext: No conectando WebSocket - sin token');
      return;
    }

    // Verificar si ya hay una conexión activa
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      console.log('NotificationContext: WebSocket ya conectado');
      return;
    }

    // Cerrar conexión existente si la hay
    if (websocket) {
      console.log('NotificationContext: Cerrando WebSocket existente antes de crear nuevo');
      websocket.close();
    }

    try {
      console.log(`NotificationContext: Intentando conectar WebSocket para usuario ${user.id}...`);
      const ws = notificationService.connectWebSocket(user.id);
      
      ws.onopen = () => {
        console.log('NotificationContext: WebSocket conectado exitosamente');
        setIsConnected(true);
        setConnectionAttempts(0);
      };
      
      ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          console.log('NotificationContext: Notificación recibida via WebSocket:', notification);
          addNotification(notification);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`NotificationContext: WebSocket cerrado - código: ${event.code}, razón: ${event.reason}`);
        setIsConnected(false);
        
        // Solo intentar reconectar si:
        // 1. Fue un cierre inesperado (no código 1000)
        // 2. El usuario sigue autenticado
        // 3. No estamos limpiando
        // 4. No hemos excedido el máximo de intentos
        if (
          event.code !== 1000 && 
          isAuthenticated && 
          user?.id && 
          !isCleaningUp && 
          connectionAttempts < 3
        ) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
          console.log(`NotificationContext: Reintentando conexión WebSocket en ${delay}ms (intento ${connectionAttempts + 1}/3)`);
          
          setTimeout(() => {
            if (isAuthenticated && user?.id && !isCleaningUp) {
              setConnectionAttempts(prev => prev + 1);
              connectWebSocket();
            }
          }, delay);
        }
      };
      
      ws.onerror = (error) => {
        console.error('NotificationContext: WebSocket error:', error);
        setIsConnected(false);
      };
      
      setWebsocket(ws);
      
    } catch (error) {
      console.error('NotificationContext: Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.id, isCleaningUp, websocket, connectionAttempts, addNotification]);

  // Effect principal para manejar autenticación
  useEffect(() => {
    console.log('NotificationContext: Cambio en autenticación', { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user?.id) {
      console.log('NotificationContext: Usuario no autenticado, limpiando estado');
      cleanupState();
      return;
    }

    // Usuario autenticado: cargar notificaciones
    console.log('NotificationContext: Usuario autenticado, cargando notificaciones');
    fetchNotifications();
    
    // Conectar WebSocket después de un pequeño delay para asegurar que todo esté listo
    const timer = setTimeout(() => {
      if (isAuthenticated && user?.id && !isCleaningUp) {
        console.log('NotificationContext: Iniciando conexión WebSocket');
        connectWebSocket();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, user?.id]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      console.log('NotificationContext: Desmontando componente, limpiando recursos');
      if (websocket) {
        websocket.close(1000, 'Component unmounting');
      }
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};