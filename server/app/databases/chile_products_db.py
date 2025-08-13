"""
Base de datos local de productos chilenos comunes para validación automática OCR
Incluye productos, precios típicos, variaciones de nombres y códigos de barras
"""

import json
import os
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher
import re
from datetime import datetime, timedelta

class ChileProductsDB:
    def __init__(self):
        self.products_db = self._load_chile_products()
        self.price_ranges = self._load_typical_prices()
        self.brand_variations = self._load_brand_variations()
        self.common_errors = self._load_common_ocr_errors()
        self.cache_file = "chile_products_cache.json"
        self._load_cache()
    
    def _load_chile_products(self) -> Dict:
        """Cargar base de datos de productos chilenos comunes"""
        return {
            # Bebidas
            "coca_cola": {
                "names": ["coca cola", "coca-cola", "cocacola", "coke", "cc"],
                "variations": ["ccca ccla", "coca ccla", "ceca cola", "coca c0la"],
                "category": "bebidas",
                "typical_sizes": ["350ml", "500ml", "1.5L", "2L"],
                "barcode_prefixes": ["789", "750"]
            },
            "pepsi": {
                "names": ["pepsi", "pepsi cola"],
                "variations": ["pepsl", "peps1", "pep5i"],
                "category": "bebidas",
                "typical_sizes": ["350ml", "500ml", "1.5L"],
                "barcode_prefixes": ["789"]
            },
            "sprite": {
                "names": ["sprite", "7up"],
                "variations": ["5prite", "sprlte", "spr1te"],
                "category": "bebidas",
                "typical_sizes": ["350ml", "500ml", "1.5L"]
            },
            
            # Lácteos
            "leche_soprole": {
                "names": ["leche soprole", "soprole", "leche"],
                "variations": ["1eche", "leche s0pr0le", "sopr0le"],
                "category": "lacteos",
                "typical_sizes": ["1L", "200ml"],
                "brands": ["soprole", "colun", "loncoleche"]
            },
            "yogurt": {
                "names": ["yogurt", "yoghurt", "yogur"],
                "variations": ["y0gurt", "yogu rt", "y0gur"],
                "category": "lacteos",
                "typical_sizes": ["125g", "150g", "1kg"]
            },
            
            # Panadería
            "pan_hallulla": {
                "names": ["hallulla", "pan hallulla", "pan"],
                "variations": ["ha11u11a", "hallul1a", "hal1ulla"],
                "category": "panaderia",
                "unit": "unidad"
            },
            "pan_marraqueta": {
                "names": ["marraqueta", "pan marraqueta", "pan frances"],
                "variations": ["marraq ueta", "marraqu3ta", "marraq"],
                "category": "panaderia",
                "unit": "unidad"
            },
            
            # Carnes
            "pollo": {
                "names": ["pollo", "pechuga", "trutro", "muslo"],
                "variations": ["p0llo", "pol1o", "pechug a"],
                "category": "carnes",
                "unit": "kg"
            },
            "carne_vacuno": {
                "names": ["lomo", "asado", "posta", "carne"],
                "variations": ["l0mo", "asad0", "p0sta"],
                "category": "carnes",
                "unit": "kg"
            },
            
            # Frutas y Verduras
            "tomate": {
                "names": ["tomate", "tomates"],
                "variations": ["t0mate", "tomat e", "tom ate"],
                "category": "frutas_verduras",
                "unit": "kg"
            },
            "palta": {
                "names": ["palta", "paltas", "aguacate"],
                "variations": ["pa1ta", "pal ta", "p4lta"],
                "category": "frutas_verduras",
                "unit": "kg"
            },
            "platano": {
                "names": ["platano", "banana", "plátano"],
                "variations": ["p1atano", "platan0", "banan a"],
                "category": "frutas_verduras",
                "unit": "kg"
            },
            
            # Abarrotes
            "arroz": {
                "names": ["arroz", "arroz grado 1", "arroz grado 2"],
                "variations": ["arr0z", "arrcz", "arr oz"],
                "category": "abarrotes",
                "typical_sizes": ["1kg", "5kg", "10kg"]
            },
            "aceite": {
                "names": ["aceite", "aceite maravilla", "aceite oliva"],
                "variations": ["ace1te", "acelte", "ace ite"],
                "category": "abarrotes",
                "typical_sizes": ["1L", "900ml"]
            },
            "azucar": {
                "names": ["azucar", "azúcar", "azucar blanca"],
                "variations": ["azuc ar", "azuc4r", "4zucar"],
                "category": "abarrotes",
                "typical_sizes": ["1kg", "5kg"]
            }
        }
    
    def _load_typical_prices(self) -> Dict:
        """Cargar rangos de precios típicos por producto (en CLP)"""
        return {
            # Bebidas (precios en CLP)
            "coca_cola": {"350ml": (800, 1500), "500ml": (1000, 2000), "1.5L": (1500, 3000)},
            "pepsi": {"350ml": (700, 1400), "500ml": (900, 1800), "1.5L": (1400, 2800)},
            "sprite": {"350ml": (800, 1500), "500ml": (1000, 2000)},
            
            # Lácteos
            "leche_soprole": {"1L": (800, 1500), "200ml": (300, 600)},
            "yogurt": {"125g": (400, 800), "150g": (500, 900), "1kg": (2000, 4000)},
            
            # Panadería (por unidad)
            "pan_hallulla": {"unidad": (150, 400)},
            "pan_marraqueta": {"unidad": (100, 300)},
            
            # Carnes (por kg)
            "pollo": {"kg": (2500, 5000)},
            "carne_vacuno": {"kg": (5000, 12000)},
            
            # Frutas y Verduras (por kg)
            "tomate": {"kg": (800, 2500)},
            "palta": {"kg": (1500, 4000)},
            "platano": {"kg": (800, 2000)},
            
            # Abarrotes
            "arroz": {"1kg": (800, 1800), "5kg": (3500, 8000)},
            "aceite": {"1L": (1500, 3500), "900ml": (1300, 3000)},
            "azucar": {"1kg": (600, 1500), "5kg": (2500, 6000)}
        }
    
    def _load_brand_variations(self) -> Dict:
        """Cargar variaciones comunes de marcas chilenas"""
        return {
            "soprole": ["s0pr0le", "sopr0le", "soproie", "sopro1e"],
            "colun": ["c0lun", "co1un", "colun", "c01un"],
            "lider": ["11der", "l1der", "llder", "l ider"],
            "jumbo": ["jumb0", "jumb o", "j umbo", "jumbc"],
            "unimarc": ["un1marc", "unimarc", "un imarc", "unlmarc"],
            "santa_isabel": ["santa isabe1", "santa isabel", "santa 1sabel"],
            "tottus": ["t0ttus", "tottus", "t ottus", "tott us"]
        }
    
    def _load_common_ocr_errors(self) -> Dict:
        """Cargar errores OCR comunes y sus correcciones"""
        return {
            # Confusiones de caracteres comunes
            "0": ["O", "o", "Q"],
            "1": ["I", "l", "|", "i"],
            "5": ["S", "s"],
            "6": ["G", "b"],
            "8": ["B"],
            "a": ["4", "@"],
            "e": ["3"],
            "i": ["1", "l", "|"],
            "o": ["0", "O"],
            "s": ["5", "$"],
            "t": ["7", "+"],
            "u": ["v", "n"],
            
            # Espacios mal interpretados
            " ": ["", "_", "-", "."],
            
            # Caracteres especiales
            "ñ": ["n", "fi", "ri"],
            "á": ["a", "4"],
            "é": ["e", "3"],
            "í": ["i", "1"],
            "ó": ["o", "0"],
            "ú": ["u", "v"]
        }
    
    def _load_cache(self):
        """Cargar cache de productos aprendidos"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    self.learned_products = json.load(f)
            else:
                self.learned_products = {}
        except:
            self.learned_products = {}
    
    def _save_cache(self):
        """Guardar cache de productos aprendidos"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.learned_products, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    def fuzzy_match_product(self, ocr_text: str, confidence_threshold: float = 0.6) -> Dict:
        """
        Realizar fuzzy matching con productos conocidos
        """
        ocr_text_clean = self._clean_text(ocr_text.lower())
        best_match = {"product": None, "confidence": 0.0, "corrected_name": ocr_text}
        
        # Buscar en productos principales
        for product_key, product_data in self.products_db.items():
            # Verificar nombres principales
            for name in product_data["names"]:
                similarity = SequenceMatcher(None, ocr_text_clean, name.lower()).ratio()
                if similarity > best_match["confidence"]:
                    best_match = {
                        "product": product_key,
                        "confidence": similarity,
                        "corrected_name": name,
                        "category": product_data["category"]
                    }
            
            # Verificar variaciones conocidas
            if "variations" in product_data:
                for variation in product_data["variations"]:
                    similarity = SequenceMatcher(None, ocr_text_clean, variation.lower()).ratio()
                    if similarity > best_match["confidence"]:
                        best_match = {
                            "product": product_key,
                            "confidence": similarity,
                            "corrected_name": product_data["names"][0],
                            "category": product_data["category"],
                            "was_variation": True
                        }
        
        # Buscar en productos aprendidos
        for learned_name, learned_data in self.learned_products.items():
            similarity = SequenceMatcher(None, ocr_text_clean, learned_name.lower()).ratio()
            if similarity > best_match["confidence"]:
                best_match = {
                    "product": "learned",
                    "confidence": similarity,
                    "corrected_name": learned_data["corrected_name"],
                    "category": learned_data.get("category", "unknown"),
                    "learned": True
                }
        
        # Solo devolver si supera el threshold
        if best_match["confidence"] >= confidence_threshold:
            return best_match
        
        return {"product": None, "confidence": 0.0, "corrected_name": ocr_text}
    
    def auto_correct_ocr_errors(self, text: str) -> str:
        """
        Auto-corregir errores OCR comunes
        """
        corrected = text
        
        # Aplicar correcciones de caracteres comunes
        for correct_char, error_chars in self.common_errors.items():
            for error_char in error_chars:
                # Reemplazar solo si mejora la similitud con productos conocidos
                test_correction = corrected.replace(error_char, correct_char)
                if self._is_better_match(test_correction, corrected):
                    corrected = test_correction
        
        return corrected
    
    def validate_price_range(self, product_name: str, price: float, size: str = None) -> Dict:
        """
        Validar si un precio está en el rango típico para un producto
        """
        # Buscar producto en la base de datos
        product_match = self.fuzzy_match_product(product_name, confidence_threshold=0.7)
        
        if product_match["product"] and product_match["product"] in self.price_ranges:
            price_data = self.price_ranges[product_match["product"]]
            
            # Si se especifica tamaño, usar ese rango
            if size and size in price_data:
                min_price, max_price = price_data[size]
            else:
                # Usar el primer rango disponible como referencia
                min_price, max_price = list(price_data.values())[0]
            
            is_valid = min_price <= price <= max_price
            confidence = 1.0 if is_valid else max(0.0, 1.0 - abs(price - (min_price + max_price) / 2) / (max_price - min_price))
            
            return {
                "is_valid": is_valid,
                "confidence": confidence,
                "expected_range": (min_price, max_price),
                "suggested_price": None if is_valid else self._suggest_price_correction(price, min_price, max_price)
            }
        
        # Si no se encuentra el producto, asumir válido con baja confianza
        return {
            "is_valid": True,
            "confidence": 0.3,
            "expected_range": None,
            "suggested_price": None
        }
    
    def learn_from_successful_processing(self, product_name: str, corrected_name: str, category: str = None):
        """
        Aprender de procesamientos exitosos para mejorar futuras correcciones
        """
        if product_name.lower() not in self.learned_products:
            self.learned_products[product_name.lower()] = {
                "corrected_name": corrected_name,
                "category": category,
                "learned_date": datetime.now().isoformat(),
                "usage_count": 1
            }
        else:
            self.learned_products[product_name.lower()]["usage_count"] += 1
        
        self._save_cache()
    
    def get_category_suggestions(self, product_name: str) -> List[str]:
        """
        Obtener sugerencias de categoría basadas en el nombre del producto
        """
        product_match = self.fuzzy_match_product(product_name, confidence_threshold=0.5)
        
        if product_match["product"]:
            return [product_match["category"]]
        
        # Sugerencias basadas en palabras clave
        name_lower = product_name.lower()
        if any(word in name_lower for word in ["leche", "yogurt", "queso", "mantequilla"]):
            return ["lacteos"]
        elif any(word in name_lower for word in ["coca", "pepsi", "sprite", "jugo", "agua"]):
            return ["bebidas"]
        elif any(word in name_lower for word in ["pan", "hallulla", "marraqueta"]):
            return ["panaderia"]
        elif any(word in name_lower for word in ["pollo", "carne", "vacuno", "cerdo"]):
            return ["carnes"]
        elif any(word in name_lower for word in ["tomate", "palta", "platano", "manzana"]):
            return ["frutas_verduras"]
        else:
            return ["abarrotes"]
    
    def _clean_text(self, text: str) -> str:
        """Limpiar texto para comparación"""
        # Remover caracteres especiales y normalizar espacios
        cleaned = re.sub(r'[^\w\s]', '', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned
    
    def _is_better_match(self, corrected_text: str, original_text: str) -> bool:
        """Verificar si el texto corregido es mejor match que el original"""
        corrected_match = self.fuzzy_match_product(corrected_text, confidence_threshold=0.0)
        original_match = self.fuzzy_match_product(original_text, confidence_threshold=0.0)
        
        return corrected_match["confidence"] > original_match["confidence"]
    
    def _suggest_price_correction(self, price: float, min_price: float, max_price: float) -> float:
        """Sugerir corrección de precio basada en errores OCR comunes"""
        # Verificar si es un error de dígito (ej: 6000 en lugar de 600)
        if price > max_price * 5:
            # Posible error de cero extra
            suggested = price / 10
            if min_price <= suggested <= max_price:
                return suggested
        
        elif price < min_price / 5:
            # Posible falta de cero
            suggested = price * 10
            if min_price <= suggested <= max_price:
                return suggested
        
        # Si no se puede corregir automáticamente, devolver el promedio del rango
        return (min_price + max_price) / 2

    def auto_correct_product_name(self, ocr_text: str) -> Dict:
        """
        Auto-corrección inteligente de nombres de productos usando múltiples estrategias
        
        Args:
            ocr_text: Texto extraído por OCR
            
        Returns:
            Dict con información de corrección
        """
        if not ocr_text or len(ocr_text.strip()) < 2:
            return {'corrected': False, 'original_text': ocr_text}
        
        cleaned_text = self._clean_text(ocr_text)
        
        # Estrategia 1: Corrección de errores OCR comunes
        corrected_text = self.auto_correct_ocr_errors(cleaned_text)
        
        # Estrategia 2: Fuzzy matching con productos conocidos
        fuzzy_result = self.fuzzy_match_product(corrected_text, confidence_threshold=0.7)
        
        if fuzzy_result['match_found']:
            product_info = self.products_db.get(fuzzy_result['matched_product'], {})
            
            return {
                'corrected': True,
                'original_text': ocr_text,
                'corrected_name': fuzzy_result['best_match'],
                'confidence': fuzzy_result['confidence'],
                'method': 'fuzzy_matching',
                'product_info': {
                    'category': product_info.get('category', 'unknown'),
                    'typical_sizes': product_info.get('typical_sizes', []),
                    'unit': product_info.get('unit', 'unidad'),
                    'brands': product_info.get('brands', [])
                }
            }
        
        # Estrategia 3: Verificar si la corrección OCR mejoró el texto
        if corrected_text != cleaned_text:
            return {
                'corrected': True,
                'original_text': ocr_text,
                'corrected_name': corrected_text,
                'confidence': 0.6,
                'method': 'ocr_error_correction'
            }
        
        return {
            'corrected': False,
            'original_text': ocr_text,
            'confidence': 0.3
        }
    
    def correct_vendor_name(self, vendor_text: str) -> Dict:
        """
        Corrección automática de nombres de vendors/tiendas chilenas
        
        Args:
            vendor_text: Texto del vendor extraído por OCR
            
        Returns:
            Dict con información de corrección del vendor
        """
        if not vendor_text:
            return {'corrected': False, 'original_text': vendor_text}
        
        # Base de datos de vendors chilenos comunes
        known_vendors = {
            'jumbo': ['jumbo', 'hiper jumbo', 'jumbo kennedy'],
            'lider': ['lider', 'hiper lider', 'express lider'],
            'santa_isabel': ['santa isabel', 'santa isa', 'sta isabel'],
            'tottus': ['tottus', 'hipermercado tottus'],
            'unimarc': ['unimarc', 'hiper unimarc'],
            'copec': ['copec', 'estacion copec', 'copec pronto'],
            'shell': ['shell', 'estacion shell', 'shell select'],
            'esso': ['esso', 'estacion esso'],
            'petrobras': ['petrobras', 'estacion petrobras'],
            'cruz_verde': ['cruz verde', 'farmacia cruz verde'],
            'salcobrand': ['salcobrand', 'farmacia salcobrand'],
            'ahumada': ['ahumada', 'farmacia ahumada'],
            'falabella': ['falabella', 'saga falabella'],
            'ripley': ['ripley', 'tiendas ripley'],
            'paris': ['paris', 'tiendas paris'],
            'sodimac': ['sodimac', 'homecenter sodimac'],
            'easy': ['easy', 'easy homecenter']
        }
        
        # Variaciones OCR comunes para vendors
        vendor_ocr_errors = {
            'jumb0': 'jumbo',
            'j umbo': 'jumbo',
            'jum bo': 'jumbo',
            '1ider': 'lider',
            'l1der': 'lider',
            'li der': 'lider',
            'c0pec': 'copec',
            'cop ec': 'copec',
            'c opec': 'copec',
            'she11': 'shell',
            'sh ell': 'shell',
            'cruz verd e': 'cruz verde',
            'cruz v erde': 'cruz verde',
            'salc0brand': 'salcobrand',
            'salco brand': 'salcobrand',
            'fa1abella': 'falabella',
            'falabe11a': 'falabella',
            'rip1ey': 'ripley',
            'ripl ey': 'ripley',
            'par1s': 'paris',
            'pa ris': 'paris',
            's0dimac': 'sodimac',
            'sodi mac': 'sodimac',
            'ea5y': 'easy',
            'e asy': 'easy'
        }
        
        cleaned_vendor = self._clean_text(vendor_text.lower())
        
        # Estrategia 1: Corrección directa de errores OCR
        if cleaned_vendor in vendor_ocr_errors:
            corrected_name = vendor_ocr_errors[cleaned_vendor]
            return {
                'corrected': True,
                'original_text': vendor_text,
                'corrected_name': corrected_name.title(),
                'confidence': 0.9,
                'method': 'direct_ocr_correction'
            }
        
        # Estrategia 2: Fuzzy matching con vendors conocidos
        best_match = None
        best_confidence = 0.0
        
        for vendor_key, variations in known_vendors.items():
            for variation in variations:
                similarity = self._calculate_similarity(cleaned_vendor, variation.lower())
                if similarity > best_confidence and similarity > 0.7:
                    best_confidence = similarity
                    best_match = variation.title()
        
        if best_match:
            return {
                'corrected': True,
                'original_text': vendor_text,
                'corrected_name': best_match,
                'confidence': best_confidence,
                'method': 'fuzzy_matching'
            }
        
        return {
            'corrected': False,
            'original_text': vendor_text,
            'confidence': 0.3
        }
    
    def auto_correct_product_name(self, product_text: str) -> Dict:
        """
        Corrección automática de nombres de productos chilenos
        
        Args:
            product_text: Texto del producto extraído por OCR
            
        Returns:
            Dict con información de corrección del producto
        """
        if not product_text:
            return {'corrected': False, 'original_text': product_text}
        
        cleaned_product = self._clean_text(product_text.lower())
        
        # Buscar en base de datos de productos
        for category_name, products in self.products_db.items():
            for product_info in products:
                product_name = product_info['name'].lower()
                
                # Coincidencia exacta
                if cleaned_product == product_name:
                    return {
                        'corrected': True,
                        'original_text': product_text,
                        'corrected_name': product_info['name'],
                        'confidence': 1.0,
                        'method': 'exact_match',
                        'category': category_name
                    }
                
                # Fuzzy matching
                similarity = self._calculate_similarity(cleaned_product, product_name)
                if similarity > 0.8:
                    return {
                        'corrected': True,
                        'original_text': product_text,
                        'corrected_name': product_info['name'],
                        'confidence': similarity,
                        'method': 'fuzzy_matching',
                        'category': category_name
                    }
                
                # Buscar en variaciones OCR
                for variation in product_info.get('ocr_variations', []):
                    if cleaned_product == variation.lower():
                        return {
                            'corrected': True,
                            'original_text': product_text,
                            'corrected_name': product_info['name'],
                            'confidence': 0.9,
                            'method': 'ocr_variation',
                            'category': category_name
                        }
        
        return {
            'corrected': False,
            'original_text': product_text,
            'confidence': 0.2
        }
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calcular similitud entre dos textos usando SequenceMatcher
        
        Args:
            text1: Primer texto
            text2: Segundo texto
            
        Returns:
            Similitud entre 0.0 y 1.0
        """
        from difflib import SequenceMatcher
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def validate_product_consistency(self, items: List[Dict]) -> Dict:
        """
        Validar consistencia de productos extraídos
        
        Args:
            items: Lista de items extraídos
            
        Returns:
            Dict con información de validación
        """
        validation_results = {
            'consistent': True,
            'issues': [],
            'corrected_items': [],
            'confidence': 1.0
        }
        
        for i, item in enumerate(items):
            item_issues = []
            corrected_item = item.copy()
            
            # Validar precio vs cantidad
            quantity = item.get('quantity', 1)
            unit_price = item.get('unit_price', 0)
            total_price = item.get('total_price', 0)
            
            if quantity > 0 and unit_price > 0:
                expected_total = quantity * unit_price
                if abs(expected_total - total_price) > 0.1:
                    item_issues.append(f"Inconsistencia precio: {total_price} vs esperado {expected_total}")
                    # Auto-corrección: usar el cálculo más probable
                    if abs(total_price - expected_total) / max(total_price, expected_total) < 0.1:
                        corrected_item['total_price'] = expected_total
            
            # Validar rango de precios típicos
            product_name = item.get('name', '')
            if product_name and total_price > 0:
                price_validation = self.validate_price_range(product_name, total_price)
                if not price_validation['valid']:
                    item_issues.append(f"Precio fuera de rango típico: {total_price}")
                    if price_validation.get('suggested_price'):
                        corrected_item['total_price'] = price_validation['suggested_price']
                        corrected_item['unit_price'] = price_validation['suggested_price'] / max(quantity, 1)
            
            if item_issues:
                validation_results['issues'].extend([f"Item {i+1}: {issue}" for issue in item_issues])
                validation_results['consistent'] = False
            
            validation_results['corrected_items'].append(corrected_item)
        
        # Calcular confianza basada en número de issues
        total_items = len(items)
        items_with_issues = len([item for item in validation_results['corrected_items'] 
                               if any(f"Item {i+1}:" in issue for i, issue in enumerate(validation_results['issues']))])
        
        if total_items > 0:
            validation_results['confidence'] = max(0.3, 1.0 - (items_with_issues / total_items) * 0.5)
        
        return validation_results


# Instancia global
chile_products_db = ChileProductsDB()
