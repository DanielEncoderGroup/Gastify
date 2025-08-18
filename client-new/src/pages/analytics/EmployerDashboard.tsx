import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ocrService } from '../../services/ocrService';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  total_receipts: number;
  total_amount: number;
  average_receipt: number;
  trend: 'up' | 'down' | 'stable';
}

interface EmployerStats {
  total_employees: number;
  total_amount_all: number;
  average_per_employee: number;
  monthly_trend: 'up' | 'down' | 'stable';
}

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [employerStats, setEmployerStats] = useState<EmployerStats | null>(null);

  useEffect(() => {
    if (user && user.role === 'EMPLOYER') {
      fetchEmployerData();
    }
  }, [user]);

  const fetchEmployerData = async () => {
    try {
      setLoading(true);
      const employeesList = await ocrService.getMyEmployees();
      const employeeData: EmployeeData[] = [];
      let totalAmountAll = 0;

      for (const employee of employeesList) {
        try {
          const receiptsResponse = await ocrService.getEmployeeReceipts(employee.id);
          const receipts = receiptsResponse.receipts || [];

          const totalReceipts = receipts.length;
          const totalAmount = receipts.reduce((sum: number, receipt: any) => sum + (receipt.totalAmount || 0), 0);
          const averageReceipt = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

          employeeData.push({
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}` || employee.email,
            email: employee.email,
            department: employee.department,
            position: employee.position,
            total_receipts: totalReceipts,
            total_amount: totalAmount,
            average_receipt: averageReceipt,
            trend: 'stable'
          });

          totalAmountAll += totalAmount;
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error);
        }
      }

      const totalEmployees = employeeData.length;
      const averagePerEmployee = totalEmployees > 0 ? totalAmountAll / totalEmployees : 0;

      setEmployees(employeeData);
      setEmployerStats({
        total_employees: totalEmployees,
        total_amount_all: totalAmountAll,
        average_per_employee: averagePerEmployee,
        monthly_trend: 'stable'
      });

    } catch (error) {
      console.error('Error fetching employer data:', error);
      toast.error('Error al cargar datos del empleador');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (user?.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso denegado</h3>
          <p className="mt-1 text-sm text-gray-500">Esta página es solo para empleadores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Empleador</h1>
          <p className="mt-1 text-sm text-gray-500">Métricas agregadas de todos tus empleados</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employerStats?.total_employees || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gasto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(employerStats?.total_amount_all || 0)}
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
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio por Empleado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(employerStats?.average_per_employee || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lista de empleados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Ranking de Empleados por Gastos</h3>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Gastos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recibos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees
                  .sort((a, b) => b.total_amount - a.total_amount)
                  .map((employee, index) => (
                  <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-500">
                          {employee.department && employee.position ? 
                            `${employee.position} - ${employee.department}` : employee.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(employee.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.total_receipts}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(employee.average_receipt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
