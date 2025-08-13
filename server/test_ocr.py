import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Archivos de programa\Tesseract-OCR\tesseract.exe'
print(f"Tesseract version: {pytesseract.get_tesseract_version()}")