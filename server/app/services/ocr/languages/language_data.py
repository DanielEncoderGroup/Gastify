"""
Datos de configuración para soporte multiidioma en OCR.
"""

from typing import Dict, List

# Mapeo de códigos de idioma estándar a códigos de Tesseract
LANGUAGE_MAPPINGS: Dict[str, str] = {
    # Idiomas principales
    'es': 'spa',      # Español
    'en': 'eng',      # Inglés
    'pt': 'por',      # Portugués
    'fr': 'fra',      # Francés
    'it': 'ita',      # Italiano
    'de': 'deu',      # Alemán
    'zh': 'chi_sim', # Chino simplificado
    'ja': 'jpn',      # Japonés
    'ko': 'kor',      # Coreano
    'ru': 'rus',      # Ruso
    'ar': 'ara',      # Árabe
    'hi': 'hin',      # Hindi
    'th': 'tha',      # Tailandés
    'vi': 'vie',      # Vietnamita
    'nl': 'nld',      # Holandés
    'sv': 'swe',      # Sueco
    'no': 'nor',      # Noruego
    'da': 'dan',      # Danés
    'fi': 'fin',      # Finlandés
    'pl': 'pol',      # Polaco
    'cs': 'ces',      # Checo
    'hu': 'hun',      # Húngaro
    'ro': 'ron',      # Rumano
    'bg': 'bul',      # Búlgaro
    'hr': 'hrv',      # Croata
    'sk': 'slk',      # Eslovaco
    'sl': 'slv',      # Esloveno
    'et': 'est',      # Estonio
    'lv': 'lav',      # Letón
    'lt': 'lit',      # Lituano
    'el': 'ell',      # Griego
    'tr': 'tur',      # Turco
    'he': 'heb',      # Hebreo
    'fa': 'fas',      # Persa
    'ur': 'urd',      # Urdu
    'bn': 'ben',      # Bengalí
    'ta': 'tam',      # Tamil
    'te': 'tel',      # Telugu
    'ml': 'mal',      # Malayalam
    'kn': 'kan',      # Kannada
    'gu': 'guj',      # Gujarati
    'pa': 'pan',      # Punjabi
    'or': 'ori',      # Oriya
    'as': 'asm',      # Asamés
    'ne': 'nep',      # Nepalí
    'si': 'sin',      # Cingalés
    'my': 'mya',      # Birmano
    'km': 'khm',      # Khmer
    'lo': 'lao',      # Lao
    'ka': 'kat',      # Georgiano
    'am': 'amh',      # Amhárico
    'is': 'isl',      # Islandés
    'mt': 'mlt',      # Maltés
    'cy': 'cym',      # Galés
    'ga': 'gle',      # Irlandés
    'gd': 'gla',      # Gaélico escocés
    'eu': 'eus',      # Euskera
    'ca': 'cat',      # Catalán
    'gl': 'glg',      # Gallego
    'af': 'afr',      # Afrikáans
    'sw': 'swa',      # Suajili
    'zu': 'zul',      # Zulú
    'xh': 'xho',      # Xhosa
    'st': 'sot',      # Sesotho
    'tn': 'tsn',      # Setsuana
    'ss': 'ssw',      # Siswati
    'nr': 'nbl',      # Ndebele del sur
    've': 'ven',      # Venda
    'ts': 'tso',      # Tsonga
    'ms': 'msa',      # Malayo
    'id': 'ind',      # Indonesio
    'tl': 'fil',      # Filipino
    'haw': 'haw',     # Hawaiano
    'mi': 'mri',      # Maorí
    'sm': 'smo',      # Samoano
    'to': 'ton',      # Tongano
    'fj': 'fij',      # Fiyiano
}

