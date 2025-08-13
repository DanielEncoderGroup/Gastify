/**
 * Componente mejorado para análisis de recibos usando sistema OCR híbrido
 * Proporciona feedback detallado, selección de engine y monitoreo en tiempo real
 */

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { hybridOcrService, HybridOCRAnalysisResult } from '../../../services/hybridOcrService';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { useToast } from '../../ui/Toast';

interface HybridReceiptAnalyzerProps {
  onAnalysisComplete?: (result: HybridOCRAnalysisResult, file: File) => void;
  onError?: (error: string) => void;
  className?: string;
  showAdvancedOptions?: boolean;
  autoAnalyze?: boolean;
}

interface AnalysisOptions {
  forceEngine?: 'tesseract' | 'google_vision' | 'hybrid';
  includeCategorization: boolean;
  includeGeolocation: boolean;
}

export const HybridReceiptAnalyzer: React.FC<HybridReceiptAnalyzerProps> = ({
  onAnalysisComplete,
  onError,
  className = '',
  showAdvancedOptions = true,
  autoAnalyze = true
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HybridOCRAnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    forceEngine: undefined,
    includeCategorization: true,
    includeGeolocation: true
  });
  const [showRawText, setShowRawText] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  
  const { success: addSuccessToast, error: addErrorToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función principal de análisis
  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Obtener estadísticas de uso antes del análisis
      try {
        const stats = await hybridOcrService.getUsageStats();
        setUsageStats(stats);
      } catch (statsError) {
        console.warn('No se pudieron obtener estadísticas:', statsError);
      }

      const result = await hybridOcrService.analyzeReceiptHybrid(file, analysisOptions);
      
      setAnalysisResult(result);
      
      // Mostrar toast con resultado
      const engineIcon = hybridOcrService.getEngineIcon(result.analysis.hybrid_metadata.engine_used);
      const confidenceText = hybridOcrService.getConfidenceText(result.confidence_summary.overall_confidence);
      
      addSuccessToast(
        'Análisis completado',
        `${engineIcon} ${confidenceText} (${(result.confidence_summary.overall_confidence * 100).toFixed(1)}%)`
      );

      // Callback de éxito
      if (onAnalysisComplete) {
        onAnalysisComplete(result, file);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido';
      
      addErrorToast(
        'Error en análisis',
        errorMessage
      );

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [analysisOptions, onAnalysisComplete, onError, addSuccessToast, addErrorToast]);

  // Configurar dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Auto-analizar si está habilitado
    if (autoAnalyze) {
      await analyzeFile(file);
    }
  }, [autoAnalyze, analyzeFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Manejar nuevo análisis
  const handleReanalyze = () => {
    if (selectedFile) {
      analyzeFile(selectedFile);
    }
  };

  // Limpiar estado
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setShowRawText(false);
  };

  // Renderizar estadísticas de uso
  const renderUsageStats = () => {
    if (!usageStats?.stats) return null;

    const stats = usageStats.stats;
    const recommendations = usageStats.recommendations;

    return (
      <Card className="mt-4 p-4 bg-gray-50">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Estado del Sistema</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Google Vision:</span>
            <div className={`font-semibold ${stats.google_vision_available ? 'text-green-600' : 'text-red-600'}`}>
              {stats.google_remaining}/{stats.google_monthly_limit}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Cache Hits:</span>
            <div className="font-semibold text-blue-600">
              {((stats.cache_hits / Math.max(stats.cache_total, 1)) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <span className="text-gray-500">Confianza Promedio:</span>
            <div className={`font-semibold ${hybridOcrService.getConfidenceColor(stats.average_confidence) === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>
              {(stats.average_confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <span className="text-gray-500">Engine Recomendado:</span>
            <div className="font-semibold text-emerald-600">
              {recommendations.suggested_engine === 'google_vision' ? '🔍 Google' : 
               recommendations.suggested_engine === 'hybrid' ? '🤖 Híbrido' : '📖 Tesseract'}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Renderizar opciones avanzadas
  const renderAdvancedOptions = () => {
    if (!showAdvancedOptions) return null;

    return (
      <Card className="mt-4 p-4">
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Opciones Avanzadas</h4>
        
        {/* Selección de Engine */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Engine OCR:
          </label>
          <select 
            value={analysisOptions.forceEngine || 'auto'}
            onChange={(e) => setAnalysisOptions(prev => ({
              ...prev,
              forceEngine: e.target.value === 'auto' ? undefined : e.target.value as any
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="auto">🤖 Automático (Recomendado)</option>
            <option value="tesseract">📖 Solo Tesseract (Gratuito)</option>
            <option value="google_vision">🔍 Solo Google Vision (Premium)</option>
            <option value="hybrid">⚡ Híbrido (Mejor Precisión)</option>
          </select>
        </div>

        {/* Opciones de procesamiento */}
        <div className="space-y-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={analysisOptions.includeCategorization}
              onChange={(e) => setAnalysisOptions(prev => ({
                ...prev,
                includeCategorization: e.target.checked
              }))}
              className="mr-2 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Incluir categorización automática
          </label>
          
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={analysisOptions.includeGeolocation}
              onChange={(e) => setAnalysisOptions(prev => ({
                ...prev,
                includeGeolocation: e.target.checked
              }))}
              className="mr-2 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Incluir geolocalización
          </label>
        </div>
      </Card>
    );
  };

  // Renderizar resultado del análisis
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { analysis, confidence_summary } = analysisResult;
    const ocrData = analysis.ocr;
    const hybridMeta = analysis.hybrid_metadata;

    return (
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Resultado del Análisis</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              hybridOcrService.getConfidenceColor(confidence_summary.overall_confidence) === 'green' 
                ? 'bg-green-100 text-green-800'
                : hybridOcrService.getConfidenceColor(confidence_summary.overall_confidence) === 'yellow'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {hybridOcrService.getConfidenceText(confidence_summary.overall_confidence)} 
              ({(confidence_summary.overall_confidence * 100).toFixed(1)}%)
            </span>
            <span className="text-xs text-gray-500">
              {hybridOcrService.getEngineIcon(hybridMeta.engine_used)} 
              {hybridOcrService.getEngineDescription(hybridMeta.engine_used)}
            </span>
          </div>
        </div>

        {/* Datos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Empresa:</label>
            <div className="flex items-center">
              <span className="text-sm font-medium">{ocrData.vendor || 'No detectado'}</span>
              {ocrData.chile_specific_data.known_brand && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded">
                  Marca conocida
                </span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Total:</label>
            <span className="text-sm font-medium">
              ${ocrData.total_amount?.toLocaleString() || '0'}
            </span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha:</label>
            <span className="text-sm">{ocrData.date || 'No detectada'}</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo documento:</label>
            <span className="text-sm capitalize">
              {ocrData.chile_specific_data.document_type}
              {ocrData.chile_specific_data.rut_detected && ' ✓ RUT'}
              {ocrData.chile_specific_data.iva_detected && ' ✓ IVA'}
            </span>
          </div>
        </div>

        {/* Ítems */}
        {ocrData.items && ocrData.items.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Ítems detectados ({ocrData.items.length}):
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {ocrData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className={item.name_corrected ? 'font-medium text-emerald-600' : ''}>
                      {item.name}
                    </span>
                    {item.name_corrected && (
                      <span className="ml-1 text-xs text-emerald-600">✓ Corregido</span>
                    )}
                    {item.quantity && item.quantity > 1 && (
                      <span className="ml-2 text-xs text-gray-500">x{item.quantity}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">${item.price?.toLocaleString() || '0'}</span>
                    {item.price_warning && (
                      <div className="text-xs text-orange-600">⚠️ {item.price_warning}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorización */}
        {analysis.categorization && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría:</label>
            <div className="flex items-center">
              <span className="text-sm font-medium">{analysis.categorization.category}</span>
              <span className="ml-2 text-xs text-gray-500">
                ({(analysis.categorization.confidence * 100).toFixed(0)}% confianza)
              </span>
            </div>
          </div>
        )}

        {/* Métricas técnicas */}
        <div className="border-t pt-3 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Tiempo:</span>
              <div className="font-medium">
                {hybridOcrService.formatProcessingTime(hybridMeta.processing_time)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Fallback usado:</span>
              <div className={`font-medium ${hybridMeta.fallback_used ? 'text-orange-600' : 'text-green-600'}`}>
                {hybridMeta.fallback_used ? 'Sí' : 'No'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Uso Google Vision:</span>
              <div className="font-medium">{hybridMeta.google_usage_count}</div>
            </div>
            <div>
              <span className="text-gray-500">Confianza OCR:</span>
              <div className={`font-medium ${hybridOcrService.getConfidenceColor(confidence_summary.ocr_confidence) === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>
                {(confidence_summary.ocr_confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Botón para mostrar texto crudo */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Ocultar' : 'Mostrar'} texto crudo
          </Button>
          
          {showRawText && (
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {ocrData.raw_text}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zona de drop */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="space-y-2">
            <div className="text-4xl">📸</div>
            <div className="text-lg font-medium text-gray-700">
              {isDragActive ? '¡Suelta la imagen aquí!' : 'Arrastra una imagen de recibo'}
            </div>
            <div className="text-sm text-gray-500">
              o haz clic para seleccionar archivo
            </div>
            <div className="text-xs text-gray-400">
              PNG, JPG, GIF hasta 10MB
            </div>
          </div>
        </div>
      )}

      {/* Preview y controles */}
      {selectedFile && (
        <Card className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Imagen seleccionada</h3>
              <p className="text-sm text-gray-500">{selectedFile.name}</p>
            </div>
            <div className="flex space-x-2">
              {!autoAnalyze && !isAnalyzing && (
                <Button onClick={handleReanalyze} size="sm">
                  Analizar
                </Button>
              )}
              <Button variant="outline" onClick={handleClear} size="sm">
                Cambiar imagen
              </Button>
            </div>
          </div>

          {/* Preview de imagen */}
          {previewUrl && (
            <div className="mb-4">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full h-auto max-h-64 rounded border"
              />
            </div>
          )}

          {/* Loading state */}
          {isAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" withLogo className="mr-3" />
              <div>
                <div className="font-medium text-gray-700">Analizando recibo...</div>
                <div className="text-sm text-gray-500">
                  Usando sistema OCR híbrido {analysisOptions.forceEngine ? `(${analysisOptions.forceEngine})` : '(automático)'}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Estadísticas de uso */}
      {renderUsageStats()}

      {/* Opciones avanzadas */}
      {renderAdvancedOptions()}

      {/* Resultado del análisis */}
      {renderAnalysisResult()}
    </div>
  );
};
