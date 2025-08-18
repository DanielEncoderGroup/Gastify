/**
 * Servicio avanzado de notificaciones y alertas inteligentes
 */

import api from './api';
import toast from 'react-hot-toast';

// Endpoint base
const ADVANCED_NOTIFICATIONS_BASE = '/advanced-notifications';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  category: 'workflow' | 'spending' | 'system' | 'receipt' | 'reminder' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  is_actionable: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: {
    workflow_id?: string;
    receipt_id?: string;
    limit_id?: string;
    employee_id?: string;
    amount?: number;
    due_date?: string;
    [key: string]: any;
  };
  expires_at?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationRule {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_active: boolean;
  triggers: {
    workflow_events?: string[]; // 'approval_required', 'approved', 'rejected', 'escalated'
    spending_events?: string[]; // 'limit_exceeded', 'limit_warning', 'unusual_spending'
    receipt_events?: string[]; // 'receipt_uploaded', 'receipt_processed', 'ocr_low_confidence'
    time_based?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time?: string; // HH:MM format
      days_of_week?: number[]; // 0-6, Sunday=0
    };
  };
  conditions: {
    amount_threshold?: number;
    categories?: string[];
    employee_ids?: string[];
    workflow_types?: string[];
  };
  actions: {
    send_notification: boolean;
    send_email: boolean;
    send_sms?: boolean;
    escalate_after?: number; // minutes
    auto_resolve?: boolean;
  };
  created_at: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  notification_quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:MM
    end_time: string; // HH:MM
  };
  categories: {
    workflow: { enabled: boolean; min_priority: string };
    spending: { enabled: boolean; min_priority: string };
    system: { enabled: boolean; min_priority: string };
    receipt: { enabled: boolean; min_priority: string };
    reminder: { enabled: boolean; min_priority: string };
    alert: { enabled: boolean; min_priority: string };
  };
  digest_settings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM
  };
  updated_at: string;
}

export interface IntelligentAlert {
  id: string;
  type: 'spending_pattern' | 'approval_delay' | 'unusual_activity' | 'budget_forecast' | 'compliance_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  affected_entities: {
    employees?: string[];
    categories?: string[];
    amounts?: number[];
    time_range?: { start: string; end: string };
  };
  confidence_score: number; // 0-100
  auto_generated: boolean;
  requires_action: boolean;
  action_deadline?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  by_category: {
    [category: string]: { total: number; unread: number };
  };
  by_priority: {
    [priority: string]: { total: number; unread: number };
  };
  response_times: {
    average_read_time: number; // minutes
    average_action_time: number; // minutes
  };
  recent_activity: Array<{
    date: string;
    count: number;
    categories: { [category: string]: number };
  }>;
}

class NotificationsService {
  private eventSource: EventSource | null = null;
  private subscriptions: Set<(notification: Notification) => void> = new Set();