# Idiomas soportados por Tesseract (los más comunes)
TESSERACT_LANGUAGES: List[str] = [
    'spa',     # Español
    'eng',     # Inglés
    'por',     # Portugués
    'fra',     # Francés
    'ita',     # Italiano
    'deu',     # Alemán
    'chi_sim', # Chino simplificado
    'chi_tra', # Chino tradicional
    'jpn',     # Japonés
    'kor',     # Coreano
    'rus',     # Ruso
    'ara',     # Árabe
    'hin',     # Hindi
    'tha',     # Tailandés
    'vie',     # Vietnamita
    'nld',     # Holandés
    'swe',     # Sueco
    'nor',     # Noruego
    'dan',     # Danés
    'fin',     # Finlandés
    'pol',     # Polaco
    'ces',     # Checo
    'hun',     # Húngaro
    'ron',     # Rumano
    'bul',     # Búlgaro
    'hrv',     # Croata
    'slk',     # Eslovaco
    'slv',     # Esloveno
    'est',     # Estonio
    'lav',     # Letón
    'lit',     # Lituano
    'ell',     # Griego
    'tur',     # Turco
    'heb',     # Hebreo
    'fas',     # Persa
    'urd',     # Urdu
    'ben',     # Bengalí
    'tam',     # Tamil
    'tel',     # Telugu
    'mal',     # Malayalam
    'kan',     # Kannada
    'guj',     # Gujarati
    'pan',     # Punjabi
    'ori',     # Oriya
    'asm',     # Asamés
    'nep',     # Nepalí
    'sin',     # Cingalés
    'mya',     # Birmano
    'khm',     # Khmer
    'lao',     # Lao
    'kat',     # Georgiano
    'amh',     # Amhárico
    'isl',     # Islandés
    'mlt',     # Maltés
    'cym',     # Galés
    'gle',     # Irlandés
    'gla',     # Gaélico escocés
    'eus',     # Euskera
    'cat',     # Catalán
    'glg',     # Gallego
    'afr',     # Afrikáans
    'swa',     # Suajili
    'msa',     # Malayo
    'ind',     # Indonesio
    'fil',     # Filipino
]

# Combinaciones de idiomas comunes para regiones específicas
REGIONAL_LANGUAGE_COMBINATIONS: Dict[str, str] = {
    'latin_america': 'spa+eng',           # Español + Inglés
    'brazil': 'por+eng',                  # Portugués + Inglés
    'europe_west': 'eng+fra+deu+ita',    # Europa Occidental
    'europe_east': 'eng+rus+pol+ces',    # Europa Oriental
    'asia_east': 'eng+chi_sim+jpn+kor',  # Asia Oriental
    'asia_south': 'eng+hin+ben+tam',     # Asia del Sur
    'middle_east': 'eng+ara+fas+tur',    # Medio Oriente
    'africa': 'eng+fra+ara+swa',         # África
    'north_america': 'eng+spa+fra',      # Norteamérica
    'oceania': 'eng',                    # Oceanía
}

# Patrones de texto específicos por idioma para mejorar detección
LANGUAGE_PATTERNS: Dict[str, List[str]] = {
    'spa': [
        r'\b(total|subtotal|iva|descuento|cantidad|precio|fecha|factura|boleta)\b',
        r'\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b',
        r'\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b',
        r'\$\s*\d+[.,]\d+',  # Formato de moneda en español
    ],
    'eng': [
        r'\b(total|subtotal|tax|discount|quantity|price|date|invoice|receipt)\b',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\b',
        r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\$\s*\d+[.,]\d+',  # Formato de moneda en inglés
    ],
    'por': [
        r'\b(total|subtotal|imposto|desconto|quantidade|preço|data|fatura|recibo)\b',
        r'\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b',
        r'\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)\b',
        r'R\$\s*\d+[.,]\d+',  # Formato de moneda brasileña
    ],
    'fra': [
        r'\b(total|sous-total|taxe|remise|quantité|prix|date|facture|reçu)\b',
        r'\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b',
        r'\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b',
        r'€\s*\d+[.,]\d+',  # Formato de moneda europea
    ],
    'ita': [
        r'\b(totale|subtotale|tassa|sconto|quantità|prezzo|data|fattura|ricevuta)\b',
        r'\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b',
        r'\b(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)\b',
        r'€\s*\d+[.,]\d+',  # Formato de moneda europea
    ],
    'deu': [
        r'\b(gesamt|zwischensumme|steuer|rabatt|menge|preis|datum|rechnung|beleg)\b',
        r'\b(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b',
        r'\b(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b',
        r'€\s*\d+[.,]\d+',  # Formato de moneda europea
    ],
}
