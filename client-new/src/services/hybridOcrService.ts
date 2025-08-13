/**
 * Servicio para OCR Híbrido (Tesseract + Google Vision)
 * Proporciona análisis de recibos con >95% precisión usando decisión inteligente de engines
 */

import api from './api';

// Tipos para el sistema OCR híbrido
export interface HybridOCRAnalysisResult {
  success: boolean;
  message: string;
  analysis: {
    ocr: {
      vendor: string;
      total_amount: number;
      date: string;
      items: Array<{
        name: string;
        price: number;
        quantity?: number;
        unit?: string;
        product_match?: any;
        name_corrected?: boolean;
        price_warning?: string;
      }>;
      raw_text: string;
      confidence: number;
      processing_time: number;
      extraction_method: string;
      chile_specific_data: {
        rut_detected: boolean;
        document_type: string;
        iva_detected: boolean;
        known_brand?: string;
      };
    };
    categorization?: {
      category: string;
      confidence: number;
      method: string;
      chile_specific: any;
      all_probabilities: Record<string, number>;
    };
    geolocation?: {
      location: any;
      extraction_method: string;
      confidence: number;
    };
    hybrid_metadata: {
      engine_used: 'tesseract' | 'google_vision' | 'hybrid';
      fallback_used: boolean;
      google_usage_count: number;
      processing_time: number;
      timestamp: string;
    };
  };
  confidence_summary: {
    ocr_confidence: number;
    category_confidence: number;
    location_confidence: number;
    overall_confidence: number;
  };
  suggested_form_data: {
    companyName: string;
    totalAmount: number;
    date: string;
    category: string;
    description: string;
    folioNumber: string;
    items: Array<any>;
  };
}

export interface HybridUsageStats {
  success: boolean;
  message: string;
  stats: {
    total_requests: number;
    tesseract_usage: number;
    google_vision_usage: number;
    google_usage_month: number;
    google_remaining: number;
    google_monthly_limit: number;
    cache_hits: number;
    cache_total: number;
    average_confidence: number;
    confidence_threshold: number;
    google_vision_available: boolean;
    cache_enabled: boolean;
  };
  recommendations: {
    google_vision_status: 'available' | 'unavailable';
    monthly_usage_status: 'within_limit' | 'approaching_limit' | 'limit_exceeded';
    suggested_engine: 'google_vision' | 'hybrid' | 'tesseract';
  };
}

export interface HybridHealthCheck {
  success: boolean;
  message: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    tesseract: 'available' | 'unavailable';
    google_vision: 'available' | 'unavailable';
    cache: 'available' | 'unavailable';
    categorization: 'available' | 'unavailable';
    geolocation: 'available' | 'unavailable';
  };
  configuration: {
    google_vision_enabled: boolean;
    monthly_limit: number;
    confidence_threshold: number;
    cache_enabled: boolean;
  };
  usage: {
    total_requests: number;
    google_usage_month: number;
    cache_hits: number;
    average_confidence: number;
  };
}

