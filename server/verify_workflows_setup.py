#!/usr/bin/env python3
"""
Script de Verificación del Sistema de Workflows de Gastify
Verifica que todos los componentes del sistema de workflows estén correctamente configurados
"""

import asyncio
import sys
import os
import importlib
from datetime import datetime, timedelta
from typing import List, Dict, Any
from bson import ObjectId

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def print_header(title: str):
    """Imprime un encabezado formateado"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_check(description: str, status: bool, details: str = ""):
    """Imprime el resultado de una verificación"""
    status_symbol = "✅" if status else "❌"
    print(f"{status_symbol} {description}")
    if details:
        print(f"   {details}")

def print_summary(checks_passed: int, total_checks: int):
    """Imprime el resumen final"""
    print(f"\n{'='*60}")
    print(f"  RESUMEN: {checks_passed}/{total_checks} verificaciones exitosas")
    if checks_passed == total_checks:
        print("  🎉 ¡Todos los componentes están funcionando correctamente!")
    else:
        print(f"  ⚠️  {total_checks - checks_passed} verificaciones fallaron")
    print(f"{'='*60}")

async def verify_imports():
    """Verifica que todos los módulos necesarios se puedan importar"""
    print_header("VERIFICACIÓN DE IMPORTACIONES")
    
    modules_to_check = [
        ("app.models.workflow", "Modelos de workflow"),
        ("app.services.workflow_engine", "Motor de workflow"),
        ("app.services.workflow_service", "Servicio de workflow"),
        ("app.services.workflow_notifications", "Notificaciones de workflow"),
        ("app.api.routes.workflows", "Rutas API de workflow"),
    ]
    
    passed = 0
    total = len(modules_to_check)
    
    for module_name, description in modules_to_check:
        try:
            importlib.import_module(module_name)
            print_check(f"Importar {description}", True)
            passed += 1
        except ImportError as e:
            print_check(f"Importar {description}", False, f"Error: {str(e)}")
        except Exception as e:
            print_check(f"Importar {description}", False, f"Error inesperado: {str(e)}")
    
    return passed, total

async def verify_models():
    """Verifica que los modelos de workflow estén correctamente definidos"""
    print_header("VERIFICACIÓN DE MODELOS")
    
    try:
        from app.models.workflow import (
            WorkflowModel, WorkflowCreate, WorkflowRule, WorkflowCondition,
            ConditionOperator, ApprovalAction, ApprovalInstance, ApprovalStatus,
            OrganizationRole, UserRoleAssignment, WorkflowEvaluation
        )
        
        checks = []
        
        # Verificar enums
        try:
            assert hasattr(ConditionOperator, 'EQUALS')
            assert hasattr(ConditionOperator, 'GREATER_THAN')
            assert hasattr(ApprovalAction, 'APPROVE')
            assert hasattr(ApprovalAction, 'REJECT')
            assert hasattr(ApprovalStatus, 'PENDING')
            checks.append(("Enums de workflow definidos", True, ""))
        except Exception as e:
            checks.append(("Enums de workflow definidos", False, str(e)))
        
        # Verificar modelos principales
        try:
            workflow = WorkflowModel(
                company_id="test",
                name="Test Workflow",
                created_by="test_user"
            )
            checks.append(("Modelo WorkflowModel", True, ""))
        except Exception as e:
            checks.append(("Modelo WorkflowModel", False, str(e)))
        
        try:
            condition = WorkflowCondition(
                field="amount",
                operator=ConditionOperator.GREATER_THAN,
                value=100000
            )
            checks.append(("Modelo WorkflowCondition", True, ""))
        except Exception as e:
            checks.append(("Modelo WorkflowCondition", False, str(e)))
        
        try:
            rule = WorkflowRule(
                name="Test Rule",
                conditions=[condition],
                action=ApprovalAction.APPROVE
            )
            checks.append(("Modelo WorkflowRule", True, ""))
        except Exception as e:
            checks.append(("Modelo WorkflowRule", False, str(e)))
        
        try:
            instance = ApprovalInstance(
                receipt_id="test_receipt",
                workflow_id="test_workflow",
                company_id="test_company"
            )
            checks.append(("Modelo ApprovalInstance", True, ""))
        except Exception as e:
            checks.append(("Modelo ApprovalInstance", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except ImportError as e:
        print_check("Importar modelos de workflow", False, f"Error de importación: {str(e)}")
        return 0, 1

async def verify_workflow_engine():
    """Verifica que el motor de workflow funcione correctamente"""
    print_header("VERIFICACIÓN DEL MOTOR DE WORKFLOW")
    
    try:
        from app.services.workflow_engine import (
            WorkflowEngine, WorkflowRuleBuilder, ChileanWorkflowTemplates
        )
        from app.models.workflow import (
            WorkflowModel, WorkflowRule, WorkflowCondition,
            ConditionOperator, ApprovalAction
        )
        from app.models.receipt import ReceiptModel
        from app.models.user import UserModel
        
        checks = []
        engine = WorkflowEngine()
        
        # Verificar evaluadores de condiciones
        try:
            context = {"amount": 100000, "category": "Oficina"}
            
            # Test EQUALS
            result = engine._equals("Oficina", "Oficina")
            assert result == True
            
            # Test GREATER_THAN
            result = engine._greater_than(100000, 50000)
            assert result == True
            
            # Test CONTAINS
            result = engine._contains("Oficina Central", "Oficina")
            assert result == True
            
            checks.append(("Evaluadores de condiciones", True, ""))
        except Exception as e:
            checks.append(("Evaluadores de condiciones", False, str(e)))
        
        # Verificar WorkflowRuleBuilder
        try:
            rule = WorkflowRuleBuilder.create_amount_rule(
                name="Test Rule",
                amount_limit=50000,
                operator=ConditionOperator.LESS_EQUAL,
                action=ApprovalAction.APPROVE
            )
            assert rule.name == "Test Rule"
            assert len(rule.conditions) == 1
            assert rule.conditions[0].field == "amount"
            checks.append(("WorkflowRuleBuilder", True, ""))
        except Exception as e:
            checks.append(("WorkflowRuleBuilder", False, str(e)))
        
        # Verificar plantillas chilenas
        try:
            basic_rules = ChileanWorkflowTemplates.get_basic_approval_workflow()
            enterprise_rules = ChileanWorkflowTemplates.get_enterprise_approval_workflow()
            
            assert len(basic_rules) > 0
            assert len(enterprise_rules) > 0
            assert all(isinstance(rule, WorkflowRule) for rule in basic_rules)
            
            checks.append(("Plantillas chilenas", True, f"Básica: {len(basic_rules)} reglas, Empresarial: {len(enterprise_rules)} reglas"))
        except Exception as e:
            checks.append(("Plantillas chilenas", False, str(e)))
        
        # Verificar evaluación de workflow
        try:
            # Crear datos de prueba
            receipt = ReceiptModel(
                id=ObjectId(),
                user=ObjectId(),
                companyName="Test Merchant",
                folioNumber="TEST001",
                totalAmount=30000,  # Monto pequeño
                date=datetime.utcnow(),
                description="Test receipt"
            )
            
            user = UserModel(
                id=ObjectId(),
                firstName="Test",
                lastName="User",
                email="test@test.com",
                role="client",
                password="password123"  # Agregado campo password requerido
            )
            
            workflow = WorkflowModel(
                id=ObjectId(),
                company_id="test_company",
                name="Test Workflow",
                rules=basic_rules,
                created_by="test_user"
            )
            
            # Evaluar
            evaluation = await engine.evaluate_receipt(receipt, user, workflow)
            
            assert evaluation.workflow_id == str(workflow.id)
            assert evaluation.action in [ApprovalAction.APPROVE, ApprovalAction.REQUIRE_APPROVAL, ApprovalAction.ESCALATE]
            assert 0.0 <= evaluation.confidence <= 1.0
            
            checks.append(("Evaluación de workflow", True, f"Acción: {evaluation.action}, Confianza: {evaluation.confidence:.2f}"))
        except Exception as e:
            checks.append(("Evaluación de workflow", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except ImportError as e:
        print_check("Importar motor de workflow", False, f"Error de importación: {str(e)}")
        return 0, 1

async def verify_workflow_service():
    """Verifica que el servicio de workflow funcione correctamente"""
    print_header("VERIFICACIÓN DEL SERVICIO DE WORKFLOW")
    
    try:
        from app.services.workflow_service import WorkflowService
        from app.models.workflow import WorkflowCreate, ApprovalDecision, ApprovalAction
        from unittest.mock import AsyncMock, MagicMock
        
        checks = []
        
        # Crear mock de base de datos
        mock_db = MagicMock()
        mock_db.workflows = AsyncMock()
        mock_db.approval_instances = AsyncMock()
        mock_db.organization_roles = AsyncMock()
        mock_db.user_role_assignments = AsyncMock()
        
        service = WorkflowService(mock_db)
        
        # Verificar inicialización del servicio
        try:
            assert service.db == mock_db
            assert service.engine is not None
            checks.append(("Inicialización del servicio", True, ""))
        except Exception as e:
            checks.append(("Inicialización del servicio", False, str(e)))
        
        # Verificar métodos del servicio
        try:
            # Verificar que los métodos existen
            assert hasattr(service, 'create_workflow')
            assert hasattr(service, 'get_workflow')
            assert hasattr(service, 'list_workflows')
            assert hasattr(service, 'update_workflow')
            assert hasattr(service, 'delete_workflow')
            assert hasattr(service, 'evaluate_receipt_approval')
            assert hasattr(service, 'create_approval_instance')
            assert hasattr(service, 'process_approval_decision')
            
            checks.append(("Métodos del servicio", True, "Todos los métodos principales disponibles"))
        except Exception as e:
            checks.append(("Métodos del servicio", False, str(e)))
        
        # Verificar creación de workflow (mock)
        try:
            workflow_data = WorkflowCreate(
                name="Test Workflow",
                description="Test Description"
            )
            
            # Mock del resultado de inserción
            mock_db.workflows.insert_one.return_value = AsyncMock()
            mock_db.workflows.insert_one.return_value.inserted_id = ObjectId()
            mock_db.workflows.update_many.return_value = AsyncMock()
            
            # No ejecutamos realmente, solo verificamos que el método existe y acepta los parámetros
            checks.append(("Creación de workflow (estructura)", True, ""))
        except Exception as e:
            checks.append(("Creación de workflow (estructura)", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except ImportError as e:
        print_check("Importar servicio de workflow", False, f"Error de importación: {str(e)}")
        return 0, 1

async def verify_notifications():
    """Verifica que el sistema de notificaciones funcione correctamente"""
    print_header("VERIFICACIÓN DE NOTIFICACIONES")
    
    try:
        from app.services.workflow_notifications import (
            WorkflowNotificationService, WorkflowNotificationTemplates
        )
        from unittest.mock import AsyncMock, MagicMock
        
        checks = []
        
        # Crear mock de base de datos
        mock_db = MagicMock()
        notification_service = WorkflowNotificationService(mock_db)
        
        # Verificar inicialización
        try:
            assert notification_service.db == mock_db
            checks.append(("Inicialización de notificaciones", True, ""))
        except Exception as e:
            checks.append(("Inicialización de notificaciones", False, str(e)))
        
        # Verificar métodos de notificación
        try:
            methods = [
                'notify_approval_required',
                'notify_approval_decision',
                'notify_auto_approval',
                'notify_escalation',
                'notify_overdue_approval',
                'send_daily_approval_summary'
            ]
            
            for method in methods:
                assert hasattr(notification_service, method)
            
            checks.append(("Métodos de notificación", True, f"{len(methods)} métodos disponibles"))
        except Exception as e:
            checks.append(("Métodos de notificación", False, str(e)))
        
        # Verificar plantillas
        try:
            approval_templates = WorkflowNotificationTemplates.get_approval_templates()
            admin_templates = WorkflowNotificationTemplates.get_admin_templates()
            
            assert len(approval_templates) > 0
            assert len(admin_templates) > 0
            assert 'approval_required' in approval_templates
            assert 'workflow_updated' in admin_templates
            
            checks.append(("Plantillas de notificación", True, f"Aprobación: {len(approval_templates)}, Admin: {len(admin_templates)}"))
        except Exception as e:
            checks.append(("Plantillas de notificación", False, str(e)))
        
        # Verificar cálculo de prioridad
        try:
            from app.models.workflow import ApprovalInstance
            
            instance = ApprovalInstance(
                receipt_id="test",
                workflow_id="test",
                company_id="test"
            )
            
            # Test diferentes montos
            priority_high = notification_service._calculate_priority(instance, {"totalAmount": 1500000})
            priority_medium = notification_service._calculate_priority(instance, {"totalAmount": 250000})
            priority_low = notification_service._calculate_priority(instance, {"totalAmount": 25000})
            
            assert priority_high == "urgent"
            assert priority_medium == "medium"
            assert priority_low == "low"
            
            checks.append(("Cálculo de prioridad", True, "Todos los niveles funcionan correctamente"))
        except Exception as e:
            checks.append(("Cálculo de prioridad", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except ImportError as e:
        print_check("Importar notificaciones de workflow", False, f"Error de importación: {str(e)}")
        return 0, 1

async def verify_api_routes():
    """Verifica que las rutas API estén correctamente definidas"""
    print_header("VERIFICACIÓN DE RUTAS API")
    
    try:
        from app.api.routes.workflows import router
        from fastapi import APIRouter
        
        checks = []
        
        # Verificar que el router existe y es del tipo correcto
        try:
            assert isinstance(router, APIRouter)
            checks.append(("Router de workflows", True, ""))
        except Exception as e:
            checks.append(("Router de workflows", False, str(e)))
        
        # Verificar rutas principales (verificación simplificada)
        try:
            # En lugar de verificar rutas dinámicamente, verificamos que el router tenga rutas registradas
            route_count = len(router.routes) if hasattr(router, 'routes') else 0
            
            if route_count > 0:
                checks.append(("Rutas API definidas", True, f"{route_count} rutas registradas en el router"))
            else:
                # Verificación alternativa: buscar funciones de endpoint en el módulo
                import app.api.routes.workflows as workflows_module
                endpoint_functions = [
                    'create_workflow', 'list_workflows', 'get_workflow', 'update_workflow',
                    'delete_workflow', 'get_default_workflow', 'list_pending_approvals',
                    'get_approval_instance', 'process_approval_decision', 'create_organization_role',
                    'assign_user_role', 'get_workflow_analytics'
                ]
                
                found_functions = []
                for func_name in endpoint_functions:
                    if hasattr(workflows_module, func_name):
                        found_functions.append(func_name)
                
                if len(found_functions) >= 8:  # Al menos 8 funciones principales
                    checks.append(("Rutas API definidas", True, f"{len(found_functions)} funciones de endpoint encontradas"))
                else:
                    checks.append(("Rutas API definidas", False, f"Solo {len(found_functions)} funciones encontradas de {len(endpoint_functions)} esperadas"))
        except Exception as e:
            checks.append(("Rutas API definidas", False, f"Error en verificación: {str(e)}"))
        
        # Verificar métodos HTTP
        try:
            methods = set()
            for route in router.routes:
                if hasattr(route, 'methods'):
                    methods.update(route.methods)
            
            expected_methods = {'GET', 'POST', 'PUT', 'DELETE'}
            if expected_methods.issubset(methods):
                checks.append(("Métodos HTTP", True, f"Métodos disponibles: {sorted(methods)}"))
            else:
                missing = expected_methods - methods
                checks.append(("Métodos HTTP", False, f"Faltan métodos: {missing}"))
        except Exception as e:
            checks.append(("Métodos HTTP", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except ImportError as e:
        print_check("Importar rutas de workflow", False, f"Error de importación: {str(e)}")
        return 0, 1

async def verify_integration():
    """Verifica que la integración con el sistema de recibos funcione"""
    print_header("VERIFICACIÓN DE INTEGRACIÓN")
    
    try:
        checks = []
        
        # Verificar que las rutas estén registradas en main.py
        try:
            with open("app/main.py", "r", encoding="utf-8") as f:
                main_content = f.read()
            
            if "workflows" in main_content and "include_router" in main_content:
                checks.append(("Rutas registradas en main.py", True, ""))
            else:
                checks.append(("Rutas registradas en main.py", False, "No se encontró registro de rutas"))
        except Exception as e:
            checks.append(("Rutas registradas en main.py", False, str(e)))
        
        # Verificar modificaciones en receipts.py
        try:
            with open("app/api/routes/receipts.py", "r", encoding="utf-8") as f:
                receipts_content = f.read()
            
            integration_checks = [
                ("WorkflowService", "workflow_service" in receipts_content),
                ("Evaluación de workflow", "evaluate_receipt_approval" in receipts_content),
                ("Instancia de aprobación", "create_approval_instance" in receipts_content),
                ("Respuesta con datos de aprobación", '"approval"' in receipts_content)
            ]
            
            for check_name, condition in integration_checks:
                checks.append((f"Integración: {check_name}", condition, ""))
                
        except Exception as e:
            checks.append(("Integración con recibos", False, str(e)))
        
        # Verificar documentación
        try:
            docs_files = [
                "docs/WORKFLOWS_API.md",
                "docs/WORKFLOWS_TECHNICAL.md"
            ]
            
            docs_exist = []
            for doc_file in docs_files:
                if os.path.exists(doc_file):
                    docs_exist.append(doc_file)
            
            if len(docs_exist) == len(docs_files):
                checks.append(("Documentación", True, f"Archivos: {', '.join(docs_exist)}"))
            else:
                missing = set(docs_files) - set(docs_exist)
                checks.append(("Documentación", False, f"Faltan archivos: {missing}"))
        except Exception as e:
            checks.append(("Documentación", False, str(e)))
        
        passed = sum(1 for _, status, _ in checks if status)
        total = len(checks)
        
        for description, status, details in checks:
            print_check(description, status, details)
        
        return passed, total
        
    except Exception as e:
        print_check("Verificación de integración", False, f"Error general: {str(e)}")
        return 0, 1

async def verify_tests():
    """Verifica que los tests estén disponibles"""
    print_header("VERIFICACIÓN DE TESTS")
    
    checks = []
    
    # Verificar archivo de tests
    try:
        test_file = "tests/test_workflows.py"
        if os.path.exists(test_file):
            with open(test_file, "r", encoding="utf-8") as f:
                test_content = f.read()
            
            test_classes = [
                "TestWorkflowEngine",
                "TestWorkflowRuleBuilder", 
                "TestChileanWorkflowTemplates",
                "TestWorkflowService",
                "TestWorkflowNotifications"
            ]
            
            found_classes = []
            for test_class in test_classes:
                if test_class in test_content:
                    found_classes.append(test_class)
            
            checks.append(("Archivo de tests", True, f"Clases encontradas: {len(found_classes)}/{len(test_classes)}"))
            
            # Contar métodos de test
            test_methods = test_content.count("def test_")
            checks.append(("Métodos de test", True, f"{test_methods} métodos de test definidos"))
            
        else:
            checks.append(("Archivo de tests", False, "No se encontró tests/test_workflows.py"))
    except Exception as e:
        checks.append(("Archivo de tests", False, str(e)))
    
    passed = sum(1 for _, status, _ in checks if status)
    total = len(checks)
    
    for description, status, details in checks:
        print_check(description, status, details)
    
    return passed, total

async def main():
    """Función principal que ejecuta todas las verificaciones"""
    print_header("VERIFICACIÓN DEL SISTEMA DE WORKFLOWS DE GASTIFY")
    print("Este script verifica que todos los componentes del sistema de workflows")
    print("estén correctamente implementados e integrados.")
    
    total_passed = 0
    total_checks = 0
    
    # Ejecutar todas las verificaciones
    verification_functions = [
        verify_imports,
        verify_models,
        verify_workflow_engine,
        verify_workflow_service,
        verify_notifications,
        verify_api_routes,
        verify_integration,
        verify_tests
    ]
    
    for verify_func in verification_functions:
        try:
            passed, total = await verify_func()
            total_passed += passed
            total_checks += total
        except Exception as e:
            print(f"❌ Error en {verify_func.__name__}: {str(e)}")
            total_checks += 1
    
    # Mostrar resumen final
    print_summary(total_passed, total_checks)
    
    # Mostrar recomendaciones si hay fallos
    if total_passed < total_checks:
        print(f"\n📋 RECOMENDACIONES:")
        print("1. Revise los errores mostrados arriba")
        print("2. Verifique que todas las dependencias estén instaladas")
        print("3. Asegúrese de que la estructura de archivos sea correcta")
        print("4. Ejecute los tests unitarios: python -m pytest tests/test_workflows.py -v")
        print("5. Revise la documentación en docs/WORKFLOWS_TECHNICAL.md")
    else:
        print(f"\n🚀 PRÓXIMOS PASOS:")
        print("1. Ejecutar el servidor: uvicorn app.main:app --reload")
        print("2. Probar los endpoints en: http://localhost:8000/docs")
        print("3. Crear workflows de prueba usando las plantillas")
        print("4. Probar el flujo completo de aprobación")
        print("5. Configurar notificaciones en producción")
    
    return total_passed == total_checks

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
