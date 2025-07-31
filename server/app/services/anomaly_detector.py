"""
Detector de Anomalías para Gastify Chile.
Detecta patrones sospechosos y gastos anómalos específicos del mercado chileno.
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from scipy import stats

from app.models.analytics import (
    AnomalyModel, AnomalyType, AnomalySeverity, ChileAnomalyContext,
    ChileTimePattern, ChileEconomicIndicator
)

logger = logging.getLogger(__name__)


class ExpenseAnomalyDetector:
    """
    Detector de anomalías en gastos específico para el mercado chileno.
    Utiliza algoritmos estadísticos y reglas específicas de Chile.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Umbrales para detección de anomalías
        self.z_score_threshold = 2.5  # Z-Score para valores atípicos
        self.iqr_multiplier = 1.5     # Multiplicador para IQR
        self.duplicate_time_window = 24  # Horas para detectar duplicados
        
        # Horarios comerciales típicos en Chile
        self.commercial_hours = {
            'start': 10,  # 10:00 AM
            'end': 20     # 8:00 PM
        }
        
        # Montos típicos por categoría en Chile (CLP)
        self.typical_amounts = {
            "Supermercado": {"min": 5000, "max": 100000, "avg": 25000},
            "Combustible": {"min": 10000, "max": 80000, "avg": 35000},
            "Transporte": {"min": 1000, "max": 15000, "avg": 5000},
            "Farmacia": {"min": 2000, "max": 50000, "avg": 15000},
            "Retail": {"min": 10000, "max": 500000, "avg": 75000},
            "Comida": {"min": 3000, "max": 50000, "avg": 18000},
            "Salud": {"min": 15000, "max": 200000, "avg": 60000},
            "Educación": {"min": 20000, "max": 300000, "avg": 80000},
            "Entretenimiento": {"min": 5000, "max": 100000, "avg": 25000},
            "Servicios": {"min": 10000, "max": 150000, "avg": 40000}
        }

    async def detect_all_anomalies(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Detecta todas las anomalías para un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de anomalías detectadas
        """
        anomalies = []
        
        try:
            # Detectar duplicados
            duplicates = await self.detect_duplicate_receipts(user_id)
            anomalies.extend(duplicates)
            
            # Detectar montos inusuales
            unusual_amounts = await self.detect_unusual_amounts(user_id)
            anomalies.extend(unusual_amounts)
            
            # Detectar patrones sospechosos
            suspicious_patterns = await self.detect_suspicious_patterns(user_id)
            anomalies.extend(suspicious_patterns)
            
            # Detectar horarios inusuales
            unusual_times = await self.detect_unusual_times(user_id)
            anomalies.extend(unusual_times)
            
            logger.info(f"Detectadas {len(anomalies)} anomalías para usuario {user_id}")
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detectando anomalías para usuario {user_id}: {str(e)}")
            return []

    async def detect_duplicate_receipts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Detecta recibos duplicados específicos para Chile.
        Considera RUT, monto, fecha y hora.
        """
        anomalies = []
        
        try:
            # Pipeline para encontrar posibles duplicados
            pipeline = [
                {"$match": {"user": ObjectId(user_id)}},
                {"$lookup": {
                    "from": "categories",
                    "localField": "_id",
                    "foreignField": "receipt_id",
                    "as": "category_info"
                }},
                {"$sort": {"date": -1}},
                {"$limit": 1000}  # Últimos 1000 recibos
            ]
            
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            
            # Agrupar por criterios de duplicación
            for i, receipt1 in enumerate(receipts):
                for receipt2 in receipts[i+1:]:
                    # Verificar si están dentro de la ventana de tiempo
                    time_diff = abs((receipt1['date'] - receipt2['date']).total_seconds() / 3600)
                    
                    if time_diff <= self.duplicate_time_window:
                        similarity_score = self._calculate_similarity(receipt1, receipt2)
                        
                        if similarity_score > 0.8:  # 80% de similitud
                            severity = AnomalySeverity.HIGH if similarity_score > 0.95 else AnomalySeverity.MEDIUM
                            
                            # Extraer RUT si está disponible
                            rut_emisor = self._extract_rut_from_receipt(receipt1)
                            
                            chile_context = ChileAnomalyContext(
                                rut_emisor=rut_emisor,
                                compared_to_retail_average=False
                            )
                            
                            anomaly = {
                                "receipt_id": str(receipt1['_id']),
                                "type": AnomalyType.DUPLICATE_RECEIPT,
                                "severity": severity,
                                "amount": receipt1['totalAmount'],
                                "description": f"Posible recibo duplicado (similitud: {similarity_score:.0%})",
                                "chile_context": chile_context.dict(),
                                "related_receipt_id": str(receipt2['_id'])
                            }
                            anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detectando duplicados: {str(e)}")
            return []

    async def detect_unusual_amounts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Detecta montos inusuales comparando con el histórico personal y promedios chilenos.
        """
        anomalies = []
        
        try:
            # Obtener datos históricos por categoría
            pipeline = [
                {"$match": {"user": ObjectId(user_id)}},
                {"$lookup": {
                    "from": "categories",
                    "localField": "_id",
                    "foreignField": "receipt_id",
                    "as": "category_info"
                }},
                {"$unwind": {"path": "$category_info", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"date": -1}},
                {"$limit": 500}  # Últimos 500 recibos
            ]
            
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            
            # Agrupar por categoría
            category_amounts = {}
            for receipt in receipts:
                category = receipt.get('category_info', {}).get('category', 'Sin categoría')
                if category not in category_amounts:
                    category_amounts[category] = []
                category_amounts[category].append(receipt['totalAmount'])
            
            # Analizar cada categoría
            for category, amounts in category_amounts.items():
                if len(amounts) < 5:  # Necesitamos al menos 5 datos
                    continue
                
                amounts_array = np.array(amounts)
                
                # Método 1: Z-Score
                z_scores = np.abs(stats.zscore(amounts_array))
                z_outliers = amounts_array[z_scores > self.z_score_threshold]
                
                # Método 2: IQR
                q1, q3 = np.percentile(amounts_array, [25, 75])
                iqr = q3 - q1
                lower_bound = q1 - (self.iqr_multiplier * iqr)
                upper_bound = q3 + (self.iqr_multiplier * iqr)
                iqr_outliers = amounts_array[(amounts_array < lower_bound) | (amounts_array > upper_bound)]
                
                # Combinar outliers
                all_outliers = np.unique(np.concatenate([z_outliers, iqr_outliers]))
                
                for outlier_amount in all_outliers:
                    # Encontrar el recibo correspondiente
                    matching_receipts = [r for r in receipts 
                                       if r['totalAmount'] == outlier_amount 
                                       and r.get('category_info', {}).get('category') == category]
                    
                    if matching_receipts:
                        receipt = matching_receipts[0]
                        expected_amount = np.median(amounts_array)
                        deviation = abs(outlier_amount - expected_amount) / expected_amount * 100
                        
                        # Determinar severidad
                        if deviation > 200:
                            severity = AnomalySeverity.HIGH
                        elif deviation > 100:
                            severity = AnomalySeverity.MEDIUM
                        else:
                            severity = AnomalySeverity.LOW
                        
                        # Contexto chileno
                        chile_context = ChileAnomalyContext(
                            rut_emisor=self._extract_rut_from_receipt(receipt),
                            compared_to_retail_average=category in self.typical_amounts
                        )
                        
                        # Comparar con promedios chilenos
                        chile_comparison = ""
                        if category in self.typical_amounts:
                            chile_avg = self.typical_amounts[category]["avg"]
                            if outlier_amount > chile_avg * 2:
                                chile_comparison = f" (muy alto vs promedio Chile: ${chile_avg:,.0f})"
                        
                        anomaly = {
                            "receipt_id": str(receipt['_id']),
                            "type": AnomalyType.UNUSUAL_AMOUNT,
                            "severity": severity,
                            "amount": outlier_amount,
                            "expected_amount": expected_amount,
                            "deviation_percentage": deviation,
                            "description": f"Gasto en {category} {deviation:.0f}% {'más alto' if outlier_amount > expected_amount else 'más bajo'} que promedio{chile_comparison}",
                            "chile_context": chile_context.dict()
                        }
                        anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detectando montos inusuales: {str(e)}")
            return []

    async def detect_suspicious_patterns(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Detecta patrones sospechosos específicos para Chile.
        """
        anomalies = []
        
        try:
            # Obtener recibos recientes
            recent_date = datetime.now() - timedelta(days=30)
            pipeline = [
                {"$match": {
                    "user": ObjectId(user_id),
                    "date": {"$gte": recent_date}
                }},
                {"$sort": {"date": -1}}
            ]
            
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            
            # Patrón 1: Múltiples gastos el mismo día
            daily_expenses = {}
            for receipt in receipts:
                date_key = receipt['date'].date()
                if date_key not in daily_expenses:
                    daily_expenses[date_key] = []
                daily_expenses[date_key].append(receipt)
            
            for date, day_receipts in daily_expenses.items():
                if len(day_receipts) > 5:  # Más de 5 gastos en un día
                    total_amount = sum(r['totalAmount'] for r in day_receipts)
                    
                    # Verificar si es un patrón inusual
                    if total_amount > 200000:  # Más de $200,000 en un día
                        severity = AnomalySeverity.MEDIUM
                        
                        anomaly = {
                            "type": AnomalyType.SUSPICIOUS_PATTERN,
                            "severity": severity,
                            "amount": total_amount,
                            "description": f"{len(day_receipts)} gastos en un día por ${total_amount:,.0f}",
                            "chile_context": {
                                "pattern_type": "multiple_daily_expenses",
                                "receipts_count": len(day_receipts),
                                "date": date.isoformat()
                            }
                        }
                        anomalies.append(anomaly)
            
            # Patrón 2: Gastos en horarios inusuales
            for receipt in receipts:
                receipt_hour = receipt['date'].hour
                
                # Gastos muy temprano o muy tarde
                if receipt_hour < 6 or receipt_hour > 23:
                    if receipt['totalAmount'] > 50000:  # Solo para montos significativos
                        time_pattern = ChileTimePattern(
                            horario_comercial=False,
                            fin_de_semana=receipt['date'].weekday() >= 5
                        )
                        
                        chile_context = ChileAnomalyContext(
                            time_pattern=time_pattern,
                            rut_emisor=self._extract_rut_from_receipt(receipt)
                        )
                        
                        anomaly = {
                            "receipt_id": str(receipt['_id']),
                            "type": AnomalyType.UNUSUAL_TIME,
                            "severity": AnomalySeverity.MEDIUM,
                            "amount": receipt['totalAmount'],
                            "description": f"Gasto de ${receipt['totalAmount']:,.0f} a las {receipt_hour:02d}:00 hrs",
                            "chile_context": chile_context.dict()
                        }
                        anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detectando patrones sospechosos: {str(e)}")
            return []

    async def detect_unusual_times(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Detecta gastos en horarios inusuales para el contexto chileno.
        """
        anomalies = []
        
        try:
            # Obtener recibos de los últimos 60 días
            recent_date = datetime.now() - timedelta(days=60)
            pipeline = [
                {"$match": {
                    "user": ObjectId(user_id),
                    "date": {"$gte": recent_date}
                }},
                {"$sort": {"date": -1}}
            ]
            
            receipts = await self.db.receipts.aggregate(pipeline).to_list(None)
            
            # Analizar patrones horarios del usuario
            user_hours = [r['date'].hour for r in receipts]
            if len(user_hours) < 10:  # No hay suficientes datos
                return anomalies
            
            # Calcular horarios típicos del usuario
            hour_counts = {}
            for hour in user_hours:
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            
            # Encontrar horarios atípicos
            for receipt in receipts[-30:]:  # Últimos 30 recibos
                receipt_hour = receipt['date'].hour
                receipt_weekday = receipt['date'].weekday()
                
                # Verificar si es horario comercial
                is_commercial_hour = (
                    self.commercial_hours['start'] <= receipt_hour <= self.commercial_hours['end']
                )
                
                # Verificar si es fin de semana
                is_weekend = receipt_weekday >= 5
                
                # Detectar anomalías temporales
                is_anomaly = False
                anomaly_reason = ""
                
                if not is_commercial_hour and receipt['totalAmount'] > 30000:
                    is_anomaly = True
                    anomaly_reason = "Gasto significativo fuera de horario comercial"
                
                elif receipt_hour < 6 and receipt['totalAmount'] > 10000:
                    is_anomaly = True
                    anomaly_reason = "Gasto en madrugada"
                
                elif is_weekend and receipt_hour < 8 and receipt['totalAmount'] > 20000:
                    is_anomaly = True
                    anomaly_reason = "Gasto temprano en fin de semana"
                
                if is_anomaly:
                    time_pattern = ChileTimePattern(
                        fin_de_semana=is_weekend,
                        horario_comercial=is_commercial_hour
                    )
                    
                    chile_context = ChileAnomalyContext(
                        time_pattern=time_pattern,
                        rut_emisor=self._extract_rut_from_receipt(receipt)
                    )
                    
                    severity = AnomalySeverity.MEDIUM if receipt['totalAmount'] > 50000 else AnomalySeverity.LOW
                    
                    anomaly = {
                        "receipt_id": str(receipt['_id']),
                        "type": AnomalyType.UNUSUAL_TIME,
                        "severity": severity,
                        "amount": receipt['totalAmount'],
                        "description": f"{anomaly_reason}: ${receipt['totalAmount']:,.0f} a las {receipt_hour:02d}:00",
                        "chile_context": chile_context.dict()
                    }
                    anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detectando horarios inusuales: {str(e)}")
            return []

    def _calculate_similarity(self, receipt1: Dict, receipt2: Dict) -> float:
        """
        Calcula la similitud entre dos recibos.
        
        Returns:
            Valor entre 0 y 1 indicando similitud
        """
        similarity_score = 0.0
        
        # Comparar montos (peso: 40%)
        amount_diff = abs(receipt1['totalAmount'] - receipt2['totalAmount'])
        max_amount = max(receipt1['totalAmount'], receipt2['totalAmount'])
        if max_amount > 0:
            amount_similarity = 1 - (amount_diff / max_amount)
            similarity_score += amount_similarity * 0.4
        
        # Comparar empresa (peso: 30%)
        company1 = receipt1.get('companyName', '').lower()
        company2 = receipt2.get('companyName', '').lower()
        if company1 and company2:
            if company1 == company2:
                similarity_score += 0.3
            elif company1 in company2 or company2 in company1:
                similarity_score += 0.15
        
        # Comparar descripción (peso: 20%)
        desc1 = receipt1.get('description', '').lower()
        desc2 = receipt2.get('description', '').lower()
        if desc1 and desc2:
            if desc1 == desc2:
                similarity_score += 0.2
            elif desc1 in desc2 or desc2 in desc1:
                similarity_score += 0.1
        
        # Comparar tiempo (peso: 10%)
        time_diff = abs((receipt1['date'] - receipt2['date']).total_seconds() / 3600)
        if time_diff <= 1:  # Dentro de 1 hora
            similarity_score += 0.1
        elif time_diff <= 6:  # Dentro de 6 horas
            similarity_score += 0.05
        
        return min(1.0, similarity_score)

    def _extract_rut_from_receipt(self, receipt: Dict) -> Optional[str]:
        """
        Extrae el RUT del recibo si está disponible en los datos OCR.
        """
        try:
            ocr_data = receipt.get('ocrData', {})
            if ocr_data and 'rawText' in ocr_data:
                raw_text = ocr_data['rawText']
                
                # Buscar patrón de RUT chileno
                import re
                rut_pattern = r'\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b'
                match = re.search(rut_pattern, raw_text)
                
                if match:
                    return match.group(0)
            
            return None
            
        except Exception:
            return None

    async def calculate_risk_score(self, anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula un score de riesgo general basado en las anomalías detectadas.
        
        Returns:
            Dict con score de riesgo y detalles
        """
        if not anomalies:
            return {"risk_score": 0, "risk_level": "low", "total_anomalies": 0}
        
        # Pesos por tipo de anomalía
        severity_weights = {
            AnomalySeverity.LOW: 1,
            AnomalySeverity.MEDIUM: 3,
            AnomalySeverity.HIGH: 5,
            AnomalySeverity.CRITICAL: 10
        }
        
        type_weights = {
            AnomalyType.DUPLICATE_RECEIPT: 2,
            AnomalyType.UNUSUAL_AMOUNT: 1.5,
            AnomalyType.SUSPICIOUS_PATTERN: 2.5,
            AnomalyType.UNUSUAL_TIME: 1,
            AnomalyType.UNUSUAL_FREQUENCY: 1.5,
            AnomalyType.CATEGORY_SHIFT: 1
        }
        
        total_score = 0
        type_counts = {}
        
        for anomaly in anomalies:
            severity = anomaly.get('severity', AnomalySeverity.LOW)
            anomaly_type = anomaly.get('type', AnomalyType.UNUSUAL_AMOUNT)
            
            score = severity_weights.get(severity, 1) * type_weights.get(anomaly_type, 1)
            total_score += score
            
            type_counts[anomaly_type] = type_counts.get(anomaly_type, 0) + 1
        
        # Normalizar score (0-100)
        max_possible_score = len(anomalies) * 10 * 2.5  # Máximo teórico
        normalized_score = min(100, (total_score / max_possible_score * 100)) if max_possible_score > 0 else 0
        
        # Determinar nivel de riesgo
        if normalized_score >= 70:
            risk_level = "high"
        elif normalized_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_score": round(normalized_score, 1),
            "risk_level": risk_level,
            "total_anomalies": len(anomalies),
            "anomaly_types": type_counts,
            "recommendations": self._generate_risk_recommendations(risk_level, type_counts)
        }

    def _generate_risk_recommendations(self, risk_level: str, type_counts: Dict) -> List[str]:
        """Genera recomendaciones basadas en el nivel de riesgo."""
        recommendations = []
        
        if risk_level == "high":
            recommendations.append("Revisa inmediatamente los gastos marcados como anómalos")
            recommendations.append("Considera cambiar contraseñas si hay gastos no reconocidos")
        
        if AnomalyType.DUPLICATE_RECEIPT in type_counts:
            recommendations.append("Verifica si hay recibos duplicados accidentalmente")
        
        if AnomalyType.UNUSUAL_AMOUNT in type_counts:
            recommendations.append("Revisa gastos con montos inusuales para tu patrón habitual")
        
        if AnomalyType.SUSPICIOUS_PATTERN in type_counts:
            recommendations.append("Analiza días con múltiples gastos concentrados")
        
        return recommendations
