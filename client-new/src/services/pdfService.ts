import jsPDF from 'jspdf';
import { ReceiptProduct, ReceiptPDFData } from '../types/receipt';

class PDFService {
  private readonly COLORS = {
    primary: '#059669', // emerald-600
    secondary: '#6b7280', // gray-500
    dark: '#1f2937', // gray-800
    light: '#f9fafb', // gray-50
    accent: '#3b82f6' // blue-600
  };

  private readonly FONTS = {
    title: 18,
    subtitle: 14,
    normal: 10,
    small: 8
  };

  /**
   * Genera PDF completo de recibo con productos individuales
   */
  async generateReceiptPDF(receipt: ReceiptPDFData): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header con logo y título
    yPosition = this.addHeader(doc, yPosition);
    
    // Información del recibo
    yPosition = this.addReceiptInfo(doc, receipt, yPosition);
    
    // Productos individuales
    if (receipt.products && receipt.products.length > 0) {
      yPosition = this.addProductsSection(doc, receipt.products, yPosition);
    }
    
    // Resumen de totales
    yPosition = this.addTotalsSummary(doc, receipt, yPosition);
    
    // Información técnica (OCR, confianza, etc.)
    yPosition = this.addTechnicalInfo(doc, receipt, yPosition);
    
    // Footer
    this.addFooter(doc);
    
