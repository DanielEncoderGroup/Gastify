/**
 * Servicio para gestión de límites de gasto por empleado
 */

import api from './api';

// Endpoint base para límites de gasto
const SPENDING_LIMITS_BASE = '/spending-limits';

export interface SpendingLimit {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  limit_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'per_transaction';
  limit_amount: number;
  currency: string;
  category_restrictions?: string[]; // Categorías específicas donde aplica el límite
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface SpendingUsage {
  employee_id: string;
  employee_name: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  total_spent: number;
  transaction_count: number;
  categories_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  limits_status: Array<{
    limit_id: string;
    limit_type: string;
    limit_amount: number;
    current_usage: number;
    usage_percentage: number;
    is_exceeded: boolean;
    days_until_reset: number;
  }>;
}

export interface LimitAlert {
  id: string;
  employee_id: string;
  employee_name: string;
  limit_id: string;
  limit_type: string;
  limit_amount: number;
  current_usage: number;
  exceeded_amount: number;
  alert_type: 'warning' | 'exceeded' | 'approaching';
  receipt_id?: string;
  receipt_amount?: number;
  created_at: string;
  is_resolved: boolean;
}

export interface CreateLimitRequest {
  employee_id: string;
  limit_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'per_transaction';
  limit_amount: number;
  currency?: string;
  category_restrictions?: string[];
  is_active?: boolean;
}

export interface BulkLimitRequest {
  employee_ids: string[];
  limit_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'per_transaction';
  limit_amount: number;
  currency?: string;
  category_restrictions?: string[];
  is_active?: boolean;
}

class SpendingLimitsService {
  // Gestión de límites
  async getSpendingLimits(employeeId?: string): Promise<SpendingLimit[]> {
    const params = employeeId ? { employee_id: employeeId } : {};
    const response = await api.get(`${SPENDING_LIMITS_BASE}`, { params });
    return response.data;
  }

  async getSpendingLimit(limitId: string): Promise<SpendingLimit> {
    const response = await api.get(`${SPENDING_LIMITS_BASE}/${limitId}`);
    return response.data;
  }

  async createSpendingLimit(limitData: CreateLimitRequest): Promise<SpendingLimit> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}`, limitData);
    return response.data;
  }

  async createBulkLimits(bulkData: BulkLimitRequest): Promise<SpendingLimit[]> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}/bulk`, bulkData);
    return response.data;
  }

  async updateSpendingLimit(limitId: string, updates: Partial<CreateLimitRequest>): Promise<SpendingLimit> {
    const response = await api.put(`${SPENDING_LIMITS_BASE}/${limitId}`, updates);
    return response.data;
  }

  async deleteSpendingLimit(limitId: string): Promise<void> {
    await api.delete(`${SPENDING_LIMITS_BASE}/${limitId}`);
  }

  async activateLimit(limitId: string): Promise<SpendingLimit> {
    const response = await api.put(`${SPENDING_LIMITS_BASE}/${limitId}`, { is_active: true });
    return response.data;
  }

  async deactivateLimit(limitId: string): Promise<SpendingLimit> {
    const response = await api.put(`${SPENDING_LIMITS_BASE}/${limitId}`, { is_active: false });
    return response.data;
  }

  // Monitoreo de uso
  async getSpendingUsage(
    employeeId?: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<SpendingUsage[]> {
    const params = {
      employee_id: employeeId,
      period_type: periodType
    };
    const response = await api.get(`${SPENDING_LIMITS_BASE}/usage`, { params });
    return response.data;
  }

  async getEmployeeUsage(employeeId: string): Promise<SpendingUsage> {
    const response = await api.get(`${SPENDING_LIMITS_BASE}/usage`, { params: { employee_id: employeeId } });
    return response.data;
  }

  // Alertas y notificaciones
  async getLimitAlerts(
    employeeId?: string,
    unresolved?: boolean
  ): Promise<LimitAlert[]> {
    const params = {
      employee_id: employeeId,
      unresolved_only: unresolved
    };
    const response = await api.get(`${SPENDING_LIMITS_BASE}/alerts`, { params });
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<LimitAlert> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}/alerts/${alertId}/resolve`);
    return response.data;
  }

  async resolveBulkAlerts(alertIds: string[]): Promise<LimitAlert[]> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}/alerts/bulk-resolve`, {
      alert_ids: alertIds
    });
    return response.data;
  }

  // Validación de transacciones
  async validateTransaction(
    employeeId: string,
    amount: number,
    category?: string
  ): Promise<{
    is_valid: boolean;
    exceeded_limits: Array<{
      limit_id: string;
      limit_type: string;
      limit_amount: number;
      current_usage: number;
      would_exceed_by: number;
    }>;
    warnings: Array<{
      limit_id: string;
      limit_type: string;
      usage_percentage: number;
      message: string;
    }>;
  }> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}/validate-transaction`, {
      employee_id: employeeId,
      amount,
      category
    });
    return response.data;
  }

  // Reportes y estadísticas
  async getSpendingReport(
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ): Promise<{
    period: { start: string; end: string };
    total_employees: number;
    total_limits: number;
    total_violations: number;
    average_compliance_rate: number;
    employees_summary: Array<{
      employee_id: string;
      employee_name: string;
      total_spent: number;
      limits_count: number;
      violations_count: number;
      compliance_rate: number;
    }>;
    categories_analysis: Array<{
      category: string;
      total_spent: number;
      violations_count: number;
      average_limit: number;
    }>;
  }> {
    const response = await api.get(`${SPENDING_LIMITS_BASE}/reports/spending`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        employee_ids: employeeIds
      }
    });
    return response.data;
  }

  // Templates de límites predefinidos
  async getLimitTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    limits: Array<{
      limit_type: string;
      limit_amount: number;
      category_restrictions?: string[];
    }>;
  }>> {
    const response = await api.get(`${SPENDING_LIMITS_BASE}/templates`);
    return response.data;
  }

  async applyTemplate(
    templateId: string,
    employeeIds: string[]
  ): Promise<SpendingLimit[]> {
    const response = await api.post(`${SPENDING_LIMITS_BASE}/templates/${templateId}/apply`, {
      employee_ids: employeeIds
    });
    return response.data;
  }

  // Utilidades
  formatCurrency(amount: number, currency: string = 'CLP'): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  calculateUsagePercentage(currentUsage: number, limit: number): number {
    return limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;
  }

  getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  getLimitTypeLabel(type: string): string {
    const labels = {
      daily: 'Diario',
      weekly: 'Semanal', 
      monthly: 'Mensual',
      yearly: 'Anual',
      per_transaction: 'Por Transacción'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getDaysUntilReset(limitType: string): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (limitType) {
      case 'daily':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
      case 'weekly':
        const nextWeek = new Date(today);
        const daysUntilSunday = 7 - today.getDay();
        nextWeek.setDate(nextWeek.getDate() + daysUntilSunday);
        return Math.ceil((nextWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
      case 'monthly':
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
      case 'yearly':
        const nextYear = new Date(today.getFullYear() + 1, 0, 1);
        return Math.ceil((nextYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
      default:
        return 0;
    }
  }
}

export const spendingLimitsService = new SpendingLimitsService();
export default spendingLimitsService;