class HybridOCRService {
  /**
   * Analiza un recibo usando el sistema OCR híbrido
   */
  async analyzeReceiptHybrid(
    file: File,
    options: {
      forceEngine?: 'tesseract' | 'google_vision' | 'hybrid';
      includeCategorization?: boolean;
      includeGeolocation?: boolean;
    } = {}
  ): Promise<HybridOCRAnalysisResult> {
    const formData = new FormData();
    formData.append('image', file);

    const params = new URLSearchParams();
    if (options.forceEngine) {
      params.append('force_engine', options.forceEngine);
    }
    if (options.includeCategorization !== undefined) {
      params.append('include_categorization', options.includeCategorization.toString());
    }
    if (options.includeGeolocation !== undefined) {
      params.append('include_geolocation', options.includeGeolocation.toString());
    }

    const queryString = params.toString();
    const url = `/hybrid-ocr/analyze-hybrid${queryString ? `?${queryString}` : ''}`;

    const response = await api.post<HybridOCRAnalysisResult>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Obtiene estadísticas de uso del sistema híbrido
   */
  async getUsageStats(): Promise<HybridUsageStats> {
    const response = await api.get<HybridUsageStats>('/hybrid-ocr/usage-stats');
    return response.data;
  }

  /**
   * Limpia el cache del sistema OCR
   */
  async clearCache(): Promise<{ success: boolean; message: string; cache_path: string }> {
    const response = await api.post('/hybrid-ocr/clear-cache');
    return response.data;
  }

  /**
   * Verifica el estado del sistema OCR híbrido
   */
  async healthCheck(): Promise<HybridHealthCheck> {
    const response = await api.get<HybridHealthCheck>('/hybrid-ocr/health');
    return response.data;
  }

  /**
   * Obtiene recomendaciones basadas en el estado actual
   */
  async getRecommendations(): Promise<{
    engine_recommendation: string;
    confidence_tips: string[];
    usage_warnings: string[];
  }> {
    const stats = await this.getUsageStats();
    const health = await this.healthCheck();

    const recommendations = {
      engine_recommendation: '',
      confidence_tips: [] as string[],
      usage_warnings: [] as string[]
    };

    // Recomendación de engine
    if (stats.recommendations.google_vision_status === 'available' && 
        stats.stats.google_remaining > 500) {
      recommendations.engine_recommendation = 'Se recomienda usar el modo híbrido para máxima precisión';
    } else if (stats.recommendations.monthly_usage_status === 'approaching_limit') {
      recommendations.engine_recommendation = 'Quedas cerca del límite mensual. Considera usar solo Tesseract para algunas imágenes';
    } else if (stats.recommendations.monthly_usage_status === 'limit_exceeded') {
      recommendations.engine_recommendation = 'Límite mensual de Google Vision excedido. Solo disponible Tesseract este mes';
    }

    // Tips de confianza
    if (stats.stats.average_confidence < 0.8) {
      recommendations.confidence_tips.push('Asegúrate de que las imágenes tengan buena iluminación');
      recommendations.confidence_tips.push('Evita imágenes borrosas o con mucho ruido');
    }

    if (health.components.google_vision === 'unavailable') {
      recommendations.confidence_tips.push('Google Vision no disponible. Configura las credenciales en .env');
    }

    // Advertencias de uso
    if (stats.stats.google_usage_month > stats.stats.google_monthly_limit * 0.8) {
      recommendations.usage_warnings.push(`Has usado ${stats.stats.google_usage_month}/${stats.stats.google_monthly_limit} requests de Google Vision este mes`);
    }

    if (stats.stats.cache_hits / stats.stats.cache_total < 0.1 && stats.stats.cache_total > 10) {
      recommendations.usage_warnings.push('Bajo uso de cache. Considera usar el mismo tipo de imágenes para aprovechar el cache');
    }

    return recommendations;
  }

  /**
   * Formatea el tiempo de procesamiento para mostrar al usuario
   */
  formatProcessingTime(timeInSeconds: number): string {
    if (timeInSeconds < 1) {
      return `${Math.round(timeInSeconds * 1000)}ms`;
    } else if (timeInSeconds < 60) {
      return `${timeInSeconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.round(timeInSeconds % 60);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Obtiene el color de confianza para UI
   */
  getConfidenceColor(confidence: number): 'green' | 'yellow' | 'red' {
    if (confidence >= 0.9) return 'green';
    if (confidence >= 0.7) return 'yellow';
    return 'red';
  }

  /**
   * Obtiene el texto descriptivo de confianza
   */
  getConfidenceText(confidence: number): string {
    if (confidence >= 0.95) return 'Excelente';
    if (confidence >= 0.9) return 'Muy buena';
    if (confidence >= 0.8) return 'Buena';
    if (confidence >= 0.7) return 'Aceptable';
    if (confidence >= 0.5) return 'Baja';
    return 'Muy baja';
  }

  /**
   * Obtiene el ícono del engine usado
   */
  getEngineIcon(engine: string): string {
    switch (engine) {
      case 'google_vision':
        return '🔍'; // Google Vision
      case 'tesseract':
        return '📖'; // Tesseract
      case 'hybrid':
        return '🤖'; // Híbrido
      default:
        return '⚙️'; // Genérico
    }
  }

  /**
   * Obtiene descripción del engine usado
   */
  getEngineDescription(engine: string): string {
    switch (engine) {
      case 'google_vision':
        return 'Google Vision API (Premium)';
      case 'tesseract':
        return 'Tesseract OCR (Gratuito)';
      case 'hybrid':
        return 'Sistema Híbrido (Inteligente)';
      default:
        return 'Engine desconocido';
    }
  }
}

// Instancia singleton
export const hybridOcrService = new HybridOCRService();
export default hybridOcrService;
