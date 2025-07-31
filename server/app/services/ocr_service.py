import cv2
import numpy as np
import pytesseract
from PIL import Image
import re
from datetime import datetime
import os
import logging
from typing import Dict, List, Any, Optional, Tuple

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FreeOCRService:
    """
    Servicio de OCR gratuito utilizando Tesseract para extraer datos de recibos.
    """
    
    def __init__(self, language: str = "spa+eng"):
        """
        Inicializa el servicio OCR.
        
        Args:
            language (str): Idiomas para Tesseract ('spa' para español, 'eng' para inglés)
        """
        pytesseract.pytesseract.tesseract_cmd = r'C:\Archivos de programa\Tesseract-OCR\tesseract.exe'
        self.language = language
        
        # Verificar la instalación de tesseract
        self._check_tesseract()

    def _check_tesseract(self):
        """
        Verifica que Tesseract esté instalado y configurado correctamente.
        """
        try:
            # En Windows, es posible que necesite establecer el path a Tesseract
            if os.name == 'nt':  # Windows
                # Intenta detectar automáticamente Tesseract (ajusta la ruta si es necesario)
                common_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                ]
                for path in common_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
        except Exception as e:
            logger.error(f"Error al configurar Tesseract: {str(e)}")
            raise Exception("No se pudo inicializar Tesseract. Asegúrese de que esté instalado correctamente.")

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocesa la imagen para mejorar la calidad del OCR.
        
        Args:
            image_path (str): Ruta a la imagen del recibo
            
        Returns:
            np.ndarray: Imagen preprocesada
        """
        try:
            # Cargar imagen
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"No se pudo cargar la imagen: {image_path}")
            
            # Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Aplicar umbral adaptativo
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Reducir ruido
            denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
            
            # Dilatar texto para mejorar reconocimiento
            kernel = np.ones((1, 1), np.uint8)
            dilated = cv2.dilate(denoised, kernel, iterations=1)
            
            return dilated
            
        except Exception as e:
            logger.error(f"Error al preprocesar la imagen: {str(e)}")
            raise Exception(f"Error al preprocesar la imagen: {str(e)}")

    def extract_text(self, image: np.ndarray) -> str:
        """
        Extrae el texto completo de una imagen usando Tesseract.
        
        Args:
            image (np.ndarray): Imagen preprocesada
            
        Returns:
            str: Texto extraído
        """
        try:
            # Configuración para mejorar la extracción de texto
            config = '--oem 3 --psm 6'
            
            # Extraer texto
            text = pytesseract.image_to_string(image, lang=self.language, config=config)
            
            return text
        except Exception as e:
            logger.error(f"Error al extraer texto con OCR: {str(e)}")
            raise Exception(f"Error en OCR: {str(e)}")

    def _calculate_confidence(self, data_dict: Dict[str, Any]) -> float:
        """
        Calcula la confianza general de la extracción OCR.
        
        Args:
            data_dict (Dict[str, Any]): Diccionario con datos extraídos
            
        Returns:
            float: Puntuación de confianza entre 0 y 1
        """
        # Inicializar puntuación base
        base_score = 0.5
        score = base_score
        
        # Verificar cada campo clave y ajustar la puntuación
        if data_dict.get('vendor'):
            score += 0.1
        
        if data_dict.get('total_amount'):
            score += 0.2
            
        if data_dict.get('date'):
            score += 0.1
            
        if data_dict.get('items') and len(data_dict['items']) > 0:
            score += 0.1
            
        # Normalizar entre 0 y 1
        return min(max(score, 0), 1)

    def extract_vendor(self, text: str) -> str:
        """
        Extrae el nombre del proveedor del texto OCR.
        Busca nombres de empresas en las primeras líneas del texto.
        
        Args:
            text (str): Texto completo del OCR
            
        Returns:
            str: Nombre del proveedor
        """
        # Dividir en líneas y tomar las primeras líneas (normalmente el header del recibo)
        lines = text.split('\n')
        first_lines = [line.strip() for line in lines[:5] if line.strip()]
        
        # El nombre del proveedor suele estar en las primeras líneas y en mayúsculas
        for line in first_lines:
            # Si la línea está en mayúsculas y tiene más de 3 caracteres, probablemente es el nombre
            if line.isupper() and len(line) > 3:
                return line
            
            # Verificar si hay palabras clave como "restaurante", "tienda", etc.
            keywords = ["restaurante", "tienda", "supermercado", "café", "cafetería", "hotel", "restaurant", "store"]
            for keyword in keywords:
                if keyword.lower() in line.lower():
                    return line
        
        # Si no se encuentra un candidato claro, devolver la primera línea no vacía
        for line in first_lines:
            if len(line) > 3:
                return line
                
        return ""

    def extract_total_amount(self, text: str) -> Optional[float]:
        """
        Extrae el monto total del texto OCR.
        
        Args:
            text (str): Texto completo del OCR
            
        Returns:
            Optional[float]: Monto total o None si no se encuentra
        """
        # Patrones comunes para montos totales
        patterns = [
            r'total[\s:]*\$?\s*(\d+[.,]\d+)',  # TOTAL: $123.45
            r'total[\s:]*\$?\s*(\d+)',          # TOTAL: $123
            r'importe total[\s:]*\$?\s*(\d+[.,]\d+)',  # IMPORTE TOTAL: $123.45
            r'importe[\s:]*\$?\s*(\d+[.,]\d+)',  # IMPORTE: $123.45
            r'total a pagar[\s:]*\$?\s*(\d+[.,]\d+)',  # TOTAL A PAGAR: $123.45
            r'sum[a]?[\s:]*\$?\s*(\d+[.,]\d+)',  # SUMA: $123.45
            r'\$\s*(\d+[.,]\d+)',  # $123.45 (solo busca precios con símbolo $)
        ]
        
        # Buscar utilizando patrones
        text_lower = text.lower()
        for pattern in patterns:
            matches = re.finditer(pattern, text_lower)
            amounts = []
            
            # Recopilar todos los montos encontrados
            for match in matches:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = float(amount_str)
                    amounts.append((amount, match.start()))
                except ValueError:
                    continue
            
            # Si encontramos montos, seleccionar el más probable
            if amounts:
                # Ordenar por valor descendente (el total suele ser el valor más alto)
                amounts.sort(key=lambda x: x[0], reverse=True)
                # O podríamos elegir el que aparece más tarde en el recibo
                # amounts.sort(key=lambda x: x[1], reverse=True)
                return amounts[0][0]
        
        return None

    def extract_date(self, text: str) -> Optional[str]:
        """
        Extrae la fecha del texto OCR.
        
        Args:
            text (str): Texto completo del OCR
            
        Returns:
            Optional[str]: Fecha en formato ISO (YYYY-MM-DD) o None si no se encuentra
        """
        # Patrones comunes para fechas en formatos español e inglés
        patterns = [
            r'(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{2,4})',  # DD/MM/YYYY o MM/DD/YYYY
            r'(\d{2,4})[/\.-](\d{1,2})[/\.-](\d{1,2})',  # YYYY/MM/DD
            r'(\d{1,2})[\s]*(?:de|-)[\s]*([a-zA-Záéíóúü]+)[\s]*(?:del?)?[\s]*(\d{2,4})',  # DD de Mes de YYYY
        ]
        
        months_es = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
            'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        }
        
        months_en = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        
        # Buscar fechas en el texto
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                match = matches[0]
                
                # Para el patrón DD de Mes de YYYY
                if len(match) == 3 and isinstance(match[1], str) and len(match[1]) > 2:
                    day = int(match[0])
                    month_str = match[1].lower()
                    year = int(match[2])
                    
                    # Verificar si es un mes en español o inglés
                    month = None
                    for m_name, m_num in {**months_es, **months_en}.items():
                        if m_name.startswith(month_str[:3]):  # Compara solo las primeras letras
                            month = m_num
                            break
                    
                    if month is None:
                        continue
                    
                else:  # Para patrones numéricos
                    # Determinar qué formato de fecha es
                    if len(match[0]) == 4:  # YYYY/MM/DD
                        year = int(match[0])
                        month = int(match[1])
                        day = int(match[2])
                    else:  # DD/MM/YYYY o MM/DD/YYYY
                        first = int(match[0])
                        second = int(match[1])
                        year = int(match[2])
                        
                        # Validar y corregir año si es necesario
                        if year < 100:
                            year += 2000 if year < 50 else 1900
                        
                        # Asumimos formato DD/MM/YYYY (más común en español)
                        # Validar que los valores tengan sentido
                        if 1 <= first <= 31 and 1 <= second <= 12:
                            day, month = first, second
                        elif 1 <= second <= 31 and 1 <= first <= 12:
                            # Si el primer número es un mes válido, asumimos MM/DD/YYYY
                            day, month = second, first
                        else:
                            continue
                
                # Validar fecha
                try:
                    # Asegurar que los valores están en rangos válidos
                    if not (1 <= day <= 31 and 1 <= month <= 12 and 1000 <= year <= datetime.now().year + 1):
                        continue
                    
                    # Crear objeto datetime para validación
                    date_obj = datetime(year, month, day)
                    
                    # Devolver en formato ISO
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        
        return None

    def extract_items(self, text: str) -> List[str]:
        """
        Extrae los ítems del recibo.
        
        Args:
            text (str): Texto completo del OCR
            
        Returns:
            List[str]: Lista de ítems encontrados
        """
        items = []
        lines = text.split('\n')
        
        # Buscar líneas que podrían ser ítems (con precios)
        price_pattern = r'\$?\s*\d+[.,]\d+\s*'
        
        # Ignorar las primeras y últimas líneas (suelen ser cabecera y pie de página)
        start_index = min(3, len(lines) // 4)
        end_index = max(len(lines) - 3, len(lines) * 3 // 4)
        
        for i, line in enumerate(lines[start_index:end_index]):
            line = line.strip()
            if not line:
                continue
                
            # Si la línea contiene un precio y no es una línea de total o subtotal
            if re.search(price_pattern, line):
                lower_line = line.lower()
                if 'total' in lower_line or 'subtotal' in lower_line or 'iva' in lower_line:
                    continue
                
                # Limpiar y añadir a la lista de ítems
                item = re.sub(r'\s+', ' ', line)
                items.append(item)
        
        return items

    def extract_receipt_data(self, image_path: str) -> Dict[str, Any]:
        """
        Extrae datos estructurados de un recibo.
        
        Args:
            image_path (str): Ruta a la imagen del recibo
            
        Returns:
            Dict[str, Any]: Datos estructurados del recibo
        """
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image_path)
            
            # Extraer texto completo
            raw_text = self.extract_text(processed_image)
            
            if not raw_text.strip():
                logger.warning("No se pudo extraer texto de la imagen")
                return {
                    "raw_text": "",
                    "confidence": 0,
                    "vendor": "",
                    "total_amount": None,
                    "date": None,
                    "items": []
                }
            
            # Extraer datos específicos
            vendor = self.extract_vendor(raw_text)
            total_amount = self.extract_total_amount(raw_text)
            date = self.extract_date(raw_text)
            items = self.extract_items(raw_text)
            
            # Crear diccionario de datos
            data = {
                "vendor": vendor,
                "total_amount": total_amount,
                "date": date,
                "items": items,
                "raw_text": raw_text
            }
            
            # Calcular confianza
            confidence = self._calculate_confidence(data)
            data["confidence"] = confidence
            
            return data
            
        except Exception as e:
            logger.error(f"Error al extraer datos del recibo: {str(e)}")
            raise Exception(f"Error al extraer datos del recibo: {str(e)}")
