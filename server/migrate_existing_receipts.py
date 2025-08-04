#!/usr/bin/env python3
"""
Script de Migración - Recibos Existentes
========================================

Este script procesa recibos existentes para agregar información de geolocalización
a aquellos que no la tienen pero sí tienen datos de OCR.
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any
import os
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

async def get_receipts_without_location():
    """Obtener recibos que tienen OCR pero no tienen datos de ubicación"""
    from app.core.database import get_database
    
    db = get_database()
    
    # Buscar recibos con OCR pero sin locationData
    query = {
        "ocrData": {"$exists": True, "$ne": None},
        "$or": [
            {"locationData": {"$exists": False}},
            {"locationData": None}
        ]
    }
    
    cursor = db.receipts.find(query)
    receipts = await cursor.to_list(length=None)
    
    logger.info(f"📊 Encontrados {len(receipts)} recibos para procesar")
    return receipts

async def process_receipt_location(receipt: Dict[str, Any]) -> Dict[str, Any]:
    """Procesar ubicación de un recibo individual"""
    from app.services.geolocation_service import GeolocationService
    from app.models.location_models import LocationDataModel
    
    try:
        # Obtener texto OCR
        ocr_data = receipt.get("ocrData", {})
        raw_text = ocr_data.get("raw_text", "")
        
        if not raw_text:
            logger.warning(f"⚠️  Recibo {receipt['_id']}: Sin texto OCR")
            return None
        
        # Procesar geolocalización
        geo_service = GeolocationService()
        location_result = await geo_service.process_receipt_location(raw_text)
        
        if location_result:
            location_data = LocationDataModel(
                location=location_result,
                extraction_method=location_result.get("extraction_method", "migration"),
                confidence=location_result.get("confidence", 0.0)
            )
            
            logger.info(f"✅ Recibo {receipt['_id']}: Ubicación extraída con confianza {location_data.confidence:.2f}")
            return location_data.dict()
        else:
            logger.info(f"ℹ️  Recibo {receipt['_id']}: No se pudo extraer ubicación")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error procesando recibo {receipt['_id']}: {str(e)}")
        return None

async def update_receipt_with_location(receipt_id: str, location_data: Dict[str, Any]):
    """Actualizar recibo con datos de ubicación"""
    from app.core.database import get_database
    from bson import ObjectId
    
    db = get_database()
    
    try:
        result = await db.receipts.update_one(
            {"_id": ObjectId(receipt_id)},
            {
                "$set": {
                    "locationData": location_data,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"💾 Recibo {receipt_id}: Actualizado con datos de ubicación")
            return True
        else:
            logger.warning(f"⚠️  Recibo {receipt_id}: No se pudo actualizar")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error actualizando recibo {receipt_id}: {str(e)}")
        return False

async def migrate_receipts_batch(receipts: List[Dict[str, Any]], batch_size: int = 10):
    """Procesar recibos en lotes para evitar sobrecarga"""
    total_receipts = len(receipts)
    processed = 0
    updated = 0
    errors = 0
    
    logger.info(f"🚀 Iniciando migración de {total_receipts} recibos en lotes de {batch_size}")
    
    for i in range(0, total_receipts, batch_size):
        batch = receipts[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_receipts + batch_size - 1) // batch_size
        
        logger.info(f"📦 Procesando lote {batch_num}/{total_batches} ({len(batch)} recibos)")
        
        # Procesar lote en paralelo
        tasks = [process_receipt_location(receipt) for receipt in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Actualizar recibos con resultados exitosos
        for receipt, result in zip(batch, results):
            processed += 1
            
            if isinstance(result, Exception):
                logger.error(f"❌ Error en recibo {receipt['_id']}: {result}")
                errors += 1
                continue
                
            if result is not None:
                success = await update_receipt_with_location(str(receipt['_id']), result)
                if success:
                    updated += 1
                else:
                    errors += 1
        
        # Pausa entre lotes para no sobrecargar la API
        if i + batch_size < total_receipts:
            logger.info("⏳ Pausa de 2 segundos entre lotes...")
            await asyncio.sleep(2)
    
    return {
        "total_processed": processed,
        "total_updated": updated,
        "total_errors": errors,
        "success_rate": (updated / processed) * 100 if processed > 0 else 0
    }

async def generate_migration_report(stats: Dict[str, Any]):
    """Generar reporte de migración"""
    report_file = f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    report_content = f"""
REPORTE DE MIGRACIÓN - SISTEMA DE GEOLOCALIZACIÓN
===============================================

Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

ESTADÍSTICAS:
- Total de recibos procesados: {stats['total_processed']}
- Recibos actualizados exitosamente: {stats['total_updated']}
- Errores encontrados: {stats['total_errors']}
- Tasa de éxito: {stats['success_rate']:.1f}%

