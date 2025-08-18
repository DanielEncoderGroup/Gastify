"""
Parser Avanzado para Recibos Chilenos - Extracción Estructurada de Raw Text OCR
Especializado en extraer productos, precios, totales y metadatos de recibos chilenos
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ReceiptProduct:
    """Producto extraído del recibo"""
    name: str
    quantity: int = 1
    unit_price: Optional[float] = None
    total_price: float = 0.0
    barcode: Optional[str] = None
    sku: Optional[str] = None
    confidence: float = 0.0

@dataclass
class ReceiptTransaction:
    """Datos de transacción del recibo"""
    total_amount: float = 0.0
    subtotal: float = 0.0
    iva_amount: float = 0.0
    iva_rate: float = 19.0
    total_items: int = 0
    payment_method: Optional[str] = None
    change_amount: float = 0.0
    confidence: float = 0.0

@dataclass
class ReceiptLocation:
    """Datos de ubicación y tienda"""
    store_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    receipt_number: Optional[str] = None
    transaction_date: Optional[str] = None
    transaction_time: Optional[str] = None
    date_time: Optional[datetime] = None
    rut: Optional[str] = None
    register: Optional[str] = None
    confidence: float = 0.0

@dataclass
class ParsedReceiptData:
    """Datos completos parseados del recibo"""
    products: List[ReceiptProduct]
    transaction: Optional[ReceiptTransaction]
    location: Optional[ReceiptLocation]
    raw_text: str
    confidence: float = 0.0
    products_confidence: float = 0.0
    transaction_confidence: float = 0.0
    location_confidence: float = 0.0

class ChileReceiptParserAdvanced:
    """
    Parser avanzado especializado en recibos chilenos.
    Extrae datos estructurados del texto OCR crudo.
    """
    
    def __init__(self):
        # Patrones regex para extracción chilena
        self.patterns = self._compile_patterns()
        
        # Palabras clave comunes en recibos chilenos
        self.total_keywords = ['total', 'total $', 'total afecto', 'total neto']
        self.iva_keywords = ['iva', 'i.v.a', 'impuesto']
        self.subtotal_keywords = ['subtotal', 'sub-total', 'total afecto']
        self.quantity_keywords = ['x', 'und', 'unidades', 'qty']
        
        # Métodos de pago chilenos
        self.payment_methods = ['efectivo', 'debito', 'credito', 'transferencia', 'debit/prepag']
        
    def _compile_patterns(self) -> Dict[str, re.Pattern]:
        """Compila todos los patrones regex optimizados para formato específico de recibos chilenos"""
        return {
            # PRODUCTOS - Optimizados para tu formato específico
            
            # Productos con cantidad explícita (2X1.000\nBEN AGUA PER\n$ 2.000)
            'product_with_quantity_newline': re.compile(
                r'(\d+)X(\d{1,3}(?:\.\d{3})*)\s*\n\s*([A-Z\s\d]+?)\s*\n\s*\$\s*(\d{1,3}(?:\.\d{3})*)',
                re.MULTILINE | re.IGNORECASE
            ),
            
            # Productos con código de barras (7803468005005 MOLD INT 630\n$ 2.890)
            'product_with_barcode_newline': re.compile(
                r'(\d{13})\s+([A-Z\s\d]+?)\s*\n\s*\$\s*(\d{1,3}(?:\.\d{3})*)',
                re.MULTILINE | re.IGNORECASE
            ),
            
            # Productos simples sin cantidad (GALLETAOBSE\n\n1.000)
            'product_simple_newline': re.compile(
                r'([A-Z\s\d]{5,30})\s*\n\s*\n\s*(\d{1,3}(?:\.\d{3})*)',
                re.MULTILINE | re.IGNORECASE
            ),
            
            # Productos con cantidad al final (GALLETA OBSE\n\n1.000)
            'product_quantity_end': re.compile(
                r'([A-Z\s\d]{5,30})\s*\n\s*\n\s*(\d{1,3}(?:\.\d{3})*)',
                re.MULTILINE | re.IGNORECASE
            ),
            
            # TOTALES - Optimizados para tu formato específico
            
            # Total final (TOTAL $\n8.360)
            'total_amount': re.compile(
                r'TOTAL\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # Subtotal (SUBTOTAL\n8.360)
            'subtotal': re.compile(
                r'SUBTOTAL\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # Total afecto (TOTAL AFECTO $\n7.025)
            'total_afecto': re.compile(
                r'TOTAL\s+AFECTO\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # IVA con tasa (TOTAL IVA (19.0%)\n1.335)
            'iva_with_rate': re.compile(
                r'TOTAL\s+IVA\s*\(([\d\.]+)%\)\s*\n?\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # IVA sin tasa (IVA\n1.335)
            'iva': re.compile(
                r'IVA\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # Total artículos (TOTAL NUMERO DE ARTIC VEND = 7)
            'total_items': re.compile(
                r'TOTAL\s+NUMERO\s+DE\s+ARTIC\s+VEND\s*=\s*(\d+)',
                re.IGNORECASE | re.MULTILINE
            ),
            
            # UBICACIÓN Y FECHAS
            
            # Fechas (Fecha: 10/08/2025)
            'date': re.compile(
                r'Fecha[:.]?\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',
                re.IGNORECASE
            ),
            
            # Horas (Hora: 20:49:23)
            'time': re.compile(
                r'Hora[:.]?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?',
                re.IGNORECASE
            ),
            
            # Direcciones (SUC: Av. Ferrocarril 2001)
            'address': re.compile(
                r'SUC[:.]?\s*([^\n]{10,100})',
                re.IGNORECASE
            ),
            
            # Ciudad (Pto.Montt-Pto Montt)
            'city': re.compile(
                r'([A-Za-z\.]+(?:\s+[A-Za-z\.]+)*)-([A-Za-z\.]+(?:\s+[A-Za-z\.]+)*)',
                re.IGNORECASE
            ),
            
            # Número de boleta (Bol. Electronica: 002426936168)
            'receipt_number': re.compile(
                r'Bol\.?\s*Electronica[:.]?\s*(\d{8,15})',
                re.IGNORECASE
            ),
            
            # Caja (Caja: 0090)
            'register': re.compile(
                r'Caja[:.]?\s*(\d+)',
                re.IGNORECASE
            ),
            
            # Código (CODIGO: 7802820454208)
            'codigo': re.compile(
                r'CODIGO[:.]?\s*(\d{13})',
                re.IGNORECASE
            ),
            
            # RUT (RUT: 96.790.240-3 o 96790240-3)
            'rut': re.compile(
                r'RUT[:.]?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])',
                re.IGNORECASE
            ),
            
            # MÉTODOS DE PAGO
            
            # Método de pago (DEBIT/PREPAG)
            'payment_method': re.compile(
                r'(EFECTIVO|DEBITO|CREDITO|DEBIT/PREPAG|TRANSFERENCIA)',
                re.IGNORECASE
            ),
            
            # Vuelto (VUELTO\n0)
            'change': re.compile(
                r'VUELTO\s*\$?\s*(\d{1,3}(?:\.\d{3})*)',
                re.IGNORECASE | re.MULTILINE
            ),
        }
            
    def parse_receipt(self, raw_text: str) -> ParsedReceiptData:
        """
        Parser principal que extrae todos los datos del texto OCR
        """
        logger.info("Iniciando parsing de recibo chileno...")
        
        # Limpiar texto
        cleaned_text = self._clean_text(raw_text)
        
        # Extraer componentes
        products = self._extract_products(cleaned_text)
        transaction = self._extract_transaction_data(cleaned_text)
        location = self._extract_location_data(cleaned_text)
        
        # Calcular confianzas individuales
        products_confidence = sum(p.confidence for p in products) / len(products) if products else 0.0
        transaction_confidence = transaction.confidence if transaction else 0.0
        location_confidence = location.confidence if location else 0.0
        
        # Calcular confianza general
        overall_confidence = self._calculate_overall_confidence(products, transaction, location)
        
        parsed_data = ParsedReceiptData(
            products=products,
            transaction=transaction,
            location=location,
            raw_text=raw_text,
            confidence=overall_confidence / 100.0,  # Convertir a decimal
            products_confidence=products_confidence,
            transaction_confidence=transaction_confidence,
            location_confidence=location_confidence
        )
        
        logger.info(f"Parsing completado - Confianza: {overall_confidence:.2f}%")
        logger.info(f"Productos extraídos: {len(products)}")
        logger.info(f"Total detectado: ${transaction.total_amount if transaction else 0}")
        
        return parsed_data
    
    def _clean_text(self, text: str) -> str:
        """Limpia y normaliza el texto OCR"""
        # Normalizar espacios y saltos de línea
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n', text)
        
        # Corregir errores comunes de OCR
        text = text.replace('$', '$')  # Normalizar símbolo peso
        text = re.sub(r'(\d)\s*\.\s*(\d{3})', r'\1.\2', text)  # Arreglar separadores de miles
        
        return text.strip()
    
    def _extract_products(self, text: str) -> List[ReceiptProduct]:
        """Extrae productos del texto OCR mejorado"""
        products = []
        processed_names = set()  # Para evitar duplicados
        
        logger.info("Iniciando extracción de productos...")
        
        # 1. Buscar productos con cantidad explícita con saltos de línea (2X1.000\nBEN AGUA PER\n$ 2.000)
        for match in self.patterns['product_with_quantity_newline'].finditer(text):
            try:
                quantity = int(match.group(1))
                unit_price = self._parse_price(match.group(2))
                name = self._clean_product_name(match.group(3))
                total_price = self._parse_price(match.group(4))
                
                if name not in processed_names and len(name) > 2:
                    product = ReceiptProduct(
                        name=name,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        confidence=0.95
                    )
                    products.append(product)
                    processed_names.add(name)
                    logger.debug(f"✓ Producto con cantidad (newline): {name} (Q:{quantity}, Unit:${unit_price}, Total:${total_price})")
                
            except Exception as e:
                logger.warning(f"Error parsing producto con cantidad newline: {e}")
        
        # 2. Buscar productos con código de barras con saltos de línea (7803468005005 MOLD INT 630\n$ 2.890)
        for match in self.patterns['product_with_barcode_newline'].finditer(text):
            try:
                barcode = match.group(1)
                name = self._clean_product_name(match.group(2))
                total_price = self._parse_price(match.group(3))
                
                if name not in processed_names and len(name) > 2:
                    product = ReceiptProduct(
                        name=name,
                        barcode=barcode,
                        quantity=1,
                        total_price=total_price,
                        unit_price=total_price,
                        confidence=0.9
                    )
                    products.append(product)
                    processed_names.add(name)
                    logger.debug(f"✓ Producto con barcode (newline): {name} - ${total_price} - Barcode: {barcode}")
                    
            except Exception as e:
                logger.warning(f"Error parsing producto con barcode newline: {e}")
        
        # 3. Buscar productos simples con cantidad al final (GALLETAOBSE\n\n1.000)
        for match in self.patterns['product_simple_newline'].finditer(text):
            try:
                name = self._clean_product_name(match.group(1))
                amount = self._parse_price(match.group(2))
                
                if name not in processed_names and len(name) > 3:
                    # Determinar si es precio o cantidad
                    if amount < 100:  # Probablemente cantidad
                        product = ReceiptProduct(
                            name=name,
                            quantity=int(amount),
                            total_price=0.0,  # Se calculará después
                            unit_price=0.0,
                            confidence=0.7
                        )
                    else:  # Probablemente precio
                        product = ReceiptProduct(
                            name=name,
                            quantity=1,
                            total_price=amount,
                            unit_price=amount,
                            confidence=0.8
                        )
                    
                    products.append(product)
                    processed_names.add(name)
                    logger.debug(f"✓ Producto simple (newline): {name} - {amount}")
                    
            except Exception as e:
                logger.warning(f"Error parsing producto simple newline: {e}")
        
        logger.info(f"Productos extraídos: {len(products)}")
        return products
    
    def _clean_product_name(self, name: str) -> str:
        """Limpia y normaliza nombres de productos"""
        # Remover códigos de barras del inicio
        name = re.sub(r'^\d{13}\s*', '', name)
        # Normalizar espacios
        name = re.sub(r'\s+', ' ', name)
        # Remover símbolos especiales al final
        name = re.sub(r'[\$\n\r]+$', '', name)
        return name.strip().title()
    
    def _extract_transaction_data(self, text: str) -> ReceiptTransaction:
        """Extrae datos de transacción (totales, IVA, etc.)"""
        transaction = ReceiptTransaction()
        confidence_factors = []
        
        # Total final
        total_match = self.patterns['total_amount'].search(text)
        if total_match:
            transaction.total_amount = self._parse_price(total_match.group(1))
            confidence_factors.append(0.95)
            logger.debug(f"Total encontrado: ${transaction.total_amount}")
        
        # Total afecto como alternativa
        if not total_match:
            total_afecto_match = self.patterns['total_afecto'].search(text)
            if total_afecto_match:
                transaction.total_amount = self._parse_price(total_afecto_match.group(1))
                confidence_factors.append(0.9)
                logger.debug(f"Total afecto encontrado: ${transaction.total_amount}")
        
        # Subtotal
        subtotal_match = self.patterns['subtotal'].search(text)
        if subtotal_match:
            transaction.subtotal = self._parse_price(subtotal_match.group(1))
            confidence_factors.append(0.9)
            logger.debug(f"Subtotal encontrado: ${transaction.subtotal}")
        
        # IVA con tasa (TOTAL IVA (19.0%)\n1.335)
        iva_rate_match = self.patterns['iva_with_rate'].search(text)
        if iva_rate_match:
            transaction.iva_rate = float(iva_rate_match.group(1))
            transaction.iva_amount = self._parse_price(iva_rate_match.group(2))
            confidence_factors.append(0.95)
            logger.debug(f"IVA con tasa encontrado: {transaction.iva_rate}% = ${transaction.iva_amount}")
        else:
            # IVA sin tasa explícita
            iva_match = self.patterns['iva'].search(text)
            if iva_match:
                transaction.iva_amount = self._parse_price(iva_match.group(1))
                transaction.iva_rate = 19.0  # Tasa estándar chilena
                confidence_factors.append(0.85)
                logger.debug(f"IVA encontrado: ${transaction.iva_amount}")
        
        # Total de artículos
        items_match = self.patterns['total_items'].search(text)
        if items_match:
            transaction.total_items = int(items_match.group(1))
            confidence_factors.append(0.9)
            logger.debug(f"Total artículos: {transaction.total_items}")
        
        # Método de pago
        payment_match = self.patterns['payment_method'].search(text)
        if payment_match:
            transaction.payment_method = payment_match.group(1).upper()
            confidence_factors.append(0.8)
            logger.debug(f"Método de pago: {transaction.payment_method}")
        
        # Vuelto
        change_match = self.patterns['change'].search(text)
        if change_match:
            transaction.change_amount = self._parse_price(change_match.group(1))
            confidence_factors.append(0.8)
            logger.debug(f"Vuelto: ${transaction.change_amount}")
        
        # Calcular confianza
        transaction.confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.0
        
        return transaction
    
    def _extract_location_data(self, text: str) -> ReceiptLocation:
        """Extrae datos de ubicación y tienda"""
        location = ReceiptLocation()
        confidence_factors = []
        
        # Nombre de tienda (buscar en las primeras líneas)
        lines = text.split('\n')[:5]  # Primeras 5 líneas
        for line in lines:
            line = line.strip()
            if len(line) >= 5 and line.isupper() and not any(x in line.lower() for x in ['rut', 'fecha', 'boleta']):
                if not location.store_name:  # Tomar la primera tienda encontrada
                    location.store_name = line
                    confidence_factors.append(0.9)
                    logger.debug(f"Tienda encontrada: {location.store_name}")
                    break
        
        # RUT
        rut_match = self.patterns['rut'].search(text)
        if rut_match:
            location.rut = rut_match.group(1)
            confidence_factors.append(0.95)
            logger.debug(f"RUT encontrado: {location.rut}")
        
        # Fecha
        date_match = self.patterns['date'].search(text)
        if date_match:
            day, month, year = date_match.groups()
            try:
                # Convertir a formato ISO
                date_obj = datetime(int(year), int(month), int(day))
                location.transaction_date = date_obj.strftime('%Y-%m-%d')
                location.date_time = date_obj  # También guardar como datetime
                confidence_factors.append(0.95)
                logger.debug(f"Fecha encontrada: {location.transaction_date}")
            except ValueError:
                logger.warning("Fecha inválida encontrada")
        
        # Hora
        time_match = self.patterns['time'].search(text)
        if time_match:
            hour, minute, second = time_match.groups()
            location.transaction_time = f"{hour.zfill(2)}:{minute}:{second}"
            confidence_factors.append(0.9)
            logger.debug(f"Hora encontrada: {location.transaction_time}")
        
        # Número de boleta
        receipt_match = self.patterns['receipt_number'].search(text)
        if receipt_match:
            location.receipt_number = receipt_match.group(1)
            confidence_factors.append(0.9)
            logger.debug(f"Boleta encontrada: {location.receipt_number}")
        
        # Dirección
        address_match = self.patterns['address'].search(text)
        if address_match:
            location.address = address_match.group(1).strip()
            confidence_factors.append(0.85)
            logger.debug(f"Dirección encontrada: {location.address}")
        
        # Ciudad
        city_match = self.patterns['city'].search(text)
        if city_match:
            location.city = city_match.group(1).strip()
            confidence_factors.append(0.8)
            logger.debug(f"Ciudad encontrada: {location.city}")
        
        # Caja
        register_match = self.patterns['register'].search(text)
        if register_match:
            location.register = register_match.group(1)
            confidence_factors.append(0.8)
            logger.debug(f"Caja encontrada: {location.register}")
        
        # Calcular confianza
        location.confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.0
        
        return location
    
    def _parse_price(self, price_str: str) -> float:
        """Convierte string de precio chileno a float"""
        try:
            # Remover todo excepto dígitos y puntos
            clean_price = re.sub(r'[^\d.]', '', price_str)
            
            # Manejar formato chileno (1.000 = mil, no 1.0)
            if '.' in clean_price:
                # Si hay un punto y después 3 dígitos, es separador de miles
                if re.match(r'\d+\.\d{3}$', clean_price):
                    clean_price = clean_price.replace('.', '')
                elif re.match(r'\d+\.\d{3}\.\d{3}$', clean_price):
                    clean_price = clean_price.replace('.', '')
                # Si hay punto y 1-2 dígitos, es decimal (raro en Chile)
            
            return float(clean_price)
        except (ValueError, AttributeError):
            logger.warning(f"No se pudo parsear precio: {price_str}")
            return 0.0
    
    def _calculate_overall_confidence(self, products: List[ReceiptProduct], 
                                    transaction: ReceiptTransaction, 
                                    location: ReceiptLocation) -> float:
        """Calcula confianza general del parsing"""
        
        weights = {'products': 0.4, 'transaction': 0.4, 'location': 0.2}
        scores = {}
        
        # Confianza de productos
        if products:
            scores['products'] = sum(p.confidence for p in products) / len(products)
        else:
            scores['products'] = 0.0
        
        # Confianza de transacción
        scores['transaction'] = transaction.confidence
        
        # Confianza de ubicación
        scores['location'] = location.confidence
        
        # Calcular promedio ponderado
        overall = sum(scores[key] * weights[key] for key in weights.keys())
        
        return round(overall * 100, 2)  # Convertir a porcentaje
    
    def get_summary(self, parsed_data: ParsedReceiptData) -> Dict[str, Any]:
        """Genera resumen legible del parsing"""
        return {
            'total_products': len(parsed_data.products),
            'total_amount': parsed_data.transaction.total_amount,
            'iva_amount': parsed_data.transaction.iva_amount,
            'receipt_date': parsed_data.location.transaction_date,
            'store_location': parsed_data.location.address,
            'overall_confidence': parsed_data.overall_confidence,
            'products_summary': [
                {
                    'name': p.name,
                    'quantity': p.quantity,
                    'price': p.total_price,
                    'barcode': p.barcode
                }
                for p in parsed_data.products[:5]  # Top 5 productos
            ]
        }
