import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { companyAnalyticsService, CompanyDashboardData } from '../../services/companyAnalyticsService';
import { useToast } from '../../components/ui/Toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const CompanyDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CompanyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const { user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    if (user?.role === 'employer') {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await companyAnalyticsService.getCompanyDashboard(period);
      setDashboardData(data);
      success('Dashboard Actualizado', 'Datos empresariales cargados exitosamente');
    } catch (err: any) {
      error('Error', err.message || 'Error cargando dashboard empresarial');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'employer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold mb-2">Dashboard Empresarial</h2>
          <p className="text-gray-600 mb-4">Este dashboard está disponible solo para empleadores.</p>
          <Button variant="primary" to="/app/receipts">Ir a Mis Recibos</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" withLogo />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold mb-2">Sin Datos</h2>
          <p className="text-gray-600 mb-4">No hay suficientes datos para mostrar analytics.</p>
          <Button variant="primary" onClick={loadDashboardData}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  const { company_overview, employee_ranking, category_breakdown, department_summary, alerts, insights } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                📊 Dashboard Empresarial
              </h1>
              <p className="text-emerald-100">
                {user?.company_name || 'Tu Empresa'} • {companyAnalyticsService.generateExecutiveSummary(dashboardData)}
              </p>
            </div>
            <div className="flex space-x-2">
              {(['weekly', 'monthly', 'quarterly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p 
                      ? 'bg-white text-emerald-600' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-400'
                  }`}
                >
                  {p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensual' : 'Trimestral'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-100">Gastos Totales</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {companyAnalyticsService.formatCurrency(company_overview.total_expenses)}
            </div>
            <div className={`text-sm flex items-center ${
              company_overview.growth_rate >= 0 ? 'text-emerald-100' : 'text-emerald-200'
            }`}>
              {company_overview.growth_rate >= 0 ? '↗' : '↘'} {companyAnalyticsService.formatPercentage(company_overview.growth_rate)} vs anterior
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">Empleados Activos</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {company_overview.active_employees}
            </div>
            <div className="text-sm text-blue-100">
              de {company_overview.total_employees} total
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">Promedio por Empleado</span>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {companyAnalyticsService.formatCurrency(company_overview.avg_per_employee)}
            </div>
            <div className="text-sm text-purple-100">
              {company_overview.total_receipts} recibos total
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100">Insights</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-lg font-bold mb-1">
              {insights[0]?.value || 'N/A'}
            </div>
            <div className="text-sm text-orange-100">
              {insights[0]?.title || 'Sin datos'}
            </div>
          </Card>
        </div>

        {/* Alertas */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">🚨 Alertas y Notificaciones</h3>
            <div className="grid gap-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-l-4 p-4 rounded-lg ${companyAnalyticsService.getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      {alert.type === 'warning' ? '⚠️' : alert.type === 'info' ? 'ℹ️' : '✅'}
                    </span>
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking de Empleados y Categorías */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Empleados */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              🏆 Top Empleados por Gastos
            </h3>
            <div className="space-y-3">
              {employee_ranking.slice(0, 5).map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                    </span>
                    <div>
                      <div className="font-medium">{employee.employee_name}</div>
                      <div className="text-sm text-gray-500">
                        {employee.department} • {employee.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      {companyAnalyticsService.formatCurrency(employee.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.receipt_count} recibos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Categorías */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📊 Gastos por Categoría
            </h3>
            <div className="space-y-3">
              {category_breakdown.slice(0, 5).map((category, index) => {
                const percentage = (category.total_amount / company_overview.total_expenses) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category._id}</span>
                      <span className="text-emerald-600 font-bold">
                        {companyAnalyticsService.formatCurrency(category.total_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}% del total • {category.receipt_count} recibos
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Departamentos */}
        {department_summary && department_summary.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              🏢 Gastos por Departamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {department_summary.map((dept, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{dept.department}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">{companyAnalyticsService.formatCurrency(dept.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Empleados:</span>
                      <span>{dept.employee_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Promedio:</span>
                      <span className="text-emerald-600">{companyAnalyticsService.formatCurrency(dept.avg_per_employee)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-center space-x-4">
          <Button variant="primary" onClick={loadDashboardData}>
            🔄 Actualizar Datos
          </Button>
          <Button variant="secondary" to="/app/employees">
            👥 Ver Empleados
          </Button>
          <Button variant="outline" to="/app/receipts">
            📋 Ver Recibos
          </Button>
        </div>
      </div>
    </div>
  );
};
