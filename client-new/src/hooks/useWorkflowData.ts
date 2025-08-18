/**
 * Hook optimizado para gestión de datos de workflows
 * Incluye cache, refetch automático y optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { workflowService, PendingApproval, WorkflowAnalytics } from '../services/workflowService';
import toast from 'react-hot-toast';

interface UseWorkflowDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
}

interface WorkflowDataState {
  approvals: PendingApproval[];
  analytics: WorkflowAnalytics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Cache global para evitar llamadas duplicadas
const workflowCache = new Map<string, { data: any; timestamp: number; }>();

export const useWorkflowData = (options: UseWorkflowDataOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
    enableCache = true,
    cacheTimeout = 60000 // 1 minuto
  } = options;

  const [state, setState] = useState<WorkflowDataState>({
    approvals: [],
    analytics: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Cache helper
  const getCachedData = useCallback((key: string) => {
    if (!enableCache) return null;
    
    const cached = workflowCache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    
    workflowCache.delete(key);
    return null;
  }, [enableCache, cacheTimeout]);

  const setCachedData = useCallback((key: string, data: any) => {
    if (enableCache) {
      workflowCache.set(key, { data, timestamp: Date.now() });
    }
  }, [enableCache]);

  // Función principal de carga de datos
  const loadData = useCallback(async (showLoading = true) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Intentar usar cache primero
      const cachedApprovals = getCachedData('approvals');
      const cachedAnalytics = getCachedData('analytics');

      if (cachedApprovals && cachedAnalytics) {
        setState(prev => ({
          ...prev,
          approvals: cachedApprovals,
          analytics: cachedAnalytics,
          loading: false,
          lastUpdated: new Date()
        }));
        return;
      }

      // Cargar datos frescos
      const [approvalsData, analyticsData] = await Promise.all([
        workflowService.getPendingApprovals(),
        workflowService.getWorkflowAnalytics()
      ]);

      // Verificar si el request fue cancelado
      if (abortController.signal.aborted) return;

      // Guardar en cache
      setCachedData('approvals', approvalsData);
      setCachedData('analytics', analyticsData);

      setState(prev => ({
        ...prev,
        approvals: approvalsData,
        analytics: analyticsData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Error loading workflow data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos'
      }));
      
      if (showLoading) {
        toast.error('Error al cargar las aprobaciones');
      }
    }
  }, [getCachedData, setCachedData]);

  // Optimistic update para aprobaciones
  const processApprovalOptimistic = useCallback(async (
    approvalId: string, 
    decision: 'approve' | 'reject', 
    comment?: string
  ) => {
    // Actualizar UI inmediatamente (optimistic)
    setState(prev => ({
      ...prev,
      approvals: prev.approvals.filter(a => a.id !== approvalId)
    }));

    try {
      await workflowService.processApprovalDecision(approvalId, decision, comment || '');
      
      // Limpiar cache para forzar refresh
      workflowCache.delete('approvals');
      workflowCache.delete('analytics');
      
      // Recargar analytics sin loading
      loadData(false);
      
      toast.success(`Boleta ${decision === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`);
      
    } catch (error: any) {
      console.error('Error processing approval:', error);
      
      // Revertir cambio optimistic
      loadData(false);
      
      toast.error(`Error al ${decision === 'approve' ? 'aprobar' : 'rechazar'} la boleta`);
      throw error;
    }
  }, [loadData]);

  // Batch processing optimizado
  const processBatchOptimistic = useCallback(async (
    approvalIds: string[], 
    decision: 'approve' | 'reject'
  ) => {
    // Actualizar UI inmediatamente
    setState(prev => ({
      ...prev,
      approvals: prev.approvals.filter(a => !approvalIds.includes(a.id))
    }));

    try {
      const promises = approvalIds.map(id =>
        workflowService.processApprovalDecision(id, decision, `Acción en lote: ${decision}`)
      );

      await Promise.allSettled(promises);
      
      // Limpiar cache
      workflowCache.delete('approvals');
      workflowCache.delete('analytics');
      
      // Recargar datos
      loadData(false);
      
      toast.success(`${approvalIds.length} boleta(s) ${decision === 'approve' ? 'aprobadas' : 'rechazadas'}`);
      
    } catch (error: any) {
      console.error('Error in batch processing:', error);
      
      // Revertir cambios
      loadData(false);
      
      toast.error('Error al procesar las boletas seleccionadas');
      throw error;
    }
  }, [loadData]);

  // Función de refresh manual
  const refresh = useCallback(() => {
    workflowCache.clear();
    loadData(true);
  }, [loadData]);

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        loadData(false); // Refresh silencioso
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, loadData]);

  // Carga inicial
  useEffect(() => {
    loadData(true);

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    loadData,
    refresh,
    processApprovalOptimistic,
    processBatchOptimistic,
    // Helpers para UI
    isEmpty: state.approvals.length === 0 && !state.loading,
    hasError: !!state.error,
    isStale: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() > refreshInterval : false
  };
};
