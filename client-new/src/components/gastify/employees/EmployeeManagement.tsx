import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ocrService, EmployeeInfo, AllEmployeeReceipts } from '../../../services/ocrService';
import { useToast } from '../../ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [allReceipts, setAllReceipts] = useState<AllEmployeeReceipts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'employees' | 'receipts'>('employees');
  const { user } = useAuth();
  const { error } = useToast();

  useEffect(() => {
    if (user?.role === 'employer') {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const [employeesData, receiptsData] = await Promise.all([
        ocrService.getMyEmployees(),
        ocrService.getAllEmployeeReceipts()
      ]);
      
      setEmployees(employeesData);
      setAllReceipts(receiptsData);
    } catch (err: any) {
      error('Error', 'No se pudieron cargar los datos de empleados');
      console.error('Error loading employee data:', err);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  if (user?.role !== 'employer') {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium">Acceso Restringido</h3>
          <p>Solo los empleadores pueden acceder a esta sección</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Cargando datos de empleados...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            👥 Gestión de Empleados
          </h1>
          <p className="text-gray-600">
            {user.company_name && `${user.company_name} • `}
            {employees.length} empleados • {allReceipts?.total_receipts || 0} recibos
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={selectedView === 'employees' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('employees')}
          >
            Empleados
          </Button>
          <Button
            variant={selectedView === 'receipts' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('receipts')}
          >
            Todos los Recibos
          </Button>
        </div>
      </div>

      {/* Resumen */}
      {allReceipts && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allReceipts.summary.total_employees}
              </div>
              <div className="text-sm text-gray-600">Empleados</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allReceipts.total_receipts}
              </div>
              <div className="text-sm text-gray-600">Recibos Total</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(allReceipts.summary.total_amount)}
              </div>
              <div className="text-sm text-gray-600">Monto Total</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allReceipts.summary.total_amount > 0 
                  ? formatCurrency(allReceipts.summary.total_amount / allReceipts.summary.total_employees)
                  : '$0'
                }
              </div>
              <div className="text-sm text-gray-600">Promedio/Empleado</div>
            </div>
          </Card>
        </div>
      )}

      {/* Vista de Empleados */}
      {selectedView === 'employees' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {employees.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium">No hay empleados</h3>
                <p>Aún no tienes empleados registrados en tu empresa</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => {
                const employeeStats = allReceipts?.summary.receipts_by_employee[employee.id];
                
                return (
                  <Card key={employee.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                        {employee.position && (
                          <p className="text-sm text-blue-600">{employee.position}</p>
                        )}
                        {employee.department && (
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">
                          {employeeStats?.count || 0}
                        </div>
                        <div className="text-xs text-gray-500">recibos</div>
                      </div>
                    </div>
                    
                    {employeeStats && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total gastado:</span>
                          <span className="font-medium">
                            {formatCurrency(employeeStats.total_amount)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // TODO: Implementar vista detallada del empleado
                          console.log('Ver detalles de', employee.id);
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Vista de Todos los Recibos */}
      {selectedView === 'receipts' && allReceipts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {allReceipts.receipts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-medium">No hay recibos</h3>
                <p>Tus empleados aún no han subido recibos</p>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Todos los Recibos ({allReceipts.receipts.length})
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allReceipts.receipts.map((receipt: any) => (
                    <div
                      key={receipt._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 font-medium">
                              {receipt.employee_info?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {receipt.companyName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {receipt.employee_info?.name} • {formatDate(receipt.date)}
                            </div>
                            {receipt.employee_info?.department && (
                              <div className="text-xs text-blue-600">
                                {receipt.employee_info.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(receipt.totalAmount)}
                        </div>
                        {receipt.category && (
                          <div className="text-xs text-gray-500">
                            {receipt.category}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};