  // Gestión de notificaciones
  async getNotifications(
    filters?: {
      category?: string;
      type?: string;
      priority?: string;
      is_read?: boolean;
      is_actionable?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}`, { params: filters });
    return response.data;
  }

  async getNotification(notificationId: string): Promise<Notification> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}/${notificationId}`);
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.put(`${ADVANCED_NOTIFICATIONS_BASE}/${notificationId}/read`);
    return response.data;
  }

  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/bulk-read`, notificationIds);
  }

  async markAllAsRead(category?: string): Promise<void> {
    const params = category ? { category } : {};
    await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/read-all`, params);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`${ADVANCED_NOTIFICATIONS_BASE}/${notificationId}`);
  }

  async deleteMultiple(notificationIds: string[]): Promise<void> {
    await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/delete-all`, { notification_ids: notificationIds });
  }

  // Reglas de notificación
  async getNotificationRules(): Promise<NotificationRule[]> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}/rules`);
    return response.data;
  }

  async createNotificationRule(rule: Omit<NotificationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NotificationRule> {
    const response = await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/rules`, rule);
    return response.data;
  }

  async updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const response = await api.put(`${ADVANCED_NOTIFICATIONS_BASE}/rules/${ruleId}`, updates);
    return response.data;
  }

  async deleteNotificationRule(ruleId: string): Promise<void> {
    await api.delete(`${ADVANCED_NOTIFICATIONS_BASE}/rules/${ruleId}`);
  }

  async toggleNotificationRule(ruleId: string, isActive: boolean): Promise<NotificationRule> {
    const response = await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/rules/${ruleId}/toggle`, { is_active: isActive });
    return response.data;
  }

  // Preferencias de notificación
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}/preferences`);
    return response.data;
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/preferences`, preferences);
    return response.data;
  }

  // Alertas inteligentes
  async getIntelligentAlerts(
    filters?: {
      type?: string;
      severity?: string;
      resolved?: boolean;
      limit?: number;
    }
  ): Promise<IntelligentAlert[]> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}/intelligent-alerts`, { params: filters });
    return response.data;
  }

  async resolveIntelligentAlert(alertId: string, resolution_notes?: string): Promise<IntelligentAlert> {
    const response = await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/resolve-alert`, { alert_id: alertId, resolution_notes });
    return response.data;
  }

  async generateIntelligentAlerts(): Promise<IntelligentAlert[]> {
    const response = await api.post(`${ADVANCED_NOTIFICATIONS_BASE}/intelligent-alerts/generate`);
    return response.data;
  }

  // Estadísticas
  async getNotificationStats(
    timeRange?: { start: string; end: string }
  ): Promise<NotificationStats> {
    const response = await api.get(`${ADVANCED_NOTIFICATIONS_BASE}/stats`, { params: timeRange });
    return response.data;
  }

  // Notificaciones en tiempo real
  startRealTimeNotifications(userId: string, onNotification: (notification: Notification) => void): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.subscriptions.add(onNotification);
    
    this.eventSource = new EventSource(`/api/notifications/stream?user_id=${userId}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.subscriptions.forEach(callback => callback(notification));
        
        // Mostrar toast notification automáticamente
        this.showToastNotification(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      // Reconectar después de 5 segundos
      setTimeout(() => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.startRealTimeNotifications(userId, onNotification);
        }
      }, 5000);
    };
  }

  stopRealTimeNotifications(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.subscriptions.clear();
  }

  unsubscribe(callback: (notification: Notification) => void): void {
    this.subscriptions.delete(callback);
  }

  // Mostrar notificación toast
  private showToastNotification(notification: Notification): void {
    const options = {
      duration: this.getToastDuration(notification.priority),
      position: 'top-right' as const,
      style: this.getToastStyle(notification.type),
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, options);
        break;
      case 'error':
      case 'urgent':
        toast.error(notification.message, options);
        break;
      case 'warning':
        toast.error(notification.message, { 
          ...options, 
          icon: '⚠️',
          style: { ...options.style, backgroundColor: '#FEF3C7', color: '#92400E' }
        });
        break;
      default:
        toast(notification.message, options);
    }
  }

  private getToastDuration(priority: string): number {
    switch (priority) {
      case 'critical': return 10000;
      case 'high': return 8000;
      case 'medium': return 6000;
      case 'low': return 4000;
      default: return 6000;
    }
  }

  private getToastStyle(type: string): any {
    switch (type) {
      case 'urgent':
        return {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          fontWeight: 'bold',
          border: '2px solid #EF4444'
        };
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E'
        };
      default:
        return {};
    }
  }

  // Utilidades
  getNotificationIcon(category: string): string {
    const icons = {
      workflow: '📋',
      spending: '💰',
      system: '⚙️',
      receipt: '🧾',
      reminder: '⏰',
      alert: '🚨'
    };
    return icons[category as keyof typeof icons] || '📱';
  }

  getPriorityColor(priority: string): string {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  getCategoryColor(category: string): string {
    const colors = {
      workflow: 'text-purple-600 bg-purple-50',
      spending: 'text-green-600 bg-green-50',
      system: 'text-gray-600 bg-gray-50',
      receipt: 'text-blue-600 bg-blue-50',
      reminder: 'text-indigo-600 bg-indigo-50',
      alert: 'text-red-600 bg-red-50'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  }

  formatTimeAgo(dateString: string): string {
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
  }

  // Templates de reglas predefinidas
  getNotificationRuleTemplates(): Array<{
    name: string;
    description: string;
    template: Omit<NotificationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  }> {
    return [
      {
        name: 'Límites de Gasto Excedidos',
        description: 'Notificar cuando se excedan límites de gasto',
        template: {
          name: 'Límites de Gasto Excedidos',
          description: 'Alerta cuando empleados excedan sus límites de gasto',
          is_active: true,
          triggers: {
            spending_events: ['limit_exceeded', 'limit_warning']
          },
          conditions: {},
          actions: {
            send_notification: true,
            send_email: true,
            escalate_after: 60
          }
        }
      },
      {
        name: 'Aprobaciones Pendientes',
        description: 'Recordar aprobaciones pendientes diariamente',
        template: {
          name: 'Aprobaciones Pendientes',
          description: 'Recordatorio diario de aprobaciones pendientes',
          is_active: true,
          triggers: {
            workflow_events: ['approval_required'],
            time_based: {
              frequency: 'daily',
              time: '09:00'
            }
          },
          conditions: {},
          actions: {
            send_notification: true,
            send_email: true
          }
        }
      },
      {
        name: 'Gastos Inusuales',
        description: 'Detectar patrones de gasto inusuales',
        template: {
          name: 'Gastos Inusuales',
          description: 'Alerta sobre patrones de gasto inusuales',
          is_active: true,
          triggers: {
            spending_events: ['unusual_spending']
          },
          conditions: {
            amount_threshold: 500000
          },
          actions: {
            send_notification: true,
            send_email: true,
            escalate_after: 30
          }
        }
      }
    ];
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
