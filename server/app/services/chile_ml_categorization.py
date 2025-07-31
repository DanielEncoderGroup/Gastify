import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from typing import Dict, List, Any, Optional, Tuple
import logging
import os
import pickle
from datetime import datetime
import joblib

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Definición de categorías chilenas
CHILE_CATEGORIES = [
    "Supermercado",
    "Combustible",
    "Transporte",
    "Retail",
    "Restaurante",
    "Farmacia",
    "Servicios",
    "Salud",
    "Envíos",
    "Educación",
    "Otros"
]

class ChileCategorizerService:
    """
    Servicio de categorización automática específico para Chile, 
    usando machine learning y reglas adaptadas al mercado chileno.
    """
    
    def __init__(self, model_path: str = None):
        """
        Inicializa el servicio de categorización.
        
        Args:
            model_path (str): Ruta al modelo pre-entrenado (opcional)
        """
        # Inicializar variables
        self.model = None
        self.model_path = model_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "models",
            "chile_categorizer_model.pkl"
        )
        
        # Inicializar base de conocimiento chilena primero
        self._initialize_chile_knowledge_base()
        
        # Cargar modelo si existe, sino crear uno nuevo
        self._load_or_create_model()
        
    def _initialize_chile_knowledge_base(self):
        """
        Inicializa la base de conocimiento específica de Chile con marcas,
        patrones y expresiones regulares para detección de información relevante.
        """
        # Supermercados/Retail
        self.chile_brands = {
            "Supermercado": [
                "lider", "jumbo", "santa isabel", "unimarc", "tottus", 
                "acuenta", "mayorista 10", "alvi", "ekono", "ok market",
                "cugat", "ketal", "montserrat"
            ],
            "Retail": [
                "falabella", "ripley", "paris", "hites", "la polar", 
                "corona", "abcdin", "easy", "sodimac", "homecenter",
                "construmart", "imperial", "mta", "mall", "plaza", "zara",
                "h&m", "tricot", "lapiz lopez", "casa ideas", "casa & ideas"
            ],
            "Combustible": [
                "copec", "shell", "petrobras", "terpel", "abastible", "lipigas",
                "gasco", "gasolinera", "servicentro", "estacion de servicio",
                "combustible", "gas", "bencina", "gasolina", "petroleo"
            ],
            "Transporte": [
                "metro", "transantiago", "bip", "red", "uber", "cabify", "didi",
                "taxi", "pasaje", "boleto", "tur bus", "pullman", "condor", "latam",
                "sky airline", "jetsmart", "transporte publico", "tren", "fesur",
                "biotren", "merval"
            ],
            "Restaurante": [
                "restaurante", "restaurant", "cafe", "cafeteria", "doggis", 
                "mcdonalds", "burger king", "wendys", "juan maestro", "dominó",
                "pizza", "sushi", "papa johns", "telepizza", "pedro juan & diego",
                "fuente alemana", "tarragona", "tomahawk", "food court", "patio de comidas"
            ],
            "Farmacia": [
                "cruz verde", "salcobrand", "ahumada", "dr. simi", "farmacia", 
                "farmaco", "botica", "medicamento", "receta medica", "remedio"
            ],
            "Servicios": [
                "notaria", "registro civil", "sii", "servicio de impuestos", "cfe",
                "seremi", "serviu", "municipalidad", "luz", "agua", "gas", "telefono",
                "internet", "movistar", "entel", "claro", "wom", "vtr", "gtd", "mundo",
                "telefonica"
            ],
            "Salud": [
                "isapre", "fonasa", "clínica", "clinica", "hospital", "consultorio",
                "cesfam", "doctor", "consulta", "medico", "dental", "dentista",
                "ortodoncista", "dermatólogo", "laboratorio", "examen medico",
                "salud", "colmena", "banmedica", "vida tres", "consalud", "masvida",
                "cruz blanca"
            ],
            "Envíos": [
                "chilexpress", "correos chile", "starken", "bluexpress", "dhl",
                "fedex", "encomienda", "envio", "despacho", "courier"
            ],
            "Educación": [
                "colegio", "escuela", "universidad", "instituto", "centro de formacion",
                "libro", "cuaderno", "uniforme", "matrícula", "mensualidad", "duoc",
                "inacap", "santo tomas", "aiep", "puc", "uchile", "usach", "unab"
            ]
        }
        
        # Patrones de Chile específicos
        self.rut_pattern = r'\b(\d{1,2}(?:\.\d{3}){2}-[\dkK])\b'
        self.iva_pattern = r'\b(iva|i\.v\.a\.?)\s*(?::|del|de|al)?\s*(?:19|19\.0|19,0|19\.00|19,00)?\s*%'
        self.boleta_pattern = r'\b(boleta(?:\s+electronica)?|factura(?:\s+electronica)?|boleta de venta|boleta de honorarios)\b'
    
    def _load_or_create_model(self):
        """
        Carga el modelo de ML si existe, de lo contrario crea y entrena un nuevo modelo.
        """
        try:
            # Intentar cargar el modelo
            if os.path.exists(self.model_path):
                logger.info(f"Cargando modelo desde {self.model_path}")
                self.model = joblib.load(self.model_path)
                logger.info("Modelo cargado correctamente")
            else:
                logger.info("No se encontró modelo pre-entrenado. Creando nuevo modelo...")
                self._create_and_train_model()
        except Exception as e:
            logger.error(f"Error al cargar modelo: {str(e)}")
            logger.info("Creando nuevo modelo...")
            self._create_and_train_model()
    
    def _create_and_train_model(self):
        """
        Crea y entrena un modelo de ML con datos sintéticos específicos de Chile.
        """
        # Crear datos sintéticos para entrenamiento
        synthetic_data = self._generate_chile_synthetic_data()
        
        # Dividir en training y test
        X_train, X_test, y_train, y_test = train_test_split(
            synthetic_data["text"], 
            synthetic_data["category"], 
            test_size=0.2, 
            random_state=42
        )
        
        # Crear pipeline con vectorizador TF-IDF y clasificador Logistic Regression
        self.model = Pipeline([
            ('vectorizer', TfidfVectorizer(lowercase=True, analyzer='word', 
                                          ngram_range=(1, 2), max_features=5000)),
            ('classifier', LogisticRegression(C=1.0, solver='liblinear', max_iter=1000, multi_class='ovr'))
        ])
        
        # Entrenar modelo
        logger.info("Entrenando modelo de categorización...")
        self.model.fit(X_train, y_train)
        
        # Evaluar modelo
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f"Precisión del modelo: {accuracy:.4f}")
        
        # Guardar modelo
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        logger.info(f"Modelo guardado en {self.model_path}")
    
    def _generate_chile_synthetic_data(self) -> pd.DataFrame:
        """
        Genera datos sintéticos de recibos chilenos para entrenamiento.
        
        Returns:
            pd.DataFrame: DataFrame con datos sintéticos
        """
        synthetic_data = []
        
        # Generar datos sintéticos para cada categoría
        for category, brands in self.chile_brands.items():
            # Generar ejemplos por marca
            for brand in brands:
                # Varios ejemplos por marca
                for _ in range(3):
                    # Texto base
                    text = f"{brand} "
                    
                    # Agregar variaciones aleatorias
                    if np.random.random() > 0.5:
                        text += f"compra "
                    
                    if np.random.random() > 0.7:
                        text += f"sucursal {np.random.choice(['santiago', 'providencia', 'las condes', 'vitacura', 'ñuñoa', 'la florida', 'maipú'])} "
                        
                    if np.random.random() > 0.5:
                        text += f"rut {np.random.randint(11, 99)}.{np.random.randint(100, 999)}.{np.random.randint(100, 999)}-{np.random.choice(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'k', 'K'])} "
                    
                    if np.random.random() > 0.6:
                        text += f"total ${np.random.randint(1000, 100000)} "
                        
                    if np.random.random() > 0.7:
                        text += f"iva 19% "
                        
                    if np.random.random() > 0.8:
                        text += f"boleta {'electronica' if np.random.random() > 0.5 else ''} "
                        
                    # Agregar a los datos sintéticos
                    synthetic_data.append({
                        "text": text.strip(),
                        "category": category
                    })
        
        # Convertir a DataFrame
        df = pd.DataFrame(synthetic_data)
        
        # Añadir algunos ejemplos difíciles o ambiguos
        ambiguous_examples = [
            {"text": "compra varios artículos", "category": "Otros"},
            {"text": "pago servicios varios", "category": "Servicios"},
            {"text": "transferencia", "category": "Servicios"},
            {"text": "cargo mensual", "category": "Servicios"},
            {"text": "compra online", "category": "Retail"},
            {"text": "pago cuenta", "category": "Servicios"}
        ]
        
        df = pd.concat([df, pd.DataFrame(ambiguous_examples)], ignore_index=True)
        
        # Mezclar datos
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        return df
        
    def extract_chile_specific_data(self, text: str) -> Dict[str, Any]:
        """
        Extrae información específica de Chile del texto OCR.
        
        Args:
            text (str): Texto completo del OCR
            
        Returns:
            Dict[str, Any]: Información específica de Chile
        """
        text_lower = text.lower()
        result = {
            "rut_detected": None,
            "document_type": None,
            "iva_detected": False,
            "known_brand": None
        }
        
        # Detectar RUT
        rut_matches = re.findall(self.rut_pattern, text)
        if rut_matches:
            result["rut_detected"] = rut_matches[0]
            
        # Detectar tipo de documento
        boleta_matches = re.findall(self.boleta_pattern, text_lower)
        if boleta_matches:
            doc_type = boleta_matches[0].lower()
            if "factura" in doc_type:
                result["document_type"] = "factura"
            else:
                result["document_type"] = "boleta"
                
        # Detectar IVA
        if re.search(self.iva_pattern, text_lower):
            result["iva_detected"] = True
            
        # Detectar marcas conocidas
        for category, brands in self.chile_brands.items():
            for brand in brands:
                if brand.lower() in text_lower:
                    result["known_brand"] = brand
                    break
            if result["known_brand"]:
                break
                
        return result
    
    def categorize_by_rules(self, text: str, chile_data: Dict[str, Any]) -> Tuple[str, float]:
        """
        Categoriza el recibo usando reglas basadas en el conocimiento chileno.
        
        Args:
            text (str): Texto del recibo
            chile_data (Dict[str, Any]): Datos específicos de Chile
            
        Returns:
            Tuple[str, float]: Categoría y nivel de confianza
        """
        text_lower = text.lower()
        
        # Si tenemos una marca conocida, usar su categoría
        if chile_data["known_brand"]:
            for category, brands in self.chile_brands.items():
                if chile_data["known_brand"].lower() in brands:
                    return category, 0.9
        
        # Buscar keywords específicos
        for category, keywords in self.chile_brands.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    return category, 0.8
        
        # Si no encontramos nada específico
        return "Otros", 0.3
    
    def categorize_by_ml(self, text: str) -> Tuple[str, Dict[str, float]]:
        """
        Categoriza el recibo usando el modelo ML.
        
        Args:
            text (str): Texto del recibo
            
        Returns:
            Tuple[str, Dict[str, float]]: Categoría predicha y probabilidades para cada categoría
        """
        try:
            # Predecir categoría
            category = self.model.predict([text])[0]
            
            # Obtener probabilidades para todas las categorías
            probabilities = self.model.predict_proba([text])[0]
            
            # Mapear probabilidades a categorías
            all_probabilities = {}
            for i, prob in enumerate(probabilities):
                category_name = self.model.classes_[i]
                all_probabilities[category_name] = float(prob)
                
            # Obtener confianza para la categoría predicha
            confidence = all_probabilities[category]
                
            return category, all_probabilities
            
        except Exception as e:
            logger.error(f"Error al categorizar con ML: {str(e)}")
            return "Otros", {"Otros": 1.0}
    
    def categorize_receipt(self, text: str) -> Dict[str, Any]:
        """
        Categoriza un recibo combinando ML y reglas específicas de Chile.
        
        Args:
            text (str): Texto del OCR del recibo
            
        Returns:
            Dict[str, Any]: Resultado de la categorización con datos adicionales
        """
        if not text or not text.strip():
            return {
                "category": "Otros",
                "confidence": 0.0,
                "method": "default",
                "chile_specific": {
                    "rut_detected": None,
                    "document_type": None,
                    "iva_detected": False,
                    "known_brand": None
                },
                "all_probabilities": {"Otros": 1.0}
            }
            
        # Extraer datos específicos de Chile
        chile_data = self.extract_chile_specific_data(text)
        
        # Categorizar con ML
        ml_category, all_probabilities = self.categorize_by_ml(text)
        ml_confidence = all_probabilities.get(ml_category, 0.0)
        
        # Categorizar con reglas
        rule_category, rule_confidence = self.categorize_by_rules(text, chile_data)
        
        # Decidir qué método usar basado en la confianza
        if ml_confidence >= 0.7:
            final_category = ml_category
            confidence = ml_confidence
            method = "ml_prediction"
        elif rule_confidence >= 0.7:
            final_category = rule_category
            confidence = rule_confidence
            method = "rule_based"
            # Actualizar probabilidades con la categoría por reglas
            for cat in all_probabilities.keys():
                if cat == rule_category:
                    all_probabilities[cat] = rule_confidence
                else:
                    all_probabilities[cat] = (1 - rule_confidence) / (len(all_probabilities) - 1)
        else:
            # Si ambos métodos tienen baja confianza, elegir el de mayor confianza
            if ml_confidence >= rule_confidence:
                final_category = ml_category
                confidence = ml_confidence
                method = "ml_prediction_low_confidence"
            else:
                final_category = rule_category
                confidence = rule_confidence
                method = "rule_based_low_confidence"
        
        # Construir respuesta
        result = {
            "category": final_category,
            "confidence": confidence,
            "method": method,
            "chile_specific": chile_data,
            "all_probabilities": all_probabilities
        }
        
        return result
    
    def retrain_with_feedback(self, texts: List[str], categories: List[str]) -> bool:
        """
        Reentrenar el modelo con feedback de usuarios.
        
        Args:
            texts (List[str]): Textos de los recibos
            categories (List[str]): Categorías correctas
            
        Returns:
            bool: True si el reentrenamiento fue exitoso
        """
        try:
            if not texts or not categories or len(texts) != len(categories):
                logger.error("Datos inválidos para reentrenamiento")
                return False
            
            # Cargar datos sintéticos originales
            synthetic_data = self._generate_chile_synthetic_data()
            
            # Crear DataFrame con nuevos datos
            feedback_data = pd.DataFrame({
                "text": texts,
                "category": categories
            })
            
            # Combinar datos originales y feedback
            combined_data = pd.concat([synthetic_data, feedback_data], ignore_index=True)
            
            # Dividir datos en train y test
            X_train, X_test, y_train, y_test = train_test_split(
                combined_data["text"], 
                combined_data["category"], 
                test_size=0.2, 
                random_state=42
            )
            
            # Crear y entrenar nuevo modelo
            self.model = Pipeline([
                ('vectorizer', TfidfVectorizer(lowercase=True, analyzer='word', 
                                              ngram_range=(1, 2), max_features=5000)),
                ('classifier', LogisticRegression(C=1.0, solver='liblinear', max_iter=1000, multi_class='ovr'))
            ])
            
            # Entrenar modelo
            logger.info("Reentrenando modelo con feedback...")
            self.model.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            logger.info(f"Precisión del modelo reentrenado: {accuracy:.4f}")
            
            # Guardar modelo
            joblib.dump(self.model, self.model_path)
            logger.info(f"Modelo actualizado guardado en {self.model_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error al reentrenar modelo: {str(e)}")
            return False
