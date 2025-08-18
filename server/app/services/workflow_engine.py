"""
Motor de Reglas de Workflow para Gastify
Evalúa automáticamente recibos contra reglas de aprobación configuradas
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from app.models.workflow import (
    WorkflowModel, WorkflowRule, WorkflowCondition, ApprovalAction,
    ConditionOperator, WorkflowEvaluation, ApprovalStatus
)
from app.models.receipt import ReceiptModel
from app.models.user import UserModel

logger = logging.getLogger(__name__)

class WorkflowEngine:
    """Motor de evaluación de workflows de aprobación"""
    
    def __init__(self):
        self.condition_evaluators = {
            ConditionOperator.EQUALS: self._equals,
            ConditionOperator.NOT_EQUALS: self._not_equals,
            ConditionOperator.GREATER_THAN: self._greater_than,
            ConditionOperator.LESS_THAN: self._less_than,
            ConditionOperator.GREATER_EQUAL: self._greater_equal,
            ConditionOperator.LESS_EQUAL: self._less_equal,
            ConditionOperator.CONTAINS: self._contains,
            ConditionOperator.NOT_CONTAINS: self._not_contains,
            ConditionOperator.IN: self._in,
            ConditionOperator.NOT_IN: self._not_in,
        }
    
    async def evaluate_receipt(
        self,
        receipt: ReceiptModel,
        user: UserModel,
        workflow: WorkflowModel,
        user_roles: List[str] = None
    ) -> WorkflowEvaluation:
        """
        Evalúa un recibo contra un workflow y determina la acción requerida
        """
        try:
            # Preparar contexto de evaluación
            context = self._prepare_evaluation_context(receipt, user, user_roles)
            
            # Evaluar reglas en orden de prioridad
            sorted_rules = sorted(workflow.rules, key=lambda r: r.priority, reverse=True)
            
            for rule in sorted_rules:
                if await self._evaluate_rule(rule, context):
                    logger.info(f"Regla aplicada: {rule.name} para recibo {receipt.id}")
                    
                    # Determinar siguiente aprobador si es necesario
                    next_approver_id, next_approver_role = await self._determine_next_approver(
                        rule, context, workflow
                    )
                    
                    return WorkflowEvaluation(
                        workflow_id=str(workflow.id),
                        applied_rule_id=rule.id,
                        action=rule.action,
                        reason=f"Regla aplicada: {rule.name}",
                        confidence=self._calculate_confidence(rule, context),
                        next_approver_id=next_approver_id,
                        next_approver_role=next_approver_role,
                        auto_approved=(rule.action == ApprovalAction.APPROVE)
                    )
            
            # Si no se aplicó ninguna regla, usar acción por defecto
            logger.info(f"Aplicando acción por defecto para recibo {receipt.id}")
            return WorkflowEvaluation(
                workflow_id=str(workflow.id),
                applied_rule_id=None,
                action=workflow.default_action,
                reason="Ninguna regla específica aplicada, usando acción por defecto",
                confidence=0.5,
                next_approver_id=None,
                next_approver_role=None,
                auto_approved=(workflow.default_action == ApprovalAction.APPROVE)
            )
            
        except Exception as e:
            logger.error(f"Error evaluando workflow: {str(e)}")
            return WorkflowEvaluation(
                workflow_id=str(workflow.id),
                applied_rule_id=None,
                action=ApprovalAction.REQUIRE_APPROVAL,
                reason=f"Error en evaluación: {str(e)}",
                confidence=0.0,
                next_approver_id=None,
                next_approver_role=None,
                auto_approved=False
            )
    
    def _prepare_evaluation_context(
        self,
        receipt: ReceiptModel,
        user: UserModel,
        user_roles: List[str] = None
    ) -> Dict[str, Any]:
        """Prepara el contexto de datos para evaluación"""
        context = {
            # Datos del recibo
            "amount": float(receipt.totalAmount),
            "category": getattr(receipt, 'category', 'Sin categoría'),  # Campo opcional
            "merchant": receipt.companyName,
            "date": receipt.date,
            "description": receipt.description or "",
            
            # Datos del usuario
            "user_id": str(user.id),
            "user_role": user.role,
            "user_roles": user_roles or [],
            "user_email": user.email,
            
            # Datos calculados
            "day_of_week": receipt.date.weekday() if receipt.date else 0,
            "month": receipt.date.month if receipt.date else 1,
            "is_weekend": receipt.date.weekday() >= 5 if receipt.date else False,
            
            # Datos de ubicación si están disponibles
            "has_location": hasattr(receipt, 'locationData') and receipt.locationData is not None,
        }
        
        # Agregar datos de ubicación si están disponibles
        if hasattr(receipt, 'locationData') and receipt.locationData:
            location_data = receipt.locationData
            context.update({
                "location_city": getattr(location_data, "city", ""),
                "location_country": getattr(location_data, "country", ""),
                "location_confidence": getattr(location_data, "confidence", 0.0),
            })
        
        return context
    
    async def _evaluate_rule(self, rule: WorkflowRule, context: Dict[str, Any]) -> bool:
        """Evalúa si una regla se aplica al contexto dado"""
        if not rule.conditions:
            return True
        
        results = []
        for condition in rule.conditions:
            result = await self._evaluate_condition(condition, context)
            results.append(result)
        
        # Aplicar lógica de combinación
        if rule.condition_logic.upper() == "OR":
            return any(results)
        else:  # AND por defecto
            return all(results)
    
    async def _evaluate_condition(
        self,
        condition: WorkflowCondition,
        context: Dict[str, Any]
    ) -> bool:
        """Evalúa una condición individual"""
        try:
            field_value = context.get(condition.field)
            evaluator = self.condition_evaluators.get(condition.operator)
            
            if evaluator is None:
                logger.warning(f"Operador no soportado: {condition.operator}")
                return False
            
            return evaluator(field_value, condition.value)
            
        except Exception as e:
            logger.error(f"Error evaluando condición {condition.field}: {str(e)}")
            return False
    
    async def _determine_next_approver(
        self,
        rule: WorkflowRule,
        context: Dict[str, Any],
        workflow: WorkflowModel
    ) -> tuple[Optional[str], Optional[str]]:
        """Determina el siguiente aprobador basado en la regla"""
        if rule.action in [ApprovalAction.APPROVE, ApprovalAction.REJECT]:
            return None, None
        
        if rule.action == ApprovalAction.ESCALATE:
            return rule.escalation_user_id, rule.escalation_role
        
        if rule.action == ApprovalAction.REQUIRE_APPROVAL:
            # Lógica para determinar aprobador basado en jerarquía
            # Por ahora, retornamos el rol de escalación si está definido
            return rule.escalation_user_id, rule.escalation_role
        
        return None, None
    
    def _calculate_confidence(self, rule: WorkflowRule, context: Dict[str, Any]) -> float:
        """Calcula la confianza en la aplicación de la regla"""
        # Lógica simple de confianza basada en número de condiciones cumplidas
        if not rule.conditions:
            return 0.5
        
        # Confianza alta si todas las condiciones son específicas
        confidence = 0.8 if len(rule.conditions) > 1 else 0.6
        
        # Ajustar basado en tipo de condiciones
        for condition in rule.conditions:
            if condition.field == "amount" and condition.operator in [
                ConditionOperator.GREATER_THAN, ConditionOperator.LESS_THAN
            ]:
                confidence += 0.1
        
        return min(confidence, 1.0)
    
    # Evaluadores de condiciones
    def _equals(self, field_value: Any, condition_value: Any) -> bool:
        return field_value == condition_value
    
    def _not_equals(self, field_value: Any, condition_value: Any) -> bool:
        return field_value != condition_value
    
    def _greater_than(self, field_value: Any, condition_value: Any) -> bool:
        try:
            return float(field_value) > float(condition_value)
        except (ValueError, TypeError):
            return False
    
    def _less_than(self, field_value: Any, condition_value: Any) -> bool:
        try:
            return float(field_value) < float(condition_value)
        except (ValueError, TypeError):
            return False
    
    def _greater_equal(self, field_value: Any, condition_value: Any) -> bool:
        try:
            return float(field_value) >= float(condition_value)
        except (ValueError, TypeError):
            return False
    
    def _less_equal(self, field_value: Any, condition_value: Any) -> bool:
        try:
            return float(field_value) <= float(condition_value)
        except (ValueError, TypeError):
            return False
    
    def _contains(self, field_value: Any, condition_value: Any) -> bool:
        try:
            return str(condition_value).lower() in str(field_value).lower()
        except (AttributeError, TypeError):
            return False
    
    def _not_contains(self, field_value: Any, condition_value: Any) -> bool:
        return not self._contains(field_value, condition_value)
    
    def _in(self, field_value: Any, condition_value: Any) -> bool:
        try:
            if isinstance(condition_value, list):
                return field_value in condition_value
            return str(field_value) in str(condition_value)
        except (TypeError, AttributeError):
            return False
    
    def _not_in(self, field_value: Any, condition_value: Any) -> bool:
        return not self._in(field_value, condition_value)


class WorkflowRuleBuilder:
    """Constructor de reglas de workflow con validaciones"""
    
    @staticmethod
    def create_amount_rule(
        name: str,
        amount_limit: float,
        operator: ConditionOperator,
        action: ApprovalAction,
        priority: int = 0
    ) -> WorkflowRule:
        """Crea una regla basada en monto"""
        condition = WorkflowCondition(
            field="amount",
            operator=operator,
            value=amount_limit,
            description=f"Monto {operator.value} {amount_limit:,.0f} CLP"
        )
        
        return WorkflowRule(
            name=name,
            description=f"Regla de aprobación para montos {operator.value} {amount_limit:,.0f} CLP",
            conditions=[condition],
            action=action,
            priority=priority
        )
    
    @staticmethod
    def create_category_rule(
        name: str,
        categories: List[str],
        action: ApprovalAction,
        priority: int = 0
    ) -> WorkflowRule:
        """Crea una regla basada en categorías"""
        condition = WorkflowCondition(
            field="category",
            operator=ConditionOperator.IN,
            value=categories,
            description=f"Categoría en {', '.join(categories)}"
        )
        
        return WorkflowRule(
            name=name,
            description=f"Regla para categorías: {', '.join(categories)}",
            conditions=[condition],
            action=action,
            priority=priority
        )
    
    @staticmethod
    def create_role_rule(
        name: str,
        user_roles: List[str],
        action: ApprovalAction,
        priority: int = 0
    ) -> WorkflowRule:
        """Crea una regla basada en roles de usuario"""
        condition = WorkflowCondition(
            field="user_role",
            operator=ConditionOperator.IN,
            value=user_roles,
            description=f"Rol de usuario en {', '.join(user_roles)}"
        )
        
        return WorkflowRule(
            name=name,
            description=f"Regla para roles: {', '.join(user_roles)}",
            conditions=[condition],
            action=action,
            priority=priority
        )
    
    @staticmethod
    def create_combined_rule(
        name: str,
        conditions: List[WorkflowCondition],
        action: ApprovalAction,
        condition_logic: str = "AND",
        priority: int = 0
    ) -> WorkflowRule:
        """Crea una regla con múltiples condiciones"""
        return WorkflowRule(
            name=name,
            description=f"Regla combinada con {len(conditions)} condiciones",
            conditions=conditions,
            condition_logic=condition_logic,
            action=action,
            priority=priority
        )


# Reglas predefinidas para Chile
class ChileanWorkflowTemplates:
    """Plantillas de workflow predefinidas para empresas chilenas"""
    
    @staticmethod
    def get_basic_approval_workflow() -> List[WorkflowRule]:
        """Workflow básico de aprobación para empresas pequeñas"""
        return [
            # Auto-aprobación para montos pequeños
            WorkflowRuleBuilder.create_amount_rule(
                name="Auto-aprobación montos pequeños",
                amount_limit=50000,  # 50.000 CLP
                operator=ConditionOperator.LESS_EQUAL,
                action=ApprovalAction.APPROVE,
                priority=100
            ),
            
            # Requerir aprobación para montos medianos
            WorkflowRuleBuilder.create_amount_rule(
                name="Aprobación requerida montos medianos",
                amount_limit=500000,  # 500.000 CLP
                operator=ConditionOperator.LESS_EQUAL,
                action=ApprovalAction.REQUIRE_APPROVAL,
                priority=90
            ),
            
            # Escalación para montos altos
            WorkflowRuleBuilder.create_amount_rule(
                name="Escalación montos altos",
                amount_limit=500000,  # > 500.000 CLP
                operator=ConditionOperator.GREATER_THAN,
                action=ApprovalAction.ESCALATE,
                priority=80
            )
        ]
    
    @staticmethod
    def get_enterprise_approval_workflow() -> List[WorkflowRule]:
        """Workflow empresarial con múltiples niveles"""
        return [
            # Auto-aprobación para gastos de oficina pequeños
            WorkflowRuleBuilder.create_combined_rule(
                name="Auto-aprobación gastos oficina",
                conditions=[
                    WorkflowCondition(
                        field="category",
                        operator=ConditionOperator.IN,
                        value=["Oficina", "Materiales", "Suministros"],
                        description="Categorías de oficina"
                    ),
                    WorkflowCondition(
                        field="amount",
                        operator=ConditionOperator.LESS_EQUAL,
                        value=100000,  # 100.000 CLP
                        description="Monto menor a 100.000 CLP"
                    )
                ],
                action=ApprovalAction.APPROVE,
                priority=100
            ),
            
            # Aprobación especial para viajes
            WorkflowRuleBuilder.create_category_rule(
                name="Aprobación viajes",
                categories=["Viajes", "Transporte", "Alojamiento"],
                action=ApprovalAction.REQUIRE_APPROVAL,
                priority=95
            ),
            
            # Escalación para gastos de representación altos
            WorkflowRuleBuilder.create_combined_rule(
                name="Escalación gastos representación",
                conditions=[
                    WorkflowCondition(
                        field="category",
                        operator=ConditionOperator.IN,
                        value=["Entretenimiento", "Comidas de negocios"],
                        description="Gastos de representación"
                    ),
                    WorkflowCondition(
                        field="amount",
                        operator=ConditionOperator.GREATER_THAN,
                        value=200000,  # 200.000 CLP
                        description="Monto mayor a 200.000 CLP"
                    )
                ],
                action=ApprovalAction.ESCALATE,
                priority=90
            )
        ]
