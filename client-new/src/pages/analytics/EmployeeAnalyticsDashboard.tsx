import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { receiptService } from '../../services/receiptService';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EmployeeStats {
  total_receipts: number;
  total_amount: number;
  average_receipt: number;
  this_month: number;
  last_month: number;
  monthly_trend: 'up' | 'down' | 'stable';
  category_breakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  recent_receipts: Array<{
    id: string;
    date: string;
    amount: number;
    vendor: string;
    category: string;
  }>;
}

interface EmployeeInfo {
  name: string;
  email: string;
  department?: string;
  position?: string;
  company_name?: string;
  employer_name?: string;
}

const EmployeeAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user) {
      fetchEmployeeAnalytics();
      fetchEmployeeInfo();
    }
  }, [user, selectedPeriod]);

  const fetchEmployeeAnalytics = async () => {
    try {
      setLoading(true);
      // Obtener estadísticas básicas del empleado
      const receipts = await receiptService.getReceipts();
      
      // Calcular estadísticas
      const totalReceipts = receipts.length;
      const totalAmount = receipts.reduce((sum: number, receipt: any) => sum + (receipt.totalAmount || 0), 0);
      const averageReceipt = totalReceipts > 0 ? totalAmount / totalReceipts : 0;
      
      // Filtrar por período
      const now = new Date();
      const periodMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
      };
      
      const cutoffDate = new Date(now.getTime() - periodMs[selectedPeriod]);
      const periodReceipts = receipts.filter((receipt: any) => 
        new Date(receipt.date || receipt.createdAt) >= cutoffDate
      );
      
      // Calcular tendencia mensual (comparar últimos 30 días vs 30 días anteriores)
      const thisMonth = receipts.filter((receipt: any) => {
        const receiptDate = new Date(receipt.date || receipt.createdAt);
        return receiptDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).reduce((sum: number, receipt: any) => sum + (receipt.totalAmount || 0), 0);
      
      const lastMonth = receipts.filter((receipt: any) => {
        const receiptDate = new Date(receipt.date || receipt.createdAt);
        return receiptDate >= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) &&
               receiptDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).reduce((sum: number, receipt: any) => sum + (receipt.totalAmount || 0), 0);
      
      let monthlyTrend: 'up' | 'down' | 'stable' = 'stable';
      if (thisMonth > lastMonth * 1.1) monthlyTrend = 'up';
      else if (thisMonth < lastMonth * 0.9) monthlyTrend = 'down';
      
      // Análisis por categorías
      const categoryMap = new Map();
      periodReceipts.forEach((receipt: any) => {
        const category = receipt.category || 'Sin categoría';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { amount: 0, count: 0 });
        }
        const current = categoryMap.get(category);
        current.amount += receipt.totalAmount || 0;
        current.count += 1;
      });
      
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]: [string, any]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);
      
      // Recibos recientes
      const recentReceipts = receipts
        .sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
        .slice(0, 5)
        .map((receipt: any) => ({
          id: receipt.id || receipt._id,
          date: receipt.date || receipt.createdAt,
          amount: receipt.totalAmount || 0,
          vendor: receipt.companyName || receipt.vendor || 'Proveedor desconocido',
          category: receipt.category || 'Sin categoría'
        }));
      
      setStats({
        total_receipts: totalReceipts,
        total_amount: totalAmount,
        average_receipt: averageReceipt,
        this_month: thisMonth,
        last_month: lastMonth,
        monthly_trend: monthlyTrend,
        category_breakdown: categoryBreakdown,
        recent_receipts: recentReceipts
      });
      
    } catch (error) {
      console.error('Error fetching employee analytics:', error);
      toast.error('Error al cargar analytics del empleado');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeInfo = async () => {
    try {
      if (user) {
        setEmployeeInfo({
          name: user.name || user.email,
          email: user.email,
          department: user.department,
          position: user.position,
          company_name: user.company_name,
          employer_name: user.employer_name
        });
      }
    } catch (error) {
      console.error('Error fetching employee info:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Dashboard de Gastos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Análisis personal de tus gastos y recibos
              </p>
            </div>
            
            {/* Selector de período */}
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del Empleado */}
        {employeeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border mb-8 p-6"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{employeeInfo.name}</h3>
                <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                  <span>{employeeInfo.email}</span>
                  {employeeInfo.department && (
                    <span className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {employeeInfo.department}
                    </span>
                  )}
                  {employeeInfo.position && (
                    <span className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {employeeInfo.position}
                    </span>
                  )}
                </div>
                {employeeInfo.company_name && (
                  <p className="text-xs text-gray-400 mt-1">
                    {employeeInfo.company_name}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recibos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_receipts || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gasto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.total_amount || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio por Recibo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.average_receipt || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {stats?.monthly_trend === 'up' ? (
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">↑</span>
                  </div>
                ) : stats?.monthly_trend === 'down' ? (
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">↓</span>
                  </div>
                ) : (
                  <ClockIcon className="h-8 w-8 text-gray-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.this_month || 0)}
                </p>
                <p className={`text-xs ${
                  stats?.monthly_trend === 'up' ? 'text-red-600' : 
                  stats?.monthly_trend === 'down' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  vs {formatCurrency(stats?.last_month || 0)} mes anterior
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Breakdown por categorías */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Gastos por Categoría
            </h3>
            <div className="space-y-4">
              {stats?.category_breakdown.slice(0, 5).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.count} recibos ({category.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recibos recientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recibos Recientes
            </h3>
            <div className="space-y-4">
              {stats?.recent_receipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {receipt.vendor}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatDate(receipt.date)}</span>
                      <span>•</span>
                      <span>{receipt.category}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAnalyticsDashboard;
