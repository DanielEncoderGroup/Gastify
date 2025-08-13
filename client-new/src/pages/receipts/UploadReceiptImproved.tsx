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
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleAnalysisComplete = async (analysis: OCRAnalysisResult, file: File) => {
    setAnalysisResult(analysis);
    
    // Auto-llenar el formulario con los datos extraídos
    const suggested = analysis.analysis.suggested_form_data;
    const extractedData = {
      companyName: suggested.companyName || '',
      folioNumber: suggested.folioNumber || '',
      date: suggested.date || '',
      description: suggested.description || '',
      totalAmount: suggested.totalAmount || 0,
      category: suggested.category || ''
    };
    
    setFormData(extractedData);
    
    // FLUJO AUTOMÁTICO: Si la confianza es alta (>90%), guardar automáticamente
    const overallConfidence = analysis.confidence_summary.overall_confidence;
    
    if (overallConfidence > 0.90 && file) {
      try {
        setIsSubmitting(true);
        
        // Guardar automáticamente usando el nuevo método
        const result = await receiptService.createReceiptWithImage(file, extractedData);
        
        if (result.success) {
          success(`¡Recibo procesado automáticamente! Confianza: ${Math.round(overallConfidence * 100)}%`);
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
      folioNumber: extractedData.folioNumber,
      date: extractedData.date,
      description: extractedData.description,
      totalAmount: extractedData.totalAmount,
      category: suggested.category || ''
    });
    
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
      // Crear objeto de datos para enviar al backend
      const submitData = {
        companyName: formData.companyName,
        folioNumber: formData.folioNumber,
        date: formData.date,
        description: formData.description,
        totalAmount: formData.totalAmount,
        category: formData.category
      };

      await receiptService.createReceipt(submitData);
      
      success('¡Recibo guardado!', 'El recibo se ha guardado exitosamente');
      setStep('success');
      
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
  };

  const goToReceipts = () => {
    navigate('/receipts');
  };

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
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                      {formData.category}
                    </div>
                  </div>
                )}

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