    // Descargar PDF
    const fileName = `Recibo_${receipt.companyName.replace(/[^a-zA-Z0-9]/g, '')}_${receipt.folioNumber}.pdf`;
    doc.save(fileName);
  }

  private addHeader(doc: jsPDF, yPosition: number): number {
    // Logo/Título Gastify
    doc.setFontSize(this.FONTS.title);
    doc.setTextColor(this.COLORS.primary);
    doc.text('GASTIFY', 20, yPosition);
    
    doc.setFontSize(this.FONTS.normal);
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Sistema de Gestión de Gastos Inteligente', 20, yPosition + 7);
    
    // Línea divisoria
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition + 15, 190, yPosition + 15);
    
    return yPosition + 25;
  }

  private addReceiptInfo(doc: jsPDF, receipt: ReceiptPDFData, yPosition: number): number {
    // Título de sección
    doc.setFontSize(this.FONTS.subtitle);
    doc.setTextColor(this.COLORS.dark);
    doc.text('INFORMACIÓN DEL RECIBO', 20, yPosition);
    yPosition += 12;

    // Grid de información
    const leftCol = 20;
    const rightCol = 110;
    
    doc.setFontSize(this.FONTS.normal);
    doc.setTextColor(this.COLORS.secondary);

    // Columna izquierda
    doc.text('Empresa:', leftCol, yPosition);
    doc.setTextColor(this.COLORS.dark);
    doc.text(receipt.companyName, leftCol + 25, yPosition);
    
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Folio:', leftCol, yPosition + 8);
    doc.setTextColor(this.COLORS.dark);
    doc.text(receipt.folioNumber, leftCol + 25, yPosition + 8);
    
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Descripción:', leftCol, yPosition + 16);
    doc.setTextColor(this.COLORS.dark);
    // Texto largo con wrap
    const description = doc.splitTextToSize(receipt.description, 80);
    doc.text(description, leftCol + 25, yPosition + 16);

    // Columna derecha
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Fecha:', rightCol, yPosition);
    doc.setTextColor(this.COLORS.dark);
    doc.text(new Date(receipt.date).toLocaleDateString('es-CL'), rightCol + 20, yPosition);
    
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Total:', rightCol, yPosition + 8);
    doc.setTextColor(this.COLORS.primary);
    doc.setFontSize(this.FONTS.subtitle);
    doc.text(`$${receipt.totalAmount.toLocaleString('es-CL')}`, rightCol + 20, yPosition + 8);

    // RUT si está disponible
    if (receipt.ocrData?.chile_metadata?.rut_emisor) {
      doc.setFontSize(this.FONTS.normal);
      doc.setTextColor(this.COLORS.secondary);
      doc.text('RUT Emisor:', rightCol, yPosition + 18);
      doc.setTextColor(this.COLORS.dark);
      doc.text(receipt.ocrData.chile_metadata.rut_emisor, rightCol + 25, yPosition + 18);
    }

    return yPosition + 35;
  }

  private addProductsSection(doc: jsPDF, products: ReceiptProduct[], yPosition: number): number {
    // Título de sección
    doc.setFontSize(this.FONTS.subtitle);
    doc.setTextColor(this.COLORS.dark);
    doc.text(`PRODUCTOS EXTRAÍDOS (${products.length})`, 20, yPosition);
    yPosition += 12;

    // Headers de tabla
    const headers = ['Producto', 'Cant.', 'P. Unit.', 'Total', 'Conf.'];
    const colWidths = [80, 20, 25, 25, 20];
    const startX = 20;
    
    // Background del header
    doc.setFillColor(247, 247, 247); // gray-50
    doc.rect(startX, yPosition - 3, 170, 8, 'F');
    
    doc.setFontSize(this.FONTS.normal);
    doc.setTextColor(this.COLORS.dark);
    
    let xPosition = startX;
    headers.forEach((header, index) => {
      doc.text(header, xPosition + 2, yPosition + 3);
      xPosition += colWidths[index];
    });
    
    yPosition += 10;

    // Productos
    doc.setFontSize(this.FONTS.small);
    products.forEach((product, index) => {
      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252); // gray-25
        doc.rect(startX, yPosition - 2, 170, 7, 'F');
      }

      xPosition = startX;
      
      // Nombre del producto (truncar si es muy largo)
      doc.setTextColor(this.COLORS.dark);
      const productName = product.name.length > 35 ? 
        product.name.substring(0, 32) + '...' : product.name;
      doc.text(productName, xPosition + 2, yPosition + 2);
      xPosition += colWidths[0];

      // Cantidad
      doc.setTextColor(this.COLORS.secondary);
      doc.text(product.quantity.toString(), xPosition + 2, yPosition + 2);
      xPosition += colWidths[1];

      // Precio unitario
      const unitPrice = product.unit_price ? 
        `$${product.unit_price.toLocaleString('es-CL')}` : 'N/A';
      doc.text(unitPrice, xPosition + 2, yPosition + 2);
      xPosition += colWidths[2];

      // Total
      doc.setTextColor(this.COLORS.dark);
      const total = product.total_price ? 
        `$${product.total_price.toLocaleString('es-CL')}` : 'N/A';
      doc.text(total, xPosition + 2, yPosition + 2);
      xPosition += colWidths[3];

      // Confianza
      const confidence = `${(product.confidence * 100).toFixed(0)}%`;
      const confidenceColor = product.confidence >= 0.8 ? this.COLORS.primary :
                            product.confidence >= 0.6 ? '#f59e0b' : '#ef4444';
      doc.setTextColor(confidenceColor);
      doc.text(confidence, xPosition + 2, yPosition + 2);

      yPosition += 7;

      // Nueva página si es necesario
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    return yPosition + 10;
  }

  private addTotalsSummary(doc: jsPDF, receipt: ReceiptPDFData, yPosition: number): number {
    if (!receipt.products || receipt.products.length === 0) {
      return yPosition;
    }

    // Calcular totales
    const calculatedTotal = receipt.products.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const difference = Math.abs(calculatedTotal - receipt.totalAmount);
    const differencePercentage = receipt.totalAmount > 0 ? 
      (difference / receipt.totalAmount) * 100 : 0;

    // Título de sección
    doc.setFontSize(this.FONTS.subtitle);
    doc.setTextColor(this.COLORS.dark);
    doc.text('RESUMEN DE TOTALES', 20, yPosition);
    yPosition += 12;

    // Box de resumen
    doc.setDrawColor(this.COLORS.secondary);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 5, 170, 25);

    const leftCol = 25;
    const rightCol = 140;

    doc.setFontSize(this.FONTS.normal);
    doc.setTextColor(this.COLORS.secondary);

    doc.text('Total de productos:', leftCol, yPosition + 3);
    doc.setTextColor(this.COLORS.dark);
    doc.text(`$${calculatedTotal.toLocaleString('es-CL')}`, rightCol, yPosition + 3);

    doc.setTextColor(this.COLORS.secondary);
    doc.text('Total declarado:', leftCol, yPosition + 10);
    doc.setTextColor(this.COLORS.dark);
    doc.text(`$${receipt.totalAmount.toLocaleString('es-CL')}`, rightCol, yPosition + 10);

    doc.setTextColor(this.COLORS.secondary);
    doc.text('Diferencia:', leftCol, yPosition + 17);
    const diffColor = differencePercentage <= 5 ? this.COLORS.primary : '#ef4444';
    doc.setTextColor(diffColor);
    doc.text(`$${difference.toLocaleString('es-CL')} (${differencePercentage.toFixed(1)}%)`, rightCol, yPosition + 17);

    return yPosition + 30;
  }

  private addTechnicalInfo(doc: jsPDF, receipt: ReceiptPDFData, yPosition: number): number {
    if (!receipt.ocrData) return yPosition;

    // Título de sección
    doc.setFontSize(this.FONTS.small);
    doc.setTextColor(this.COLORS.secondary);
    doc.text('INFORMACIÓN TÉCNICA', 20, yPosition);
    yPosition += 8;

    // Información de procesamiento
    doc.setFontSize(this.FONTS.small);
    doc.text(`OCR Confianza: ${(receipt.ocrData.confidence * 100).toFixed(1)}%`, 20, yPosition);
    
    if (receipt.ocrData.chile_metadata) {
      if (receipt.ocrData.chile_metadata.subtotal) {
        doc.text(`Subtotal: $${receipt.ocrData.chile_metadata.subtotal.toLocaleString('es-CL')}`, 80, yPosition);
      }
      if (receipt.ocrData.chile_metadata.iva_amount) {
        doc.text(`IVA: $${receipt.ocrData.chile_metadata.iva_amount.toLocaleString('es-CL')}`, 130, yPosition);
      }
    }

    if (receipt.geolocation?.city) {
      yPosition += 5;
      doc.text(`Ubicación: ${receipt.geolocation.city}, ${receipt.geolocation.region || 'Chile'}`, 20, yPosition);
    }

    return yPosition + 10;
  }

  private addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(this.FONTS.small);
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Generado por Gastify - Sistema de Gestión de Gastos', 20, pageHeight - 15);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, 20, pageHeight - 10);
    
    // Número de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Página ${i} de ${pageCount}`, 170, pageHeight - 10);
    }
  }

  /**
   * Genera PDF de resumen de múltiples recibos
   */
  async generateReceiptsSummaryPDF(receipts: ReceiptPDFData[]): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    yPosition = this.addHeader(doc, yPosition);
    
    // Título del reporte
    doc.setFontSize(this.FONTS.subtitle);
    doc.setTextColor(this.COLORS.dark);
    doc.text(`RESUMEN DE RECIBOS (${receipts.length})`, 20, yPosition);
    yPosition += 15;

    // Estadísticas generales
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalProducts = receipts.reduce((sum, r) => sum + (r.products?.length || 0), 0);

    doc.setFontSize(this.FONTS.normal);
    doc.text(`Total general: $${totalAmount.toLocaleString('es-CL')}`, 20, yPosition);
    doc.text(`Productos extraídos: ${totalProducts}`, 120, yPosition);
    yPosition += 15;

    // Lista de recibos
    receipts.forEach((receipt, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(this.FONTS.normal);
      doc.setTextColor(this.COLORS.dark);
      doc.text(`${index + 1}. ${receipt.companyName}`, 20, yPosition);
      
      doc.setTextColor(this.COLORS.secondary);
      doc.setFontSize(this.FONTS.small);
      doc.text(`Folio: ${receipt.folioNumber} | Fecha: ${new Date(receipt.date).toLocaleDateString('es-CL')}`, 25, yPosition + 5);
      doc.text(`Productos: ${receipt.products?.length || 0} | Total: $${receipt.totalAmount.toLocaleString('es-CL')}`, 25, yPosition + 10);
      
      yPosition += 18;
    });

    this.addFooter(doc);
    
    const fileName = `Resumen_Recibos_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}

export const pdfService = new PDFService();
