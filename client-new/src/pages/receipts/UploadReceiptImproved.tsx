import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AutoReceiptAnalyzer } from '../../components/gastify/receipts/AutoReceiptAnalyzer';
import { OCRAnalysisResult } from '../../services/ocrService';
import { receiptService } from '../../services/receiptService';
import { useToast } from '../../components/ui/Toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TransactionSummary from '../../components/receipts/TransactionSummary';
import ProductList from '../../components/gastify/receipts/ProductList';
import { ReceiptProduct } from '../../types/receipt';

interface FormData {
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
}

export const UploadReceiptImproved: React.FC = () => {
  const [step, setStep] = useState<'analyze' | 'form' | 'success'>('analyze');
  const [analysisResult, setAnalysisResult] = useState<OCRAnalysisResult | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    folioNumber: '',
    date: '',
    description: '',
    totalAmount: 0,
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ReceiptProduct[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleAnalysisComplete = async (analysis: OCRAnalysisResult, file: File) => {
    setAnalysisResult(analysis);
    
    // 🔍 DEBUG: Log completo de la respuesta OCR
    console.log('=== ANÁLISIS OCR COMPLETO ===');
    console.log('Respuesta completa:', analysis);
    console.log('Analysis structure:', analysis.analysis);
    console.log('Suggested form data:', analysis.analysis.suggested_form_data);
    console.log('OCR data:', analysis.analysis.ocr);
    console.log('Raw text presente:', !!analysis.analysis.ocr?.raw_text);
    
    // Extraer y formatear datos del análisis OCR
    const suggested = analysis.analysis.suggested_form_data;
    let formattedDate = suggested.date || '';
    if (suggested.date) {
      try {
        // Si viene en formato chileno DD/MM/YYYY, convertir a formato ISO
        if (suggested.date.includes('/')) {
          const dateParts = suggested.date.split('/');
          if (dateParts.length === 3) {
            const [day, month, year] = dateParts;
            formattedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0];
          }
        } else {
          // Ya está en formato ISO o similar
          formattedDate = new Date(suggested.date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error formateando fecha:', e);
        formattedDate = new Date().toISOString().split('T')[0]; // Fecha actual como fallback
      }
    }
    
    const extractedData = {
      companyName: suggested.companyName || '',
      folioNumber: suggested.folioNumber || '',
      date: formattedDate,
      description: suggested.description || '',
      totalAmount: suggested.totalAmount || 0,
      category: suggested.category || ''
    };
    
    setFormData(extractedData);
    
    // FLUJO AUTOMÁTICO: Si la confianza es alta (>90%), guardar automáticamente
    const overallConfidence = analysis.confidence_summary.overall_confidence;
    
    // Enriquecer datos extraídos con información del parser avanzado
    const enrichedData = {
      ...extractedData,
      detailed_products: analysis.analysis.suggested_form_data.detailed_products || [],
      transaction_data: analysis.analysis.suggested_form_data.transaction_data || null,
      location_data: analysis.analysis.suggested_form_data.location_data || null,
      chile_metadata: analysis.analysis.suggested_form_data.chile_metadata || null
    };
    
    if (overallConfidence > 0.90 && file) {
      try {
        setIsSubmitting(true);
        
        // Guardar automáticamente usando el nuevo método con datos enriquecidos
        const result = await receiptService.createReceiptWithImage(file, enrichedData);
        
        if (result && result.success) {
          const productCount = analysis.analysis.suggested_form_data.detailed_products?.length || 0;
          success(`¡Recibo procesado automáticamente! Confianza: ${Math.round(overallConfidence * 100)}%${productCount > 0 ? ` • ${productCount} productos detectados` : ''}`);
          setStep('success');
          
          // Opcional: Redirigir a "Mis Recibos" después de 2 segundos
          setTimeout(() => {
            navigate('/app/receipts');
          }, 2000);
          
          return; // Salir aquí, no continuar al formulario manual
        }
      } catch (err: any) {
        console.error('Error en guardado automático:', err);
        error(`Error en procesamiento automático: ${err.message || 'Error desconocido'}. Puedes completar manualmente.`);
      } finally {
        setIsSubmitting(false);
      }
    }
    
    // Si la confianza es baja o falló el guardado automático, continuar al formulario manual
    setFormData({
      companyName: extractedData.companyName,
      folioNumber: extractedData.folioNumber || analysis.analysis.suggested_form_data.location_data?.receipt_number || '',
      date: extractedData.date,
      description: extractedData.description,
      totalAmount: extractedData.totalAmount || analysis.analysis.suggested_form_data.transaction_data?.total_amount || extractedData.totalAmount,
      category: suggested.category || ''
    });
    
    // 🔍 DEBUG: Verificar múltiples fuentes de productos
    console.log('=== BÚSQUEDA DE PRODUCTOS ===');
    console.log('suggested_form_data.detailed_products:', analysis.analysis.suggested_form_data.detailed_products);
    console.log('ocr.items:', analysis.analysis.ocr?.items);
    console.log('ocr.detailed_items:', analysis.analysis.ocr?.detailed_items);
    console.log('parser_results.raw_text:', analysis.analysis.parser_results?.raw_text);
    console.log('parser_results.products:', analysis.analysis.parser_results?.products);
    
    // 🚀 FALLBACK: Parser directo en frontend si backend falla
    const parseProductsFromRawText = (rawText: string) => {
      if (!rawText) return [];
      
      console.log('🔧 FALLBACK: Parsing productos directamente en frontend');
      const lines = rawText.split('\n').filter(line => line.trim());
      const products = [];
      
      // Patrón mejorado para productos chilenos
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim();
        const nextLine = lines[i + 1]?.trim();
        const nextLine2 = lines[i + 2]?.trim();
        
        // Patrón 1: cantidad X precio unitario (ej: "2X1.000")
        const qtyPriceMatch = currentLine.match(/^(\d+)X([\d.,]+)$/);
        if (qtyPriceMatch && nextLine && nextLine2?.startsWith('$')) {
          const quantity = parseInt(qtyPriceMatch[1]);
          const unitPrice = parseFloat(qtyPriceMatch[2].replace(/[.,]/g, ''));
          const totalPrice = parseFloat(nextLine2.replace(/[$.,\s]/g, ''));
          
          products.push({
            id: `temp_${products.length}`,
            name: nextLine,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            confidence: 0.8,
            source: 'frontend_fallback'
          });
          
          console.log(`✅ Producto extraído: ${nextLine} (${quantity}x${unitPrice} = ${totalPrice})`);
          i += 2; // Saltar las líneas procesadas
          continue;
        }
        
        // Patrón 2: código de barras + nombre, precio inmediato (ej: "7803468005005 MOLD INT 630")
        const barcodeMatch = currentLine.match(/^(\d{13})\s+(.+)$/);
        if (barcodeMatch && nextLine?.startsWith('$')) {
          const barcode = barcodeMatch[1];
          const name = barcodeMatch[2];
          const totalPrice = parseFloat(nextLine.replace(/[$.,\s]/g, ''));
          
          if (totalPrice > 0) {
            products.push({
              id: `temp_${products.length}`,
              name: name,
              quantity: 1,
              unit_price: totalPrice,
              total_price: totalPrice,
              barcode: barcode,
              confidence: 0.8,
              source: 'frontend_fallback'
            });
            
            console.log(`✅ Producto con código extraído: ${name} (${barcode}) = ${totalPrice}`);
            i += 1; // Saltar línea de precio
            continue;
          }
        }
        
        // Patrón 3: código + nombre, luego "$" solo, luego precio en línea separada
        if (barcodeMatch && nextLine === '$' && nextLine2) {
          const barcode = barcodeMatch[1];
          const name = barcodeMatch[2];
          const priceText = nextLine2.trim();
          
          // Verificar si la siguiente línea contiene un precio válido
          const priceMatch = priceText.match(/^([\d.,]+)$/);
          if (priceMatch) {
            const totalPrice = parseFloat(priceMatch[1].replace(/[.,]/g, ''));
            
            if (totalPrice > 0) {
              products.push({
                id: `temp_${products.length}`,
                name: name,
                quantity: 1,
                unit_price: totalPrice,
                total_price: totalPrice,
                barcode: barcode,
                confidence: 0.8,
                source: 'frontend_fallback'
              });
              
              console.log(`✅ Producto separado extraído: ${name} (${barcode}) = ${totalPrice}`);
              i += 2; // Saltar líneas $ y precio
              continue;
            }
          }
        }
      }
      
      console.log(`🔍 Total productos encontrados: ${products.length}`);
      return products;
    };
    
    // Buscar productos en múltiples ubicaciones posibles
    let sourceProducts = analysis.analysis.suggested_form_data.detailed_products || 
                        analysis.analysis.parser_results?.products || 
                        analysis.analysis.ocr?.items || 
                        analysis.analysis.ocr?.detailed_items || 
                        [];
    
    // 🚀 Si no hay productos del backend, usar parser fallback
    const rawTextSource = analysis.analysis.parser_results?.raw_text || analysis.analysis.ocr?.raw_text;
    if ((!sourceProducts || sourceProducts.length === 0) && rawTextSource) {
      console.log('⚠️ No hay productos del backend, activando fallback parser');
      console.log('Raw text fuente:', rawTextSource.substring(0, 200) + '...');
      sourceProducts = parseProductsFromRawText(rawTextSource);
    }
    
    console.log('Productos finales encontrados:', sourceProducts.length);
    console.log('Source products:', sourceProducts);
    
    // NUEVO: Procesar productos extraídos si están disponibles
    if (sourceProducts && sourceProducts.length > 0) {
      const products = sourceProducts.map((product: any, index: number) => ({
        id: product.id || `temp_${index}`, // ID temporal para productos no guardados
        name: product.name,
        barcode: product.barcode,
        quantity: product.quantity,
        unit_price: product.unit_price,
        total_price: product.total_price,
        confidence: product.confidence || 0.7,
        extraction_method: 'advanced_parser',
        created_at: new Date().toISOString()
      }));
      setExtractedProducts(products);

      // Validar totales automáticamente
      const calculatedTotal = products.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0);
      const difference = Math.abs(calculatedTotal - (analysis.analysis.suggested_form_data.totalAmount || 0));
      const differencePercentage = calculatedTotal > 0 ? (difference / calculatedTotal) * 100 : 0;
      
      // Log validation results for debugging
      console.log('Validation results:', {
        is_valid: differencePercentage <= 5,
        declared_total: analysis.analysis.suggested_form_data.totalAmount || 0,
        calculated_total: calculatedTotal,
        difference,
        difference_percentage: differencePercentage,
        products_count: products.length
      });
    }
    
    console.log('🔄 SETTING STEP TO FORM - Analysis complete');
    console.log('🔄 ExtractedProducts before form:', extractedProducts.length);
    console.log('🔄 FormData before form:', formData);
    setStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      error('Error', 'Usuario no autenticado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Formatear fecha correctamente para el backend
      let formattedDate = formData.date;
      if (formData.date && !formData.date.includes('T')) {
        // Si es formato DD/MM/YYYY, convertir a ISO string
        const dateParts = formData.date.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          formattedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
        } else {
          // Si es otro formato, intentar parsearlo
          formattedDate = new Date(formData.date).toISOString();
        }
      }
      
      // Limpiar productos para compatibilidad con backend
      const cleanedProducts = extractedProducts.map(product => ({
        name: product.name,
        quantity: product.quantity,
        unit_price: product.unit_price,
        total_price: product.total_price,
        barcode: product.barcode && product.barcode !== 'undefined' ? product.barcode : null,
        // Eliminar campos que el backend no espera como 'id'
      }));

      // Crear objeto de datos para enviar al backend
      const submitData = {
        companyName: formData.companyName,
        folioNumber: formData.folioNumber,
        date: formattedDate,
        description: formData.description,
        totalAmount: formData.totalAmount,
        category: formData.category,
        // Incluir productos extraídos y análisis detallado
        products: cleanedProducts,
        analysisData: analysisResult ? {
          ocrData: analysisResult.analysis.ocr,
          parserResults: analysisResult.analysis.parser_results,
          suggestedFormData: analysisResult.analysis.suggested_form_data,
          confidence: analysisResult.confidence_summary?.overall_confidence || 0.8,
          rawText: analysisResult.analysis.parser_results?.raw_text || ''
        } : null
      };

      console.log('🚀 DATOS A ENVIAR AL BACKEND:');
      console.log('Products to send:', cleanedProducts.length);
      console.log('🔧 CLEANED PRODUCTS:', cleanedProducts);
      console.log('🔧 ORIGINAL PRODUCTS:', extractedProducts);
      console.log('Analysis data present:', !!analysisResult);
      console.log('Full submit data:', submitData);

      // Enviar al backend usando el servicio
      const response = await receiptService.createReceipt(submitData);
      
      if (response && response.id) {
        success('¡Éxito!', 'Recibo guardado correctamente');
        setStep('success');
      } else {
        throw new Error('Error guardando el recibo');
      }
      
    } catch (err: any) {
      error('Error', 'No se pudo guardar el recibo');
      console.error('Error saving receipt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetProcess = () => {
    setStep('analyze');
    setAnalysisResult(null);
    setFormData({
      companyName: '',
      folioNumber: '',
      date: '',
      description: '',
      totalAmount: 0,
      category: ''
    });
    setExtractedProducts([]);
  };

  const goToReceipts = () => {
    navigate('/app/receipts');
  };

  console.log('🔍 RENDER DEBUG - Current step:', step);
  console.log('🔍 RENDER DEBUG - ExtractedProducts length:', extractedProducts.length);
  console.log('🔍 RENDER DEBUG - AnalysisResult present:', !!analysisResult);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📱 Subir Recibo Inteligente
          </h1>
          <p className="text-gray-600">
            Usa nuestra IA para extraer automáticamente los datos de tu recibo
          </p>
          
          {/* Indicador de rol */}
          {user && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {user.role === 'employer' && '👔 Empleador'}
              {user.role === 'employee' && '👤 Empleado'}
              {user.role === 'client' && '🙋 Cliente'}
              {user.position && ` • ${user.position}`}
              {user.department && ` • ${user.department}`}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'analyze' ? 'bg-emerald-600 text-white' : 
              step === 'form' || step === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${
              step === 'form' || step === 'success' ? 'bg-emerald-600' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'form' ? 'bg-emerald-600 text-white' : 
              step === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${
              step === 'success' ? 'bg-emerald-600' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'success' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Análisis */}
        {step === 'analyze' && (
          <AutoReceiptAnalyzer
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={() => navigate('/receipts')}
          />
        )}

        {/* Step 2: Formulario */}
        {step === 'form' && analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  ✏️ Verificar y Completar Datos
                </h3>
                <div className="text-sm text-gray-600">
                  Confianza: {(analysisResult.confidence_summary.overall_confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Resumen de Transacción con componente mejorado */}
              {analysisResult.analysis.suggested_form_data.transaction_data && (
                <div className="mb-6">
                  <TransactionSummary 
                    transaction={analysisResult.analysis.suggested_form_data.transaction_data}
                    location={analysisResult.analysis.suggested_form_data.location_data}
                    confidence={analysisResult.confidence_summary.transaction_confidence || analysisResult.confidence_summary.overall_confidence}
                  />
                </div>
              )}

              {/* Productos Detectados con componentes mejorados */}
              {extractedProducts && extractedProducts.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        🤖 Productos Detectados por IA
                        <span className="ml-3 text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                          {extractedProducts.length} encontrados
                        </span>
                      </h4>
                      <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                        {analysisResult.confidence_summary.products_confidence ? 
                          `${(analysisResult.confidence_summary.products_confidence * 100).toFixed(0)}% confianza` : 
                          'Extraído con IA'}
                      </div>
                    </div>
                    
                    {/* Explicación clara de la diferencia */}
                    <div className="flex items-start space-x-4 text-sm">
                      <div className="flex items-center space-x-2 text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        📋
                        <span>Boleta declara: <strong>7 artículos vendidos</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        🤖
                        <span>IA detectó: <strong>{extractedProducts.length} productos individuales</strong></span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600 bg-yellow-50 px-3 py-2 rounded border-l-4 border-yellow-400">
                      💡 <strong>Nota:</strong> La diferencia puede deberse a productos con cantidad mayor a 1 o líneas que la IA no pudo procesar completamente.
                    </div>
                  </div>
                  
                  <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
                    {extractedProducts.length > 0 ? (
                      <ProductList
                        products={extractedProducts}
                        declaredTotal={formData.totalAmount}
                        receiptId="preview"
                        onProductUpdate={(productId: string, updates: Partial<ReceiptProduct>) => {
                          setExtractedProducts(prev => prev.map(p => 
                            p.id === productId ? { ...p, ...updates } : p
                          ));
                        }}
                        onValidationComplete={(isValid: boolean, difference: number) => {
                          // Log validation completion for debugging
                          console.log('Product validation completed:', {
                            is_valid: isValid,
                            declared_total: formData.totalAmount,
                            calculated_total: extractedProducts.reduce((sum, p) => sum + (p.total_price || 0), 0),
                            difference,
                            difference_percentage: (difference / formData.totalAmount) * 100
                          });
                        }}
                        readOnly={false}
                      />
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <div className="h-12 w-12 text-gray-400 mx-auto mb-3">
                          🛒
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Sin productos detectados
                        </h3>
                        <p className="text-gray-600 text-sm">
                          No se pudieron extraer productos individuales de este recibo. 
                          Aún puedes guardar el recibo con la información básica.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
                  
                  {/* Información de Ubicación */}
                  {analysisResult.analysis.suggested_form_data.location_data && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                      <h5 className="font-medium text-gray-900 mb-2">📍 Información del Comercio</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {analysisResult.analysis.suggested_form_data.location_data.address && (
                          <div>
                            <span className="text-gray-600">Dirección:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.location_data.address}</div>
                          </div>
                        )}
                        {analysisResult.analysis.suggested_form_data.location_data.city && (
                          <div>
                            <span className="text-gray-600">Ciudad:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.location_data.city}</div>
                          </div>
                        )}
                        {analysisResult.analysis.suggested_form_data.location_data.receipt_number && (
                          <div>
                            <span className="text-gray-600">N° Recibo:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.location_data.receipt_number}</div>
                          </div>
                        )}
                        {analysisResult.analysis.suggested_form_data.location_data.transaction_time && (
                          <div>
                            <span className="text-gray-600">Hora:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.location_data.transaction_time}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata Chilena */}
                  {analysisResult.analysis.suggested_form_data.chile_metadata && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                      <h5 className="font-medium text-gray-900 mb-2">🇨🇱 Información Chilena</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {analysisResult.analysis.suggested_form_data.chile_metadata.rut_emisor && (
                          <div>
                            <span className="text-gray-600">RUT:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.chile_metadata.rut_emisor}</div>
                          </div>
                        )}
                        {analysisResult.analysis.suggested_form_data.chile_metadata.folio && (
                          <div>
                            <span className="text-gray-600">Folio:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.chile_metadata.folio}</div>
                          </div>
                        )}
                        {analysisResult.analysis.suggested_form_data.chile_metadata.currency && (
                          <div>
                            <span className="text-gray-600">Moneda:</span>
                            <div className="font-medium">{analysisResult.analysis.suggested_form_data.chile_metadata.currency}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto Total *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Folio
                    </label>
                    <input
                      type="text"
                      value={formData.folioNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, folioNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Número de folio"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Descripción del gasto"
                  />
                </div>

                {formData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría Sugerida
                    </label>
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-center justify-between">
                      <span>{formData.category}</span>
                      {analysisResult.confidence_summary.category_confidence && (
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          {(analysisResult.confidence_summary.category_confidence * 100).toFixed(0)}% confianza
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Métricas de Confianza Detalladas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📊 Métricas de Análisis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysisResult.confidence_summary.ocr_confidence !== undefined && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          analysisResult.confidence_summary.ocr_confidence > 0.8 ? 'text-green-600' :
                          analysisResult.confidence_summary.ocr_confidence > 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(analysisResult.confidence_summary.ocr_confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">OCR</div>
                      </div>
                    )}
                    
                    {analysisResult.confidence_summary.category_confidence && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          analysisResult.confidence_summary.category_confidence > 0.8 ? 'text-green-600' :
                          analysisResult.confidence_summary.category_confidence > 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(analysisResult.confidence_summary.category_confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Categoría</div>
                      </div>
                    )}
                    
                    {analysisResult.confidence_summary.location_confidence && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          analysisResult.confidence_summary.location_confidence > 0.8 ? 'text-green-600' :
                          analysisResult.confidence_summary.location_confidence > 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(analysisResult.confidence_summary.location_confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Ubicación</div>
                      </div>
                    )}
                    
                    {analysisResult.confidence_summary.parsing_confidence && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          analysisResult.confidence_summary.parsing_confidence > 0.8 ? 'text-green-600' :
                          analysisResult.confidence_summary.parsing_confidence > 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(analysisResult.confidence_summary.parsing_confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Parsing</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetProcess}
                    disabled={isSubmitting}
                  >
                    Volver al Análisis
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-32"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : 'Guardar Recibo'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Éxito */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="p-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Recibo Guardado Exitosamente!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu recibo ha sido procesado y guardado con todos los datos extraídos automáticamente
              </p>
              
              {analysisResult && (
                <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-emerald-800">
                    <strong>Datos procesados:</strong> {formData.companyName} • {formData.totalAmount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} • {formData.date}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={resetProcess}
                >
                  Subir Otro Recibo
                </Button>
                <Button
                  onClick={goToReceipts}
                >
                  Ver Mis Recibos
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
