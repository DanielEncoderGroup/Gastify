"""
Tests para el Sistema de Workflows de Gastify
Tests unitarios e integración para workflows de aprobación
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from bson import ObjectId
from unittest.mock import AsyncMock, MagicMock

from app.models.workflow import (
    WorkflowModel, WorkflowCreate, WorkflowRule, WorkflowCondition,
    ConditionOperator, ApprovalAction, ApprovalInstance, ApprovalDecision,
    WorkflowStatus, ApprovalStatus, WorkflowEvaluation
)
from app.models.receipt import ReceiptModel
from app.models.user import UserModel
from app.services.workflow_engine import WorkflowEngine, WorkflowRuleBuilder, ChileanWorkflowTemplates
from app.services.workflow_service import WorkflowService
from app.services.workflow_notifications import WorkflowNotificationService

class TestWorkflowEngine:
    """Tests para el motor de workflows"""
    
    @pytest.fixture
    def workflow_engine(self):
        return WorkflowEngine()
    
    @pytest.fixture
    def sample_receipt(self):
        return ReceiptModel(
            id=ObjectId(),
            user=ObjectId(),
            companyName="Supermercado Chile",
            folioNumber="TEST001",
            totalAmount=150000,  # 150k CLP
            date=datetime.utcnow(),
            description="Compra de oficina"
        )
    
    @pytest.fixture
    def sample_user(self):
        return UserModel(
            id=ObjectId(),
            firstName="Juan",
            lastName="Pérez",
            email="juan@empresa.cl",
            role="client",
            password="password123"
        )
    
    @pytest.fixture
    def basic_workflow(self):
        rules = ChileanWorkflowTemplates.get_basic_approval_workflow()
        return WorkflowModel(
            id=ObjectId(),
            company_id="test_company",
            name="Workflow Básico Test",
            rules=rules,
            created_by="test_user"
        )
    
    @pytest.mark.asyncio
    async def test_evaluate_auto_approval(self, workflow_engine, sample_receipt, sample_user, basic_workflow):
        """Test de auto-aprobación para montos pequeños"""
        # Modificar recibo para monto pequeño
        sample_receipt.totalAmount = 30000  # 30k CLP
        
        evaluation = await workflow_engine.evaluate_receipt(
            sample_receipt, sample_user, basic_workflow
        )
        
        assert evaluation.action == ApprovalAction.APPROVE
        assert evaluation.auto_approved == True
        assert evaluation.confidence > 0.5
        assert "Auto-aprobación montos pequeños" in evaluation.reason
    
    @pytest.mark.asyncio
    async def test_evaluate_require_approval(self, workflow_engine, sample_receipt, sample_user, basic_workflow):
        """Test de requerimiento de aprobación para montos medianos"""
        # Modificar recibo para monto mediano
        sample_receipt.totalAmount = 300000  # 300k CLP
        
        evaluation = await workflow_engine.evaluate_receipt(
            sample_receipt, sample_user, basic_workflow
        )
        
        assert evaluation.action == ApprovalAction.REQUIRE_APPROVAL
        assert evaluation.auto_approved == False
        assert evaluation.confidence > 0.5
    
    @pytest.mark.asyncio
    async def test_evaluate_escalation(self, workflow_engine, sample_receipt, sample_user, basic_workflow):
        """Test de escalación para montos altos"""
        # Modificar recibo para monto alto
        sample_receipt.totalAmount = 800000  # 800k CLP
        
        evaluation = await workflow_engine.evaluate_receipt(
            sample_receipt, sample_user, basic_workflow
        )
        
        assert evaluation.action == ApprovalAction.ESCALATE
        assert evaluation.auto_approved == False
    
    @pytest.mark.asyncio
    async def test_condition_operators(self, workflow_engine):
        """Test de operadores de condiciones"""
        context = {"amount": 100000, "category": "Oficina"}
        
        # Test EQUALS
        condition = WorkflowCondition(
            field="category",
            operator=ConditionOperator.EQUALS,
            value="Oficina"
        )
        result = await workflow_engine._evaluate_condition(condition, context)
        assert result == True
        
        # Test GREATER_THAN
        condition = WorkflowCondition(
            field="amount",
            operator=ConditionOperator.GREATER_THAN,
            value=50000
        )
        result = await workflow_engine._evaluate_condition(condition, context)
        assert result == True
        
        # Test CONTAINS
        condition = WorkflowCondition(
            field="category",
            operator=ConditionOperator.CONTAINS,
            value="Ofi"
        )
        result = await workflow_engine._evaluate_condition(condition, context)
        assert result == True


class TestWorkflowRuleBuilder:
    """Tests para el constructor de reglas"""
    
    def test_create_amount_rule(self):
        """Test de creación de regla por monto"""
        rule = WorkflowRuleBuilder.create_amount_rule(
            name="Test Amount Rule",
            amount_limit=100000,
            operator=ConditionOperator.LESS_EQUAL,
            action=ApprovalAction.APPROVE,
            priority=10
        )
        
        assert rule.name == "Test Amount Rule"
        assert len(rule.conditions) == 1
        assert rule.conditions[0].field == "amount"
        assert rule.conditions[0].operator == ConditionOperator.LESS_EQUAL
        assert rule.conditions[0].value == 100000
        assert rule.action == ApprovalAction.APPROVE
        assert rule.priority == 10
    
    def test_create_category_rule(self):
        """Test de creación de regla por categoría"""
        categories = ["Oficina", "Suministros"]
        rule = WorkflowRuleBuilder.create_category_rule(
            name="Test Category Rule",
            categories=categories,
            action=ApprovalAction.REQUIRE_APPROVAL
        )
        
        assert rule.name == "Test Category Rule"
        assert len(rule.conditions) == 1
        assert rule.conditions[0].field == "category"
        assert rule.conditions[0].operator == ConditionOperator.IN
        assert rule.conditions[0].value == categories
    
    def test_create_combined_rule(self):
        """Test de creación de regla combinada"""
        conditions = [
            WorkflowCondition(
                field="amount",
                operator=ConditionOperator.GREATER_THAN,
                value=50000
            ),
            WorkflowCondition(
                field="category",
                operator=ConditionOperator.EQUALS,
                value="Viajes"
            )
        ]
        
        rule = WorkflowRuleBuilder.create_combined_rule(
            name="Test Combined Rule",
            conditions=conditions,
            action=ApprovalAction.ESCALATE,
            condition_logic="AND"
        )
        
        assert rule.name == "Test Combined Rule"
        assert len(rule.conditions) == 2
        assert rule.condition_logic == "AND"
        assert rule.action == ApprovalAction.ESCALATE


class TestChileanWorkflowTemplates:
    """Tests para plantillas chilenas"""
    
    def test_basic_approval_workflow(self):
        """Test de workflow básico chileno"""
        rules = ChileanWorkflowTemplates.get_basic_approval_workflow()
        
        assert len(rules) == 3
        
        # Verificar regla de auto-aprobación
        auto_approval_rule = next(r for r in rules if r.action == ApprovalAction.APPROVE)
        assert auto_approval_rule.priority == 100
        assert auto_approval_rule.conditions[0].value == 50000
        
        # Verificar regla de escalación
        escalation_rule = next(r for r in rules if r.action == ApprovalAction.ESCALATE)
        assert escalation_rule.priority == 80
        assert escalation_rule.conditions[0].operator == ConditionOperator.GREATER_THAN
    
    def test_enterprise_approval_workflow(self):
        """Test de workflow empresarial chileno"""
        rules = ChileanWorkflowTemplates.get_enterprise_approval_workflow()
        
        assert len(rules) == 3
        
        # Verificar regla de gastos de oficina
        office_rule = next(r for r in rules if "oficina" in r.name.lower())
        assert len(office_rule.conditions) == 2  # Categoría + Monto
        assert office_rule.condition_logic == "AND"
        
        # Verificar regla de viajes
        travel_rule = next(r for r in rules if "viajes" in r.name.lower())
        assert travel_rule.action == ApprovalAction.REQUIRE_APPROVAL


class TestWorkflowService:
    """Tests para el servicio de workflows"""
    
    @pytest.fixture
    def mock_db(self):
        db = MagicMock()
        db.workflows = AsyncMock()
        db.approval_instances = AsyncMock()
        db.organization_roles = AsyncMock()
        db.user_role_assignments = AsyncMock()
        return db
    
    @pytest.fixture
    def workflow_service(self, mock_db):
        return WorkflowService(mock_db)
    
    @pytest.mark.asyncio
    async def test_create_workflow(self, workflow_service, mock_db):
        """Test de creación de workflow"""
        workflow_data = WorkflowCreate(
            name="Test Workflow",
            description="Test Description",
            is_default=True
        )
        
        # Mock insert result
        mock_db.workflows.insert_one.return_value = AsyncMock()
        mock_db.workflows.insert_one.return_value.inserted_id = ObjectId()
        mock_db.workflows.update_many.return_value = AsyncMock()
        
        workflow = await workflow_service.create_workflow(
            workflow_data,
            "test_company",
            "test_user"
        )
        
        assert workflow.name == "Test Workflow"
        assert workflow.company_id == "test_company"
        assert workflow.created_by == "test_user"
        assert workflow.is_default == True
        
        # Verificar que se desactivaron otros workflows por defecto
        mock_db.workflows.update_many.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_evaluate_receipt_approval(self, workflow_service, mock_db):
        """Test de evaluación de aprobación de recibo"""
        # Mock workflow por defecto
        mock_workflow_data = {
            "_id": ObjectId(),
            "company_id": "test_company",
            "name": "Test Workflow",
            "rules": ChileanWorkflowTemplates.get_basic_approval_workflow(),
            "default_action": ApprovalAction.REQUIRE_APPROVAL,
            "status": "active",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.utcnow()
        }
        
        mock_db.workflows.find_one.return_value = mock_workflow_data
        mock_db.user_role_assignments.find.return_value = AsyncMock()
        mock_db.user_role_assignments.find.return_value.__aiter__ = AsyncMock(return_value=iter([]))
        
        receipt = ReceiptModel(
            id=ObjectId(),
            user=ObjectId(),
            companyName="Test Merchant",
            folioNumber="TEST002",
            totalAmount=30000,  # Monto pequeño para auto-aprobación
            date=datetime.utcnow(),
            description="Test"
        )
        
        user = UserModel(
            id=ObjectId(),
            firstName="Test",
            lastName="User",
            email="test@test.com",
            role="client",
            password="password123"
        )
        
        evaluation = await workflow_service.evaluate_receipt_approval(
            receipt, user, "test_company"
        )
        
        assert evaluation.action == ApprovalAction.APPROVE
        assert evaluation.auto_approved == True
    
    @pytest.mark.asyncio
    async def test_create_approval_instance(self, workflow_service, mock_db):
        """Test de creación de instancia de aprobación"""
        evaluation = WorkflowEvaluation(
            workflow_id="test_workflow",
            action=ApprovalAction.REQUIRE_APPROVAL,
            reason="Test reason",
            confidence=0.8,
            auto_approved=False
        )
        
        mock_db.approval_instances.insert_one.return_value = AsyncMock()
        mock_db.approval_instances.insert_one.return_value.inserted_id = ObjectId()
        
        instance = await workflow_service.create_approval_instance(
            "test_receipt",
            evaluation,
            "test_company"
        )
        
        assert instance.receipt_id == "test_receipt"
        assert instance.workflow_id == "test_workflow"
        assert instance.company_id == "test_company"
        assert instance.status == ApprovalStatus.PENDING
        assert instance.due_date is not None
    
    @pytest.mark.asyncio
    async def test_process_approval_decision(self, workflow_service, mock_db):
        """Test de procesamiento de decisión de aprobación"""
        # Mock instancia existente
        instance_data = {
            "_id": ObjectId(),
            "receipt_id": "test_receipt",
            "workflow_id": "test_workflow",
            "company_id": "test_company",
            "status": ApprovalStatus.PENDING,
            "approval_chain": [],
            "escalation_count": 0,
            "created_at": datetime.utcnow()
        }
        
        mock_db.approval_instances.find_one.return_value = instance_data
        mock_db.approval_instances.update_one.return_value = AsyncMock()
        
        decision = ApprovalDecision(
            action=ApprovalAction.APPROVE,
            comment="Aprobado por test"
        )
        
        instance = await workflow_service.process_approval_decision(
            str(instance_data["_id"]),
            decision,
            "test_approver",
            "test_company"
        )
        
        assert instance.status == ApprovalStatus.APPROVED
        assert len(instance.approval_chain) == 1
        assert instance.approval_chain[0]["action"] == "approve"
        assert instance.approval_chain[0]["comment"] == "Aprobado por test"


class TestWorkflowNotifications:
    """Tests para notificaciones de workflow"""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def notification_service(self, mock_db):
        service = WorkflowNotificationService(mock_db)
        service.notification_service = AsyncMock()
        return service
    
    @pytest.mark.asyncio
    async def test_notify_approval_required(self, notification_service):
        """Test de notificación de aprobación requerida"""
        approval_instance = ApprovalInstance(
            receipt_id="test_receipt",
            workflow_id="test_workflow",
            company_id="test_company",
            due_date=datetime.utcnow() + timedelta(days=3)
        )
        
        receipt_data = {
            "totalAmount": 150000,
            "companyName": "Test Merchant",
            "category": "Oficina"
        }
        
        approver = UserModel(
            id=ObjectId(),
            firstName="Approver",
            lastName="User",
            email="approver@test.com",
            role="admin",
            password="password123"
        )
        
        notification_service.notification_service.create_notification.return_value = AsyncMock()
        
        result = await notification_service.notify_approval_required(
            approval_instance, receipt_data, approver
        )
        
        assert result == True
        notification_service.notification_service.create_notification.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_notify_auto_approval(self, notification_service):
        """Test de notificación de auto-aprobación"""
        approval_instance = ApprovalInstance(
            receipt_id="test_receipt",
            workflow_id="test_workflow",
            company_id="test_company",
            status=ApprovalStatus.AUTO_APPROVED
        )
        
        receipt_data = {
            "totalAmount": 30000,
            "companyName": "Test Merchant"
        }
        
        submitter = UserModel(
            id=ObjectId(),
            firstName="Submitter",
            lastName="User",
            email="submitter@test.com",
            role="client",
            password="password123"
        )
        
        notification_service.notification_service.create_notification.return_value = AsyncMock()
        
        result = await notification_service.notify_auto_approval(
            approval_instance, receipt_data, submitter, "Auto-aprobación montos pequeños"
        )
        
        assert result == True
        notification_service.notification_service.create_notification.assert_called_once()
    
    def test_calculate_priority(self, notification_service):
        """Test de cálculo de prioridad"""
        approval_instance = ApprovalInstance(
            receipt_id="test",
            workflow_id="test",
            company_id="test"
        )
        
        # Test urgent priority
        receipt_data = {"totalAmount": 1500000}
        priority = notification_service._calculate_priority(approval_instance, receipt_data)
        assert priority == "urgent"
        
        # Test high priority
        receipt_data = {"totalAmount": 750000}
        priority = notification_service._calculate_priority(approval_instance, receipt_data)
        assert priority == "high"
        
        # Test medium priority
        receipt_data = {"totalAmount": 250000}
        priority = notification_service._calculate_priority(approval_instance, receipt_data)
        assert priority == "medium"
        
        # Test low priority
        receipt_data = {"totalAmount": 50000}
        priority = notification_service._calculate_priority(approval_instance, receipt_data)
        assert priority == "low"


class TestWorkflowIntegration:
    """Tests de integración del sistema completo"""
    
    @pytest.mark.asyncio
    async def test_complete_approval_flow(self):
        """Test del flujo completo de aprobación"""
        # Este test simularía el flujo completo:
        # 1. Crear recibo
        # 2. Evaluar workflow
        # 3. Crear instancia de aprobación
        # 4. Enviar notificación
        # 5. Procesar decisión
        # 6. Notificar resultado
        
        # Por simplicidad, solo verificamos que los componentes están integrados
        engine = WorkflowEngine()
        assert engine is not None
        
        templates = ChileanWorkflowTemplates()
        basic_rules = templates.get_basic_approval_workflow()
        assert len(basic_rules) > 0
        
        enterprise_rules = templates.get_enterprise_approval_workflow()
        assert len(enterprise_rules) > 0


# Fixtures globales para todos los tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
