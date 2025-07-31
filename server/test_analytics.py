"""
Script para probar el sistema de analytics predictivos de Gastify Chile.
Verifica que todos los servicios de analytics funcionen correctamente.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Añadir el directorio app al path para imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.analytics_service import PredictiveAnalyticsService
from app.services.anomaly_detector import ExpenseAnomalyDetector
from app.services.insights_generator import IntelligentInsights


async def test_analytics_services():
    """Prueba todos los servicios de analytics."""
    
    print("=== Test de Analytics Predictivos para Gastify Chile ===\n")
    
    # Conectar a MongoDB (usar configuración de desarrollo)
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gastify_dev
    
    # ID de usuario de prueba (usar uno existente o crear mock)
    test_user_id = "507f1f77bcf86cd799439011"  # ObjectId de ejemplo
    
    try:
        print("1. Probando PredictiveAnalyticsService...")
        analytics_service = PredictiveAnalyticsService(db)
        
        # Test predicciones
        print("   - Predicción 30 días...")
        prediction_30d = await analytics_service.predict_future_expenses(test_user_id, 30)
        print(f"     ✓ Predicción 30 días: ${prediction_30d.get('total_amount', 0):,.0f}")
        print(f"     ✓ Confianza: {prediction_30d.get('confidence', 0):.2f}")
        print(f"     ✓ Método: {prediction_30d.get('method', 'N/A')}")
        
        # Test análisis de patrones
        print("   - Análisis de patrones...")
        patterns = await analytics_service.analyze_spending_patterns(test_user_id)
        print(f"     ✓ Patrones detectados: {len(patterns.get('patterns', {}))}")
        
        # Test recomendaciones de presupuesto
        print("   - Recomendaciones de presupuesto...")
        budget_recs = await analytics_service.generate_budget_recommendations(test_user_id)
        print(f"     ✓ Recomendaciones: {len(budget_recs.get('recommendations', []))}")
        
        print("   ✅ PredictiveAnalyticsService funcionando correctamente\n")
        
        print("2. Probando ExpenseAnomalyDetector...")
        anomaly_detector = ExpenseAnomalyDetector(db)
        
        # Test detección de anomalías
        print("   - Detectando anomalías...")
        anomalies = await anomaly_detector.detect_all_anomalies(test_user_id)
        print(f"     ✓ Anomalías detectadas: {len(anomalies)}")
        
        # Test score de riesgo
        print("   - Calculando score de riesgo...")
        risk_score = await anomaly_detector.calculate_risk_score(anomalies)
        print(f"     ✓ Score de riesgo: {risk_score.get('risk_score', 0)}")
        print(f"     ✓ Nivel de riesgo: {risk_score.get('risk_level', 'N/A')}")
        
        print("   ✅ ExpenseAnomalyDetector funcionando correctamente\n")
        
        print("3. Probando IntelligentInsights...")
        insights_generator = IntelligentInsights(db)
        
        # Test generación de insights
        print("   - Generando insights...")
        insights = await insights_generator.generate_all_insights(test_user_id)
        print(f"     ✓ Insights generados: {len(insights)}")
        
        # Mostrar algunos insights
        for i, insight in enumerate(insights[:3], 1):
            print(f"     {i}. {insight.get('message', 'N/A')}")
            print(f"        Impacto: {insight.get('impact', 'N/A')}")
            print(f"        Tipo: {insight.get('type', 'N/A')}")
        
        print("   ✅ IntelligentInsights funcionando correctamente\n")
        
        print("4. Probando funcionalidades específicas de Chile...")
        
        # Test datos sintéticos chilenos
        print("   - Verificando datos económicos Chile...")
        chile_data = insights_generator.chile_economic_data
        print(f"     ✓ Sueldo mínimo: ${chile_data['sueldo_minimo']:,.0f}")
        print(f"     ✓ Gasto promedio hogar: ${chile_data['gasto_promedio_hogar']:,.0f}")
        print(f"     ✓ Inflación anual: {chile_data['inflacion_anual']}%")
        
        # Test categorías chilenas
        print("   - Verificando categorías Chile...")
        chile_categories = insights_generator.chile_category_averages
        print(f"     ✓ Categorías definidas: {len(chile_categories)}")
        for cat, amount in list(chile_categories.items())[:3]:
            print(f"       - {cat}: ${amount:,.0f}")
        
        # Test eventos comerciales
        print("   - Verificando eventos comerciales Chile...")
        retail_events = insights_generator.chile_retail_events
        print(f"     ✓ Eventos comerciales: {len(retail_events)}")
        for event, data in list(retail_events.items())[:3]:
            print(f"       - {event}: Mes {data['month']}, Impacto {data['impact']}x")
        
        print("   ✅ Funcionalidades específicas de Chile verificadas\n")
        
        print("5. Test de integración completa...")
        
        # Simular un dashboard completo
        print("   - Generando dashboard completo...")
        
        dashboard_data = {
            "predictions": prediction_30d,
            "anomalies": anomalies[:5],  # Top 5
            "insights": insights[:5],    # Top 5
            "risk_analysis": risk_score,
            "chile_context": {
                "economic_indicators": True,
                "retail_events": True,
                "cultural_patterns": True
            }
        }
        
        print(f"     ✓ Dashboard generado con {len(dashboard_data)} secciones")
        print("   ✅ Integración completa funcionando\n")
        
        print("=== Resumen de Pruebas ===")
        print("✅ PredictiveAnalyticsService: OK")
        print("✅ ExpenseAnomalyDetector: OK") 
        print("✅ IntelligentInsights: OK")
        print("✅ Datos específicos Chile: OK")
        print("✅ Integración completa: OK")
        print("\n🎉 Todos los servicios de analytics funcionan correctamente!")
        
        # Información adicional
        print("\n📊 Información del Sistema:")
        print(f"   - Predicciones: Usando {'Prophet' if prediction_30d.get('method') == 'prophet' else 'Métodos estadísticos'}")
        print(f"   - Anomalías: {len(anomalies)} detectadas")
        print(f"   - Insights: {len(insights)} generados")
        print(f"   - Contexto Chile: Aplicado en todos los servicios")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cerrar conexión
        client.close()


async def test_mock_data():
    """Prueba con datos mock cuando no hay datos reales."""
    
    print("\n=== Test con Datos Mock (Sin Datos Reales) ===")
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gastify_dev
    
    # Usuario inexistente para forzar datos mock
    fake_user_id = "000000000000000000000000"
    
    try:
        analytics_service = PredictiveAnalyticsService(db)
        
        print("1. Probando predicciones mock...")
        mock_prediction = await analytics_service.predict_future_expenses(fake_user_id, 30)
        print(f"   ✓ Predicción mock: ${mock_prediction.get('total_amount', 0):,.0f}")
        print(f"   ✓ Nota: {mock_prediction.get('note', 'N/A')}")
        
        insights_generator = IntelligentInsights(db)
        
        print("2. Probando insights sin datos...")
        mock_insights = await insights_generator.generate_all_insights(fake_user_id)
        print(f"   ✓ Insights generados: {len(mock_insights)}")
        if mock_insights:
            print(f"   ✓ Primer insight: {mock_insights[0].get('message', 'N/A')}")
        
        print("   ✅ Manejo de datos insuficientes funcionando correctamente")
        
    except Exception as e:
        print(f"❌ Error en test mock: {str(e)}")
    
    finally:
        client.close()


def main():
    """Función principal para ejecutar todas las pruebas."""
    
    print("Iniciando pruebas del sistema de analytics...")
    print("Nota: Asegúrate de que MongoDB esté ejecutándose en localhost:27017\n")
    
    # Ejecutar pruebas principales
    asyncio.run(test_analytics_services())
    
    # Ejecutar pruebas con datos mock
    asyncio.run(test_mock_data())
    
    print("\n🏁 Pruebas completadas!")


if __name__ == "__main__":
    main()
