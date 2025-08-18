"""
Parser especializado para boletas chilenas.
Extrae productos estructurados del raw_text de OCR.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ProductItem:
    """Item de producto estructurado"""
    name: str
    quantity: float = 1.0
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    barcode: Optional[str] = None
    sku: Optional[str] = None
    confidence: float = 0.7

class ChileReceiptParser:
    """Parser especializado para boletas chilenas"""
    
    def __init__(self):
        # Patrones específicos para boletas chilenas
        self.currency_symbols = ['$', 'CLP', 'PESOS']
        self.quantity_patterns = [
            r'(\d+)[xX]',                    # "2X"
            r'(\d+)\s*[uU][nN][dD]',        # "2 UND"  
            r'(\d+)\s*[kK][gG]',            # "1.5 KG"
            r'(\d+,?\d*)\s*[xX]',           # "1,5X"
        ]
        
        self.price_patterns = [
            r'\$\s*(\d{1,3}(?:\.\d{3})*)',       # "$1.500" (formato chileno)
            r'\$\s*(\d+)',                        # "$1500"
            r'(\d{1,3}(?:\.\d{3})*)\s*\$?',      # "1.500 $"
        ]
        
        # Marcas chilenas comunes para validación
        self.chile_brands = {
            'agua': ['BENEDICTINO', 'CACHANTUN', 'DASANI'],
            'bebidas': ['COCA COLA', 'PEPSI', 'FANTA', 'SPRITE'],
            'lacteos': ['SOPROLE', 'COLUN', 'SURLAT'],
            'panaderia': ['IDEAL', 'BIMBO'],
            'limpieza': ['QUIX', 'MR MUSCULO', 'CONFORT']
        }

    def parse_receipt_structured(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse principal que extrae datos estructurados de boleta chilena.
        
        Args:
            raw_text: Texto completo del OCR
            
        Returns:
            Dict con datos estructurados
        """
        logger.info("🇨🇱 Iniciando parsing estructurado de boleta chilena")
        
        # Datos básicos del recibo
        receipt_data = {
            'vendor': self._extract_vendor(raw_text),
            'date': self._extract_date(raw_text),
            'total_amount': self._extract_total_amount(raw_text),
            'subtotal': self._extract_subtotal(raw_text),
            'iva_amount': self._extract_iva(raw_text),
            'folio': self._extract_folio(raw_text),
            'rut': self._extract_rut(raw_text),
        }
        
        # Extraer productos detallados
        detailed_items = self._extract_detailed_products(raw_text)
        receipt_data['detailed_items'] = detailed_items
        receipt_data['total_items_count'] = len(detailed_items)
        
        # Validar consistencia de datos
        receipt_data = self._validate_and_reconcile(receipt_data)
        
        # Calcular confianza del parsing
        receipt_data['parsing_confidence'] = self._calculate_parsing_confidence(receipt_data)
        
        logger.info(f"✅ Parsing completado: {len(detailed_items)} productos, confianza: {receipt_data['parsing_confidence']:.1%}")
        
        return receipt_data

    def _extract_detailed_products(self, raw_text: str) -> List[Dict]:
        """Extrae productos detallados con cantidad, precios y códigos"""
        
        products = []
        lines = raw_text.split('\n')
        
        # Filtrar líneas de productos (evitar header/footer)
        product_lines = self._filter_product_lines(lines)
        
        for line in product_lines:
            product = self._parse_product_line(line)
            if product:
                products.append(product)
        
        # Post-procesamiento: deduplicar y validar
        products = self._deduplicate_products(products)
        products = self._validate_products(products)
        
        return products
    
    def _filter_product_lines(self, lines: List[str]) -> List[str]:
        """Filtra líneas que contienen productos"""
        
        product_lines = []
        skip_patterns = [
            r'^(fecha|date|hora|time|rut|folio|bol)',
            r'^(total|subtotal|iva|descuento|cambio|vuelt)',
            r'^(caja|cajero|vendedor|cliente)',
            r'^(gracias|muchas gracias|vuelva pronto)',
            r'^\s*$'  # Líneas vacías
        ]
        
        for i, line in enumerate(lines):
            line = line.strip().lower()
            
            if not line:
                continue
                
            # Saltar líneas que claramente no son productos
            skip = False
            for pattern in skip_patterns:
                if re.match(pattern, line):
                    skip = True
                    break
            
            if skip:
                continue
            
            # Línea debe tener al menos un precio o código para ser considerada producto
            if self._has_price_or_code(lines[i]):
                product_lines.append(lines[i])
        
        return product_lines
    
    def _has_price_or_code(self, line: str) -> bool:
        """Verifica si línea contiene precio o código de producto"""
        
        # Buscar patrones de precio
        for pattern in self.price_patterns:
            if re.search(pattern, line):
                return True
        
        # Buscar códigos de barras (normalmente 7-13 dígitos)
        if re.search(r'\b\d{7,13}\b', line):
            return True
        
        # Buscar cantidades con precios
        if re.search(r'(\d+)[xX].*\$', line):
            return True
            
        return False
    
    def _parse_product_line(self, line: str) -> Optional[Dict]:
        """Parse individual de línea de producto"""
        
        if not line.strip():
            return None
        
        try:
            # Inicializar producto
            product = {
                'name': '',
                'quantity': 1.0,
                'unit_price': None,
                'total_price': None,
                'barcode': None,
                'confidence': 0.5,
                'raw_line': line.strip()
            }
            
            # Extraer código de barras
            barcode_match = re.search(r'\b(\d{7,13})\b', line)
            if barcode_match:
                product['barcode'] = barcode_match.group(1)
            
            # Extraer cantidad
            quantity = self._extract_quantity_from_line(line)
            if quantity:
                product['quantity'] = quantity
            
            # Extraer precios
            prices = self._extract_prices_from_line(line)
            if prices:
                if len(prices) == 1:
                    # Solo un precio, asumir que es total
                    product['total_price'] = prices[0]
                    if product['quantity'] > 0:
                        product['unit_price'] = prices[0] / product['quantity']
                elif len(prices) == 2:
                    # Dos precios, asumir unitario y total
                    product['unit_price'] = min(prices)
                    product['total_price'] = max(prices)
                else:
                    # Múltiples precios, tomar el mayor como total
                    product['total_price'] = max(prices)
            
            # Extraer nombre del producto
            product['name'] = self._extract_product_name(line, product)
            
            # Calcular confianza
            product['confidence'] = self._calculate_product_confidence(product, line)
            
            # Solo retornar si tiene datos mínimos
            if product['name'] or product['barcode']:
                return product
                
        except Exception as e:
            logger.warning(f"Error parsing línea de producto: {line} - {e}")
        
        return None
    
    def _extract_quantity_from_line(self, line: str) -> Optional[float]:
        """Extrae cantidad de la línea"""
        
        for pattern in self.quantity_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                try:
                    quantity_str = match.group(1).replace(',', '.')
                    return float(quantity_str)
                except ValueError:
                    continue
        
        # Si no hay patrón explícito, buscar número seguido de X
        match = re.search(r'^(\d+)[xX]', line.strip())
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        
        return None
    
    def _extract_prices_from_line(self, line: str) -> List[float]:
        """Extrae todos los precios de una línea"""
        
        prices = []
        
        for pattern in self.price_patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                try:
                    price_str = match.group(1).replace('.', '')  # Quitar separadores de miles
                    price = float(price_str)
                    if 10 <= price <= 1000000:  # Rango razonable para Chile
                        prices.append(price)
                except (ValueError, IndexError):
                    continue
        
        return sorted(set(prices))  # Eliminar duplicados y ordenar
    
    def _extract_product_name(self, line: str, product: Dict) -> str:
        """Extrae nombre del producto de la línea"""
        
        name = line.strip()
        
        # Remover código de barras
        if product['barcode']:
            name = name.replace(product['barcode'], '').strip()
        
        # Remover precios
        name = re.sub(r'\$\s*\d+[,.]?\d*', '', name)
        
        # Remover cantidad al inicio
        name = re.sub(r'^\d+[xX]\s*', '', name)
        
        # Remover caracteres especiales y normalizar espacios
        name = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip().upper()
        
        # Corregir nombres conocidos usando base de productos chilenos
        name = self._correct_product_name(name)
        
        return name
    
    def _correct_product_name(self, name: str) -> str:
        """Corrige nombres de productos usando base de datos chilena"""
        
        # Correcciones comunes para OCR de boletas chilenas
        corrections = {
            'BENED': 'AGUA BENEDICTINO',
            'CACHANT': 'AGUA CACHANTUN',
            'COC COL': 'COCA COLA',
            'C COLA': 'COCA COLA',
            'GALLET': 'GALLETAS',
            'PAN MOL': 'PAN MOLDE',
            'LEC ENT': 'LECHE ENTERA',
        }
        
        for fragment, full_name in corrections.items():
            if fragment in name:
                return full_name
        
        return name
    
    def _calculate_product_confidence(self, product: Dict, line: str) -> float:
        """Calcula confianza del producto parseado"""
        
        confidence = 0.3  # Base
        
        # +0.2 si tiene código de barras
        if product['barcode']:
            confidence += 0.2
        
        # +0.2 si tiene nombre claro
        if product['name'] and len(product['name']) > 2:
            confidence += 0.2
        
        # +0.2 si tiene precios consistentes
        if product['total_price'] and product['unit_price']:
            expected_total = product['quantity'] * product['unit_price']
            if abs(expected_total - product['total_price']) / product['total_price'] < 0.1:
                confidence += 0.2
        
        # +0.1 si reconoce marca chilena
        if self._is_known_chile_brand(product['name']):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _is_known_chile_brand(self, name: str) -> bool:
        """Verifica si es marca chilena conocida"""
        
        if not name:
            return False
        
        name_upper = name.upper()
        for category, brands in self.chile_brands.items():
            for brand in brands:
                if brand in name_upper:
                    return True
        
        return False
    
    def _deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """Elimina productos duplicados"""
        
        unique_products = []
        seen_products = set()
        
        for product in products:
            # Crear clave única basada en nombre y código
            key = (
                product.get('name', '').strip().upper(),
                product.get('barcode', ''),
                product.get('total_price', 0)
            )
            
            if key not in seen_products:
                seen_products.add(key)
                unique_products.append(product)
            else:
                # Si es duplicado, consolidar con mejor confianza
                for i, existing in enumerate(unique_products):
                    existing_key = (
                        existing.get('name', '').strip().upper(),
                        existing.get('barcode', ''),
                        existing.get('total_price', 0)
                    )
                    if existing_key == key and product['confidence'] > existing['confidence']:
                        unique_products[i] = product
                        break
        
        return unique_products
    
    def _validate_products(self, products: List[Dict]) -> List[Dict]:
        """Valida y corrige productos parseados"""
        
        validated_products = []
        
        for product in products:
            # Validar que tenga datos mínimos
            if not product.get('name') and not product.get('barcode'):
                continue
            
            # Corregir quantity si es 0
            if product['quantity'] <= 0:
                product['quantity'] = 1.0
            
            # Calcular unit_price si falta
            if product['total_price'] and not product['unit_price']:
                product['unit_price'] = product['total_price'] / product['quantity']
            
            # Calcular total_price si falta
            if product['unit_price'] and not product['total_price']:
                product['total_price'] = product['unit_price'] * product['quantity']
            
            validated_products.append(product)
        
        return validated_products
    
    def _extract_vendor(self, raw_text: str) -> Optional[str]:
        """Extrae nombre del vendedor/comercio"""
        
        lines = raw_text.split('\n')[:5]  # Primeras 5 líneas
        
        for line in lines:
            line = line.strip().upper()
            if line and len(line) > 3 and not re.match(r'^\d', line):
                return line
        
        return None
    
    def _extract_total_amount(self, raw_text: str) -> Optional[float]:
        """Extrae monto total del recibo"""
        
        total_patterns = [
            r'TOTAL\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
            r'TOTAL.*?(\d{1,3}(?:\.\d{3})*)',
            r'IMPORTE\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
        ]
        
        for pattern in total_patterns:
            match = re.search(pattern, raw_text.upper())
            if match:
                try:
                    amount_str = match.group(1).replace('.', '')
                    return float(amount_str)
                except ValueError:
                    continue
        
        return None
    
    def _extract_date(self, raw_text: str) -> Optional[str]:
        """Extrae fecha del recibo"""
        
        date_patterns = [
            r'FECHA:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, raw_text)
            if match:
                date_str = match.group(1)
                try:
                    # Convertir a formato ISO
                    parts = re.split(r'[/\-]', date_str)
                    if len(parts) == 3:
                        day, month, year = parts
                        if len(year) == 2:
                            year = f"20{year}"
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                except:
                    pass
        
        return None
    
    def _extract_subtotal(self, raw_text: str) -> Optional[float]:
        """Extrae subtotal/afecto"""
        
        match = re.search(r'AFECTO.*?(\d{1,3}(?:\.\d{3})*)', raw_text.upper())
        if match:
            try:
                return float(match.group(1).replace('.', ''))
            except ValueError:
                pass
        
        return None
    
    def _extract_iva(self, raw_text: str) -> Optional[float]:
        """Extrae IVA"""
        
        match = re.search(r'IVA.*?(\d{1,3}(?:\.\d{3})*)', raw_text.upper())
        if match:
            try:
                return float(match.group(1).replace('.', ''))
            except ValueError:
                pass
        
        return None
    
    def _extract_folio(self, raw_text: str) -> Optional[str]:
        """Extrae número de folio/boleta"""
        
        folio_patterns = [
            r'BOL.*?(\d{8,})',
            r'FOLIO.*?(\d{8,})',
            r'N[ÚU]MERO.*?(\d{8,})',
        ]
        
        for pattern in folio_patterns:
            match = re.search(pattern, raw_text.upper())
            if match:
                return match.group(1)
        
        return None
    
    def _extract_rut(self, raw_text: str) -> Optional[str]:
        """Extrae RUT del emisor"""
        
        rut_patterns = [
            r'RUT.*?(\d{1,2}\.\d{3}\.\d{3}-[\dkK])',
            r'(\d{1,2}\.\d{3}\.\d{3}-[\dkK])',
        ]
        
        for pattern in rut_patterns:
            match = re.search(pattern, raw_text)
            if match:
                return match.group(1)
        
        return None
    
    def _validate_and_reconcile(self, receipt_data: Dict) -> Dict:
        """Valida consistencia y reconcilia diferencias"""
        
        detailed_items = receipt_data.get('detailed_items', [])
        total_amount = receipt_data.get('total_amount', 0)
        
        if detailed_items and total_amount:
            # Calcular total de items
            items_total = sum(item.get('total_price', 0) for item in detailed_items)
            
            # Si hay diferencia significativa, intentar reconciliar
            if abs(items_total - total_amount) > total_amount * 0.1:
                receipt_data['reconciliation_needed'] = True
                receipt_data['items_total_calculated'] = items_total
                receipt_data['difference'] = total_amount - items_total
                
                # Intentar distribuir diferencia proporcionalmente
                if items_total > 0:
                    adjustment_factor = total_amount / items_total
                    for item in detailed_items:
                        if item.get('total_price'):
                            item['total_price'] = round(item['total_price'] * adjustment_factor)
                            if item.get('unit_price'):
                                item['unit_price'] = round(item['unit_price'] * adjustment_factor)
                    
                    receipt_data['reconciliation_applied'] = True
            else:
                receipt_data['reconciliation_needed'] = False
        
        return receipt_data
    
    def _calculate_parsing_confidence(self, receipt_data: Dict) -> float:
        """Calcula confianza general del parsing"""
        
        confidence = 0.0
        
        # Factores de confianza
        if receipt_data.get('vendor'):
            confidence += 0.15
        if receipt_data.get('total_amount'):
            confidence += 0.20
        if receipt_data.get('date'):
            confidence += 0.10
        if receipt_data.get('detailed_items'):
            confidence += 0.25
            # Bonus por número de items
            items_count = len(receipt_data['detailed_items'])
            confidence += min(items_count * 0.05, 0.15)
        if not receipt_data.get('reconciliation_needed', True):
            confidence += 0.15
        
        return min(confidence, 1.0)


# Instancia global
chile_receipt_parser = ChileReceiptParser()
