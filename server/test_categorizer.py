"""
Script para probar la categorización automática de recibos chilenos.
Este script verifica que:
1. El modelo se inicializa correctamente
2. Se pueden categorizar textos de recibos
3. Se extraen correctamente datos específicos de Chile (RUT, IVA, etc.)
"""

from app.services.chile_ml_categorization import ChileCategorizerService
import time
import os

def main():
    print("=== Test de Categorización de Recibos Chilenos ===")
    
    # Verificar que la carpeta models existe
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    if not os.path.exists(models_dir):
        print(f"Creando directorio para modelos en {models_dir}")
        os.makedirs(models_dir)
    
    # Inicializar el categorizador
    print("\n1. Inicializando ChileCategorizerService...")
    start_time = time.time()
    categorizer = ChileCategorizerService()
    print(f"✓ Servicio inicializado en {time.time() - start_time:.2f} segundos")
    
    # Probar categorización con ejemplos chilenos
    test_texts = [
        "COPEC estación de servicio Providencia\nTotal: $25.000\nCombustible 95 octanos\nRUT: 96.556.940-5",
        "Jumbo Bilbao\nTotal: $45.670\nVerduras, lácteos, abarrotes\nFecha: 15/07/2025\nIVA: 19%",
        "Farmacia Cruz Verde\nLocal Las Condes\nAnalgésicos, vitaminas\nRUT: 89.807.200-2\nTotal: $12.500",
        "FALABELLA\nZapatos deportivos\nRopa de temporada\nTotal: $75.990\nBoleta electrónica",
        "UBER viaje desde Providencia a Santiago Centro\nTotal: $4.500\nConductor: Juan Pérez",
        "Clínica Santa María\nConsulta médica - Dr. González\nFecha: 20/07/2025\nTotal: $85.000"
    ]
    
    print("\n2. Probando categorización de textos:")
    for i, text in enumerate(test_texts, 1):
        print(f"\nTest {i}: Analizando texto:")
        print("-------------------")
        print(text[:80] + "..." if len(text) > 80 else text)
        print("-------------------")
        
        result = categorizer.categorize_receipt(text)
        
        print(f"✓ Categoría: {result['category']} (confianza: {result['confidence']:.2f})")
        print(f"✓ Método: {result['method']}")
        
        if result["chile_specific"]["rut_detected"]:
            print(f"✓ RUT detectado: {result['chile_specific']['rut_detected']}")
        
        if result["chile_specific"]["document_type"]:
            print(f"✓ Tipo de documento: {result['chile_specific']['document_type']}")
        
        print(f"✓ IVA detectado: {'Sí' if result['chile_specific']['iva_detected'] else 'No'}")
        
        if result["chile_specific"]["known_brand"]:
            print(f"✓ Marca conocida: {result['chile_specific']['known_brand']}")
        
        print("\nProbabilidades por categoría:")
        # Mostrar las 3 categorías más probables
        sorted_probs = sorted(result["all_probabilities"].items(), key=lambda x: x[1], reverse=True)[:3]
        for cat, prob in sorted_probs:
            print(f"  - {cat}: {prob:.2f}")
    
    print("\n3. Probando extracción de datos específicos de Chile:")
    # Texto con datos chilenos específicos
    chile_text = """
    Boleta Electrónica
    RUT: 76.555.400-4
    Fecha: 25/07/2025
    Tienda: Falabella Alto Las Condes
    Producto: Televisor Samsung 55"
    Valor Neto: $550.000
    IVA (19%): $104.500
    Total: $654.500
    """
    
    print("\nTexto de prueba:")
    print("-------------------")
    print(chile_text)
    print("-------------------")
    
    chile_data = categorizer.extract_chile_specific_data(chile_text)
    print("\nDatos específicos de Chile extraídos:")
    print(f"✓ RUT: {chile_data['rut_detected']}")
    print(f"✓ Tipo de documento: {chile_data['document_type']}")
    print(f"✓ IVA detectado: {'Sí' if chile_data['iva_detected'] else 'No'}")
    print(f"✓ Marca conocida: {chile_data['known_brand'] or 'No detectada'}")
    
    print("\n=== Test de Categorización Completado ===")

if __name__ == "__main__":
    main()