DETALLES:
- Recibos con ubicación extraída: {stats['total_updated']}
- Recibos sin ubicación disponible: {stats['total_processed'] - stats['total_updated'] - stats['total_errors']}
- Errores de procesamiento: {stats['total_errors']}

PRÓXIMOS PASOS:
1. Verificar logs detallados en migration.log
2. Revisar recibos con errores manualmente
3. Ejecutar análisis de geolocalización para usuarios
4. Configurar procesamiento automático para nuevos recibos

NOTAS:
- Los recibos migrados tienen extraction_method = "migration"
- La confianza puede ser menor que en procesamiento en tiempo real
- Se recomienda revisar recibos con confianza < 0.5
"""

    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    logger.info(f"📄 Reporte generado: {report_file}")
    return report_file

async def verify_migration():
    """Verificar que la migración fue exitosa"""
    from app.core.database import get_database
    
    db = get_database()
    
    # Contar recibos con locationData
    total_receipts = await db.receipts.count_documents({})
    receipts_with_location = await db.receipts.count_documents({
        "locationData": {"$exists": True, "$ne": None}
    })
    
    # Contar por método de extracción
    migration_receipts = await db.receipts.count_documents({
        "locationData.extraction_method": "migration"
    })
    
    logger.info("📊 VERIFICACIÓN POST-MIGRACIÓN:")
    logger.info(f"  Total de recibos: {total_receipts}")
    logger.info(f"  Recibos con ubicación: {receipts_with_location}")
    logger.info(f"  Recibos migrados: {migration_receipts}")
    logger.info(f"  Cobertura: {(receipts_with_location/total_receipts)*100:.1f}%")
    
    return {
        "total_receipts": total_receipts,
        "receipts_with_location": receipts_with_location,
        "migration_receipts": migration_receipts,
        "coverage_percentage": (receipts_with_location/total_receipts)*100 if total_receipts > 0 else 0
    }

async def main():
    """Función principal de migración"""
    logger.info("🚀 INICIANDO MIGRACIÓN DE RECIBOS EXISTENTES")
    logger.info("=" * 60)
    
    try:
        # Verificar configuración
        if not os.getenv("GOOGLE_MAPS_API_KEY"):
            logger.error("❌ GOOGLE_MAPS_API_KEY no configurado")
            logger.error("   Configurar en archivo .env antes de ejecutar migración")
            return
        
        # Obtener recibos para procesar
        logger.info("🔍 Buscando recibos para migrar...")
        receipts = await get_receipts_without_location()
        
        if not receipts:
            logger.info("✅ No hay recibos para migrar")
            return
        
        # Confirmar migración
        print(f"\n⚠️  Se van a procesar {len(receipts)} recibos.")
        print("   Esto puede tomar varios minutos y consumir cuota de API de Google Maps.")
        confirm = input("   ¿Continuar? (y/N): ").lower().strip()
        
        if confirm != 'y':
            logger.info("❌ Migración cancelada por el usuario")
            return
        
        # Ejecutar migración
        logger.info("🔄 Iniciando procesamiento...")
        start_time = datetime.now()
        
        stats = await migrate_receipts_batch(receipts, batch_size=5)
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Generar reporte
        logger.info("📊 Generando reporte...")
        report_file = await generate_migration_report(stats)
        
        # Verificar migración
        logger.info("🔍 Verificando migración...")
        verification = await verify_migration()
        
        # Resumen final
        logger.info("\n" + "=" * 60)
        logger.info("🎉 MIGRACIÓN COMPLETADA")
        logger.info("=" * 60)
        logger.info(f"⏱️  Duración: {duration}")
        logger.info(f"📊 Procesados: {stats['total_processed']}")
        logger.info(f"✅ Exitosos: {stats['total_updated']}")
        logger.info(f"❌ Errores: {stats['total_errors']}")
        logger.info(f"📈 Tasa de éxito: {stats['success_rate']:.1f}%")
        logger.info(f"📄 Reporte: {report_file}")
        logger.info(f"🎯 Cobertura total: {verification['coverage_percentage']:.1f}%")
        
        if stats['total_errors'] > 0:
            logger.warning(f"⚠️  {stats['total_errors']} recibos tuvieron errores")
            logger.warning("   Revisar migration.log para detalles")
        
    except KeyboardInterrupt:
        logger.info("\n❌ Migración interrumpida por el usuario")
    except Exception as e:
        logger.error(f"❌ Error fatal en migración: {str(e)}")
        raise

if __name__ == "__main__":
    # Cambiar al directorio del proyecto
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Ejecutar migración
    asyncio.run(main())
