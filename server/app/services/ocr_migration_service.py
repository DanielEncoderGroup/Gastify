"""
Servicio de Migración y Rollback para Sistema OCR Híbrido
Proporciona migración gradual, validación de compatibilidad y rollback seguro
"""

import json
import logging
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import shutil
import os

from .ocr_service import FreeOCRService
from .enhanced_ocr_service import EnhancedOCRService
from .hybrid_ocr_service import HybridOCRService
from .enhanced_hybrid_ocr_service import EnhancedHybridOCRService
from .ocr_metrics_service import ocr_metrics_service

logger = logging.getLogger(__name__)


class MigrationPhase(Enum):
    """Fases de migración del sistema OCR."""
    PREPARATION = "preparation"
    TESTING = "testing"
    GRADUAL_ROLLOUT = "gradual_rollout"
    FULL_DEPLOYMENT = "full_deployment"
    COMPLETED = "completed"


class MigrationStatus(Enum):
    """Estados de migración."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


@dataclass
class MigrationConfig:
    """Configuración de migración."""
    enable_gradual_rollout: bool = True
    gradual_rollout_percentage: float = 0.10  # Comenzar con 10%
    max_rollout_percentage: float = 1.0  # 100%
    rollout_increment: float = 0.20  # Incrementar 20% cada vez
    validation_threshold: float = 0.95  # 95% de confianza mínima
    error_rate_threshold: float = 0.05  # 5% de errores máximo
    performance_threshold: float = 10.0  # 10 segundos máximo
    minimum_test_samples: int = 50  # Mínimo de muestras para validar
    rollback_on_failure: bool = True
    backup_enabled: bool = True


@dataclass
class MigrationState:
    """Estado actual de la migración."""
    current_phase: MigrationPhase
    status: MigrationStatus
    rollout_percentage: float
    start_time: datetime
    last_update: datetime
    processed_requests: int
    successful_requests: int
    failed_requests: int
    average_confidence: float
    average_processing_time: float
    rollback_reason: Optional[str] = None


class OCRMigrationService:
    """
    Servicio de migración gradual para el sistema OCR híbrido.
    
    Características:
    - Migración por fases con validación automática
    - Rollout gradual por porcentaje de usuarios
    - Validación continua de rendimiento
    - Rollback automático en caso de problemas
    - Backup y restauración de configuraciones
    - Métricas detalladas de migración
    """
    
    def __init__(self, migration_dir: str = "ocr_migration"):
        """Inicializa el servicio de migración."""
        self.migration_dir = Path(migration_dir)
        self.migration_dir.mkdir(exist_ok=True)
        
        self.config_file = self.migration_dir / "migration_config.json"
        self.state_file = self.migration_dir / "migration_state.json"
        self.backup_dir = self.migration_dir / "backups"
        self.validation_log = self.migration_dir / "validation_log.jsonl"
        
        self.backup_dir.mkdir(exist_ok=True)
        
        # Servicios OCR
        self.legacy_service = FreeOCRService()
        self.hybrid_service = HybridOCRService()
        self.enhanced_hybrid_service = EnhancedHybridOCRService()
        
        # Configuración y estado
        self.config = self._load_config()
        self.state = self._load_state()
        
        logger.info("OCRMigrationService inicializado")
    
    def _load_config(self) -> MigrationConfig:
        """Carga la configuración de migración."""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)
                    return MigrationConfig(**config_data)
            else:
                config = MigrationConfig()
                self._save_config(config)
                return config
        except Exception as e:
            logger.error(f"Error cargando configuración: {str(e)}")
            return MigrationConfig()
    
    def _save_config(self, config: MigrationConfig) -> None:
        """Guarda la configuración de migración."""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(asdict(config), f, indent=2)
        except Exception as e:
            logger.error(f"Error guardando configuración: {str(e)}")
    
    def _load_state(self) -> MigrationState:
        """Carga el estado de migración."""
        try:
            if self.state_file.exists():
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    state_data = json.load(f)
                    
                    # Convertir timestamps
                    state_data['start_time'] = datetime.fromisoformat(state_data['start_time'])
                    state_data['last_update'] = datetime.fromisoformat(state_data['last_update'])
                    
                    # Convertir enums
                    state_data['current_phase'] = MigrationPhase(state_data['current_phase'])
                    state_data['status'] = MigrationStatus(state_data['status'])
                    
                    return MigrationState(**state_data)
            else:
                state = MigrationState(
                    current_phase=MigrationPhase.PREPARATION,
                    status=MigrationStatus.NOT_STARTED,
                    rollout_percentage=0.0,
                    start_time=datetime.now(),
                    last_update=datetime.now(),
                    processed_requests=0,
                    successful_requests=0,
                    failed_requests=0,
                    average_confidence=0.0,
                    average_processing_time=0.0
                )
                self._save_state(state)
                return state
        except Exception as e:
            logger.error(f"Error cargando estado: {str(e)}")
            return MigrationState(
                current_phase=MigrationPhase.PREPARATION,
                status=MigrationStatus.NOT_STARTED,
                rollout_percentage=0.0,
                start_time=datetime.now(),
                last_update=datetime.now(),
                processed_requests=0,
                successful_requests=0,
                failed_requests=0,
                average_confidence=0.0,
                average_processing_time=0.0
            )
    
    def _save_state(self, state: MigrationState) -> None:
        """Guarda el estado de migración."""
        try:
            state_dict = asdict(state)
            state_dict['start_time'] = state.start_time.isoformat()
            state_dict['last_update'] = state.last_update.isoformat()
            state_dict['current_phase'] = state.current_phase.value
            state_dict['status'] = state.status.value
            
            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(state_dict, f, indent=2)
        except Exception as e:
            logger.error(f"Error guardando estado: {str(e)}")
    
    async def start_migration(self, config: Optional[MigrationConfig] = None) -> Dict[str, Any]:
        """Inicia el proceso de migración."""
        try:
            if self.state.status == MigrationStatus.IN_PROGRESS:
                return {
                    "success": False,
                    "message": "La migración ya está en progreso",
                    "current_state": asdict(self.state)
                }
            
            # Actualizar configuración si se proporciona
            if config:
                self.config = config
                self._save_config(config)
            
            # Crear backup antes de iniciar
            if self.config.backup_enabled:
                backup_result = await self._create_backup()
                if not backup_result["success"]:
                    return backup_result
            
            # Actualizar estado
            self.state.status = MigrationStatus.IN_PROGRESS
            self.state.current_phase = MigrationPhase.PREPARATION
            self.state.start_time = datetime.now()
            self.state.last_update = datetime.now()
            self._save_state(self.state)
            
            logger.info("Migración OCR iniciada")
            
            return {
                "success": True,
                "message": "Migración iniciada exitosamente",
                "current_state": asdict(self.state)
            }
            
        except Exception as e:
            logger.error(f"Error iniciando migración: {str(e)}")
            self.state.status = MigrationStatus.FAILED
            self._save_state(self.state)
            return {
                "success": False,
                "message": f"Error iniciando migración: {str(e)}"
            }
    
    async def should_use_hybrid_ocr(self, user_id: Optional[str] = None) -> bool:
        """
        Determina si debe usar el sistema OCR híbrido basado en el estado de migración.
        """
        try:
            # Si la migración no está activa, usar sistema legacy
            if self.state.status != MigrationStatus.IN_PROGRESS:
                return False
            
            # Si está en preparación o testing, usar sistema legacy
            if self.state.current_phase in [MigrationPhase.PREPARATION, MigrationPhase.TESTING]:
                return False
            
            # Si está en rollout completo, usar híbrido
            if self.state.current_phase == MigrationPhase.FULL_DEPLOYMENT:
                return True
            
            # Si está en rollout gradual, decidir por porcentaje
            if self.state.current_phase == MigrationPhase.GRADUAL_ROLLOUT:
                # Implementación simple: usar hash del user_id si está disponible
                if user_id:
                    import hashlib
                    hash_value = int(hashlib.md5(user_id.encode()).hexdigest()[:8], 16)
                    user_percentage = (hash_value % 10000) / 10000.0
                    return user_percentage < self.state.rollout_percentage
                else:
                    # Sin user_id, usar porcentaje aleatorio
                    import random
                    return random.random() < self.state.rollout_percentage
            
            return False
            
        except Exception as e:
            logger.error(f"Error determinando uso de híbrido: {str(e)}")
            return False
    
    async def record_migration_metric(self, 
                                    used_hybrid: bool,
                                    confidence: float,
                                    processing_time: float,
                                    success: bool,
                                    error_type: Optional[str] = None) -> None:
        """Registra una métrica de migración."""
        try:
            # Actualizar estado
            self.state.processed_requests += 1
            
            if success:
                self.state.successful_requests += 1
            else:
                self.state.failed_requests += 1
            
            # Actualizar promedios (simple moving average)
            n = self.state.processed_requests
            self.state.average_confidence = ((self.state.average_confidence * (n-1)) + confidence) / n
            self.state.average_processing_time = ((self.state.average_processing_time * (n-1)) + processing_time) / n
            
            self.state.last_update = datetime.now()
            self._save_state(self.state)
            
            # Log para análisis
            metric_log = {
                "timestamp": datetime.now().isoformat(),
                "used_hybrid": used_hybrid,
                "confidence": confidence,
                "processing_time": processing_time,
                "success": success,
                "error_type": error_type,
                "migration_phase": self.state.current_phase.value,
                "rollout_percentage": self.state.rollout_percentage
            }
            
            with open(self.validation_log, 'a', encoding='utf-8') as f:
                f.write(json.dumps(metric_log) + '\n')
            
            # Verificar si debe avanzar el rollout
            if self.state.current_phase == MigrationPhase.GRADUAL_ROLLOUT:
                await self._check_rollout_advancement()
                
        except Exception as e:
            logger.error(f"Error registrando métrica de migración: {str(e)}")
    
    async def _check_rollout_advancement(self) -> None:
        """Verifica si se puede avanzar el porcentaje de rollout."""
        try:
            # Verificar si hay suficientes muestras
            if self.state.processed_requests < self.config.minimum_test_samples:
                return
            
            # Verificar métricas de calidad
            error_rate = self.state.failed_requests / self.state.processed_requests
            
            quality_ok = (
                self.state.average_confidence >= self.config.validation_threshold and
                error_rate <= self.config.error_rate_threshold and
                self.state.average_processing_time <= self.config.performance_threshold
            )
            
            if quality_ok:
                # Avanzar rollout
                new_percentage = min(
                    self.state.rollout_percentage + self.config.rollout_increment,
                    self.config.max_rollout_percentage
                )
                
                if new_percentage != self.state.rollout_percentage:
                    self.state.rollout_percentage = new_percentage
                    
                    # Si llegamos al 100%, marcar como deployment completo
                    if new_percentage >= self.config.max_rollout_percentage:
                        self.state.current_phase = MigrationPhase.FULL_DEPLOYMENT
                        logger.info("Migración avanzada a deployment completo")
                    else:
                        logger.info(f"Rollout avanzado a {new_percentage*100:.0f}%")
                    
                    self._save_state(self.state)
            else:
                # Si la calidad no es buena, considerar rollback
                if self.config.rollback_on_failure:
                    await self._initiate_rollback("Métricas de calidad por debajo del threshold")
                    
        except Exception as e:
            logger.error(f"Error verificando avance de rollout: {str(e)}")
    
    async def _initiate_rollback(self, reason: str) -> Dict[str, Any]:
        """Inicia el proceso de rollback."""
        try:
            logger.warning(f"Iniciando rollback: {reason}")
            
            self.state.status = MigrationStatus.ROLLED_BACK
            self.state.rollback_reason = reason
            self.state.last_update = datetime.now()
            self._save_state(self.state)
            
            return {
                "success": True,
                "message": f"Rollback ejecutado: {reason}"
            }
                
        except Exception as e:
            logger.error(f"Error en rollback: {str(e)}")
            return {
                "success": False,
                "message": f"Error ejecutando rollback: {str(e)}"
            }
    
    async def _create_backup(self) -> Dict[str, Any]:
        """Crea un backup de la configuración actual."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"backup_{timestamp}"
            backup_path.mkdir(exist_ok=True)
            
            # Crear manifest del backup
            manifest = {
                "backup_timestamp": timestamp,
                "migration_state": asdict(self.state),
                "migration_config": asdict(self.config)
            }
            
            with open(backup_path / "manifest.json", 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, default=str)
            
            logger.info(f"Backup creado en: {backup_path}")
            
            return {
                "success": True,
                "message": "Backup creado exitosamente",
                "backup_path": str(backup_path)
            }
            
        except Exception as e:
            logger.error(f"Error creando backup: {str(e)}")
            return {
                "success": False,
                "message": f"Error creando backup: {str(e)}"
            }
    
    def get_migration_status(self) -> Dict[str, Any]:
        """Obtiene el estado actual de la migración."""
        try:
            status = {
                "migration_state": asdict(self.state),
                "migration_config": asdict(self.config),
                "statistics": {
                    "success_rate": 0.0,
                    "error_rate": 0.0,
                    "total_processed": self.state.processed_requests
                },
                "next_actions": []
            }
            
            # Calcular estadísticas
            if self.state.processed_requests > 0:
                status["statistics"]["success_rate"] = self.state.successful_requests / self.state.processed_requests
                status["statistics"]["error_rate"] = self.state.failed_requests / self.state.processed_requests
            
            # Sugerir próximas acciones
            if self.state.status == MigrationStatus.NOT_STARTED:
                status["next_actions"].append("Iniciar migración")
            elif self.state.status == MigrationStatus.IN_PROGRESS:
                if self.state.current_phase == MigrationPhase.GRADUAL_ROLLOUT:
                    status["next_actions"].append(f"Monitoreando rollout al {self.state.rollout_percentage*100:.0f}%")
                elif self.state.current_phase == MigrationPhase.FULL_DEPLOYMENT:
                    status["next_actions"].append("Migración completa - Monitorear sistema")
            elif self.state.status == MigrationStatus.PAUSED:
                status["next_actions"].append("Resolver problemas y reanudar migración")
            
            return status
            
        except Exception as e:
            logger.error(f"Error obteniendo estado: {str(e)}")
            return {"error": str(e)}


# Instancia global del servicio de migración
ocr_migration_service = OCRMigrationService()
