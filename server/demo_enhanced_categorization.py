#!/usr/bin/env python3
"""
Demo del Sistema de Categorización Avanzado de Gastify
======================================================

Este script demuestra las capacidades mejoradas del sistema de categorización:
- Soporte multiregión (Chile, Colombia, etc.)
- NLP avanzado con ensemble de modelos
- Aprendizaje continuo basado en feedback
- Análisis detallado de características

Ejecutar: python demo_enhanced_categorization.py
"""

import os
import sys
import time
from datetime import datetime
from typing import Dict, List

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.enhanced_categorization_service import (
    EnhancedCategorizationService, 
    Region, 
    CategoryPredictionAdvanced
)

def print_header(title: str):
    """Imprime un encabezado formateado"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_prediction_details(result: CategoryPredictionAdvanced, receipt_name: str):
    """Imprime los detalles de una predicción de forma formateada"""
    print(f"\n📄 {receipt_name}")
    print("-" * 40)
    print(f"🎯 Categoría: {result.category}")
    print(f"📊 Confianza: {result.confidence:.1%}")
    print(f"🔍 Método: {result.method}")
    print(f"🌍 Región: {result.region_specific_data.get('region', 'N/A')}")
    print(f"⏰ Timestamp: {result.prediction_timestamp.strftime('%H:%M:%S')}")
    
    # Mostrar datos específicos de región
    region_data = result.region_specific_data
    indicators = []
    if region_data.get("has_tax_info"): indicators.append("IVA✓")
    if region_data.get("has_currency"): indicators.append("$✓")
    if region_data.get("has_identification"): indicators.append("RUT✓")
    if region_data.get("brand_matches", 0) > 0: indicators.append(f"Marcas({region_data['brand_matches']})✓")
    
    if indicators:
        print(f"🔍 Indicadores: {' | '.join(indicators)}")
    
    # Mostrar top 3 probabilidades
    if len(result.all_probabilities) > 1:
        sorted_probs = sorted(result.all_probabilities.items(), key=lambda x: x[1], reverse=True)
        print("📈 Top probabilidades:")
        for i, (cat, prob) in enumerate(sorted_probs[:3]):
            print(f"   {i+1}. {cat}: {prob:.1%}")

def demo_basic_categorization():
    """Demostración básica de categorización"""
    print_header("DEMO 1: Categorización Básica - Chile")
    
    # Inicializar servicio para Chile
    categorizer = EnhancedCategorizationService(region=Region.CHILE)
    
    # Recibos de prueba realistas
    test_receipts = {
        "Supermercado Jumbo": """
        JUMBO BILBAO
        Av. Providencia 1234
        
        VERDURAS FRESCAS         $3.450
        LECHE DESCREMADA 1L      $1.190
        PAN INTEGRAL             $2.590
        QUESO GOUDA 250G         $3.450
        
        SUBTOTAL                $10.680
        IVA 19%                  $2.029
        TOTAL                   $12.709
        
        RUT: 81.201.000-K
        BOLETA ELECTRÓNICA
        """,
        
        "Estación Copec": """
        COPEC ESTACIÓN PROVIDENCIA
        Av. Providencia 567
        
        COMBUSTIBLE 95 OCTANOS
        45.2 LITROS
        PRECIO POR LITRO: $890
        
        TOTAL: $40.228
        
        RUT: 96.556.940-5
        FECHA: 15/07/2024
        """,
        
        "Farmacia Cruz Verde": """
        FARMACIA CRUZ VERDE
        Local Las Condes
        
        PARACETAMOL 500MG 16COMP  $2.490
        VITAMINA C 1000MG         $8.990
        ALCOHOL GEL 60ML          $1.590
        
        SUBTOTAL                 $13.070
        DESCUENTO                  $650
        TOTAL                    $12.420
        
        RUT: 89.807.200-2
        """,
        
        "Uber Viaje": """
        UBER
        Viaje desde Providencia a Santiago Centro
        
        CONDUCTOR: Juan Pérez
        VEHÍCULO: Toyota Corolla
        DISTANCIA: 8.5 KM
        TIEMPO: 25 minutos
        
        TARIFA BASE              $1.500
        TIEMPO Y DISTANCIA       $2.800
        PROPINA                    $200
        
        TOTAL                    $4.500
        """
    }
    
    print(f"🚀 Categorizando {len(test_receipts)} recibos...")
    
    results = []
    for receipt_name, receipt_text in test_receipts.items():
        start_time = time.time()
        result = categorizer.categorize_receipt_advanced(receipt_text)
        processing_time = time.time() - start_time
        
        print_prediction_details(result, receipt_name)
        print(f"⚡ Tiempo: {processing_time*1000:.1f}ms")
        
        results.append(result)
    
    # Estadísticas generales
    print(f"\n📊 Resumen:")
    print(f"   • Recibos procesados: {len(results)}")
    print(f"   • Confianza promedio: {sum(r.confidence for r in results)/len(results):.1%}")
    print(f"   • Categorías detectadas: {len(set(r.category for r in results))}")
    print(f"   • Métodos utilizados: {', '.join(set(r.method for r in results))}")

def demo_multiregion_support():
    """Demostración de soporte multiregión"""
    print_header("DEMO 2: Soporte Multiregión")
    
    # Texto de recibo genérico
    receipt_text = """
    SUPERMERCADO LOCAL
    Compra de abarrotes
    Verduras frescas
    Lácteos y carnes
    Total: $25.000
    IVA incluido
    """
    
    regions = [Region.CHILE, Region.COLOMBIA]
    
    for region in regions:
        print(f"\n🌍 Región: {region.value.upper()}")
        print("-" * 30)
        
        categorizer = EnhancedCategorizationService(region=region)
        result = categorizer.categorize_receipt_advanced(receipt_text)
        
        print(f"Categoría: {result.category}")
        print(f"Confianza: {result.confidence:.1%}")
        print(f"Marcas conocidas: {categorizer.get_model_stats()['brands_count']}")
        print(f"Categorías: {len(categorizer.categories)}")

def demo_feedback_learning():
    """Demostración del sistema de aprendizaje continuo"""
    print_header("DEMO 3: Aprendizaje Continuo con Feedback")
    
    categorizer = EnhancedCategorizationService(region=Region.CHILE)
    
    # Texto ambiguo que podría ser mal clasificado
    ambiguous_text = """
    TIENDA LOCAL
    Compra de productos varios
    Total: $15.000
    """
    
    print("📝 Texto ambiguo para categorización:")
    print(f'"{ambiguous_text.strip()}"')
    
    # Predicción inicial
    initial_result = categorizer.categorize_receipt_advanced(ambiguous_text)
    print(f"\n🤖 Predicción inicial:")
    print(f"   Categoría: {initial_result.category}")
    print(f"   Confianza: {initial_result.confidence:.1%}")
    print(f"   Método: {initial_result.method}")
    
    # Simular feedback del usuario
    print(f"\n👤 Usuario corrige categoría:")
    correct_category = "Farmacia"
    print(f"   Categoría correcta: {correct_category}")
    
    # Agregar feedback
    categorizer.add_feedback(
        text=ambiguous_text,
        predicted_category=initial_result.category,
        correct_category=correct_category,
        user_id="demo_user_001"
    )
    
    print(f"✅ Feedback agregado al sistema")
    print(f"   Feedbacks pendientes: {len(categorizer.feedback_buffer)}")
    
    # Mostrar estadísticas del modelo
    stats = categorizer.get_model_stats()
    print(f"\n📊 Estadísticas del modelo:")
    print(f"   Versión: {stats['version']}")
    print(f"   Región: {stats['region']}")
    print(f"   Categorías: {stats['categories_count']}")
    print(f"   Feedback pendiente: {stats['feedback_pending']}")

def demo_advanced_features():
    """Demostración de características avanzadas"""
    print_header("DEMO 4: Características Avanzadas de NLP")
    
    categorizer = EnhancedCategorizationService(region=Region.CHILE)
    
    # Textos con diferentes niveles de complejidad
    test_cases = [
        {
            "name": "Texto con marca clara",
            "text": "JUMBO PROVIDENCIA\nCompra semanal\nTotal: $25.000",
            "expected_method": "brand_detection"
        },
        {
            "name": "Texto con palabras clave",
            "text": "Compra de medicamentos y remedios\nPastillas para la gripe\nTotal: $8.500",
            "expected_method": "keyword_analysis"
        },
        {
            "name": "Texto genérico",
            "text": "Compra en tienda local\nProductos varios\nTotal: $12.000",
            "expected_method": "ml_ensemble"
        }
    ]
    
    for case in test_cases:
        print(f"\n🧪 {case['name']}:")
        print(f'   Texto: "{case["text"]}"')
        
        # Analizar características
        features = categorizer._extract_advanced_features(case["text"].lower())
        
        print(f"   📊 Características extraídas:")
        print(f"      • Longitud: {features['text_length']} caracteres")
        print(f"      • Palabras: {features['word_count']}")
        print(f"      • Tiene RUT: {'Sí' if features['has_rut'] else 'No'}")
        print(f"      • Tiene IVA: {'Sí' if features['has_tax'] else 'No'}")
        print(f"      • Marcas detectadas: {len(features['brand_matches'])}")
        
        # Categorizar
        result = categorizer.categorize_receipt_advanced(case["text"])
        
        print(f"   🎯 Resultado:")
        print(f"      • Categoría: {result.category}")
        print(f"      • Confianza: {result.confidence:.1%}")
        print(f"      • Método: {result.method}")
        
        # Verificar método esperado
        method_match = case["expected_method"] in result.method
        status = "✅" if method_match else "⚠️"
        print(f"      • Método esperado: {status} {case['expected_method']}")

def demo_performance_metrics():
    """Demostración de métricas de rendimiento"""
    print_header("DEMO 5: Métricas de Rendimiento")
    
    categorizer = EnhancedCategorizationService(region=Region.CHILE)
    
    # Texto de prueba
    test_text = """
    LIDER EXPRESS
    Compra rápida de abarrotes
    Pan, leche, huevos
    Total: $8.500
    IVA: 19%
    """
    
    # Medir tiempo de múltiples predicciones
    num_predictions = 20
    print(f"🚀 Realizando {num_predictions} predicciones...")
    
    start_time = time.time()
    results = []
    
    for i in range(num_predictions):
        result = categorizer.categorize_receipt_advanced(test_text)
        results.append(result)
    
    total_time = time.time() - start_time
    avg_time = total_time / num_predictions
    
    print(f"\n⚡ Resultados de rendimiento:")
    print(f"   • Tiempo total: {total_time:.3f}s")
    print(f"   • Tiempo promedio: {avg_time*1000:.1f}ms por predicción")
    print(f"   • Predicciones por segundo: {num_predictions/total_time:.1f}")
    
    # Verificar consistencia
    categories = [r.category for r in results]
    methods = [r.method for r in results]
    confidences = [r.confidence for r in results]
    
    print(f"\n🎯 Consistencia:")
    print(f"   • Categoría única: {'✅' if len(set(categories)) == 1 else '❌'}")
    print(f"   • Método único: {'✅' if len(set(methods)) == 1 else '❌'}")
    print(f"   • Confianza promedio: {sum(confidences)/len(confidences):.1%}")
    print(f"   • Desviación confianza: {max(confidences) - min(confidences):.1%}")

def main():
    """Función principal del demo"""
    print("🎉 DEMO DEL SISTEMA DE CATEGORIZACIÓN AVANZADO DE GASTIFY")
    print("=========================================================")
    print("Este demo muestra las capacidades mejoradas del sistema:")
    print("• NLP avanzado con ensemble de modelos ML")
    print("• Soporte para múltiples regiones")
    print("• Aprendizaje continuo basado en feedback")
    print("• Análisis detallado de características")
    print("• Métricas de rendimiento en tiempo real")
    
    try:
        # Ejecutar demos
        demo_basic_categorization()
        demo_multiregion_support()
        demo_feedback_learning()
        demo_advanced_features()
        demo_performance_metrics()
        
        print_header("DEMO COMPLETADO")
        print("✅ Todas las demostraciones ejecutadas exitosamente")
        print("📈 El sistema de categorización avanzado está funcionando correctamente")
        print("\n🚀 Próximos pasos:")
        print("   1. Integrar con el sistema de recibos existente")
        print("   2. Configurar reentrenamiento automático")
        print("   3. Implementar métricas de monitoreo")
        print("   4. Expandir soporte a más regiones")
        
    except Exception as e:
        print(f"\n❌ Error durante el demo: {e}")
        print("🔧 Verificar que todas las dependencias estén instaladas:")
        print("   pip install scikit-learn numpy pandas")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
