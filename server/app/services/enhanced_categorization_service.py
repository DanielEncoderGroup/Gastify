import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
import os
import pickle
from datetime import datetime, timedelta
import joblib
from dataclasses import dataclass
from enum import Enum
import json
from collections import defaultdict, Counter
import unicodedata

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Region(str, Enum):
    """Regiones soportadas por el sistema de categorización"""
    CHILE = "chile"
    COLOMBIA = "colombia"
    PERU = "peru"
    MEXICO = "mexico"
    ARGENTINA = "argentina"

@dataclass
class CategoryPredictionAdvanced:
    """Resultado avanzado de predicción de categoría"""
    category: str
    confidence: float
    method: str
    region_specific_data: Dict[str, Any]
    all_probabilities: Dict[str, float]
    features_used: List[str]
    model_version: str
    prediction_timestamp: datetime

class EnhancedCategorizationService:
    """
    Servicio de categorización avanzado con:
    - Soporte para múltiples regiones
    - NLP avanzado con múltiples algoritmos
    - Aprendizaje continuo basado en feedback
    - Análisis de texto mejorado
    """
    
    def __init__(self, region: Region = Region.CHILE, model_path: str = None):
        """
        Inicializa el servicio de categorización avanzado.
        
        Args:
            region: Región para la cual configurar el categorizador
            model_path: Ruta al modelo pre-entrenado (opcional)
        """
        self.region = region
        self.model_version = "2.0.0"
        self.model = None
        self.label_encoder = LabelEncoder()
        self.feedback_buffer = []
        self.last_retrain = datetime.utcnow()
        
        # Configurar rutas
        self.model_path = model_path or self._get_model_path()
        self.feedback_path = self._get_feedback_path()
        
        # Inicializar base de conocimiento por región
        self._initialize_region_knowledge()
        
        # Cargar o crear modelo
        self._load_or_create_enhanced_model()
        
        # Cargar feedback pendiente
        self._load_feedback_buffer()
        
    def _get_model_path(self) -> str:
        """Obtiene la ruta del modelo para la región específica"""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base_dir, "models", f"enhanced_categorizer_{self.region.value}_v{self.model_version}.pkl")
    
    def _get_feedback_path(self) -> str:
        """Obtiene la ruta del archivo de feedback"""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base_dir, "models", f"feedback_buffer_{self.region.value}.json")
    
    def _initialize_region_knowledge(self):
        """Inicializa la base de conocimiento específica por región"""
        
        # Configuración base para Chile (expandida)
        chile_config = {
            "categories": [
                "Supermercado", "Combustible", "Transporte", "Retail", 
                "Restaurante", "Farmacia", "Servicios", "Salud", 
                "Envíos", "Educación", "Tecnología", "Entretenimiento", "Otros"
            ],
            "brands": {
                "Supermercado": [
                    "lider", "jumbo", "santa isabel", "unimarc", "tottus", 
                    "acuenta", "mayorista 10", "alvi", "ekono", "ok market",
                    "cugat", "ketal", "montserrat", "full fresh", "express de lider"
                ],
                "Combustible": [
                    "copec", "shell", "esso", "petrobras", "terpel", 
                    "mobil", "enex", "gasco", "lipigas", "abastible"
                ],
                "Retail": [
                    "falabella", "ripley", "paris", "hites", "la polar", 
                    "corona", "abcdin", "easy", "sodimac", "homecenter",
                    "construmart", "imperial", "mta", "zara", "h&m"
                ],
                "Farmacia": [
                    "cruz verde", "salcobrand", "ahumada", "farmacias del dr simi",
                    "farmacia popular", "farmacias knop", "farmacia mapuche"
                ],
                "Restaurante": [
                    "mcdonalds", "burger king", "kfc", "subway", "dominos",
                    "papa johns", "telepizza", "starbucks", "juan maestro"
                ],
                "Transporte": [
                    "uber", "cabify", "didi", "beat", "transantiago", "metro",
                    "tur bus", "pullman", "condor bus", "buses jac"
                ]
            },
            "tax_patterns": [
                r"iva\s*19%", r"impuesto\s*valor\s*agregado", 
                r"rut\s*[\d\.-]+", r"boleta\s*electr[óo]nica"
            ],
            "currency_patterns": [
                r"\$\s*[\d\.,]+", r"pesos", r"clp"
            ]
        }
        
        # Configuraciones para otras regiones
        colombia_config = {
            "categories": [
                "Supermercado", "Combustible", "Transporte", "Retail",
                "Restaurante", "Farmacia", "Servicios", "Salud", "Otros"
            ],
            "brands": {
                "Supermercado": ["exito", "carulla", "olimpica", "jumbo"],
                "Combustible": ["ecopetrol", "terpel", "mobil", "shell"],
                "Retail": ["falabella", "éxito", "alkosto", "ktronix"]
            },
            "tax_patterns": [r"iva\s*19%", r"nit\s*[\d\.-]+"],
            "currency_patterns": [r"\$\s*[\d\.,]+", r"cop", r"pesos"]
        }
        
        # Mapeo de configuraciones por región
        region_configs = {
            Region.CHILE: chile_config,
            Region.COLOMBIA: colombia_config,
            # Agregar más regiones según necesidad
        }
        
        # Configurar para la región actual
        self.config = region_configs.get(self.region, chile_config)
        self.categories = self.config["categories"]
        self.brands = self.config["brands"]
        self.tax_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.config["tax_patterns"]]
        self.currency_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.config["currency_patterns"]]
        
    def _preprocess_text_advanced(self, text: str) -> str:
        """
        Preprocesamiento avanzado de texto con normalización Unicode,
        limpieza de caracteres especiales y tokenización mejorada.
        """
        if not text:
            return ""
        
        # Normalización Unicode
        text = unicodedata.normalize('NFKD', text)
        
        # Convertir a minúsculas
        text = text.lower()
        
        # Remover caracteres especiales pero preservar espacios y puntuación importante
        text = re.sub(r'[^\w\s\.\,\-\$\%]', ' ', text)
        
        # Normalizar espacios múltiples
        text = re.sub(r'\s+', ' ', text)
        
        # Remover espacios al inicio y final
        text = text.strip()
        
        return text
    
    def _extract_advanced_features(self, text: str) -> Dict[str, Any]:
        """
        Extrae características avanzadas del texto para mejorar la clasificación.
        """
        features = {
            "text_length": len(text),
            "word_count": len(text.split()),
            "has_rut": bool(re.search(r'\d{1,2}\.\d{3}\.\d{3}[-\.][\dk]', text, re.IGNORECASE)),
            "has_tax": any(pattern.search(text) for pattern in self.tax_patterns),
            "has_currency": any(pattern.search(text) for pattern in self.currency_patterns),
            "brand_matches": [],
            "category_keywords": defaultdict(int)
        }
        
        # Detectar marcas por categoría (mejorado)
        for category, brand_list in self.brands.items():
            for brand in brand_list:
                # Búsqueda más flexible de marcas
                brand_variations = [
                    brand,
                    brand.replace(" ", ""),  # Sin espacios
                    brand.replace("-", " "),  # Guiones como espacios
                    brand.upper(),
                    brand.lower()
                ]
                
                for variation in brand_variations:
                    if variation in text:
                        features["brand_matches"].append((category, brand))
                        features["category_keywords"][category] += 2  # Mayor peso para marcas
                        break  # Evitar duplicados
        
        # Palabras clave específicas por categoría
        category_keywords = {
            "Supermercado": ["verduras", "frutas", "lacteos", "abarrotes", "carnes", "pescados"],
            "Combustible": ["gasolina", "diesel", "bencina", "combustible", "litros"],
            "Farmacia": ["medicamentos", "remedios", "pastillas", "jarabe", "vitaminas"],
            "Restaurante": ["comida", "almuerzo", "cena", "bebida", "menu", "plato"],
            "Transporte": ["viaje", "pasaje", "taxi", "bus", "metro", "peaje"]
        }
        
        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    features["category_keywords"][category] += 1
        
        return features
    
    def _create_enhanced_model(self) -> VotingClassifier:
        """
        Crea un modelo ensemble avanzado combinando múltiples algoritmos.
        """
        # Vectorizador TF-IDF mejorado
        vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),  # Unigrams, bigrams y trigrams
            stop_words=None,  # Mantenemos stop words para contexto
            min_df=2,
            max_df=0.95,
            sublinear_tf=True
        )
        
        # Modelos individuales
        logistic_model = Pipeline([
            ('tfidf', vectorizer),
            ('classifier', LogisticRegression(
                random_state=42, 
                max_iter=1000,
                class_weight='balanced'
            ))
        ])
        
        random_forest_model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=3000, ngram_range=(1, 2))),
            ('classifier', RandomForestClassifier(
                n_estimators=100,
                random_state=42,
                class_weight='balanced'
            ))
        ])
        
        naive_bayes_model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=3000, ngram_range=(1, 2))),
            ('classifier', MultinomialNB(alpha=0.1))
        ])
        
        # Ensemble con votación
        ensemble_model = VotingClassifier(
            estimators=[
                ('logistic', logistic_model),
                ('random_forest', random_forest_model),
                ('naive_bayes', naive_bayes_model)
            ],
            voting='soft'  # Usa probabilidades para mejor calibración
        )
        
        return ensemble_model
    
    def _generate_synthetic_training_data(self) -> Tuple[List[str], List[str]]:
        """
        Genera datos de entrenamiento sintéticos mejorados para la región específica.
        """
        training_texts = []
        training_labels = []
        
        # Plantillas más realistas por categoría
        templates = {
            "Supermercado": [
                "{brand} {location}\nTotal: ${amount}\nVerduras, lácteos, abarrotes\nFecha: {date}\nIVA: 19%",
                "{brand}\nCompra semanal\nFrutas y verduras frescas\nTotal: ${amount}\nBoleta electrónica",
                "Supermercado {brand}\nPan, leche, huevos\nDescuento: 10%\nTotal: ${amount}"
            ],
            "Combustible": [
                "{brand} estación {location}\nCombustible 95 octanos\n{liters} litros\nTotal: ${amount}",
                "Servicentro {brand}\nBencina sin plomo\nTotal: ${amount}\nRUT: {rut}",
                "{brand}\nDiesel\nTotal: ${amount}\nFecha: {date}"
            ],
            "Farmacia": [
                "Farmacia {brand}\nMedicamentos recetados\nAnalgésicos, vitaminas\nTotal: ${amount}",
                "{brand}\nRemedios para la gripe\nJarabe, pastillas\nTotal: ${amount}",
                "Farmacia {brand}\nProductos de higiene\nTotal: ${amount}\nBoleta: {number}"
            ]
        }
        
        # Generar ejemplos para cada categoría
        for category, category_templates in templates.items():
            brands = self.brands.get(category, [f"marca_{category.lower()}"])
            
            for _ in range(50):  # 50 ejemplos por categoría
                template = np.random.choice(category_templates)
                brand = np.random.choice(brands)
                
                # Generar datos variables
                amount = np.random.randint(1000, 50000)
                location = np.random.choice(["centro", "providencia", "las condes", "ñuñoa"])
                date = f"{np.random.randint(1,28)}/{np.random.randint(1,12)}/2024"
                rut = f"{np.random.randint(10,99)}.{np.random.randint(100,999)}.{np.random.randint(100,999)}-{np.random.randint(0,9)}"
                liters = np.random.randint(20, 60)
                number = np.random.randint(1000, 9999)
                
                # Formatear template
                text = template.format(
                    brand=brand,
                    location=location,
                    amount=f"{amount:,}".replace(",", "."),
                    date=date,
                    rut=rut,
                    liters=liters,
                    number=number
                )
                
                training_texts.append(text)
                training_labels.append(category)
        
        return training_texts, training_labels
    
    def _load_or_create_enhanced_model(self):
        """Carga un modelo existente o crea uno nuevo con datos sintéticos"""
        try:
            if os.path.exists(self.model_path):
                logger.info(f"Cargando modelo existente desde {self.model_path}")
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                    self.model = model_data['model']
                    self.label_encoder = model_data['label_encoder']
                    logger.info("✓ Modelo cargado exitosamente")
            else:
                logger.info("Creando nuevo modelo avanzado...")
                self._train_enhanced_model()
        except Exception as e:
            logger.warning(f"Error al cargar modelo: {e}. Creando nuevo modelo...")
            self._train_enhanced_model()
    
    def _train_enhanced_model(self):
        """Entrena el modelo ensemble con datos sintéticos"""
        logger.info("Generando datos de entrenamiento sintéticos...")
        texts, labels = self._generate_synthetic_training_data()
        
        # Preprocesar textos
        processed_texts = [self._preprocess_text_advanced(text) for text in texts]
        
        # Codificar etiquetas
        encoded_labels = self.label_encoder.fit_transform(labels)
        
        # Crear y entrenar modelo
        logger.info("Entrenando modelo ensemble...")
        self.model = self._create_enhanced_model()
        
        # Entrenamiento con validación cruzada
        cv_scores = cross_val_score(self.model, processed_texts, encoded_labels, cv=5)
        logger.info(f"Validación cruzada - Precisión promedio: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        # Entrenar en todo el dataset
        self.model.fit(processed_texts, encoded_labels)
        
        # Guardar modelo
        self._save_model()
        
        logger.info("✓ Modelo entrenado y guardado exitosamente")
    
    def _save_model(self):
        """Guarda el modelo entrenado"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'label_encoder': self.label_encoder,
            'region': self.region.value,
            'version': self.model_version,
            'categories': self.categories,
            'trained_at': datetime.utcnow().isoformat()
        }
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def categorize_receipt_advanced(self, text: str) -> CategoryPredictionAdvanced:
        """
        Categoriza un recibo usando el modelo avanzado con análisis detallado.
        """
        if not text or not text.strip():
            return self._create_default_prediction("Otros", 0.1, "empty_text")
        
        # Preprocesar texto
        processed_text = self._preprocess_text_advanced(text)
        
        # Extraer características avanzadas
        features = self._extract_advanced_features(text.lower())
        
        # Método 1: Detección basada en marcas (alta prioridad)
        brand_prediction = self._predict_by_brands(features)
        if brand_prediction and brand_prediction.confidence > 0.7:
            return brand_prediction
        
        # Método 2: Predicción basada en palabras clave (antes que ML para mayor precisión)
        keyword_prediction = self._predict_by_keywords(features)
        if keyword_prediction and keyword_prediction.confidence > 0.6:
            return keyword_prediction
        
        # Método 3: Predicción con modelo ML
        ml_prediction = self._predict_with_ml_model(processed_text, features)
        if ml_prediction and ml_prediction.confidence > 0.5:
            return ml_prediction
        
        # Método 4: Usar mejor predicción disponible
        best_prediction = None
        best_confidence = 0.0
        
        for prediction in [brand_prediction, keyword_prediction, ml_prediction]:
            if prediction and prediction.confidence > best_confidence:
                best_prediction = prediction
                best_confidence = prediction.confidence
        
        if best_prediction:
            return best_prediction
        
        # Fallback: categoría por defecto
        return self._create_default_prediction("Otros", 0.3, "fallback")
    
    def _predict_by_brands(self, features: Dict[str, Any]) -> Optional[CategoryPredictionAdvanced]:
        """Predicción basada en detección de marcas conocidas"""
        if not features["brand_matches"]:
            return None
        
        # Contar matches por categoría
        category_votes = Counter()
        for category, brand in features["brand_matches"]:
            category_votes[category] += 1
        
        if category_votes:
            best_category = category_votes.most_common(1)[0][0]
            # Confianza más alta para detección de marcas
            confidence = min(0.95, 0.75 + (category_votes[best_category] * 0.05))
            
            # Crear probabilidades normalizadas incluyendo otras categorías
            total_votes = sum(category_votes.values())
            all_probs = {cat: count/total_votes for cat, count in category_votes.items()}
            
            # Agregar probabilidades pequeñas para otras categorías principales
            if len(all_probs) == 1:  # Si solo hay una categoría, agregar una segunda
                remaining_prob = 0.1  # 10% para otras categorías
                all_probs[best_category] = all_probs[best_category] * (1.0 - remaining_prob)
                
                if "Otros" not in all_probs:
                    all_probs["Otros"] = remaining_prob * 0.6
                
                other_categories = [cat for cat in self.categories if cat not in all_probs]
                if other_categories:
                    all_probs[other_categories[0]] = remaining_prob * 0.4
            
            # Normalizar para asegurar que sume 1.0
            total_prob = sum(all_probs.values())
            if total_prob > 0:
                all_probs = {cat: prob/total_prob for cat, prob in all_probs.items()}
            
            return CategoryPredictionAdvanced(
                category=best_category,
                confidence=confidence,
                method="brand_detection",
                region_specific_data=self._extract_region_data(features),
                all_probabilities=all_probs,
                features_used=["brand_matches"],
                model_version=self.model_version,
                prediction_timestamp=datetime.utcnow()
            )
        
        return None
    
    def _predict_with_ml_model(self, processed_text: str, features: Dict[str, Any]) -> Optional[CategoryPredictionAdvanced]:
        """Predicción usando el modelo de machine learning"""
        if not self.model:
            return None
        
        try:
            # Obtener probabilidades de predicción
            probabilities = self.model.predict_proba([processed_text])[0]
            predicted_class_idx = np.argmax(probabilities)
            confidence = probabilities[predicted_class_idx]
            
            # Decodificar categoría
            predicted_category = self.label_encoder.inverse_transform([predicted_class_idx])[0]
            
            # Crear diccionario de todas las probabilidades
            all_probs = {}
            for i, prob in enumerate(probabilities):
                category = self.label_encoder.inverse_transform([i])[0]
                all_probs[category] = float(prob)
            
            return CategoryPredictionAdvanced(
                category=predicted_category,
                confidence=float(confidence),
                method="ml_ensemble",
                region_specific_data=self._extract_region_data(features),
                all_probabilities=all_probs,
                features_used=["tfidf_features", "text_features"],
                model_version=self.model_version,
                prediction_timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error en predicción ML: {e}")
            return None
    
    def _predict_by_keywords(self, features: Dict[str, Any]) -> Optional[CategoryPredictionAdvanced]:
        """Predicción basada en palabras clave específicas"""
        keyword_scores = features["category_keywords"]
        
        if not keyword_scores:
            return None
        
        best_category = max(keyword_scores.items(), key=lambda x: x[1])[0]
        total_keywords = sum(keyword_scores.values())
        confidence = min(0.7, 0.4 + (keyword_scores[best_category] / total_keywords) * 0.3)
        
        # Normalizar probabilidades y agregar categorías adicionales
        all_probs = {cat: score/total_keywords for cat, score in keyword_scores.items()}
        
        # Asegurar múltiples categorías
        if len(all_probs) == 1:
            remaining_prob = 0.15  # 15% para otras categorías
            all_probs[best_category] = all_probs[best_category] * (1.0 - remaining_prob)
            
            if "Otros" not in all_probs:
                all_probs["Otros"] = remaining_prob * 0.6
            # Agregar una categoría relacionada
            other_categories = [cat for cat in self.categories if cat not in all_probs]
            if other_categories:
                all_probs[other_categories[0]] = remaining_prob * 0.4
        
        # Normalizar para asegurar que sume 1.0
        total_prob = sum(all_probs.values())
        if total_prob > 0:
            all_probs = {cat: prob/total_prob for cat, prob in all_probs.items()}
        
        return CategoryPredictionAdvanced(
            category=best_category,
            confidence=confidence,
            method="keyword_analysis",
            region_specific_data=self._extract_region_data(features),
            all_probabilities=all_probs,
            features_used=["category_keywords"],
            model_version=self.model_version,
            prediction_timestamp=datetime.utcnow()
        )
    
    def _extract_region_data(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Extrae datos específicos de la región"""
        return {
            "has_tax_info": features["has_tax"],
            "has_currency": features["has_currency"],
            "has_identification": features["has_rut"],
            "brand_matches": len(features["brand_matches"]),
            "region": self.region.value
        }
    
    def _create_default_prediction(self, category: str, confidence: float, method: str) -> CategoryPredictionAdvanced:
        """Crea una predicción por defecto"""
        # Crear múltiples probabilidades para fallback
        all_probs = {category: confidence}
        remaining_prob = 1.0 - confidence
        
        # Distribuir probabilidad restante entre otras categorías
        other_categories = [cat for cat in self.categories[:3] if cat != category]  # Top 3 categorías
        if other_categories:
            prob_per_other = remaining_prob / len(other_categories)
            for other_cat in other_categories:
                all_probs[other_cat] = prob_per_other
        else:
            all_probs["Otros"] = remaining_prob
        
        # Normalizar para asegurar que sume exactamente 1.0
        total_prob = sum(all_probs.values())
        if total_prob > 0:
            all_probs = {cat: prob/total_prob for cat, prob in all_probs.items()}
        
        return CategoryPredictionAdvanced(
            category=category,
            confidence=confidence,
            method=method,
            region_specific_data={"region": self.region.value},
            all_probabilities=all_probs,
            features_used=[],
            model_version=self.model_version,
            prediction_timestamp=datetime.utcnow()
        )
    
    def add_feedback(self, text: str, predicted_category: str, correct_category: str, user_id: str = None):
        """
        Añade feedback del usuario para aprendizaje continuo.
        """
        feedback_entry = {
            "text": text,
            "predicted_category": predicted_category,
            "correct_category": correct_category,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "region": self.region.value
        }
        
        self.feedback_buffer.append(feedback_entry)
        
        # Guardar feedback
        self._save_feedback_buffer()
        
        # Verificar si es momento de reentrenar
        if len(self.feedback_buffer) >= 50:  # Reentrenar cada 50 feedbacks
            self._retrain_with_feedback()
    
    def _save_feedback_buffer(self):
        """Guarda el buffer de feedback en disco"""
        os.makedirs(os.path.dirname(self.feedback_path), exist_ok=True)
        
        with open(self.feedback_path, 'w', encoding='utf-8') as f:
            json.dump(self.feedback_buffer, f, ensure_ascii=False, indent=2)
    
    def _load_feedback_buffer(self):
        """Carga el buffer de feedback desde disco"""
        try:
            if os.path.exists(self.feedback_path):
                with open(self.feedback_path, 'r', encoding='utf-8') as f:
                    self.feedback_buffer = json.load(f)
                logger.info(f"Cargados {len(self.feedback_buffer)} feedbacks pendientes")
        except Exception as e:
            logger.warning(f"Error al cargar feedback: {e}")
            self.feedback_buffer = []
    
    def _retrain_with_feedback(self):
        """
        Reentrena el modelo incorporando el feedback del usuario.
        """
        if len(self.feedback_buffer) < 10:
            return
        
        logger.info(f"Reentrenando modelo con {len(self.feedback_buffer)} feedbacks...")
        
        # Preparar datos de feedback
        feedback_texts = []
        feedback_labels = []
        
        for feedback in self.feedback_buffer:
            feedback_texts.append(self._preprocess_text_advanced(feedback["text"]))
            feedback_labels.append(feedback["correct_category"])
        
        # Generar datos sintéticos adicionales
        synthetic_texts, synthetic_labels = self._generate_synthetic_training_data()
        
        # Combinar datos
        all_texts = synthetic_texts + feedback_texts
        all_labels = synthetic_labels + feedback_labels
        
        # Reentrenar modelo
        encoded_labels = self.label_encoder.fit_transform(all_labels)
        self.model = self._create_enhanced_model()
        self.model.fit(all_texts, encoded_labels)
        
        # Guardar modelo actualizado
        self._save_model()
        
        # Limpiar buffer de feedback
        self.feedback_buffer = []
        self._save_feedback_buffer()
        
        # Actualizar timestamp de último entrenamiento
        self.last_retrain = datetime.utcnow()
        
        logger.info("✓ Modelo reentrenado exitosamente con feedback del usuario")
    
    def get_model_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del modelo actual"""
        return {
            "version": self.model_version,
            "region": self.region.value,
            "categories_count": len(self.categories),
            "categories": self.categories,
            "feedback_pending": len(self.feedback_buffer),
            "last_retrain": self.last_retrain.isoformat() if self.last_retrain else None,
            "model_exists": self.model is not None,
            "brands_count": sum(len(brands) for brands in self.brands.values())
        }
    
    def force_retrain(self):
        """Fuerza el reentrenamiento del modelo"""
        logger.info("Forzando reentrenamiento del modelo...")
        self._retrain_with_feedback()
