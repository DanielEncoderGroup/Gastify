/**
 * Componente para gestión de límites de gasto por empleado
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import spendingLimitsService, { 
  SpendingLimit, 
  SpendingUsage, 
  LimitAlert,
  CreateLimitRequest 
} from '../../services/spendingLimitsService';

interface SpendingLimitsManagerProps {
  employeeId?: string; // Si se especifica, solo muestra límites para ese empleado
  showUsage?: boolean; // Si mostrar estadísticas de uso
  compact?: boolean; // Modo compacto para dashboards
}

const SpendingLimitsManager: React.FC<SpendingLimitsManagerProps> = ({
  employeeId,
  showUsage = true,
  compact = false
}) => {
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [usage, setUsage] = useState<SpendingUsage[]>([]);
  const [alerts, setAlerts] = useState<LimitAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLimit, setSelectedLimit] = useState<SpendingLimit | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [limitsData, usageData, alertsData] = await Promise.all([
        spendingLimitsService.getSpendingLimits(employeeId),
        showUsage ? spendingLimitsService.getSpendingUsage(employeeId) : Promise.resolve([]),
        spendingLimitsService.getLimitAlerts(employeeId, true)
      ]);

      setLimits(limitsData);
      setUsage(usageData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading spending limits data:', error);
      toast.error('Error al cargar datos de límites de gasto');
    } finally {
      setLoading(false);
    }
  }, [employeeId, showUsage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (limit: SpendingLimit) => {
    try {
      const updatedLimit = limit.is_active
        ? await spendingLimitsService.deactivateLimit(limit.id)
        : await spendingLimitsService.activateLimit(limit.id);

      setLimits(prev => prev.map(l => l.id === limit.id ? updatedLimit : l));
      toast.success(`Límite ${limit.is_active ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error toggling limit:', error);
      toast.error('Error al cambiar estado del límite');
    }
  };

  const handleDeleteLimit = async (limitId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este límite?')) return;

    try {
      await spendingLimitsService.deleteSpendingLimit(limitId);
      setLimits(prev => prev.filter(l => l.id !== limitId));
      toast.success('Límite eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting limit:', error);
      toast.error('Error al eliminar límite');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await spendingLimitsService.resolveAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta resuelta');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver alerta');
    }
  };

  const getUsageForEmployee = (employeeId: string) => {
    return usage.find(u => u.employee_id === employeeId);
  };

  const getAlertsForEmployee = (employeeId: string) => {
    return alerts.filter(a => a.employee_id === employeeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {alerts.length > 0 && (
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900">
                {alerts.length} alerta(s) de límites
              </span>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span className="text-orange-800">
                    {alert.employee_name}: {spendingLimitsService.getLimitTypeLabel(alert.limit_type)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveAlert(alert.id)}
                    className="text-xs"
                  >
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Límites Activos</h3>
            <span className="text-sm text-gray-500">{limits.filter(l => l.is_active).length} activos</span>
          </div>
          <div className="space-y-2">
            {limits.slice(0, 5).map(limit => {
              const employeeUsage = getUsageForEmployee(limit.employee_id);
              const limitStatus = employeeUsage?.limits_status.find(ls => ls.limit_id === limit.id);
              
              return (
                <div key={limit.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{limit.employee_name}</div>
                    <div className="text-xs text-gray-500">
                      {spendingLimitsService.getLimitTypeLabel(limit.limit_type)} - 
                      {spendingLimitsService.formatCurrency(limit.limit_amount)}
                    </div>
                  </div>
                  {limitStatus && (
                    <div className={`px-2 py-1 rounded text-xs ${spendingLimitsService.getUsageColor(limitStatus.usage_percentage)}`}>
                      {limitStatus.usage_percentage}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Límites de Gasto</h2>
          <p className="text-gray-600">Gestiona límites de gasto por empleado</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            Configuración Masiva
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Límite
          </Button>
        </div>
      </div>

      {/* Alertas Activas */}
      {alerts.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-900">
              Alertas de Límites ({alerts.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.employee_name}</h4>
                    <p className="text-sm text-gray-600">
                      {spendingLimitsService.getLimitTypeLabel(alert.limit_type)} - 
                      {spendingLimitsService.formatCurrency(alert.limit_amount)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.alert_type === 'exceeded' ? 'bg-red-100 text-red-800' :
                    alert.alert_type === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.alert_type === 'exceeded' ? 'Excedido' :
                     alert.alert_type === 'warning' ? 'Advertencia' : 'Aproximándose'}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usado: {spendingLimitsService.formatCurrency(alert.current_usage)}</span>
                    {alert.exceeded_amount > 0 && (
                      <span className="text-red-600">
                        Exceso: {spendingLimitsService.formatCurrency(alert.exceeded_amount)}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        alert.alert_type === 'exceeded' ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${Math.min((alert.current_usage / alert.limit_amount) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleResolveAlert(alert.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Estadísticas de Uso */}
      {showUsage && usage.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {usage.map(employeeUsage => (
            <Card key={employeeUsage.employee_id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{employeeUsage.employee_name}</h3>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">
                  {spendingLimitsService.formatCurrency(employeeUsage.total_spent)}
                </div>
                <div className="text-sm text-gray-500">
                  {employeeUsage.transaction_count} transacciones este mes
                </div>
              </div>

              <div className="space-y-3">
                {employeeUsage.limits_status.map(limitStatus => (
                  <div key={limitStatus.limit_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{spendingLimitsService.getLimitTypeLabel(limitStatus.limit_type)}</span>
                      <span className={`font-medium ${
                        limitStatus.is_exceeded ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {limitStatus.usage_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          limitStatus.usage_percentage >= 100 ? 'bg-red-500' :
                          limitStatus.usage_percentage >= 80 ? 'bg-orange-500' :
                          limitStatus.usage_percentage >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(limitStatus.usage_percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{spendingLimitsService.formatCurrency(limitStatus.current_usage)}</span>
                      <span>{spendingLimitsService.formatCurrency(limitStatus.limit_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de Límites */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Límites Configurados</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uso Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {limits.map(limit => {
                const employeeUsage = getUsageForEmployee(limit.employee_id);
                const limitStatus = employeeUsage?.limits_status.find(ls => ls.limit_id === limit.id);
                
                return (
                  <tr key={limit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{limit.employee_name}</div>
                        <div className="text-sm text-gray-500">{limit.employee_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {spendingLimitsService.getLimitTypeLabel(limit.limit_type)}
                      </span>
                      {limit.category_restrictions && limit.category_restrictions.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Categorías: {limit.category_restrictions.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {spendingLimitsService.formatCurrency(limit.limit_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        limit.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {limit.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {limitStatus ? (
                        <div className="flex items-center">
                          <div className="flex-1 mr-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  limitStatus.usage_percentage >= 100 ? 'bg-red-500' :
                                  limitStatus.usage_percentage >= 80 ? 'bg-orange-500' :
                                  limitStatus.usage_percentage >= 60 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(limitStatus.usage_percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${
                            limitStatus.is_exceeded ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {limitStatus.usage_percentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin datos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(limit)}
                        >
                          {limit.is_active ? (
                            <XCircleIcon className="w-4 h-4" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLimit(limit)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLimit(limit.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modales para crear/editar límites */}
      <CreateLimitModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      <EditLimitModal
        limit={selectedLimit}
        isOpen={!!selectedLimit}
        onClose={() => setSelectedLimit(null)}
        onSuccess={loadData}
      />

      <BulkLimitModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

// Componente modal para crear límites
const CreateLimitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateLimitRequest>({
    employee_id: '',
    limit_type: 'monthly',
    limit_amount: 100000,
    currency: 'CLP',
    category_restrictions: [],
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await spendingLimitsService.createSpendingLimit(formData);
      toast.success('Límite creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating limit:', error);
      toast.error('Error al crear límite');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Límite</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Límite
              </label>
              <select
                value={formData.limit_type}
                onChange={(e) => setFormData(prev => ({ ...prev, limit_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
                <option value="per_transaction">Por Transacción</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Límite
              </label>
              <input
                type="number"
                value={formData.limit_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, limit_amount: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
                min="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Activar inmediatamente
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Crear Límite'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Componente modal para editar límites
const EditLimitModal: React.FC<{
  limit: SpendingLimit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ limit, isOpen, onClose, onSuccess }) => {
  // Similar implementation to CreateLimitModal but for editing
  if (!isOpen || !limit) return null;
  return <div>Edit Modal Placeholder</div>;
};

// Componente modal para configuración masiva
const BulkLimitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  // Implementation for bulk limit creation
  if (!isOpen) return null;
  return <div>Bulk Modal Placeholder</div>;
};

export default SpendingLimitsManager;
