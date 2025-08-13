"""
Motor de consenso para combinar resultados de múltiples engines OCR
Genera consenso automático y resuelve conflictos sin intervención manual
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import re
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConsensusEngine:
    def __init__(self):
        # Pesos optimizados basados en rendimiento real
        self.engine_weights = {
            'tesseract': 0.25,    # Bueno para texto limpio
            'easyocr': 0.60,      # MEJOR RENDIMIENTO (73.3%)
            'paddleocr': 0.15     # Menor peso hasta que funcione
        }
        self.confidence_threshold = 0.4  # Más inclusivo
        self.similarity_threshold = 0.70  # Más flexible
        self.learning_data = self._load_learning_data()
        
        # Configuración avanzada para consenso
        self.min_engines_for_consensus = 2
        self.outlier_threshold = 0.3  # Para detectar resultados anómalos
        self.text_similarity_weights = {
            'exact_match': 1.0,
            'high_similarity': 0.9,
            'medium_similarity': 0.7,
            'low_similarity': 0.4
        }
    
    def _load_learning_data(self) -> Dict:
        """Cargar datos de aprendizaje de consensos anteriores"""
        try:
            with open('consensus_learning.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"successful_patterns": {}, "error_patterns": {}}
    
    def _save_learning_data(self):
        """Guardar datos de aprendizaje"""
        try:
            with open('consensus_learning.json', 'w', encoding='utf-8') as f:
                json.dump(self.learning_data, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    def generate_consensus(self, engine_results: Dict[str, Dict]) -> Dict:
        """
        Generar consenso automático entre múltiples engines OCR
        
        Args:
            engine_results: {engine_name: {extracted_data}}
        
        Returns:
            Dict con consenso final y metadata
        """
        logger.info(f"Generando consenso entre {len(engine_results)} engines")
        
        consensus_result = {
            "vendor": self._consensus_vendor(engine_results),
            "total_amount": self._consensus_total_amount(engine_results),
            "date": self._consensus_date(engine_results),
            "line_items": self._consensus_line_items(engine_results),
            "metadata": {
                "engines_used": list(engine_results.keys()),
                "consensus_confidence": 0.0,
                "conflicts_resolved": 0,
                "auto_corrections_applied": []
            }
        }
        
        # Calcular confianza general del consenso
        consensus_result["metadata"]["consensus_confidence"] = self._calculate_consensus_confidence(
            engine_results, consensus_result
        )
        
        # Aplicar correcciones automáticas post-consenso
        consensus_result = self._apply_post_consensus_corrections(consensus_result)
        
        # Aprender de este consenso para futuros procesamientos
        self._learn_from_consensus(engine_results, consensus_result)
        
        return consensus_result
    
    def _advanced_text_consensus(self, texts: List[str], confidences: List[float], weights: List[float]) -> Dict:
        """
        Consenso avanzado para texto usando múltiples estrategias
        
        Args:
            texts: Lista de textos de diferentes engines
            confidences: Confianzas correspondientes
            weights: Pesos de los engines
            
        Returns:
            Diccionario con texto consensuado y metadata
        """
        if not texts:
            return {"text": "", "confidence": 0.0, "method": "empty"}
        
        # Filtrar textos vacíos
        valid_entries = [(t, c, w) for t, c, w in zip(texts, confidences, weights) if t and t.strip()]
        
        if not valid_entries:
            return {"text": "", "confidence": 0.0, "method": "no_valid_text"}
        
        if len(valid_entries) == 1:
            text, conf, weight = valid_entries[0]
            return {"text": text, "confidence": conf, "method": "single_engine"}
        
        # NUEVA ESTRATEGIA: Priorizar engine con mayor confianza si es significativamente mejor
        best_entry = max(valid_entries, key=lambda x: x[1])  # Mayor confianza
        best_text, best_conf, best_weight = best_entry
        
        # Si el mejor engine tiene confianza alta, usarlo directamente
        if best_conf > 0.7:  # 70% de confianza
            return {
                "text": best_text, 
                "confidence": best_conf * 1.1,  # Bonus por alta confianza
                "method": "high_confidence_priority",
                "best_engine": True
            }
        
        # Estrategia 1: Coincidencia exacta
        exact_matches = self._find_exact_matches(valid_entries)
        if exact_matches:
            return exact_matches
        
        # Estrategia 2: Alta similitud
        high_similarity = self._find_high_similarity_consensus(valid_entries)
        if high_similarity:
            return high_similarity
        
        # Estrategia 3: Consenso por confianza ponderada
        weighted_consensus = self._weighted_confidence_consensus(valid_entries)
        return weighted_consensus
    
    def _find_exact_matches(self, entries: List[Tuple]) -> Optional[Dict]:
        """Buscar coincidencias exactas entre engines"""
        text_groups = {}
        
        for text, conf, weight in entries:
            normalized_text = text.strip().upper()
            if normalized_text not in text_groups:
                text_groups[normalized_text] = []
            text_groups[normalized_text].append((text, conf, weight))
        
        # Buscar el grupo con más engines
        best_group = max(text_groups.values(), key=len)
        
        if len(best_group) >= self.min_engines_for_consensus:
            # Calcular confianza promedio ponderada
            total_weight = sum(weight for _, _, weight in best_group)
            weighted_conf = sum(conf * weight for _, conf, weight in best_group) / total_weight
            
            return {
                "text": best_group[0][0],  # Usar el primer texto original
                "confidence": min(weighted_conf * 1.1, 1.0),  # Bonus por consenso
                "method": "exact_match",
                "engines_count": len(best_group)
            }
        
        return None
    
    def _find_high_similarity_consensus(self, entries: List[Tuple]) -> Optional[Dict]:
        """Buscar consenso por alta similitud"""
        from difflib import SequenceMatcher
        
        best_score = 0
        best_consensus = None
        
        for i, (text1, conf1, weight1) in enumerate(entries):
            similar_group = [(text1, conf1, weight1)]
            similarity_scores = [1.0]  # El texto es 100% similar a sí mismo
            
            for j, (text2, conf2, weight2) in enumerate(entries):
                if i != j:
                    similarity = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
                    if similarity > 0.9:  # Alta similitud
                        similar_group.append((text2, conf2, weight2))
                        similarity_scores.append(similarity)
            
            if len(similar_group) >= self.min_engines_for_consensus:
                # Calcular score del grupo
                total_weight = sum(weight for _, _, weight in similar_group)
                avg_similarity = sum(similarity_scores) / len(similarity_scores)
                weighted_conf = sum(conf * weight for _, conf, weight in similar_group) / total_weight
                
                group_score = avg_similarity * weighted_conf * len(similar_group)
                
                if group_score > best_score:
                    best_score = group_score
                    best_consensus = {
                        "text": text1,
                        "confidence": min(weighted_conf * avg_similarity, 1.0),
                        "method": "high_similarity",
                        "engines_count": len(similar_group),
                        "avg_similarity": avg_similarity
                    }
        
        return best_consensus
    
    def _weighted_confidence_consensus(self, entries: List[Tuple]) -> Dict:
        """Consenso basado en confianza ponderada"""
        # Encontrar el texto con mayor score ponderado
        best_score = 0
        best_entry = None
        
        for text, conf, weight in entries:
            score = conf * weight
            if score > best_score:
                best_score = score
                best_entry = (text, conf, weight)
        
        if best_entry:
            text, conf, weight = best_entry
            return {
                "text": text,
                "confidence": conf,
                "method": "weighted_confidence",
                "engines_count": len(entries)
            }
        
        return {"text": "", "confidence": 0.0, "method": "fallback"}
    
    def _consensus_vendor(self, engine_results: Dict) -> Dict:
        """Generar consenso avanzado para el nombre del vendedor"""
        vendors = []
        confidences = []
        weights = []
        
        for engine_name, result in engine_results.items():
            if 'vendor' in result and result['vendor']:
                vendors.append(result['vendor'])
                confidences.append(result.get('vendor_confidence', result.get('confidence', 0.5)))
                weights.append(self.engine_weights.get(engine_name, 0.33))
        
        if not vendors:
            return {"name": "", "confidence": 0.0, "consensus_type": "no_data"}
        
        # Usar consenso avanzado
        consensus = self._advanced_text_consensus(vendors, confidences, weights)
        
        return {
            "name": consensus["text"],
            "confidence": consensus["confidence"],
            "consensus_type": consensus["method"],
            "engines_count": consensus.get("engines_count", len(vendors))
        }
    
    def _consensus_total_amount(self, engine_results: Dict) -> Dict:
        """Generar consenso para el monto total"""
        amounts = []
        confidences = []
        
        for engine_name, result in engine_results.items():
            if 'total_amount' in result and result['total_amount'] is not None:
                amounts.append(float(result['total_amount']))
                confidences.append(result.get('total_confidence', 0.5))
        
        if not amounts:
            return {"amount": 0.0, "confidence": 0.0}
        
        # Si todos los valores están muy cerca (diferencia < 5%), usar promedio ponderado
        if self._are_amounts_similar(amounts):
            weighted_amount = np.average(amounts, weights=confidences)
            return {
                "amount": round(weighted_amount, 2),
                "confidence": np.mean(confidences),
                "consensus_type": "weighted_average"
            }
        else:
            # Resolver conflicto eligiendo el más confiable que esté en rango razonable
            best_amount = self._resolve_amount_conflict(amounts, confidences)
            return {
                "amount": best_amount["amount"],
                "confidence": best_amount["confidence"],
                "consensus_type": "conflict_resolved"
            }
    
    def _consensus_date(self, engine_results: Dict) -> Dict:
        """Generar consenso para la fecha"""
        dates = []
        confidences = []
        
        for engine_name, result in engine_results.items():
            if 'date' in result and result['date']:
                dates.append(result['date'])
                confidences.append(result.get('date_confidence', 0.5))
        
        if not dates:
            return {"date": "", "confidence": 0.0}
        
        # Normalizar fechas y encontrar consenso
        normalized_dates = [self._normalize_date(date) for date in dates]
        
        # Contar fechas más comunes
        date_counter = Counter(normalized_dates)
        most_common_date = date_counter.most_common(1)[0][0]
        
        # Calcular confianza basada en frecuencia y confianza individual
        date_confidence = self._calculate_date_confidence(normalized_dates, confidences, most_common_date)
        
        return {
            "date": most_common_date,
            "confidence": date_confidence,
            "consensus_type": "most_frequent"
        }
    
    def _consensus_line_items(self, engine_results: Dict) -> Dict:
        """Generar consenso para líneas de productos"""
        all_items = []
        
        # Recopilar todos los items de todos los engines
        for engine_name, result in engine_results.items():
            if 'line_items' in result and result['line_items']:
                for item in result['line_items']:
                    item['source_engine'] = engine_name
                    all_items.append(item)
        
        if not all_items:
            return {"items": [], "confidence": 0.0}
        
        # Agrupar items similares
        grouped_items = self._group_similar_items(all_items)
        
        # Generar consenso para cada grupo
        consensus_items = []
        for group in grouped_items:
            consensus_item = self._generate_item_consensus(group)
            if consensus_item["confidence"] > 0.3:  # Solo incluir items con confianza mínima
                consensus_items.append(consensus_item)
        
        # Calcular confianza general de line items
        overall_confidence = np.mean([item["confidence"] for item in consensus_items]) if consensus_items else 0.0
        
        return {
            "items": consensus_items,
            "confidence": overall_confidence,
            "total_items": len(consensus_items),
            "consensus_type": "grouped_similarity"
        }
    
    def _resolve_text_conflict(self, texts: List[str], confidences: List[float]) -> Dict:
        """Resolver conflicto entre textos usando similitud y confianza"""
        if len(texts) <= 1:
            return {"text": texts[0] if texts else "", "confidence": confidences[0] if confidences else 0.0}
        
        # Calcular matriz de similitud
        similarity_matrix = np.zeros((len(texts), len(texts)))
        for i, text1 in enumerate(texts):
            for j, text2 in enumerate(texts):
                similarity_matrix[i][j] = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
        
        # Encontrar el texto con mayor similitud promedio ponderada por confianza
        best_score = -1
        best_index = 0
        
        for i in range(len(texts)):
            # Score = similitud promedio * confianza propia
            avg_similarity = np.mean(similarity_matrix[i])
            weighted_score = avg_similarity * confidences[i]
            
            if weighted_score > best_score:
                best_score = weighted_score
                best_index = i
        
        return {
            "text": texts[best_index],
            "confidence": min(best_score, 1.0)
        }
    
    def _resolve_amount_conflict(self, amounts: List[float], confidences: List[float]) -> Dict:
        """Resolver conflicto entre montos"""
        if len(amounts) <= 1:
            return {"amount": amounts[0] if amounts else 0.0, "confidence": confidences[0] if confidences else 0.0}
        
        # Detectar outliers obvios (más de 10x diferencia)
        median_amount = np.median(amounts)
        filtered_amounts = []
        filtered_confidences = []
        
        for amount, confidence in zip(amounts, confidences):
            if 0.1 * median_amount <= amount <= 10 * median_amount:
                filtered_amounts.append(amount)
                filtered_confidences.append(confidence)
        
        if not filtered_amounts:
            # Si todos son outliers, usar el más confiable
            max_conf_index = np.argmax(confidences)
            return {"amount": amounts[max_conf_index], "confidence": confidences[max_conf_index]}
        
        # Usar promedio ponderado de los valores filtrados
        weighted_amount = np.average(filtered_amounts, weights=filtered_confidences)
        avg_confidence = np.mean(filtered_confidences)
        
        return {
            "amount": round(weighted_amount, 2),
            "confidence": avg_confidence
        }
    
    def _are_amounts_similar(self, amounts: List[float], tolerance: float = 0.05) -> bool:
        """Verificar si los montos son similares (dentro del 5% de diferencia)"""
        if len(amounts) <= 1:
            return True
        
        max_amount = max(amounts)
        min_amount = min(amounts)
        
        if max_amount == 0:
            return True
        
        return (max_amount - min_amount) / max_amount <= tolerance
    
    def _normalize_date(self, date_str: str) -> str:
        """Normalizar formato de fecha"""
        if not date_str:
            return ""
        
        # Patrones comunes de fecha en Chile
        date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',  # DD/MM/YYYY o DD-MM-YYYY
            r'(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})',  # YYYY/MM/DD o YYYY-MM-DD
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_str)
            if match:
                parts = match.groups()
                # Asumir formato DD/MM/YYYY para Chile
                if len(parts[2]) == 4:  # Año completo
                    return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
                else:  # Año de 2 dígitos
                    year = f"20{parts[2]}" if int(parts[2]) < 50 else f"19{parts[2]}"
                    return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{year}"
        
        return date_str
    
    def _calculate_date_confidence(self, dates: List[str], confidences: List[float], consensus_date: str) -> float:
        """Calcular confianza de la fecha consenso"""
        if not dates:
            return 0.0
        
        # Contar cuántas fechas coinciden con el consenso
        matches = sum(1 for date in dates if date == consensus_date)
        frequency_score = matches / len(dates)
        
        # Promedio de confianzas de las fechas que coinciden
        matching_confidences = [conf for date, conf in zip(dates, confidences) if date == consensus_date]
        avg_confidence = np.mean(matching_confidences) if matching_confidences else 0.0
        
        # Combinar frecuencia y confianza
        return (frequency_score * 0.6 + avg_confidence * 0.4)
    
    def _group_similar_items(self, items: List[Dict]) -> List[List[Dict]]:
        """Agrupar items similares de diferentes engines"""
        if not items:
            return []
        
        groups = []
        used_indices = set()
        
        for i, item1 in enumerate(items):
            if i in used_indices:
                continue
            
            current_group = [item1]
            used_indices.add(i)
            
            for j, item2 in enumerate(items[i+1:], i+1):
                if j in used_indices:
                    continue
                
                # Verificar similitud entre items
                if self._are_items_similar(item1, item2):
                    current_group.append(item2)
                    used_indices.add(j)
            
            groups.append(current_group)
        
        return groups
    
    def _are_items_similar(self, item1: Dict, item2: Dict, threshold: float = 0.7) -> bool:
        """Verificar si dos items son similares"""
        # Comparar nombres de productos
        name1 = item1.get('product_name', '').lower()
        name2 = item2.get('product_name', '').lower()
        
        if not name1 or not name2:
            return False
        
        name_similarity = SequenceMatcher(None, name1, name2).ratio()
        
        # Comparar precios (deben estar dentro del 20% de diferencia)
        price1 = item1.get('unit_price', 0) or item1.get('line_total', 0)
        price2 = item2.get('unit_price', 0) or item2.get('line_total', 0)
        
        price_similarity = 1.0
        if price1 > 0 and price2 > 0:
            price_diff = abs(price1 - price2) / max(price1, price2)
            price_similarity = max(0.0, 1.0 - price_diff * 5)  # Penalizar diferencias grandes
        
        # Combinar similitudes
        overall_similarity = (name_similarity * 0.7 + price_similarity * 0.3)
        
        return overall_similarity >= threshold
    
    def _generate_item_consensus(self, item_group: List[Dict]) -> Dict:
        """Generar consenso para un grupo de items similares"""
        if not item_group:
            return {"confidence": 0.0}
        
        if len(item_group) == 1:
            item = item_group[0].copy()
            item["confidence"] = item.get("confidence", 0.5)
            item["consensus_type"] = "single_source"
            return item
        
        # Generar consenso para cada campo
        consensus_item = {
            "product_name": self._consensus_item_field(item_group, "product_name"),
            "quantity": self._consensus_item_quantity(item_group),
            "unit_price": self._consensus_item_price(item_group, "unit_price"),
            "line_total": self._consensus_item_price(item_group, "line_total"),
            "confidence": 0.0,
            "consensus_type": "multi_engine",
            "source_engines": [item.get("source_engine", "unknown") for item in item_group]
        }
        
        # Calcular confianza general del item
        field_confidences = []
        for field in ["product_name", "quantity", "unit_price", "line_total"]:
            if isinstance(consensus_item[field], dict) and "confidence" in consensus_item[field]:
                field_confidences.append(consensus_item[field]["confidence"])
        
        consensus_item["confidence"] = np.mean(field_confidences) if field_confidences else 0.5
        
        return consensus_item
    
    def _consensus_item_field(self, items: List[Dict], field_name: str) -> Dict:
        """Generar consenso para un campo específico de item"""
        values = []
        confidences = []
        
        for item in items:
            if field_name in item and item[field_name]:
                values.append(str(item[field_name]))
                confidences.append(item.get(f"{field_name}_confidence", 0.5))
        
        if not values:
            return {"value": "", "confidence": 0.0}
        
        # Usar el algoritmo de resolución de conflictos de texto
        result = self._resolve_text_conflict(values, confidences)
        return {
            "value": result["text"],
            "confidence": result["confidence"]
        }
    
    def _consensus_item_quantity(self, items: List[Dict]) -> Dict:
        """Generar consenso para cantidad de item"""
        quantities = []
        confidences = []
        
        for item in items:
            if "quantity" in item and item["quantity"] is not None:
                try:
                    quantities.append(float(item["quantity"]))
                    confidences.append(item.get("quantity_confidence", 0.5))
                except (ValueError, TypeError):
                    pass
        
        if not quantities:
            return {"value": 1.0, "confidence": 0.3}  # Default quantity
        
        # Usar resolución de conflictos de montos
        result = self._resolve_amount_conflict(quantities, confidences)
        return {
            "value": result["amount"],
            "confidence": result["confidence"]
        }
    
    def _consensus_item_price(self, items: List[Dict], price_field: str) -> Dict:
        """Generar consenso para precio de item"""
        prices = []
        confidences = []
        
        for item in items:
            if price_field in item and item[price_field] is not None:
                try:
                    prices.append(float(item[price_field]))
                    confidences.append(item.get(f"{price_field}_confidence", 0.5))
                except (ValueError, TypeError):
                    pass
        
        if not prices:
            return {"value": 0.0, "confidence": 0.0}
        
        # Usar resolución de conflictos de montos
        result = self._resolve_amount_conflict(prices, confidences)
        return {
            "value": result["amount"],
            "confidence": result["confidence"]
        }
    
    def _calculate_consensus_confidence(self, engine_results: Dict, consensus_result: Dict) -> float:
        """Calcular confianza general del consenso"""
        confidence_factors = []
        
        # Factor 1: Confianza del vendor
        if "vendor" in consensus_result and "confidence" in consensus_result["vendor"]:
            confidence_factors.append(consensus_result["vendor"]["confidence"])
        
        # Factor 2: Confianza del total
        if "total_amount" in consensus_result and "confidence" in consensus_result["total_amount"]:
            confidence_factors.append(consensus_result["total_amount"]["confidence"])
        
        # Factor 3: Confianza de la fecha
        if "date" in consensus_result and "confidence" in consensus_result["date"]:
            confidence_factors.append(consensus_result["date"]["confidence"])
        
        # Factor 4: Confianza promedio de line items
        if "line_items" in consensus_result and "confidence" in consensus_result["line_items"]:
            confidence_factors.append(consensus_result["line_items"]["confidence"])
        
        # Factor 5: Número de engines que coinciden
        engine_agreement = len(engine_results) / 3.0  # Normalizado para 3 engines máximo
        confidence_factors.append(engine_agreement)
        
        return np.mean(confidence_factors) if confidence_factors else 0.5
    
    def _apply_post_consensus_corrections(self, consensus_result: Dict) -> Dict:
        """Aplicar correcciones automáticas después del consenso"""
        corrections_applied = []
        
        # Corrección 1: Validar que line_total = quantity * unit_price
        if "line_items" in consensus_result and consensus_result["line_items"]["items"]:
            for item in consensus_result["line_items"]["items"]:
                if self._validate_and_correct_line_total(item):
                    corrections_applied.append("line_total_calculation")
        
        # Corrección 2: Validar que suma de line_totals ≈ total_amount
        if self._validate_and_correct_total_amount(consensus_result):
            corrections_applied.append("total_amount_reconciliation")
        
        # Corrección 3: Normalizar formato de fecha
        if self._normalize_consensus_date(consensus_result):
            corrections_applied.append("date_normalization")
        
        consensus_result["metadata"]["auto_corrections_applied"] = corrections_applied
        
        return consensus_result
    
    def _validate_and_correct_line_total(self, item: Dict) -> bool:
        """Validar y corregir line_total de un item"""
        try:
            quantity = float(item.get("quantity", {}).get("value", 1))
            unit_price = float(item.get("unit_price", {}).get("value", 0))
            line_total = float(item.get("line_total", {}).get("value", 0))
            
            calculated_total = quantity * unit_price
            
            # Si hay discrepancia significativa (>5%), corregir
            if abs(calculated_total - line_total) > max(calculated_total * 0.05, 10):
                item["line_total"]["value"] = round(calculated_total, 2)
                item["line_total"]["auto_corrected"] = True
                return True
        except (ValueError, TypeError, KeyError):
            pass
        
        return False
    
    def _validate_and_correct_total_amount(self, consensus_result: Dict) -> bool:
        """Validar y corregir total_amount contra suma de line_items"""
        try:
            if "line_items" not in consensus_result or not consensus_result["line_items"]["items"]:
                return False
            
            calculated_total = 0
            for item in consensus_result["line_items"]["items"]:
                line_total = float(item.get("line_total", {}).get("value", 0))
                calculated_total += line_total
            
            current_total = float(consensus_result.get("total_amount", {}).get("amount", 0))
            
            # Si hay discrepancia significativa, usar el calculado
            if abs(calculated_total - current_total) > max(current_total * 0.1, 50):
                consensus_result["total_amount"]["amount"] = round(calculated_total, 2)
                consensus_result["total_amount"]["auto_corrected"] = True
                return True
        except (ValueError, TypeError, KeyError):
            pass
        
        return False
    
    def _normalize_consensus_date(self, consensus_result: Dict) -> bool:
        """Normalizar formato de fecha del consenso"""
        try:
            if "date" in consensus_result and "date" in consensus_result["date"]:
                original_date = consensus_result["date"]["date"]
                normalized_date = self._normalize_date(original_date)
                
                if normalized_date != original_date:
                    consensus_result["date"]["date"] = normalized_date
                    consensus_result["date"]["auto_corrected"] = True
                    return True
        except (KeyError, TypeError):
            pass
        
        return False
    
    def _learn_from_consensus(self, engine_results: Dict, consensus_result: Dict):
        """Aprender de este consenso para mejorar futuros procesamientos"""
        try:
            # Guardar patrones exitosos
            if consensus_result["metadata"]["consensus_confidence"] > 0.8:
                pattern_key = f"high_confidence_{len(engine_results)}_engines"
                if pattern_key not in self.learning_data["successful_patterns"]:
                    self.learning_data["successful_patterns"][pattern_key] = []
                
                self.learning_data["successful_patterns"][pattern_key].append({
                    "timestamp": datetime.now().isoformat(),
                    "confidence": consensus_result["metadata"]["consensus_confidence"],
                    "corrections_applied": consensus_result["metadata"]["auto_corrections_applied"]
                })
            
            # Guardar patrones de error para evitar en el futuro
            if consensus_result["metadata"]["consensus_confidence"] < 0.5:
                error_pattern = {
                    "timestamp": datetime.now().isoformat(),
                    "low_confidence_factors": self._identify_low_confidence_factors(consensus_result),
                    "engine_disagreements": self._identify_engine_disagreements(engine_results)
                }
                
                if "low_confidence" not in self.learning_data["error_patterns"]:
                    self.learning_data["error_patterns"]["low_confidence"] = []
                
                self.learning_data["error_patterns"]["low_confidence"].append(error_pattern)
            
            # Guardar datos cada 10 consensos para no sobrecargar I/O
            if len(self.learning_data.get("successful_patterns", {}).get("high_confidence_3_engines", [])) % 10 == 0:
                self._save_learning_data()
        
        except Exception as e:
            logger.warning(f"Error al aprender del consenso: {e}")
    
    def _identify_low_confidence_factors(self, consensus_result: Dict) -> List[str]:
        """Identificar factores que causaron baja confianza"""
        factors = []
        
        if consensus_result.get("vendor", {}).get("confidence", 1.0) < 0.5:
            factors.append("low_vendor_confidence")
        
        if consensus_result.get("total_amount", {}).get("confidence", 1.0) < 0.5:
            factors.append("low_total_confidence")
        
        if consensus_result.get("line_items", {}).get("confidence", 1.0) < 0.5:
            factors.append("low_line_items_confidence")
        
        return factors
    
    def _identify_engine_disagreements(self, engine_results: Dict) -> List[str]:
        """Identificar desacuerdos entre engines"""
        disagreements = []
        
        # Verificar desacuerdos en vendor
        vendors = [result.get("vendor", "") for result in engine_results.values()]
        if len(set(vendors)) > 1:
            disagreements.append("vendor_disagreement")
        
        # Verificar desacuerdos en total_amount
        amounts = [result.get("total_amount", 0) for result in engine_results.values()]
        if not self._are_amounts_similar(amounts, tolerance=0.1):
            disagreements.append("total_amount_disagreement")
        
        return disagreements

# Instancia global
consensus_engine = ConsensusEngine()
