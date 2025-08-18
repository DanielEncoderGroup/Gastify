/**
 * Servicio para generación y exportación de reportes
 * Soporta exportación a PDF y Excel
 */

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { PendingApproval, WorkflowAnalytics } from './workflowService';

// Interfaces para reportes
export interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  categories?: string[];
  urgency?: ('high' | 'medium' | 'low')[];
  status?: ('pending' | 'approved' | 'rejected')[];
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface ReportData {
  approvals: PendingApproval[];
  analytics: WorkflowAnalytics | null;
  filters: ReportFilters;
  generatedAt: string;
  reportType: 'approvals' | 'analytics' | 'summary';
}

export interface ExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  format: 'pdf' | 'excel';
  orientation?: 'portrait' | 'landscape';
}

class ReportsService {
  /**
   * Genera reporte de aprobaciones en PDF
   */
  async exportToPDF(data: ReportData, options: ExportOptions = { format: 'pdf' }): Promise<void> {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const filename = options.filename || `reporte-aprobaciones-${this.formatDateForFilename(new Date())}.pdf`;

    // Header del reporte
    this.addPDFHeader(doc, data);
    
    // Resumen ejecutivo
    if (data.analytics) {
      this.addPDFSummary(doc, data.analytics);
    }

    // Tabla de aprobaciones
    if (options.includeDetails !== false) {
      this.addPDFApprovalsTable(doc, data.approvals);
    }

    // Footer
    this.addPDFFooter(doc);

    // Descargar el archivo
    doc.save(filename);
  }

  /**
   * Genera reporte de aprobaciones en Excel
   */
  async exportToExcel(data: ReportData, options: ExportOptions = { format: 'excel' }): Promise<void> {
    const filename = options.filename || `reporte-aprobaciones-${this.formatDateForFilename(new Date())}.xlsx`;
    
    const workbook = XLSX.utils.book_new();

    // Hoja de resumen
    if (data.analytics) {
      const summarySheet = this.createSummarySheet(data.analytics, data.filters);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    }

    // Hoja de aprobaciones detalladas
    const approvalsSheet = this.createApprovalsSheet(data.approvals);
    XLSX.utils.book_append_sheet(workbook, approvalsSheet, 'Aprobaciones');

    // Hoja de análisis por categoría
    const categorySheet = this.createCategoryAnalysisSheet(data.approvals);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoría');

    // Hoja de análisis temporal
    const timeSheet = this.createTimeAnalysisSheet(data.approvals);
    XLSX.utils.book_append_sheet(workbook, timeSheet, 'Análisis Temporal');

    // Descargar el archivo
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Genera reporte rápido con configuración predeterminada
   */
  async quickExport(approvals: PendingApproval[], analytics: WorkflowAnalytics | null, format: 'pdf' | 'excel'): Promise<void> {
    const reportData: ReportData = {
      approvals,
      analytics,
      filters: { dateRange: 'month' },
      generatedAt: new Date().toISOString(),
      reportType: 'summary'
    };

    const options: ExportOptions = {
      format,
      includeDetails: true,
      includeCharts: false
    };

    if (format === 'pdf') {
      await this.exportToPDF(reportData, options);
    } else {
      await this.exportToExcel(reportData, options);
    }
  }

  // Métodos privados para PDF
  private addPDFHeader(doc: jsPDF, data: ReportData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Logo/Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastify - Reporte de Aprobaciones', 20, 25);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${this.formatDate(new Date(data.generatedAt))}`, pageWidth - 20, 15, { align: 'right' });
    
    // Filtros aplicados
    doc.text(`Período: ${this.getFilterDescription(data.filters)}`, 20, 35);
    
    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(20, 40, pageWidth - 20, 40);
    
    // Posición Y para siguiente contenido
    (doc as any).currentY = 50;
  }

  private addPDFSummary(doc: jsPDF, analytics: WorkflowAnalytics): void {
    const startY = (doc as any).currentY || 50;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 20, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      `Pendientes de aprobación: ${analytics.pending_approvals}`,
      `Aprobadas este mes: ${analytics.approved_this_month}`,
      `Tasa de aprobación: ${(analytics.approval_rate * 100).toFixed(1)}%`,
      `Tiempo promedio de aprobación: ${analytics.average_approval_time}h`,
      `Total procesadas: ${analytics.total_approvals || 0}`
    ];

    summaryData.forEach((text, index) => {
      doc.text(text, 25, startY + 15 + (index * 8));
    });

    (doc as any).currentY = startY + 60;
  }

