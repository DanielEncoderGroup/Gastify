"""
Sistema de Notificaciones para Workflows de Gastify
Maneja notificaciones en tiempo real para aprobaciones, escalaciones y recordatorios
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.workflow import ApprovalInstance, ApprovalStatus, ApprovalAction
from app.models.user import UserModel
from app.models.notification import NotificationModel, NotificationCreate
from app.services.notification_service import NotificationService
from app.core.database import get_database

logger = logging.getLogger(__name__)

class WorkflowNotificationService:
    """Servicio de notificaciones para workflows de aprobación"""
    
    def __init__(self, db=None):
        self.db = db if db is not None else get_database()
        # NotificationService usa métodos estáticos, no necesita instanciación
        self.notification_service = NotificationService
    
    async def notify_approval_required(
        self,
        approval_instance: ApprovalInstance,
        receipt_data: Dict[str, Any],
        approver_user: UserModel
    ) -> bool:
        """Notifica que se requiere aprobación"""
        try:
            # Preparar datos de notificación
            title = "Nueva Aprobación Requerida"
            message = f"Se requiere su aprobación para un gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP de {receipt_data.get('companyName', 'N/A')}"
            notification_type = "approval_required"
            metadata = {
                "approval_instance_id": str(approval_instance.id),
                "receipt_id": approval_instance.receipt_id,
                "amount": receipt_data.get('totalAmount', 0),
                "merchant": receipt_data.get('companyName', 'N/A'),
                "category": receipt_data.get('category', 'Sin categoría'),
                "due_date": approval_instance.due_date.isoformat() if approval_instance.due_date else None,
                "priority": self._calculate_priority(approval_instance, receipt_data)
            }
            
            notification = await self.notification_service.create_notification(
                str(approver_user.id),
                notification_type,
                title,
                message,
                metadata
            )
            
            logger.info(f"Notificación de aprobación enviada a {approver_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación de aprobación: {str(e)}")
            return False
    
    async def notify_approval_decision(
        self,
        approval_instance: ApprovalInstance,
        decision: ApprovalAction,
        receipt_data: Dict[str, Any],
        submitter_user: UserModel,
        approver_user: UserModel
    ) -> bool:
        """Notifica sobre una decisión de aprobación"""
        try:
            if decision == ApprovalAction.APPROVE:
                title = "Gasto Aprobado"
                message = f"Su gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP ha sido aprobado por {approver_user.firstName} {approver_user.lastName}"
                notification_type = "approval_approved"
            elif decision == ApprovalAction.REJECT:
                title = "Gasto Rechazado"
                message = f"Su gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP ha sido rechazado por {approver_user.firstName} {approver_user.lastName}"
                notification_type = "approval_rejected"
            elif decision == ApprovalAction.ESCALATE:
                title = "Gasto Escalado"
                message = f"Su gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP ha sido escalado para revisión adicional"
                notification_type = "approval_escalated"
            else:
                return False
            
            notification_data = NotificationCreate(
                title=title,
                message=message,
                type=notification_type,
                metadata={
                    "approval_instance_id": str(approval_instance.id),
                    "receipt_id": approval_instance.receipt_id,
                    "amount": receipt_data.get('totalAmount', 0),
                    "merchant": receipt_data.get('companyName', 'N/A'),
                    "approver_name": f"{approver_user.firstName} {approver_user.lastName}",
                    "decision": decision.value,
                    "decision_timestamp": datetime.utcnow().isoformat()
                }
            )
            
            notification = await self.notification_service.create_notification(
                notification_data,
                str(submitter_user.id)
            )
            
            logger.info(f"Notificación de decisión enviada a {submitter_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación de decisión: {str(e)}")
            return False
    
    async def notify_auto_approval(
        self,
        approval_instance: ApprovalInstance,
        receipt_data: Dict[str, Any],
        submitter_user: UserModel,
        rule_name: str
    ) -> bool:
        """Notifica sobre auto-aprobación"""
        try:
            # Preparar datos de notificación
            title = "Gasto Auto-Aprobado"
            message = f"Su gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP ha sido aprobado automáticamente según la regla: {rule_name}"
            notification_type = "auto_approved"
            metadata = {
                "approval_instance_id": str(approval_instance.id),
                "receipt_id": approval_instance.receipt_id,
                "amount": receipt_data.get('totalAmount', 0),
                "merchant": receipt_data.get('companyName', 'N/A'),
                "rule_applied": rule_name,
                "auto_approved": True
            }
            
            notification = await self.notification_service.create_notification(
                str(submitter_user.id),
                notification_type,
                title,
                message,
                metadata
            )
            
            logger.info(f"Notificación de auto-aprobación enviada a {submitter_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación de auto-aprobación: {str(e)}")
            return False
    
    async def notify_escalation(
        self,
        approval_instance: ApprovalInstance,
        receipt_data: Dict[str, Any],
        new_approver_user: UserModel,
        escalated_by_user: UserModel
    ) -> bool:
        """Notifica sobre escalación a nuevo aprobador"""
        try:
            notification_data = NotificationCreate(
                title="Aprobación Escalada",
                message=f"Se ha escalado una aprobación de {receipt_data.get('totalAmount', 0):,.0f} CLP que requiere su revisión. Escalado por {escalated_by_user.firstName} {escalated_by_user.lastName}",
                type="approval_escalated",
                metadata={
                    "approval_instance_id": str(approval_instance.id),
                    "receipt_id": approval_instance.receipt_id,
                    "amount": receipt_data.get('totalAmount', 0),
                    "merchant": receipt_data.get('companyName', 'N/A'),
                    "escalated_by": f"{escalated_by_user.firstName} {escalated_by_user.lastName}",
                    "escalation_count": approval_instance.escalation_count,
                    "priority": "high"
                }
            )
            
            notification = await self.notification_service.create_notification(
                notification_data,
                str(new_approver_user.id)
            )
            
            logger.info(f"Notificación de escalación enviada a {new_approver_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación de escalación: {str(e)}")
            return False
    
    async def notify_overdue_approval(
        self,
        approval_instance: ApprovalInstance,
        receipt_data: Dict[str, Any],
        approver_user: UserModel
    ) -> bool:
        """Notifica sobre aprobación vencida"""
        try:
            days_overdue = (datetime.utcnow() - approval_instance.due_date).days
            
            notification_data = NotificationCreate(
                title="Aprobación Vencida",
                message=f"Tiene una aprobación pendiente vencida hace {days_overdue} días para un gasto de {receipt_data.get('totalAmount', 0):,.0f} CLP",
                type="approval_overdue",
                metadata={
                    "approval_instance_id": str(approval_instance.id),
                    "receipt_id": approval_instance.receipt_id,
                    "amount": receipt_data.get('totalAmount', 0),
                    "merchant": receipt_data.get('companyName', 'N/A'),
                    "days_overdue": days_overdue,
                    "due_date": approval_instance.due_date.isoformat(),
                    "priority": "urgent"
                }
            )
            
            notification = await self.notification_service.create_notification(
                notification_data,
                str(approver_user.id)
            )
            
            logger.info(f"Notificación de vencimiento enviada a {approver_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación de vencimiento: {str(e)}")
            return False
    
    async def notify_workflow_updated(
        self,
        workflow_name: str,
        company_id: str,
        updated_by_user: UserModel,
        changes_summary: str
    ) -> bool:
        """Notifica sobre actualización de workflow a administradores"""
        try:
            # TODO: Obtener lista de administradores de la empresa
            admin_users = []  # Placeholder
            
            notification_data = NotificationCreate(
                title="Workflow Actualizado",
                message=f"El workflow '{workflow_name}' ha sido actualizado por {updated_by_user.firstName} {updated_by_user.lastName}. Cambios: {changes_summary}",
                type="workflow_updated",
                metadata={
                    "workflow_name": workflow_name,
                    "company_id": company_id,
                    "updated_by": f"{updated_by_user.firstName} {updated_by_user.lastName}",
                    "changes": changes_summary,
                    "update_timestamp": datetime.utcnow().isoformat()
                }
            )
            
            notifications_sent = 0
            for admin_user in admin_users:
                try:
                    await self.notification_service.create_notification(
                        notification_data,
                        str(admin_user.id)
                    )
                    notifications_sent += 1
                except Exception as e:
                    logger.error(f"Error enviando notificación a admin {admin_user.id}: {str(e)}")
            
            logger.info(f"Notificaciones de workflow enviadas a {notifications_sent} administradores")
            return notifications_sent > 0
            
        except Exception as e:
            logger.error(f"Error enviando notificaciones de workflow: {str(e)}")
            return False
    
    async def send_daily_approval_summary(
        self,
        approver_user: UserModel,
        company_id: str
    ) -> bool:
        """Envía resumen diario de aprobaciones pendientes"""
        try:
            # Obtener aprobaciones pendientes del usuario
            from app.services.workflow_service import WorkflowService
            workflow_service = WorkflowService(self.db)
            
            pending_approvals = await workflow_service.list_pending_approvals(
                company_id,
                approver_id=str(approver_user.id)
            )
            
            if not pending_approvals:
                return True  # No hay nada que notificar
            
            total_amount = 0
            overdue_count = 0
            urgent_count = 0
            
            for approval in pending_approvals:
                # TODO: Obtener datos del recibo
                receipt_amount = 0  # Placeholder
                total_amount += receipt_amount
                
                if approval.due_date and approval.due_date < datetime.utcnow():
                    overdue_count += 1
                
                if receipt_amount > 500000:  # Más de 500k CLP
                    urgent_count += 1
            
            notification_data = NotificationCreate(
                title="Resumen Diario de Aprobaciones",
                message=f"Tiene {len(pending_approvals)} aprobaciones pendientes por un total de {total_amount:,.0f} CLP. {overdue_count} vencidas, {urgent_count} urgentes.",
                type="daily_summary",
                metadata={
                    "pending_count": len(pending_approvals),
                    "total_amount": total_amount,
                    "overdue_count": overdue_count,
                    "urgent_count": urgent_count,
                    "summary_date": datetime.utcnow().date().isoformat()
                }
            )
            
            notification = await self.notification_service.create_notification(
                notification_data,
                str(approver_user.id)
            )
            
            logger.info(f"Resumen diario enviado a {approver_user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando resumen diario: {str(e)}")
            return False
    
    def _calculate_priority(
        self,
        approval_instance: ApprovalInstance,
        receipt_data: Dict[str, Any]
    ) -> str:
        """Calcula la prioridad de la notificación"""
        amount = receipt_data.get('totalAmount', 0)
        
        # Prioridad basada en monto
        if amount > 1000000:  # Más de 1M CLP
            return "urgent"
        elif amount > 500000:  # Más de 500k CLP
            return "high"
        elif amount > 100000:  # Más de 100k CLP
            return "medium"
        else:
            return "low"
    
    async def schedule_reminder_notifications(
        self,
        approval_instance: ApprovalInstance
    ) -> bool:
        """Programa notificaciones de recordatorio"""
        try:
            # TODO: Implementar sistema de tareas programadas
            # Por ahora, solo registramos que se debe programar
            logger.info(f"Recordatorio programado para instancia {approval_instance.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error programando recordatorio: {str(e)}")
            return False


class WorkflowNotificationTemplates:
    """Plantillas de notificaciones para diferentes tipos de workflows"""
    
    @staticmethod
    def get_approval_templates() -> Dict[str, Dict[str, str]]:
        """Plantillas para notificaciones de aprobación"""
        return {
            "approval_required": {
                "title": "Nueva Aprobación Requerida",
                "message": "Se requiere su aprobación para un gasto de {amount:,.0f} CLP de {merchant}",
                "email_subject": "Gastify - Nueva Aprobación Requerida",
                "email_template": "approval_required.html"
            },
            "approval_approved": {
                "title": "Gasto Aprobado",
                "message": "Su gasto de {amount:,.0f} CLP ha sido aprobado",
                "email_subject": "Gastify - Gasto Aprobado",
                "email_template": "approval_approved.html"
            },
            "approval_rejected": {
                "title": "Gasto Rechazado",
                "message": "Su gasto de {amount:,.0f} CLP ha sido rechazado",
                "email_subject": "Gastify - Gasto Rechazado",
                "email_template": "approval_rejected.html"
            },
            "approval_escalated": {
                "title": "Gasto Escalado",
                "message": "Su gasto de {amount:,.0f} CLP ha sido escalado para revisión adicional",
                "email_subject": "Gastify - Gasto Escalado",
                "email_template": "approval_escalated.html"
            },
            "auto_approved": {
                "title": "Gasto Auto-Aprobado",
                "message": "Su gasto de {amount:,.0f} CLP ha sido aprobado automáticamente",
                "email_subject": "Gastify - Gasto Auto-Aprobado",
                "email_template": "auto_approved.html"
            },
            "approval_overdue": {
                "title": "Aprobación Vencida",
                "message": "Tiene una aprobación pendiente vencida para un gasto de {amount:,.0f} CLP",
                "email_subject": "Gastify - Aprobación Vencida",
                "email_template": "approval_overdue.html"
            }
        }
    
    @staticmethod
    def get_admin_templates() -> Dict[str, Dict[str, str]]:
        """Plantillas para notificaciones administrativas"""
        return {
            "workflow_updated": {
                "title": "Workflow Actualizado",
                "message": "El workflow '{workflow_name}' ha sido actualizado",
                "email_subject": "Gastify - Workflow Actualizado",
                "email_template": "workflow_updated.html"
            },
            "daily_summary": {
                "title": "Resumen Diario de Aprobaciones",
                "message": "Resumen de aprobaciones pendientes del día",
                "email_subject": "Gastify - Resumen Diario",
                "email_template": "daily_summary.html"
            }
        }
