"""
Extractor Automático de Líneas de Detalle para Gastify
Extiende el receipt_parser existente con capacidades de extracción 100% automatizada
Objetivo: >95% precisión en extracción de líneas sin intervención manual
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from datetime import datetime

# Importar componentes existentes
from .receipt_parser.receipt_parser import AdvancedReceiptParser
from ..databases.chile_products_db import ChileProductsDB

logger = logging.getLogger(__name__)

class AutomaticLineExtractor:
    """
    Extractor automático de líneas de detalle que extiende AdvancedReceiptParser
    con capacidades de procesamiento 100% automatizado para recibos chilenos.
    """
    
    def __init__(self):
        """Inicializar el extractor automático"""
        self.receipt_parser = AdvancedReceiptParser()
        self.products_db = ChileProductsDB()
        
        # Patrones mejorados para recibos chilenos
        self.chile_patterns = self._initialize_chile_patterns()
        
        # Configuración de automatización
        self.min_confidence_threshold = 0.85
        self.auto_correction_enabled = True
        self.validation_enabled = True
        
        logger.info("AutomaticLineExtractor inicializado correctamente")
    
    def _initialize_chile_patterns(self) -> Dict:
        """Inicializar patrones específicos para recibos chilenos"""
        return {
            # Patrones de líneas de productos mejorados
            'product_line_patterns': [
                # Patrón: CANTIDAD PRODUCTO PRECIO_UNITARIO PRECIO_TOTAL
                r'(\d+(?:\.\d+)?)\s+([A-ZÁÉÍÓÚÑ\s\w\-\.]+?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                
                # Patrón: PRODUCTO CANTIDAD x PRECIO_UNITARIO = PRECIO_TOTAL
                r'([A-ZÁÉÍÓÚÑ\s\w\-\.]+?)\s+(\d+(?:\.\d+)?)\s*[xX×]\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*=?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                
                # Patrón: CÓDIGO PRODUCTO PRECIO (común en supermercados)
                r'(\d{6,13})\s+([A-ZÁÉÍÓÚÑ\s\w\-\.]+?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                
                # Patrón: PRODUCTO PRECIO (línea simple)
                r'^([A-ZÁÉÍÓÚÑ\s\w\-\.]{3,40})\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)$',
                
                # Patrón con descuentos: PRODUCTO PRECIO DESCUENTO PRECIO_FINAL
                r'([A-ZÁÉÍÓÚÑ\s\w\-\.]+?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*-\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)'
            ],
            
            # Patrones de cantidades y unidades
            'quantity_patterns': [
                r'(\d+(?:\.\d+)?)\s*(kg|gr?|lt?|ml|un|und|unid|pza|pzas)',
                r'(\d+(?:\.\d+)?)\s*[xX×]\s*',
                r'^(\d+(?:\.\d+)?)\s+',
            ],
            
            # Patrones de precios chilenos
            'price_patterns': [
                r'\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',  # Formato chileno: 1.234,56
                r'(\d+(?:,\d{2})?)',  # Formato simple: 1234,56
            ],
            
            # Patrones de códigos de barras/SKU
            'sku_patterns': [
                r'(\d{6,13})',  # Códigos EAN/UPC
                r'([A-Z]{2,4}\d{3,8})',  # Códigos alfanuméricos
                r'(#\d{4,8})',  # Códigos con #
            ],
            
            # Patrones de descuentos
            'discount_patterns': [
                r'DESC\w*\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                r'DCTO\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                r'-\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
            ],
            
            # Palabras clave para filtrar líneas no válidas
            'invalid_line_keywords': [
                'total', 'subtotal', 'iva', 'cambio', 'efectivo', 'tarjeta',
                'fecha', 'hora', 'cajero', 'boleta', 'factura', 'rut',
                'gracias', 'vuelva', 'pronto', 'atencion', 'cliente'
            ]
        }
    
    def extract_lines_automatically(self, raw_text: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracción automática de líneas de detalle con >95% precisión
        
        Args:
            raw_text: Texto extraído por OCR
            image_path: Ruta opcional a la imagen para análisis adicional
            
        Returns:
            Dict con líneas extraídas y metadata de confianza
        """
        start_time = datetime.utcnow()
        
        try:
            # PASO 1: Preprocesamiento del texto
            preprocessed_text = self._preprocess_text(raw_text)
            
            # PASO 2: Extracción de líneas candidatas
            candidate_lines = self._extract_candidate_lines(preprocessed_text)
            
            # PASO 3: Análisis y estructuración de líneas
            structured_lines = self._analyze_and_structure_lines(candidate_lines)
            
            # PASO 4: Auto-corrección usando base de conocimiento
            if self.auto_correction_enabled:
                corrected_lines = self._auto_correct_lines(structured_lines)
            else:
                corrected_lines = structured_lines
            
            # PASO 5: Validación automática
            if self.validation_enabled:
                validated_lines = self._validate_lines_automatically(corrected_lines)
            else:
                validated_lines = corrected_lines
            
            # PASO 6: Cálculo de confianza final
            final_result = self._calculate_extraction_confidence(validated_lines)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Agregar metadata
            final_result.update({
                'extraction_metadata': {
                    'processing_time': processing_time,
                    'lines_processed': len(candidate_lines),
                    'lines_extracted': len(final_result.get('extracted_items', [])),
                    'auto_corrections_applied': final_result.get('corrections_applied', 0),
                    'validation_passed': final_result.get('validation_passed', False),
                    'extraction_method': 'automatic_multi_pattern',
                    'timestamp': start_time.isoformat(),
                    'version': 'automatic_v2.0'
                }
            })
            
            logger.info(f"Extracción automática completada: {len(final_result.get('extracted_items', []))} líneas en {processing_time:.2f}s")
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error en extracción automática: {e}")
            # Fallback al parser base
            return self._fallback_extraction(raw_text)
    
    def _preprocess_text(self, raw_text: str) -> str:
        """Preprocesamiento del texto para mejorar extracción"""
        if not raw_text:
            return ""
        
        # Normalizar espacios y saltos de línea
        text = re.sub(r'\s+', ' ', raw_text.strip())
        text = re.sub(r'\n\s*\n', '\n', text)
        
        # Corregir errores OCR comunes en números
        text = re.sub(r'(\d)\s+(\d)', r'\1\2', text)  # Espacios en números
        text = re.sub(r'(\d)\s*[oO]\s*(\d)', r'\1.0\2', text)  # O por 0
        text = re.sub(r'(\d)\s*[lI]\s*(\d)', r'\1.1\2', text)  # l/I por 1
        
        # Normalizar separadores de miles y decimales
        text = re.sub(r'(\d{1,3})\.(\d{3})', r'\1.\2', text)  # Mantener formato chileno
        text = re.sub(r'(\d),(\d{2})(?!\d)', r'\1,\2', text)  # Decimales
        
        return text
    
    def _extract_candidate_lines(self, text: str) -> List[str]:
        """Extraer líneas candidatas que podrían contener productos"""
        lines = text.split('\n')
        candidate_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Filtrar líneas muy cortas o muy largas
            if len(line) < 5 or len(line) > 100:
                continue
            
            # Filtrar líneas que contienen palabras clave no válidas
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in self.chile_patterns['invalid_line_keywords']):
                continue
            
            # Debe contener al menos un número (precio)
            if not re.search(r'\d', line):
                continue
            
            # Debe contener al menos una letra (nombre del producto)
            if not re.search(r'[a-zA-ZáéíóúñÁÉÍÓÚÑ]', line):
                continue
            
            candidate_lines.append(line)
        
        return candidate_lines
    
    def _analyze_and_structure_lines(self, candidate_lines: List[str]) -> List[Dict]:
        """Analizar y estructurar líneas candidatas"""
        structured_lines = []
        
        for line in candidate_lines:
            # Intentar múltiples patrones de extracción
            for pattern in self.chile_patterns['product_line_patterns']:
                match = re.search(pattern, line, re.IGNORECASE)
                
                if match:
                    structured_item = self._parse_pattern_match(match, pattern, line)
                    if structured_item:
                        structured_lines.append(structured_item)
                        break
        
        return structured_lines
    
    def _parse_pattern_match(self, match, pattern: str, original_line: str) -> Optional[Dict]:
        """Parsear un match de patrón en un item estructurado"""
        try:
            groups = match.groups()
            
            # Determinar estructura basada en el patrón
            if len(groups) == 4:
                # Patrón completo: cantidad, producto, precio_unitario, precio_total
                if re.match(r'^\d', groups[0]):  # Empieza con cantidad
                    quantity_str, name, unit_price_str, total_price_str = groups
                else:  # Empieza con nombre
                    name, quantity_str, unit_price_str, total_price_str = groups
                
                quantity = self._parse_quantity(quantity_str)
                unit_price = self._parse_price(unit_price_str)
                total_price = self._parse_price(total_price_str)
                
            elif len(groups) == 3:
                # Patrón con código: código, producto, precio
                if re.match(r'^\d{6,13}$', groups[0]):
                    sku, name, total_price_str = groups
                    quantity = 1.0
                    total_price = self._parse_price(total_price_str)
                    unit_price = total_price
                else:
                    # Patrón: producto, cantidad, precio
                    name, quantity_str, total_price_str = groups
                    quantity = self._parse_quantity(quantity_str)
                    total_price = self._parse_price(total_price_str)
                    unit_price = total_price / max(quantity, 1)
                
            elif len(groups) == 2:
                # Patrón simple: producto, precio
                name, total_price_str = groups
                quantity = 1.0
                total_price = self._parse_price(total_price_str)
                unit_price = total_price
                
            else:
                return None
            
            # Validar que los valores sean razonables
            if not name or total_price <= 0:
                return None
            
            # Extraer información adicional
            sku = self._extract_sku(original_line)
            unit = self._extract_unit(original_line)
            discount = self._extract_discount(original_line)
            
            return {
                'name': name.strip(),
                'quantity': quantity,
                'unit_price': round(unit_price, 2),
                'total_price': round(total_price, 2),
                'unit': unit,
                'sku': sku,
                'discount': discount,
                'original_line': original_line,
                'confidence': 0.8,  # Confianza base
                'extraction_method': 'pattern_matching'
            }
            
        except Exception as e:
            logger.warning(f"Error parseando línea '{original_line}': {e}")
            return None
    
    def _parse_quantity(self, quantity_str: str) -> float:
        """Parsear cantidad de un string"""
        try:
            # Limpiar y convertir
            clean_qty = re.sub(r'[^\d\.,]', '', quantity_str)
            clean_qty = clean_qty.replace(',', '.')
            return float(clean_qty) if clean_qty else 1.0
        except:
            return 1.0
    
    def _parse_price(self, price_str: str) -> float:
        """Parsear precio en formato chileno"""
        try:
            # Remover símbolos de moneda
            clean_price = re.sub(r'[\$\s]', '', price_str)
            
            # Convertir formato chileno (1.234,56) a float
            if ',' in clean_price and '.' in clean_price:
                # Formato: 1.234,56
                clean_price = clean_price.replace('.', '').replace(',', '.')
            elif ',' in clean_price:
                # Formato: 1234,56
                clean_price = clean_price.replace(',', '.')
            
            return float(clean_price) if clean_price else 0.0
        except:
            return 0.0
    
    def _extract_sku(self, line: str) -> Optional[str]:
        """Extraer SKU/código de barras de la línea"""
        for pattern in self.chile_patterns['sku_patterns']:
            match = re.search(pattern, line)
            if match:
                return match.group(1)
        return None
    
    def _extract_unit(self, line: str) -> str:
        """Extraer unidad de medida de la línea"""
        for pattern in self.chile_patterns['quantity_patterns']:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and len(match.groups()) > 1:
                return match.group(2).lower()
        return 'unidad'
    
    def _extract_discount(self, line: str) -> float:
        """Extraer descuento de la línea"""
        for pattern in self.chile_patterns['discount_patterns']:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return self._parse_price(match.group(1))
        return 0.0
    
    def _auto_correct_lines(self, structured_lines: List[Dict]) -> List[Dict]:
        """Auto-corrección de líneas usando base de conocimiento"""
        corrected_lines = []
        corrections_applied = 0
        
        for item in structured_lines:
            corrected_item = item.copy()
            
            # Corregir nombre del producto
            product_correction = self.products_db.auto_correct_product_name(item['name'])
            
            if product_correction['corrected']:
                corrected_item['name'] = product_correction['corrected_name']
                corrected_item['confidence'] = min(item['confidence'] + 0.15, 1.0)
                corrections_applied += 1
                
                # Agregar información del producto si está disponible
                if 'product_info' in product_correction:
                    corrected_item.update({
                        'category': product_correction['product_info'].get('category'),
                        'typical_sizes': product_correction['product_info'].get('typical_sizes', []),
                        'brands': product_correction['product_info'].get('brands', [])
                    })
            
            # Validar consistencia precio-cantidad
            if corrected_item['quantity'] > 0 and corrected_item['unit_price'] > 0:
                expected_total = corrected_item['quantity'] * corrected_item['unit_price']
                actual_total = corrected_item['total_price']
                
                # Si hay inconsistencia menor al 5%, corregir automáticamente
                if abs(expected_total - actual_total) / max(expected_total, actual_total) < 0.05:
                    corrected_item['total_price'] = expected_total
                    corrections_applied += 1
            
            corrected_lines.append(corrected_item)
        
        # Agregar metadata de correcciones
        for item in corrected_lines:
            item['corrections_applied'] = corrections_applied
        
        return corrected_lines
    
    def _validate_lines_automatically(self, corrected_lines: List[Dict]) -> List[Dict]:
        """Validación automática de líneas extraídas"""
        # Usar validación de la base de productos
        validation_result = self.products_db.validate_product_consistency(corrected_lines)
        
        validated_lines = validation_result['corrected_items']
        
        # Agregar metadata de validación
        for item in validated_lines:
            item['validation_passed'] = validation_result['consistent']
            item['validation_confidence'] = validation_result['confidence']
        
        return validated_lines
    
    def _calculate_extraction_confidence(self, validated_lines: List[Dict]) -> Dict:
        """Calcular confianza final de la extracción"""
        if not validated_lines:
            return {
                'extracted_items': [],
                'confidence': 0.0,
                'extraction_quality': 'poor'
            }
        
        # Calcular confianza promedio
        total_confidence = sum(item.get('confidence', 0.5) for item in validated_lines)
        avg_confidence = total_confidence / len(validated_lines)
        
        # Bonificaciones por validaciones exitosas
        validation_bonus = 0.1 if all(item.get('validation_passed', False) for item in validated_lines) else 0.0
        correction_bonus = min(sum(item.get('corrections_applied', 0) for item in validated_lines) * 0.02, 0.1)
        
        # Confianza final
        final_confidence = min(1.0, avg_confidence + validation_bonus + correction_bonus)
        
        # Determinar calidad
        if final_confidence >= 0.95:
            quality = 'excellent'
        elif final_confidence >= 0.85:
            quality = 'good'
        elif final_confidence >= 0.70:
            quality = 'fair'
        else:
            quality = 'poor'
        
        return {
            'extracted_items': validated_lines,
            'confidence': final_confidence,
            'extraction_quality': quality,
            'lines_count': len(validated_lines),
            'avg_item_confidence': avg_confidence,
            'validation_bonus': validation_bonus,
            'correction_bonus': correction_bonus
        }
    
    def _fallback_extraction(self, raw_text: str) -> Dict:
        """Extracción de fallback usando el parser base"""
        try:
            base_result = self.receipt_parser.parse_receipt_text(raw_text)
            return {
                'extracted_items': base_result.get('extracted_items', []),
                'confidence': 0.6,
                'extraction_quality': 'fallback',
                'extraction_method': 'base_parser'
            }
        except Exception as e:
            logger.error(f"Error en fallback extraction: {e}")
            return {
                'extracted_items': [],
                'confidence': 0.0,
                'extraction_quality': 'failed'
            }


# Instancia global
automatic_line_extractor = AutomaticLineExtractor()