  private addPDFApprovalsTable(doc: jsPDF, approvals: PendingApproval[]): void {
    const startY = (doc as any).currentY || 120;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Aprobaciones', 20, startY);
    
    // Headers de tabla
    const headers = ['Fecha', 'Empleado', 'Categoría', 'Monto', 'Urgencia', 'Estado'];
    const colWidths = [25, 40, 30, 25, 20, 20];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let xPos = 20;
    headers.forEach((header, index) => {
      doc.text(header, xPos, startY + 15);
      xPos += colWidths[index];
    });
    
    // Línea bajo headers
    doc.line(20, startY + 18, 180, startY + 18);
    
    // Datos de la tabla
    doc.setFont('helvetica', 'normal');
    approvals.slice(0, 25).forEach((approval, index) => { // Límite para PDF
      const yPos = startY + 25 + (index * 8);
      
      if (yPos > 270) { // Nueva página si es necesario
        doc.addPage();
        (doc as any).currentY = 30;
        return;
      }
      
      xPos = 20;
      const rowData = [
        this.formatDate(new Date(approval.created_at)),
        approval.requester_name.substring(0, 18),
        approval.receipt_category.substring(0, 15),
        this.formatCurrency(approval.receipt_amount),
        approval.urgency.toUpperCase(),
        'PENDIENTE'
      ];
      
      rowData.forEach((data, colIndex) => {
        doc.text(data, xPos, yPos);
        xPos += colWidths[colIndex];
      });
    });

    (doc as any).currentY = Math.min(startY + 25 + (approvals.length * 8), 270);
  }

  private addPDFFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount} - Gastify Sistema de Aprobaciones`,
        pageWidth / 2,
        285,
        { align: 'center' }
      );
    }
  }

  // Métodos privados para Excel
  private createSummarySheet(analytics: WorkflowAnalytics, filters: ReportFilters): XLSX.WorkSheet {
    const summaryData = [
      ['Gastify - Resumen de Aprobaciones', ''],
      ['', ''],
      ['Métrica', 'Valor'],
      ['Pendientes de aprobación', analytics.pending_approvals],
      ['Aprobadas este mes', analytics.approved_this_month],
      ['Tasa de aprobación', `${(analytics.approval_rate * 100).toFixed(1)}%`],
      ['Tiempo promedio (horas)', analytics.average_approval_time],
      ['Total procesadas', analytics.total_approvals || 0],
      ['', ''],
      ['Filtros Aplicados', ''],
      ['Período', this.getFilterDescription(filters)],
      ['Generado', this.formatDate(new Date())]
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Estilo para el título
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });

    return ws;
  }

  private createApprovalsSheet(approvals: PendingApproval[]): XLSX.WorkSheet {
    const headers = [
      'ID', 'Fecha Creación', 'Empleado', 'Categoría', 'Vendor', 
      'Monto', 'Moneda', 'Urgencia', 'Estado', 'Días Pendiente'
    ];

    const data = approvals.map(approval => [
      approval.id,
      this.formatDate(new Date(approval.created_at)),
      approval.requester_name,
      approval.receipt_category,
      approval.receipt_vendor,
      approval.receipt_amount,
      'CLP',
      approval.urgency,
      'PENDIENTE',
      this.calculateDaysPending(approval.created_at)
    ]);

    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-ajustar ancho de columnas
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    return ws;
  }

  private createCategoryAnalysisSheet(approvals: PendingApproval[]): XLSX.WorkSheet {
    const categoryStats = this.calculateCategoryStats(approvals);
    
    const headers = ['Categoría', 'Cantidad', 'Monto Total', 'Monto Promedio', '% del Total'];
    const data = Object.entries(categoryStats).map(([category, stats]) => [
      category,
      stats.count,
      stats.totalAmount,
      Math.round(stats.totalAmount / stats.count),
      `${((stats.count / approvals.length) * 100).toFixed(1)}%`
    ]);

    const wsData = [headers, ...data];
    return XLSX.utils.aoa_to_sheet(wsData);
  }

  private createTimeAnalysisSheet(approvals: PendingApproval[]): XLSX.WorkSheet {
    const timeStats = this.calculateTimeStats(approvals);
    
    const headers = ['Período', 'Cantidad', 'Monto Total'];
    const data = Object.entries(timeStats).map(([period, stats]) => [
      period,
      stats.count,
      stats.totalAmount
    ]);

    const wsData = [headers, ...data];
    return XLSX.utils.aoa_to_sheet(wsData);
  }

  // Métodos utilitarios
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private getFilterDescription(filters: ReportFilters): string {
    switch (filters.dateRange) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      case 'quarter': return 'Este trimestre';
      case 'year': return 'Este año';
      case 'custom': return `${filters.customStartDate} - ${filters.customEndDate}`;
      default: return 'Todos los períodos';
    }
  }

  private calculateDaysPending(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateCategoryStats(approvals: PendingApproval[]): Record<string, { count: number; totalAmount: number }> {
    return approvals.reduce((stats, approval) => {
      const category = approval.receipt_category;
      if (!stats[category]) {
        stats[category] = { count: 0, totalAmount: 0 };
      }
      stats[category].count += 1;
      stats[category].totalAmount += approval.receipt_amount;
      return stats;
    }, {} as Record<string, { count: number; totalAmount: number }>);
  }

  private calculateTimeStats(approvals: PendingApproval[]): Record<string, { count: number; totalAmount: number }> {
    return approvals.reduce((stats, approval) => {
      const date = new Date(approval.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!stats[monthYear]) {
        stats[monthYear] = { count: 0, totalAmount: 0 };
      }
      
      stats[monthYear].count += 1;
      stats[monthYear].totalAmount += approval.receipt_amount;
      return stats;
    }, {} as Record<string, { count: number; totalAmount: number }>);
  }
}

export const reportsService = new ReportsService();
export default reportsService;
