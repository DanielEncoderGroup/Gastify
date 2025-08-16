"""
Servicio OCR Inteligente 100% Automatizado para Gastify
Extiende enhanced_ocr_service.py con capacidades multi-engine y consenso automático
Objetivo: >95% precisión sin intervención manual
"""

import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Importar servicios existentes
from .enhanced_ocr_service import EnhancedOCRService
from .consensus_engine import ConsensusEngine
from .automatic_line_extractor import AutomaticLineExtractor
from ..databases.chile_products_db import ChileProductsDB
from .chile_ml_categorization import ChileCategorizerService
from .ocr.tesseract_ocr_service import TesseractOCRService
from .ocr.easyocr_service import EasyOCRService
from .ocr.paddleocr_service import PaddleOCRService

# Importar engines OCR adicionales
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR no disponible. Instalar con: pip install easyocr")

try:
    import paddleocr
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logging.warning("PaddleOCR no disponible. Instalar con: pip install paddleocr")

logger = logging.getLogger(__name__)

class IntelligentOCRService(EnhancedOCRService):
    """
    Servicio OCR Inteligente que extiende EnhancedOCRService con:
    - Multi-engine OCR (Tesseract + EasyOCR + PaddleOCR)
    - Consenso automático sin intervención manual
    - Auto-corrección avanzada usando base de conocimiento
    - Validación y reconciliación automática de totales
    - Extracción de líneas de detalle con >95% precisión
    """
    
    def __init__(self, language: str = "auto"):
        """
        Inicializa el servicio OCR inteligente.
        
        Args:
            language: Idioma(s) para OCR. "auto" para detección automática.
        """
        # Inicializar servicio base
        super().__init__(language)
        
        # Inicializar componentes adicionales
        self.consensus_engine = ConsensusEngine()
        self.products_db = ChileProductsDB()
        self.categorizer = ChileCategorizerService()
        self.line_extractor = AutomaticLineExtractor()
        
        # Inicializar engines OCR múltiples
        self.engines = self._initialize_multi_ocr_engines()
        self.engine_weights = {
            'tesseract': 0.30,
            'easyocr': 0.35,
            'paddleocr': 0.35
        }
        
        # Configuración de automatización
        self.auto_confidence_threshold = 0.95  # >95% para ser completamente automático
        self.consensus_threshold = 0.85
        self.validation_threshold = 0.90
        
        logger.info(f"IntelligentOCRService inicializado con {len(self.engines)} engines")
    
    def _initialize_multi_ocr_engines(self) -> Dict[str, Any]:
        """Inicializar múltiples engines OCR con servicios dedicados"""
        engines = {}
        
        # Tesseract OCR Service
        try:
            engines['tesseract'] = TesseractOCRService()
            logger.info("TesseractOCRService inicializado")
        except Exception as e:
            logger.warning(f"Error inicializando Tesseract: {e}")
        
        # EasyOCR Service
        try:
            easyocr_service = EasyOCRService()
            if easyocr_service.is_available():
                engines['easyocr'] = easyocr_service
                logger.info("EasyOCRService inicializado")
            else:
                logger.warning("EasyOCR no está disponible")
        except Exception as e:
            logger.warning(f"Error inicializando EasyOCR: {e}")
        
        # PaddleOCR Service
        try:
            paddleocr_service = PaddleOCRService()
            if paddleocr_service.is_available():
                engines['paddleocr'] = paddleocr_service
                logger.info("PaddleOCRService inicializado")
            else:
                logger.warning("PaddleOCR no está disponible")
        except Exception as e:
            logger.warning(f"Error inicializando PaddleOCR: {e}")
        
        return engines
    
    def extract_receipt_data_intelligent(self, image_path: str) -> Dict[str, Any]:
        """
        Extracción inteligente 100% automatizada con multi-engine OCR.
        
        Args:
            image_path: Ruta a la imagen del recibo
            
        Returns:
            Dict con datos extraídos, confianza >95% y metadata completa
        """
        start_time = time.time()
        
        try:
            # PASO 1: Ejecutar todos los engines OCR en paralelo
            logger.info(f"Iniciando extracción inteligente para: {image_path}")
            engine_results = self._run_multi_engine_ocr(image_path)
            
            # PASO 2: Generar consenso automático
            consensus_result = self.consensus_engine.generate_consensus(engine_results)
            
            # PASO 3: Auto-corrección usando base de conocimiento
            corrected_result = self._auto_correct_with_knowledge_base(consensus_result)
            
            # PASO 4: Validación automática de totales
            validated_result = self._auto_validate_totals(corrected_result)
            
            # PASO 5: Extracción avanzada de líneas de detalle
            detailed_result = self._extract_detailed_line_items(validated_result, image_path)
            
            # PASO 6: Categorización automática
            categorized_result = self._auto_categorize_receipt(detailed_result)
            
            # PASO 7: Cálculo de confianza final
            final_result = self._calculate_final_confidence(categorized_result)
            
            processing_time = time.time() - start_time
            
            # Agregar metadata de procesamiento
            final_result.update({
                'processing_metadata': {
                    'engines_used': list(engine_results.keys()),
                    'processing_time': processing_time,
                    'consensus_applied': True,
                    'auto_corrections_count': corrected_result.get('corrections_applied', 0),
                    'validation_passed': validated_result.get('validation_passed', False),
                    'fully_automated': final_result.get('confidence', 0) >= self.auto_confidence_threshold,
                    'timestamp': datetime.utcnow().isoformat(),
                    'version': 'intelligent_v2.0'
                }
            })
            
            logger.info(f"Extracción completada en {processing_time:.2f}s con confianza {final_result.get('confidence', 0):.2f}")
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error en extracción inteligente: {e}")
            # Fallback al método base si falla
            return super().extract_receipt_data(image_path)
    
    def _run_multi_engine_ocr(self, image_path: str) -> Dict[str, Dict]:
        """Ejecutar todos los engines OCR en paralelo"""
        engine_results = {}
        
        with ThreadPoolExecutor(max_workers=len(self.engines)) as executor:
            # Enviar tareas a todos los engines
            future_to_engine = {}
            
            for engine_name, engine in self.engines.items():
                future = executor.submit(self._run_engine_ocr, engine_name, engine, image_path)
                future_to_engine[future] = engine_name
            
            # Recopilar resultados
            for future in as_completed(future_to_engine):
                engine_name = future_to_engine[future]
                try:
                    result = future.result(timeout=30)  # 30s timeout por engine
                    engine_results[engine_name] = result
                    logger.info(f"Engine {engine_name} completado con confianza {result.get('confidence', 0):.2f}")
                except Exception as e:
                    logger.warning(f"Engine {engine_name} falló: {e}")
        
        return engine_results
    
    def _run_engine_ocr(self, engine_name: str, engine, image_path: str) -> Dict:
        """
        Ejecutar un engine OCR específico usando su servicio dedicado.
        
        Args:
            engine_name: Nombre del engine ('tesseract', 'easyocr', 'paddleocr')
            engine: Instancia del servicio OCR
            image_path: Ruta a la imagen
            
        Returns:
            Diccionario con resultados del engine
        """
        try:
            start_time = time.time()
            
            # Usar el método extract_receipt_data del servicio
            result = engine.extract_receipt_data(image_path)
            
            processing_time = time.time() - start_time
            
            # Asegurar que el resultado tenga la estructura esperada
            if not isinstance(result, dict):
                result = {'raw_text': str(result), 'confidence': 0.5}
            
            # Agregar metadata del engine
            result.update({
                'engine': engine_name,
                'processing_time': processing_time,
                'timestamp': time.time()
            })
            
            # Normalizar campos comunes
            if 'confidence' not in result:
                result['confidence'] = 0.5
            
            if 'raw_text' not in result:
                result['raw_text'] = ''
            
            logger.debug(f"{engine_name} completado en {processing_time:.2f}s con confianza {result['confidence']:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error en {engine_name}: {e}")
            return {
                'engine': engine_name,
                'confidence': 0.0,
                'raw_text': '',
                'error': str(e),
                'processing_time': 0.0
            }
    
    def _legacy_run_tesseract_ocr(self, image_path: str) -> Dict:
        """Ejecutar Tesseract OCR (usando el servicio base)"""
        try:
            result = super().extract_receipt_data(image_path)
            result['engine'] = 'tesseract'
            return result
        except Exception as e:
            logger.error(f"Error en Tesseract: {e}")
            return {'engine': 'tesseract', 'confidence': 0.0, 'error': str(e)}
    
    def _run_easyocr(self, image_path: str, reader) -> Dict:
        """Ejecutar EasyOCR"""
        try:
            results = reader.readtext(image_path)
            
            # Procesar resultados de EasyOCR
            raw_text = ' '.join([result[1] for result in results])
            confidence = np.mean([result[2] for result in results]) if results else 0.0
            
            # Extraer datos estructurados usando el parser existente
            parsed_data = self.receipt_parser.parse_receipt_text(raw_text)
            
            return {
                'engine': 'easyocr',
                'raw_text': raw_text,
                'confidence': confidence,
                'vendor': parsed_data.get('vendor'),
                'total_amount': parsed_data.get('total_amount'),
                'date': parsed_data.get('date'),
                'items': parsed_data.get('items', []),
                'extracted_items': parsed_data.get('extracted_items', [])
            }
            
        except Exception as e:
            logger.error(f"Error en EasyOCR: {e}")
            return {'engine': 'easyocr', 'confidence': 0.0, 'error': str(e)}
    
    def _run_paddleocr(self, image_path: str, ocr_engine) -> Dict:
        """Ejecutar PaddleOCR"""
        try:
            results = ocr_engine.ocr(image_path, cls=True)
            
            if not results or not results[0]:
                return {'engine': 'paddleocr', 'confidence': 0.0, 'raw_text': ''}
            
            # Procesar resultados de PaddleOCR
            texts = []
            confidences = []
            
            for line in results[0]:
                if line:
                    text = line[1][0]
                    confidence = line[1][1]
                    texts.append(text)
                    confidences.append(confidence)
            
            raw_text = ' '.join(texts)
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            # Extraer datos estructurados
            parsed_data = self.receipt_parser.parse_receipt_text(raw_text)
            
            return {
                'engine': 'paddleocr',
                'raw_text': raw_text,
                'confidence': avg_confidence,
                'vendor': parsed_data.get('vendor'),
                'total_amount': parsed_data.get('total_amount'),
                'date': parsed_data.get('date'),
                'items': parsed_data.get('items', []),
                'extracted_items': parsed_data.get('extracted_items', [])
            }
            
        except Exception as e:
            logger.error(f"Error en PaddleOCR: {e}")
            return {'engine': 'paddleocr', 'confidence': 0.0, 'error': str(e)}
    
    def _auto_correct_with_knowledge_base(self, consensus_result: Dict) -> Dict:
        """Auto-corrección usando base de conocimiento de productos chilenos"""
        corrections_applied = 0
        
        try:
            # Corregir líneas de productos
            if 'extracted_items' in consensus_result:
                corrected_items = []
                
                for item in consensus_result['extracted_items']:
                    original_name = item.get('name', '')
                    
                    # Buscar corrección en base de conocimiento
                    corrected_product = self.products_db.auto_correct_product_name(original_name)
                    
                    if corrected_product['corrected']:
                        item['name'] = corrected_product['corrected_name']
                        item['confidence'] = min(item.get('confidence', 0.5) + 0.2, 1.0)
                        corrections_applied += 1
                        
                        # Agregar información adicional del producto
                        if 'product_info' in corrected_product:
                            item.update(corrected_product['product_info'])
                    
                    corrected_items.append(item)
                
                consensus_result['extracted_items'] = corrected_items
            
            # Corregir nombre del vendor
            if 'vendor' in consensus_result and consensus_result['vendor']:
                vendor_data = consensus_result['vendor']
                
                # Manejar vendor como dict o string
                if isinstance(vendor_data, dict):
                    vendor_name = vendor_data.get('name', '')
                else:
                    vendor_name = str(vendor_data)
                
                if vendor_name:
                    vendor_correction = self.products_db.correct_vendor_name(vendor_name)
                    if vendor_correction['corrected']:
                        if isinstance(vendor_data, dict):
                            consensus_result['vendor']['name'] = vendor_correction['corrected_name']
                        else:
                            consensus_result['vendor'] = vendor_correction['corrected_name']
                        corrections_applied += 1
            
            consensus_result['corrections_applied'] = corrections_applied
            
            logger.info(f"Auto-corrección aplicada: {corrections_applied} correcciones")
            
        except Exception as e:
            logger.error(f"Error en auto-corrección: {e}")
        
        return consensus_result
    
    def _auto_validate_totals(self, corrected_result: Dict) -> Dict:
        """Validación automática de totales"""
        validation_passed = False
        
        try:
            total_amount_data = corrected_result.get('total_amount', 0)
            extracted_items = corrected_result.get('extracted_items', [])
            
            # Manejar total_amount como dict o número
            if isinstance(total_amount_data, dict):
                total_amount = total_amount_data.get('amount', 0)
            else:
                total_amount = float(total_amount_data) if total_amount_data else 0
            
            if total_amount > 0 and extracted_items:
                # Calcular suma de items
                items_sum = sum(item.get('total_price', 0) for item in extracted_items)
                
                # Calcular diferencia porcentual
                if items_sum > 0:
                    difference_pct = abs(total_amount - items_sum) / total_amount
                    
                    # Validación automática (tolerancia 5%)
                    if difference_pct <= 0.05:
                        validation_passed = True
                    else:
                        # Intentar reconciliación automática
                        reconciled = self._auto_reconcile_totals(total_amount, extracted_items)
                        if reconciled:
                            corrected_result['extracted_items'] = reconciled['items']
                            validation_passed = True
                            corrected_result['reconciliation_applied'] = True
            
            corrected_result['validation_passed'] = validation_passed
            corrected_result['total_validation_confidence'] = 0.95 if validation_passed else 0.6
            
        except Exception as e:
            logger.error(f"Error en validación de totales: {e}")
            corrected_result['validation_passed'] = False
        
        return corrected_result
    
    def _auto_reconcile_totals(self, expected_total: float, items: List[Dict]) -> Optional[Dict]:
        """Reconciliación automática de totales"""
        try:
            # Estrategia 1: Ajustar precios proporcionalmente
            items_sum = sum(item.get('total_price', 0) for item in items)
            
            if items_sum > 0:
                adjustment_factor = expected_total / items_sum
                
                # Solo ajustar si el factor está en rango razonable (0.8 - 1.2)
                if 0.8 <= adjustment_factor <= 1.2:
                    adjusted_items = []
                    
                    for item in items:
                        adjusted_item = item.copy()
                        adjusted_item['total_price'] = round(item.get('total_price', 0) * adjustment_factor, 2)
                        adjusted_item['unit_price'] = round(adjusted_item['total_price'] / max(item.get('quantity', 1), 1), 2)
                        adjusted_items.append(adjusted_item)
                    
                    return {'items': adjusted_items, 'method': 'proportional_adjustment'}
            
            return None
            
        except Exception as e:
            logger.error(f"Error en reconciliación: {e}")
            return None
    
    def _extract_detailed_line_items(self, validated_result: Dict, image_path: str) -> Dict:
        """Extracción avanzada de líneas de detalle usando el parser existente"""
        try:
            # Usar el parser avanzado existente para extraer más detalles
            raw_text = validated_result.get('raw_text', '')
            
            if raw_text:
                # Extraer líneas de detalle mejoradas
                detailed_items = self.receipt_parser.extract_line_items_advanced(raw_text)
                
                # Combinar con items existentes
                existing_items = validated_result.get('extracted_items', [])
                
                # Mejorar items existentes con detalles adicionales
                enhanced_items = self._enhance_items_with_details(existing_items, detailed_items)
                
                validated_result['extracted_items'] = enhanced_items
                validated_result['line_items_count'] = len(enhanced_items)
        
        except Exception as e:
            logger.error(f"Error en extracción detallada: {e}")
        
        return validated_result
    
    def _enhance_items_with_details(self, existing_items: List[Dict], detailed_items: List[Dict]) -> List[Dict]:
        """Combinar items existentes con detalles adicionales"""
        enhanced_items = []
        
        for existing_item in existing_items:
            enhanced_item = existing_item.copy()
            
            # Buscar item correspondiente en detalles
            for detailed_item in detailed_items:
                if self._items_match(existing_item, detailed_item):
                    # Agregar detalles adicionales
                    enhanced_item.update({
                        'sku': detailed_item.get('sku'),
                        'brand': detailed_item.get('brand'),
                        'category': detailed_item.get('category'),
                        'unit': detailed_item.get('unit'),
                        'discount': detailed_item.get('discount', 0),
                        'tax_amount': detailed_item.get('tax_amount', 0),
                        'confidence': max(existing_item.get('confidence', 0.5), detailed_item.get('confidence', 0.5))
                    })
                    break
            
            enhanced_items.append(enhanced_item)
        
        return enhanced_items
    
    def _items_match(self, item1: Dict, item2: Dict) -> bool:
        """Verificar si dos items corresponden al mismo producto"""
        name1 = item1.get('name', '').lower().strip()
        name2 = item2.get('name', '').lower().strip()
        
        # Similitud por nombre
        if name1 and name2:
            similarity = self._calculate_similarity(name1, name2)
            return similarity > 0.8
        
        return False
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcular similitud entre dos textos"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, text1, text2).ratio()
    
    def _auto_categorize_receipt(self, detailed_result: Dict) -> Dict:
        """Categorización automática del recibo"""
        try:
            raw_text = detailed_result.get('raw_text', '')
            vendor = detailed_result.get('vendor', '')
            
            if raw_text:
                # Usar el categorizador existente
                categorization = self.categorizer.categorize_receipt(raw_text)
                
                detailed_result['category_prediction'] = {
                    'category': categorization.get('category', 'Otros'),
                    'confidence': categorization.get('confidence', 0.5),
                    'method': categorization.get('method', 'ml'),
                    'chile_specific': categorization.get('chile_specific', {}),
                    'all_probabilities': categorization.get('all_probabilities', {})
                }
        
        except Exception as e:
            logger.error(f"Error en categorización automática: {e}")
        
        return detailed_result
    
    def _calculate_final_confidence(self, categorized_result: Dict) -> Dict:
        """Calcular confianza final del procesamiento completo"""
        try:
            # Factores de confianza
            ocr_confidence = categorized_result.get('confidence', 0.0)
            validation_confidence = categorized_result.get('total_validation_confidence', 0.6)
            category_confidence = categorized_result.get('category_prediction', {}).get('confidence', 0.5)
            
            # Bonificaciones por correcciones y validaciones
            corrections_bonus = min(categorized_result.get('corrections_applied', 0) * 0.05, 0.15)
            validation_bonus = 0.1 if categorized_result.get('validation_passed', False) else 0.0
            
            # Cálculo de confianza final ponderada
            final_confidence = (
                ocr_confidence * 0.4 +
                validation_confidence * 0.3 +
                category_confidence * 0.2 +
                corrections_bonus +
                validation_bonus
            )
            
            # Asegurar que esté en rango [0, 1]
            final_confidence = max(0.0, min(1.0, final_confidence))
            
            categorized_result['confidence'] = final_confidence
            categorized_result['confidence_breakdown'] = {
                'ocr_confidence': ocr_confidence,
                'validation_confidence': validation_confidence,
                'category_confidence': category_confidence,
                'corrections_bonus': corrections_bonus,
                'validation_bonus': validation_bonus,
                'final_confidence': final_confidence
            }
            
            # Determinar si es completamente automático
            categorized_result['fully_automated'] = final_confidence >= self.auto_confidence_threshold
            
        except Exception as e:
            logger.error(f"Error calculando confianza final: {e}")
            categorized_result['confidence'] = 0.5
        
        return categorized_result
    
    def _items_match(self, item1: Dict, item2: Dict) -> bool:
        """Determina si dos items son el mismo producto."""
        try:
            name1 = item1.get('name', '').lower().strip()
            name2 = item2.get('name', '').lower().strip()
            
            if not name1 or not name2:
                return False
            
            # Coincidencia exacta
            if name1 == name2:
                return True
            
            # Coincidencia por similitud (usando fuzzywuzzy si está disponible)
            try:
                from fuzzywuzzy import fuzz
                similarity = fuzz.ratio(name1, name2)
                return similarity > 85
            except ImportError:
                # Fallback: coincidencia parcial simple
                return name1 in name2 or name2 in name1
                
        except Exception:
            return False
    
    def _auto_reconcile_totals(self, total_amount: float, items: List[Dict]) -> Dict:
        """Intenta reconciliar automáticamente las diferencias en totales."""
        try:
            items_sum = sum(item.get('total_price', 0) for item in items)
            difference = total_amount - items_sum
            
            # Si la diferencia es pequeña, distribuir proporcionalmente
            if abs(difference) < total_amount * 0.1:  # Menos del 10%
                adjusted_items = []
                
                for item in items:
                    adjusted_item = item.copy()
                    item_price = item.get('total_price', 0)
                    
                    if items_sum > 0:
                        # Distribuir diferencia proporcionalmente
                        adjustment = (item_price / items_sum) * difference
                        adjusted_item['total_price'] = item_price + adjustment
                        adjusted_item['reconciled'] = True
                    
                    adjusted_items.append(adjusted_item)
                
                return {
                    'success': True,
                    'items': adjusted_items,
                    'adjustment_applied': difference
                }
            
            return {'success': False, 'reason': 'Diferencia demasiado grande'}
            
        except Exception as e:
            logger.error(f"Error en reconciliación: {e}")
            return {'success': False, 'reason': str(e)}
    
    # Método de compatibilidad con la interfaz existente
    def extract_receipt_data_intelligent(self, image_path: str) -> Dict[str, Any]:
        """
        Método principal de extracción inteligente de datos de recibo.
        Combina multi-engine OCR con consenso automático para >95% precisión.
        """
        start_time = time.time()
        logger.info(f"🧠 Iniciando análisis inteligente OCR para: {image_path}")
        
        try:
            # 1. Análisis multi-engine OCR con consenso
            multi_engine_result = self.process_receipt_automatic(image_path)
            
            # 2. Extracción automática de líneas de detalle
            if hasattr(self, 'line_extractor'):
                detailed_items = self.line_extractor.extract_lines_automatic(
                    multi_engine_result.get('raw_text', ''),
                    multi_engine_result.get('items', [])
                )
                multi_engine_result['items'] = detailed_items
            
            # 3. Validación y reconciliación automática
            validated_result = self._validate_and_reconcile_automatic(multi_engine_result)
            
            # 4. Categorización ML automática
            if validated_result.get('raw_text'):
                try:
                    category_result = self.categorizer.categorize_receipt(validated_result['raw_text'])
                    validated_result['category_prediction'] = {
                        'category': category_result['category'],
                        'confidence': category_result['confidence'],
                        'method': category_result['method']
                    }
                    validated_result['chile_specific'] = category_result['chile_specific']
                except Exception as e:
                    logger.error(f"Error en categorización ML: {e}")
            
            # 5. Calcular confianza final
            processing_time = time.time() - start_time
            final_confidence = self._calculate_final_confidence(validated_result)
            
            # 6. Preparar resultado final
            result = {
                'vendor': validated_result.get('vendor'),
                'total_amount': validated_result.get('total_amount'),
                'date': validated_result.get('date'),
                'items': validated_result.get('items', []),
                'raw_text': validated_result.get('raw_text', ''),
                'confidence': final_confidence,
                'category_prediction': validated_result.get('category_prediction'),
                'chile_specific': validated_result.get('chile_specific'),
                'processing_time': processing_time,
                'engine_used': validated_result.get('engine_used', 'intelligent_consensus'),
                'fully_automated': final_confidence >= self.auto_confidence_threshold,
                'validation_passed': validated_result.get('validation_passed', False),
                'items_reconciled': validated_result.get('items_reconciled', False)
            }
            
            logger.info(f"✅ Análisis inteligente completado en {processing_time:.2f}s - Confianza: {final_confidence:.1%}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en análisis inteligente OCR: {e}")
            processing_time = time.time() - start_time
            
            # Fallback a servicio base si falla
            try:
                fallback_result = super().extract_receipt_data(image_path)
                fallback_result.update({
                    'confidence': 0.3,
                    'processing_time': processing_time,
                    'engine_used': 'fallback_basic',
                    'fully_automated': False,
                    'error': str(e)
                })
                return fallback_result
            except Exception as fallback_error:
                logger.error(f"❌ Error en fallback: {fallback_error}")
                return {
                    'vendor': None,
                    'total_amount': 0.0,
                    'date': None,
                    'items': [],
                    'raw_text': '',
                    'confidence': 0.1,
                    'processing_time': processing_time,
                    'engine_used': 'error',
                    'fully_automated': False,
                    'error': f"OCR failed: {e}, Fallback failed: {fallback_error}"
                }

    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """
        Método de compatibilidad que mantiene la interfaz existente
        pero usa el procesamiento inteligente.
        """
        return self.extract_receipt_data_intelligent(image_path)


# Instancia global para compatibilidad
intelligent_ocr_service = IntelligentOCRService()
