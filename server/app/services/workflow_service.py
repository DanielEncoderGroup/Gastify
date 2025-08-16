"""
Servicio de Gestión de Workflows para Gastify
Maneja CRUD de workflows, evaluación de aprobaciones y gestión de instancias
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.workflow import (
    WorkflowModel, WorkflowCreate, WorkflowUpdate, ApprovalInstance,
    ApprovalDecision, WorkflowEvaluation, ApprovalStatus, ApprovalAction,
    OrganizationRole, UserRoleAssignment, WorkflowAnalytics
)
from app.models.receipt import ReceiptModel
from app.models.user import UserModel
from app.services.workflow_engine import WorkflowEngine, ChileanWorkflowTemplates
from app.core.database import get_database

logger = logging.getLogger(__name__)

class WorkflowService:
    """Servicio principal para gestión de workflows de aprobación"""
    
    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.db = db if db is not None else get_database()
        self.engine = WorkflowEngine()
        self.workflows_collection = self.db.workflows
        self.approval_instances_collection = self.db.approval_instances
        self.organization_roles_collection = self.db.organization_roles
        self.user_role_assignments_collection = self.db.user_role_assignments
    
    # CRUD de Workflows
    async def create_workflow(
        self,
        workflow_data: WorkflowCreate,
        company_id: str,
        created_by: str
    ) -> WorkflowModel:
        """Crea un nuevo workflow"""
        try:
            # Si es workflow por defecto, desactivar otros workflows por defecto
            if workflow_data.is_default:
                await self.workflows_collection.update_many(
                    {"company_id": company_id, "is_default": True},
                    {"$set": {"is_default": False, "updated_at": datetime.utcnow()}}
                )
            
            workflow = WorkflowModel(
                company_id=company_id,
                created_by=created_by,
                **workflow_data.dict()
            )
            
            result = await self.workflows_collection.insert_one(workflow.dict(by_alias=True))
            workflow.id = result.inserted_id
            
            logger.info(f"Workflow creado: {workflow.name} para empresa {company_id}")
            return workflow
            
        except Exception as e:
            logger.error(f"Error creando workflow: {str(e)}")
            raise
    
    async def get_workflow(self, workflow_id: str, company_id: str) -> Optional[WorkflowModel]:
        """Obtiene un workflow por ID"""
        try:
            workflow_data = await self.workflows_collection.find_one({
                "_id": ObjectId(workflow_id),
                "company_id": company_id
            })
            
            if workflow_data:
                return WorkflowModel(**workflow_data)
            return None
            
        except Exception as e:
            logger.error(f"Error obteniendo workflow {workflow_id}: {str(e)}")
            return None
    
    async def list_workflows(self, company_id: str) -> List[WorkflowModel]:
        """Lista todos los workflows de una empresa"""
        try:
            cursor = self.workflows_collection.find({"company_id": company_id})
            workflows = []
            
            async for workflow_data in cursor:
                workflows.append(WorkflowModel(**workflow_data))
            
            return workflows
            
        except Exception as e:
            logger.error(f"Error listando workflows para empresa {company_id}: {str(e)}")
            return []
    
    async def update_workflow(
        self,
        workflow_id: str,
        company_id: str,
        workflow_update: WorkflowUpdate
    ) -> Optional[WorkflowModel]:
        """Actualiza un workflow"""
        try:
            update_data = {
                k: v for k, v in workflow_update.model_dump().items() 
                if v is not None
            }
            update_data["updated_at"] = datetime.utcnow()
            
            # Si se está marcando como por defecto, desactivar otros
            if workflow_update.is_default:
                await self.workflows_collection.update_many(
                    {"company_id": company_id, "is_default": True},
                    {"$set": {"is_default": False, "updated_at": datetime.utcnow()}}
                )
            
            result = await self.workflows_collection.update_one(
                {"_id": ObjectId(workflow_id), "company_id": company_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return await self.get_workflow(workflow_id, company_id)
            return None
            
        except Exception as e:
            logger.error(f"Error actualizando workflow {workflow_id}: {str(e)}")
            return None
    
    async def delete_workflow(self, workflow_id: str, company_id: str) -> bool:
        """Elimina un workflow"""
        try:
            # Verificar que no haya instancias de aprobación pendientes
            pending_count = await self.approval_instances_collection.count_documents({
                "workflow_id": workflow_id,
                "status": ApprovalStatus.PENDING
            })
            
            if pending_count > 0:
                raise ValueError(f"No se puede eliminar workflow con {pending_count} aprobaciones pendientes")
            
            result = await self.workflows_collection.delete_one({
                "_id": ObjectId(workflow_id),
                "company_id": company_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error eliminando workflow {workflow_id}: {str(e)}")
            raise
    
    async def get_default_workflow(self, company_id: str) -> Optional[WorkflowModel]:
        """Obtiene el workflow por defecto de una empresa"""
        try:
            workflow_data = await self.workflows_collection.find_one({
                "company_id": company_id,
                "is_default": True,
                "status": "active"
            })
            
            if workflow_data:
                return WorkflowModel(**workflow_data)
            
            # Si no hay workflow por defecto, crear uno básico
            return await self._create_default_workflow(company_id)
            
        except Exception as e:
            logger.error(f"Error obteniendo workflow por defecto: {str(e)}")
            return None
    
    # Evaluación y Procesamiento de Aprobaciones
    async def evaluate_receipt_approval(
        self,
        receipt: ReceiptModel,
        user: UserModel,
        company_id: str
    ) -> WorkflowEvaluation:
        """Evalúa un recibo para determinar el proceso de aprobación requerido"""
        try:
            # Obtener workflow aplicable
            workflow = await self.get_default_workflow(company_id)
            if not workflow:
                raise ValueError("No se encontró workflow para la empresa")
            
            # Obtener roles del usuario
            user_roles = await self.get_user_roles(str(user.id), company_id)
            
            # Evaluar con el motor de workflow
            evaluation = await self.engine.evaluate_receipt(
                receipt, user, workflow, user_roles
            )
            
            logger.info(f"Evaluación completada para recibo {receipt.id}: {evaluation.action}")
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluando aprobación de recibo: {str(e)}")
            raise
    
    async def create_approval_instance(
        self,
        receipt_id: str,
        evaluation: WorkflowEvaluation,
        company_id: str
    ) -> ApprovalInstance:
        """Crea una instancia de aprobación basada en la evaluación"""
        try:
            instance = ApprovalInstance(
                receipt_id=receipt_id,
                workflow_id=evaluation.workflow_id,
                company_id=company_id,
                applied_rule_id=evaluation.applied_rule_id,
                current_approver_id=evaluation.next_approver_id,
                current_approver_role=evaluation.next_approver_role
            )
            
            # Establecer estado inicial
            if evaluation.auto_approved:
                instance.status = ApprovalStatus.AUTO_APPROVED
                instance.approval_chain.append({
                    "action": "auto_approved",
                    "timestamp": datetime.utcnow(),
                    "reason": evaluation.reason,
                    "confidence": evaluation.confidence
                })
            else:
                instance.status = ApprovalStatus.PENDING
                # Establecer fecha límite (por defecto 3 días)
                instance.due_date = datetime.utcnow() + timedelta(days=3)
            
            result = await self.approval_instances_collection.insert_one(
                instance.dict(by_alias=True)
            )
            instance.id = result.inserted_id
            
            logger.info(f"Instancia de aprobación creada: {instance.id}")
            return instance
            
        except Exception as e:
            logger.error(f"Error creando instancia de aprobación: {str(e)}")
            raise
    
    async def process_approval_decision(
        self,
        instance_id: str,
        decision: ApprovalDecision,
        approver_id: str,
        company_id: str
    ) -> ApprovalInstance:
        """Procesa una decisión de aprobación"""
        try:
            # Obtener instancia
            instance = await self.get_approval_instance(instance_id, company_id)
            if not instance:
                raise ValueError("Instancia de aprobación no encontrada")
            
            if instance.status != ApprovalStatus.PENDING:
                raise ValueError("La instancia no está pendiente de aprobación")
            
            # Registrar decisión en el historial
            approval_entry = {
                "approver_id": approver_id,
                "action": decision.action.value,
                "comment": decision.comment,
                "timestamp": datetime.utcnow()
            }
            
            # Actualizar estado basado en la decisión
            if decision.action == ApprovalAction.APPROVE:
                instance.status = ApprovalStatus.APPROVED
            elif decision.action == ApprovalAction.REJECT:
                instance.status = ApprovalStatus.REJECTED
            elif decision.action == ApprovalAction.ESCALATE:
                instance.status = ApprovalStatus.ESCALATED
                instance.escalation_count += 1
                instance.current_approver_id = decision.escalate_to_user_id
                instance.current_approver_role = decision.escalate_to_role
                # Extender fecha límite
                instance.due_date = datetime.utcnow() + timedelta(days=3)
            
            instance.approval_chain.append(approval_entry)
            instance.updated_at = datetime.utcnow()
            
            # Guardar cambios
            await self.approval_instances_collection.update_one(
                {"_id": ObjectId(instance_id)},
                {"$set": instance.dict(by_alias=True, exclude={"id"})}
            )
            
            logger.info(f"Decisión procesada para instancia {instance_id}: {decision.action}")
            return instance
            
        except Exception as e:
            logger.error(f"Error procesando decisión de aprobación: {str(e)}")
            raise
    
    async def get_approval_instance(
        self,
        instance_id: str,
        company_id: str
    ) -> Optional[ApprovalInstance]:
        """Obtiene una instancia de aprobación"""
        try:
            instance_data = await self.approval_instances_collection.find_one({
                "_id": ObjectId(instance_id),
                "company_id": company_id
            })
            
            if instance_data:
                return ApprovalInstance(**instance_data)
            return None
            
        except Exception as e:
            logger.error(f"Error obteniendo instancia {instance_id}: {str(e)}")
            return None
    
    async def list_pending_approvals(
        self,
        company_id: str,
        approver_id: str = None,
        approver_role: str = None
    ) -> List[ApprovalInstance]:
        """Lista aprobaciones pendientes"""
        try:
            filter_query = {
                "company_id": company_id,
                "status": ApprovalStatus.PENDING
            }
            
            if approver_id:
                filter_query["current_approver_id"] = approver_id
            elif approver_role:
                filter_query["current_approver_role"] = approver_role
            
            cursor = self.approval_instances_collection.find(filter_query)
            instances = []
            
            async for instance_data in cursor:
                instances.append(ApprovalInstance(**instance_data))
            
            return instances
            
        except Exception as e:
            logger.error(f"Error listando aprobaciones pendientes: {str(e)}")
            return []
    
    # Gestión de Roles Organizacionales
    async def create_organization_role(
        self,
        company_id: str,
        name: str,
        level: int,
        approval_limit: float = None,
        can_approve_categories: List[str] = None,
        parent_role_id: str = None
    ) -> OrganizationRole:
        """Crea un rol organizacional"""
        try:
            role = OrganizationRole(
                company_id=company_id,
                name=name,
                level=level,
                approval_limit=approval_limit,
                can_approve_categories=can_approve_categories or [],
                parent_role_id=parent_role_id
            )
            
            result = await self.organization_roles_collection.insert_one(
                role.model_dump(by_alias=True)
            )
            role.id = result.inserted_id
            
            return role
            
        except Exception as e:
            logger.error(f"Error creando rol organizacional: {str(e)}")
            raise
    
    async def assign_user_role(
        self,
        user_id: str,
        company_id: str,
        role_id: str,
        assigned_by: str
    ) -> UserRoleAssignment:
        """Asigna un rol a un usuario"""
        try:
            # Desactivar asignaciones anteriores
            await self.user_role_assignments_collection.update_many(
                {"user_id": user_id, "company_id": company_id},
                {"$set": {"is_active": False}}
            )
            
            assignment = UserRoleAssignment(
                user_id=user_id,
                company_id=company_id,
                role_id=role_id,
                assigned_by=assigned_by
            )
            
            result = await self.user_role_assignments_collection.insert_one(
                assignment.model_dump(by_alias=True)
            )
            assignment.id = result.inserted_id
            
            return assignment
            
        except Exception as e:
            logger.error(f"Error asignando rol: {str(e)}")
            raise
    
    async def get_user_roles(self, user_id: str, company_id: str) -> List[str]:
        """Obtiene los roles de un usuario"""
        try:
            cursor = self.user_role_assignments_collection.find({
                "user_id": user_id,
                "company_id": company_id,
                "is_active": True
            })
            
            role_ids = []
            async for assignment in cursor:
                role_ids.append(assignment["role_id"])
            
            return role_ids
            
        except Exception as e:
            logger.error(f"Error obteniendo roles de usuario: {str(e)}")
            return []
    
    # Analytics y Reportes
    async def get_workflow_analytics(
        self,
        company_id: str,
        workflow_id: str = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> WorkflowAnalytics:
        """Genera analytics de workflows"""
        try:
            # Construir filtro de consulta
            filter_query = {"company_id": company_id}
            if workflow_id:
                filter_query["workflow_id"] = workflow_id
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = start_date
                if end_date:
                    date_filter["$lte"] = end_date
                filter_query["created_at"] = date_filter
            
            # Agregaciones para estadísticas
            pipeline = [
                {"$match": filter_query},
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "auto_approved": {
                            "$sum": {"$cond": [{"$eq": ["$status", "auto_approved"]}, 1, 0]}
                        },
                        "approved": {
                            "$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}
                        },
                        "rejected": {
                            "$sum": {"$cond": [{"$eq": ["$status", "rejected"]}, 1, 0]}
                        },
                        "pending": {
                            "$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}
                        },
                        "escalated": {
                            "$sum": {"$cond": [{"$eq": ["$status", "escalated"]}, 1, 0]}
                        }
                    }
                }
            ]
            
            result = await self.approval_instances_collection.aggregate(pipeline).to_list(1)
            stats = result[0] if result else {}
            
            return WorkflowAnalytics(
                total_approvals=stats.get("total", 0),
                auto_approved=stats.get("auto_approved", 0),
                manual_approved=stats.get("approved", 0),
                rejected=stats.get("rejected", 0),
                pending=stats.get("pending", 0),
                average_approval_time=0.0,  # TODO: Calcular tiempo promedio
                escalation_rate=0.0,  # TODO: Calcular tasa de escalación
                approval_rate_by_category={},  # TODO: Implementar
                approval_rate_by_amount_range={},  # TODO: Implementar
                top_approvers=[]  # TODO: Implementar
            )
            
        except Exception as e:
            logger.error(f"Error generando analytics: {str(e)}")
            raise
    
    # Métodos privados
    async def _create_default_workflow(self, company_id: str) -> WorkflowModel:
        """Crea un workflow por defecto para una empresa"""
        try:
            # Usar plantilla básica chilena
            basic_rules = ChileanWorkflowTemplates.get_basic_approval_workflow()
            
            workflow_data = WorkflowCreate(
                name="Workflow por Defecto",
                description="Workflow básico de aprobación para gastos empresariales",
                rules=basic_rules,
                is_default=True
            )
            
            workflow = await self.create_workflow(
                workflow_data,
                company_id,
                "system"  # Creado por el sistema
            )
            
            logger.info(f"Workflow por defecto creado para empresa {company_id}")
            return workflow
            
        except Exception as e:
            logger.error(f"Error creando workflow por defecto: {str(e)}")
            raise
