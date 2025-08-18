import axios from 'axios';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

class NotificationService {
  private baseURL = '/api/notifications';

  // Obtener notificaciones del usuario
  async getUserNotifications(
    skip: number = 0,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.baseURL}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          skip,
          limit,
          unread_only: unreadOnly,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseURL}/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(): Promise<{ success: boolean; marked_read: number }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseURL}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

    // Obtener conteo de no leídas
    async getUnreadCount(): Promise<number> {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${this.baseURL}/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data.unread_count;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    }

  // Crear conexión WebSocket para notificaciones en tiempo real
  connectWebSocket(userId: string): WebSocket {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/websockets/ws/${userId}`;
    console.log('🔗 URL WebSocket generada:', wsUrl);
    return new WebSocket(wsUrl);
  }
}

export const notificationService = new NotificationService();