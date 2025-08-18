/**
 * Componente para exportación de reportes de workflows
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { PendingApproval, WorkflowAnalytics } from '../../services/workflowService';
import reportsService, { ReportFilters } from '../../services/reportsService';

interface ReportsExportProps {
  approvals: PendingApproval[];
  analytics: WorkflowAnalytics | null;
  filteredApprovals: PendingApproval[];
  isOpen: boolean;
  onClose: () => void;
}

const ReportsExport: React.FC<ReportsExportProps> = ({
  approvals,
  analytics,
  filteredApprovals,
  isOpen,
  onClose
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('excel');
  const [reportType, setReportType] = useState<'current' | 'all' | 'custom'>('current');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [customFilters, setCustomFilters] = useState<ReportFilters>({
    dateRange: 'month'
  });

  const handleQuickExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    
    try {
      const dataToExport = reportType === 'current' ? filteredApprovals : approvals;
      await reportsService.quickExport(dataToExport, analytics, format);
      
      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
      onClose();
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(`Error al generar reporte ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    setIsExporting(true);
    
    try {
      const reportData = {
        approvals: reportType === 'current' ? filteredApprovals : approvals,
        analytics,
        filters: customFilters,
        generatedAt: new Date().toISOString(),
        reportType: 'summary' as const
      };

      const options = {
        format: selectedFormat,
        includeCharts,
        includeDetails: true,
        filename: `gastify-reporte-${selectedFormat}-${new Date().toISOString().split('T')[0]}.${selectedFormat === 'pdf' ? 'pdf' : 'xlsx'}`
      };

      if (selectedFormat === 'pdf') {
        await reportsService.exportToPDF(reportData, options);
      } else {
        await reportsService.exportToExcel(reportData, options);
      }

      toast.success(`Reporte personalizado ${selectedFormat.toUpperCase()} generado`);
      onClose();
    } catch (error) {
      console.error('Error exporting custom report:', error);
      toast.error('Error al generar reporte personalizado');
    } finally {
      setIsExporting(false);
    }
  };

  const getReportStats = () => {
    const dataToAnalyze = reportType === 'current' ? filteredApprovals : approvals;
    const totalAmount = dataToAnalyze.reduce((sum, a) => sum + a.receipt_amount, 0);
    const avgAmount = dataToAnalyze.length > 0 ? totalAmount / dataToAnalyze.length : 0;
    
    return {
      count: dataToAnalyze.length,
      totalAmount,
      avgAmount,
      categories: new Set(dataToAnalyze.map(a => a.receipt_category)).size
    };
  };

  const stats = getReportStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowDownTrayIcon className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Exportar Reportes</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isExporting}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Exportación Rápida */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-emerald-600" />
              Exportación Rápida
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleQuickExport('excel')}
                disabled={isExporting}
                className="flex items-center justify-center h-20 bg-green-600 hover:bg-green-700"
              >
                {isExporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Squares2X2Icon className="w-6 h-6 mr-2" />
                    <div>
                      <div className="font-semibold">Excel</div>
                      <div className="text-sm opacity-90">Análisis detallado</div>
                    </div>
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleQuickExport('pdf')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center justify-center h-20 border-red-300 text-red-600 hover:bg-red-50"
              >
                {isExporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <DocumentTextIcon className="w-6 h-6 mr-2" />
                    <div>
                      <div className="font-semibold">PDF</div>
                      <div className="text-sm opacity-90">Reporte ejecutivo</div>
                    </div>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Configuración Avanzada */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FunnelIcon className="w-5 h-5 mr-2 text-emerald-600" />
              Configuración Avanzada
            </h3>

            <div className="space-y-4">
              {/* Tipo de datos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datos a incluir
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'current', label: 'Vista Actual', desc: `${stats.count} registros` },
                    { value: 'all', label: 'Todos los Datos', desc: `${approvals.length} registros` },
                    { value: 'custom', label: 'Personalizado', desc: 'Configurar filtros' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                        reportType === option.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={option.value}
                        checked={reportType === option.value}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Formato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de exportación
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={selectedFormat === 'excel'}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Squares2X2Icon className="w-4 h-4 ml-2 mr-1 text-green-600" />
                    <span className="text-sm">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={selectedFormat === 'pdf'}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <DocumentTextIcon className="w-4 h-4 ml-2 mr-1 text-red-600" />
                    <span className="text-sm">PDF (.pdf)</span>
                  </label>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Incluir gráficos y visualizaciones
                  </span>
                </label>
              </div>

              {/* Filtros personalizados */}
              {reportType === 'custom' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Filtros Personalizados</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <select
                      value={customFilters.dateRange}
                      onChange={(e) => setCustomFilters(prev => ({ 
                        ...prev, 
                        dateRange: e.target.value as any 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="today">Hoy</option>
                      <option value="week">Esta semana</option>
                      <option value="month">Este mes</option>
                      <option value="quarter">Este trimestre</option>
                      <option value="year">Este año</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Estadísticas del reporte */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Vista previa del reporte</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.count}</div>
                <div className="text-sm text-gray-600">Registros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.categories}</div>
                <div className="text-sm text-gray-600">Categorías</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${(stats.totalAmount / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ${(stats.avgAmount / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-gray-600">Promedio</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCustomExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generando...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsExport;
