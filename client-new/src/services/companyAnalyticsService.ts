/**
 * Servicio para Analytics Empresariales - KPIs Empleador-Empleado
 * Métricas específicas para gestión corporativa
 */

import api from './api';

export interface CompanyOverview {
  total_expenses: number;
  previous_expenses: number;
  growth_rate: number;
  total_employees: number;
  active_employees: number;
  avg_per_employee: number;
  total_receipts: number;
}

export interface EmployeeRanking {
  employee_name: string;
  department?: string;
  position?: string;
  total_amount: number;
  receipt_count: number;
  avg_per_receipt: number;
}

export interface CategoryBreakdown {
  _id: string;
  total_amount: number;
  receipt_count: number;
}

export interface DepartmentSummary {
  department: string;
  total_amount: number;
  receipt_count: number;
  employee_count: number;
  avg_per_employee: number;
}

export interface WeeklyTrend {
  _id: {
    week: number;
    year: number;
  };
  total_amount: number;
  receipt_count: number;
}

export interface CompanyAlert {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface CompanyInsight {
  title: string;
  value: string;
  subtitle: string;
}

export interface CompanyDashboardData {
  success: boolean;
  period: 'weekly' | 'monthly' | 'quarterly';
  company_overview: CompanyOverview;
  employee_ranking: EmployeeRanking[];
  category_breakdown: CategoryBreakdown[];
  department_summary: DepartmentSummary[];
  weekly_trend: WeeklyTrend[];
  alerts: CompanyAlert[];
  insights: CompanyInsight[];
  generated_at: string;
}

export interface EmployeePerformance {
  success: boolean;
  employee: {
    name: string;
    department: string;
    position: string;
  };
  performance: {
    total_spent: number;
    receipt_count: number;
    avg_per_receipt: number;
    company_avg: number;
  };
  period_days: number;
  generated_at: string;
}

class CompanyAnalyticsService {
  /**
   * Obtiene dashboard empresarial completo con todos los KPIs
   */
  async getCompanyDashboard(period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'): Promise<CompanyDashboardData> {
    try {
      console.log(`📊 Obteniendo dashboard empresarial (${period})...`);
      
      const response = await api.get(`/company-analytics/company-dashboard?period=${period}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo dashboard empresarial');
      }
      
      console.log(`✅ Dashboard empresarial obtenido: ${response.data.company_overview.total_employees} empleados, $${response.data.company_overview.total_expenses.toLocaleString()}`);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error obteniendo dashboard empresarial:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo analytics empresariales');
    }
  }

  /**
   * Obtiene performance detallado de un empleado específico
   */
  async getEmployeePerformance(employeeId: string, days: number = 30): Promise<EmployeePerformance> {
    try {
      console.log(`📈 Obteniendo performance del empleado ${employeeId} (${days} días)...`);
      
      const response = await api.get(`/company-analytics/employee-performance/${employeeId}?days=${days}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo performance del empleado');
      }
      
      console.log(`✅ Performance obtenido: ${response.data.employee.name}, $${response.data.performance.total_spent.toLocaleString()}`);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error obteniendo performance del empleado:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo performance del empleado');
    }
  }

  /**
   * Formatea moneda chilena
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea porcentaje
   */
  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  /**
   * Calcula color basado en el crecimiento
   */
  getGrowthColor(growthRate: number): string {
    if (growthRate > 10) return 'text-red-600';
    if (growthRate > 0) return 'text-yellow-600';
    return 'text-emerald-600';
  }

  /**
   * Obtiene color de severidad para alertas
   */
  getAlertColor(severity: string): string {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      default: return 'border-blue-500 bg-blue-50 text-blue-700';
    }
  }

  /**
   * Procesa datos para gráficos de tendencia
   */
  processTrendData(weeklyTrend: WeeklyTrend[]): Array<{week: string, amount: number, receipts: number}> {
    return weeklyTrend.map(trend => ({
      week: `S${trend._id.week}/${trend._id.year}`,
      amount: trend.total_amount,
      receipts: trend.receipt_count
    }));
  }

  /**
   * Genera resumen ejecutivo
   */
  generateExecutiveSummary(data: CompanyDashboardData): string {
    const overview = data.company_overview;
    const topCategory = data.category_breakdown[0];
    const topEmployee = data.employee_ranking[0];
    
    let summary = `En ${data.period === 'monthly' ? 'el último mes' : data.period === 'weekly' ? 'la última semana' : 'el último trimestre'}, `;
    summary += `${overview.active_employees} de ${overview.total_employees} empleados generaron gastos por ${this.formatCurrency(overview.total_expenses)}`;
    
    if (overview.growth_rate !== 0) {
      summary += `, representando un ${overview.growth_rate > 0 ? 'aumento' : 'disminución'} del ${Math.abs(overview.growth_rate).toFixed(1)}% respecto al período anterior`;
    }
    
    if (topCategory) {
      summary += `. La categoría principal fue "${topCategory._id}" con ${this.formatCurrency(topCategory.total_amount)}`;
    }
    
    if (topEmployee) {
      summary += `. ${topEmployee.employee_name} lideró los gastos con ${this.formatCurrency(topEmployee.total_amount)}`;
    }
    
    summary += '.';
    return summary;
  }
}

export const companyAnalyticsService = new CompanyAnalyticsService();
