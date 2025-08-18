/**
 * Dashboard principal para aprobaciones de boletas
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

import { useWorkflowData } from '../../hooks/useWorkflowData';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import VirtualizedApprovalList from '../../components/ui/VirtualizedList';
import ReportsExport from '../../components/workflows/ReportsExport';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface FilterState {
  search: string;
  urgency: 'all' | 'high' | 'medium' | 'low';
  category: string;
  amountRange: 'all' | 'under_100k' | '100k_500k' | 'over_500k';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

const ApprovalDashboard: React.FC = () => {
  const {
    approvals,
    analytics,
    loading,
    error,
    refresh,
    processApprovalOptimistic,
    processBatchOptimistic,
    hasError,
    isStale
  } = useWorkflowData({ autoRefresh: true, refreshInterval: 30000 });

  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    urgency: 'all',
    category: 'all',
    amountRange: 'all',
    dateRange: 'all'
  });

  // Filtros optimizados con useMemo
  const filteredApprovals = useMemo(() => {
    let filtered = [...approvals];

    // Filtro de búsqueda
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(approval =>
        approval.requester_name.toLowerCase().includes(searchLower) ||
        approval.receipt_vendor.toLowerCase().includes(searchLower) ||
        approval.receipt_category.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de urgencia
    if (filters.urgency !== 'all') {
      filtered = filtered.filter(approval => approval.urgency === filters.urgency);
    }

    // Filtro de categoría
    if (filters.category !== 'all') {
      filtered = filtered.filter(approval => approval.receipt_category === filters.category);
    }

    // Filtro de monto
    if (filters.amountRange !== 'all') {
      filtered = filtered.filter(approval => {
        const amount = approval.receipt_amount;
        switch (filters.amountRange) {
          case 'under_100k': return amount < 100000;
          case '100k_500k': return amount >= 100000 && amount <= 500000;
          case 'over_500k': return amount > 500000;
          default: return true;
        }
      });
    }

    // Filtro de fecha
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(approval => {
        const createdDate = new Date(approval.created_at);
        switch (filters.dateRange) {
          case 'today':
            return createdDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Ordenar por urgencia y fecha
    filtered.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return filtered;
  }, [approvals, filters]);

  const handleDecisionMade = useCallback(async (approvalId: string, decision: 'approve' | 'reject') => {
    try {
      await processApprovalOptimistic(approvalId, decision);
      
      // Limpiar selección
      setSelectedApprovals(prev => {
        const newSet = new Set(prev);
        newSet.delete(approvalId);
        return newSet;
      });
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  }, [processApprovalOptimistic]);

  const handleBatchDecision = useCallback(async (decision: 'approve' | 'reject') => {
    if (selectedApprovals.size === 0) {
      toast.error('Selecciona al menos una boleta');
      return;
    }

    const confirmMessage = `¿Estás seguro de ${decision === 'approve' ? 'aprobar' : 'rechazar'} ${selectedApprovals.size} boleta(s)?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setProcessingBatch(true);
      await processBatchOptimistic(Array.from(selectedApprovals), decision);
      setSelectedApprovals(new Set());
    } catch (error) {
      console.error('Error in batch processing:', error);
    } finally {
      setProcessingBatch(false);
    }
  }, [selectedApprovals, processBatchOptimistic]);

  const toggleSelectAll = () => {
    if (selectedApprovals.size === filteredApprovals.length) {
      setSelectedApprovals(new Set());
    } else {
      setSelectedApprovals(new Set(filteredApprovals.map(a => a.id)));
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set(approvals.map(a => a.receipt_category));
    return Array.from(categories).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Aprobaciones</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona las boletas pendientes de aprobación de tus empleados
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowReportsModal(true)}
                className="flex items-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <Button onClick={refresh} variant="outline">
                <span className="mr-2">🔄</span>
                Actualizar
                {isStale && <span className="ml-1 w-2 h-2 bg-yellow-400 rounded-full" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.pending_approvals}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIconSolid className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aprobadas (mes)</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.approved_this_month}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasa Aprobación</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.approval_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.average_approval_time}h</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros expandidos */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Buscar..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgencia</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">Todas</option>
                    <option value="high">🔥 Alta</option>
                    <option value="medium">⚡ Media</option>
                    <option value="low">📋 Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">Todas</option>
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <select
                    value={filters.amountRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">Todos</option>
                    <option value="under_100k">Menos de $100K</option>
                    <option value="100k_500k">$100K - $500K</option>
                    <option value="over_500k">Más de $500K</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">Todos</option>
                    <option value="today">Hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Acciones en lote */}
        {selectedApprovals.size > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedApprovals.size} boleta(s) seleccionada(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApprovals(new Set())}
                >
                  Limpiar selección
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchDecision('reject')}
                  disabled={processingBatch}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {processingBatch ? <LoadingSpinner size="sm" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                  Rechazar todas
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => handleBatchDecision('approve')}
                  disabled={processingBatch}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingBatch ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-4 h-4 mr-1" />}
                  Aprobar todas
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Controles de lista */}
        {filteredApprovals.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedApprovals.size === filteredApprovals.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Seleccionar todas</span>
              </label>
              
              <span className="text-sm text-gray-500">
                {filteredApprovals.length} de {approvals.length} boletas
              </span>
            </div>
          </div>
        )}

        {/* Lista de aprobaciones optimizada */}
        <ErrorBoundary>
          {hasError ? (
            <Card className="p-12 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh}>Reintentar</Button>
            </Card>
          ) : (
            <VirtualizedApprovalList
              approvals={filteredApprovals}
              selectedApprovals={selectedApprovals}
              onApprovalSelect={(approvalId: string, selected: boolean) => {
                const newSet = new Set(selectedApprovals);
                if (selected) {
                  newSet.add(approvalId);
                } else {
                  newSet.delete(approvalId);
                }
                setSelectedApprovals(newSet);
              }}
              onDecisionMade={handleDecisionMade}
              height={600}
              itemHeight={320}
            />
          )}
        </ErrorBoundary>

        {/* Modal de Reportes */}
        <ReportsExport
          approvals={approvals}
          analytics={analytics}
          filteredApprovals={filteredApprovals}
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
        />
      </div>
    </div>
  );
};

export default ApprovalDashboard;
