import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ocrService, OCRAnalysisResult } from '../../../services/ocrService';
import { useToast } from '../../ui/Toast';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

interface AutoReceiptAnalyzerProps {
  onAnalysisComplete: (analysis: OCRAnalysisResult, imageFile: File) => void;
  onCancel?: () => void;
}

export const AutoReceiptAnalyzer: React.FC<AutoReceiptAnalyzerProps> = ({
  onAnalysisComplete,
  onCancel
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<OCRAnalysisResult | null>(null);
  const { success, error } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Iniciar análisis
    setIsAnalyzing(true);
    try {
      const result = await ocrService.analyzeReceipt(file);
      setAnalysisResult(result);
      
      if (result.success) {
        success('¡Análisis completado!', 
          `Confianza general: ${(result.confidence_summary.overall_confidence * 100).toFixed(1)}%`
        );
        // Pasar tanto el resultado como el archivo
        onAnalysisComplete(result, file);
      } else {
        error('Error en el análisis', result.message);
      }
    } catch (err: any) {
      error('Error', 'No se pudo analizar el recibo');
      console.error('Error analyzing receipt:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete, success, error]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isAnalyzing
  });

  const resetAnalysis = () => {
    setPreview(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  if (analysisResult && !isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Análisis Completado
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAnalysis}
              >
                Analizar Otro
              </Button>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Preview de la imagen */}
          {preview && (
            <div className="mb-6">
              <img
                src={preview}
                alt="Recibo analizado"
                className="max-w-full h-48 object-contain mx-auto rounded-lg border"
              />
            </div>
          )}

          {/* Resumen de confianza */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(analysisResult.confidence_summary.ocr_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-blue-700">OCR</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(analysisResult.confidence_summary.category_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-green-700">Categoría</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(analysisResult.confidence_summary.location_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-700">Ubicación</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {(analysisResult.confidence_summary.overall_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-emerald-700">General</div>
            </div>
          </div>

          {/* Datos extraídos */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Datos Extraídos:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Proveedor:</span>
                  <span className="font-medium">
                    {analysisResult.analysis.suggested_form_data.companyName || 'No detectado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monto:</span>
                  <span className="font-medium">
                    ${analysisResult.analysis.suggested_form_data.totalAmount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <span className="font-medium">
                    {analysisResult.analysis.suggested_form_data.date || 'No detectada'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <span className="font-medium">
                    {analysisResult.analysis.suggested_form_data.category || 'No clasificada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Folio:</span>
                  <span className="font-medium">
                    {analysisResult.analysis.suggested_form_data.folioNumber || 'No detectado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-medium">
                    {analysisResult.analysis.suggested_form_data.detailed_products?.length || 0} detectados
                  </span>
                </div>
              </div>
            </div>

            {/* Items detectados */}
            {analysisResult.analysis.suggested_form_data.detailed_products && 
             analysisResult.analysis.suggested_form_data.detailed_products.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Productos Detectados:</h5>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {analysisResult.analysis.suggested_form_data.detailed_products.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm py-1">
                      <span>{item.name} {item.quantity && `(x${item.quantity})`}</span>
                      <span>${item.total_price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            {analysisResult.analysis.categorization && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <strong>Información Chile:</strong>
                  {analysisResult.analysis.categorization.chile_specific.rut_detected && 
                    <span className="ml-2 text-green-600">✓ RUT detectado</span>
                  }
                  {analysisResult.analysis.categorization.chile_specific.iva_detected && 
                    <span className="ml-2 text-green-600">✓ IVA detectado</span>
                  }
                  {analysisResult.analysis.categorization.chile_specific.known_brand && 
                    <span className="ml-2 text-blue-600">
                      Marca: {analysisResult.analysis.categorization.chile_specific.known_brand}
                    </span>
                  }
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🤖 Análisis Automático de Recibos
          </h3>
          <p className="text-gray-600 mb-6">
            Sube una foto de tu recibo y nuestro sistema IA extraerá automáticamente todos los datos
          </p>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200
              ${isDragActive 
                ? 'border-emerald-400 bg-emerald-50' 
                : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
              }
              ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <LoadingSpinner size="lg" />
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      Analizando recibo...
                    </div>
                    <div className="text-sm text-gray-600">
                      Extrayendo datos con IA • OCR • Categorización • Geolocalización
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-6xl">📱</div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Soporta JPG, PNG, WebP • Máximo 10MB
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {preview && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-32 object-contain mx-auto rounded-lg border"
              />
            </motion.div>
          )}

          {onCancel && (
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isAnalyzing}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Información sobre el proceso */}
      <Card className="p-4">
        <div className="text-sm text-gray-600">
          <h4 className="font-medium text-gray-900 mb-2">¿Cómo funciona?</h4>
          <ul className="space-y-1">
            <li>• <strong>OCR Avanzado:</strong> Extrae texto e información estructurada</li>
            <li>• <strong>IA Categorización:</strong> Clasifica automáticamente el tipo de gasto</li>
            <li>• <strong>Geolocalización:</strong> Detecta ubicación y datos del comercio</li>
            <li>• <strong>Validación Chile:</strong> Reconoce RUT, IVA y marcas locales</li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};
