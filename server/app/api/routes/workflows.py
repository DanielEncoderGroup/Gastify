"""
API Routes para Workflows de Aprobación
Endpoints para gestión de workflows, aprobaciones y roles organizacionales
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer

from app.models.workflow import (
    WorkflowModel, WorkflowCreate, WorkflowUpdate, ApprovalInstance,
    ApprovalDecision, WorkflowAnalytics, OrganizationRole, UserRoleAssignment,
    ApprovalStatus, WorkflowStatus
)
from app.models.user import UserModel
from app.services.workflow_service import WorkflowService
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_database

router = APIRouter(prefix="/workflows", tags=["workflows"])
security = HTTPBearer()

# Dependency para obtener el servicio de workflow
async def get_workflow_service():
    return WorkflowService(get_database())

# CRUD de Workflows
@router.post("/")
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Crea un nuevo workflow de aprobación"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflow = await workflow_service.create_workflow(
            workflow_data,
            company_id,
            str(current_user.id)
        )
        
        return workflow
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creando workflow: {str(e)}"
        )

@router.get("/")
async def list_workflows(
    status_filter: Optional[WorkflowStatus] = Query(None, alias="status"),
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Lista todos los workflows de la empresa"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflows = await workflow_service.list_workflows(company_id)
        
        # Filtrar por estado si se especifica
        if status_filter:
            workflows = [w for w in workflows if w.status == status_filter]
        
        return workflows
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listando workflows: {str(e)}"
        )

@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Obtiene un workflow específico"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflow = await workflow_service.get_workflow(workflow_id, company_id)
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow no encontrado"
            )
        
        return workflow
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo workflow: {str(e)}"
        )

@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Actualiza un workflow"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflow = await workflow_service.update_workflow(
            workflow_id,
            company_id,
            workflow_update
        )
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow no encontrado"
            )
        
        return workflow
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error actualizando workflow: {str(e)}"
        )

@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Elimina un workflow"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        deleted = await workflow_service.delete_workflow(workflow_id, company_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow no encontrado"
            )
        
        return {"message": "Workflow eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error eliminando workflow: {str(e)}"
        )

@router.get("/default/current")
async def get_default_workflow(
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Obtiene el workflow por defecto de la empresa"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        workflow = await workflow_service.get_default_workflow(company_id)
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró workflow por defecto"
            )
        
        return workflow
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo workflow por defecto: {str(e)}"
        )

# Gestión de Aprobaciones
@router.get("/approvals/pending")
async def list_pending_approvals(
    approver_role: Optional[str] = Query(None),
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Lista aprobaciones pendientes para el usuario actual"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        approvals = await workflow_service.list_pending_approvals(
            company_id,
            approver_id=str(current_user.id),
            approver_role=approver_role
        )
        
        return approvals
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listando aprobaciones pendientes: {str(e)}"
        )

@router.get("/approvals/{instance_id}")
async def get_approval_instance(
    instance_id: str,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Obtiene una instancia de aprobación específica"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        instance = await workflow_service.get_approval_instance(instance_id, company_id)
        
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instancia de aprobación no encontrada"
            )
        
        return instance
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo instancia de aprobación: {str(e)}"
        )

@router.post("/approvals/{instance_id}/decision")
async def process_approval_decision(
    instance_id: str,
    decision: ApprovalDecision,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Procesa una decisión de aprobación"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        instance = await workflow_service.process_approval_decision(
            instance_id,
            decision,
            str(current_user.id),
            company_id
        )
        
        return instance
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando decisión: {str(e)}"
        )

# Roles Organizacionales
@router.post("/roles")
async def create_organization_role(
    name: str,
    level: int,
    approval_limit: Optional[float] = None,
    can_approve_categories: Optional[List[str]] = None,
    parent_role_id: Optional[str] = None,
    current_user: UserModel = Depends(get_admin_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Crea un rol organizacional (solo administradores)"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        role = await workflow_service.create_organization_role(
            company_id,
            name,
            level,
            approval_limit,
            can_approve_categories or [],
            parent_role_id
        )
        
        return role
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creando rol: {str(e)}"
        )

@router.post("/roles/assign")
async def assign_user_role(
    user_id: str,
    role_id: str,
    current_user: UserModel = Depends(get_admin_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Asigna un rol a un usuario (solo administradores)"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        assignment = await workflow_service.assign_user_role(
            user_id,
            company_id,
            role_id,
            str(current_user.id)
        )
        
        return assignment
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error asignando rol: {str(e)}"
        )

# Analytics y Reportes
@router.get("/analytics/summary")
async def get_workflow_analytics(
    workflow_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Obtiene analytics de workflows"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        analytics = await workflow_service.get_workflow_analytics(
            company_id,
            workflow_id,
            start_date,
            end_date
        )
        
        return analytics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo analytics: {str(e)}"
        )

# Endpoints de Utilidad
@router.get("/templates/basic")
async def get_basic_workflow_template():
    """Obtiene plantilla de workflow básico para Chile"""
    from app.services.workflow_engine import ChileanWorkflowTemplates
    
    return {
        "name": "Workflow Básico Chile",
        "description": "Plantilla básica de aprobación para empresas chilenas",
        "rules": ChileanWorkflowTemplates.get_basic_approval_workflow()
    }

@router.get("/templates/enterprise")
async def get_enterprise_workflow_template():
    """Obtiene plantilla de workflow empresarial para Chile"""
    from app.services.workflow_engine import ChileanWorkflowTemplates
    
    return {
        "name": "Workflow Empresarial Chile",
        "description": "Plantilla empresarial con múltiples niveles para Chile",
        "rules": ChileanWorkflowTemplates.get_enterprise_approval_workflow()
    }

@router.post("/test-evaluation")
async def test_workflow_evaluation(
    receipt_data: dict,
    workflow_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Endpoint de prueba para evaluar un recibo contra un workflow"""
    try:
        # TODO: Obtener company_id del usuario actual
        company_id = "default_company"  # Placeholder
        
        # Crear recibo temporal para prueba
        from app.models.receipt import ReceiptModel
        receipt = ReceiptModel(**receipt_data)
        
        # Obtener workflow
        if workflow_id:
            workflow = await workflow_service.get_workflow(workflow_id, company_id)
        else:
            workflow = await workflow_service.get_default_workflow(company_id)
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow no encontrado"
            )
        
        # Evaluar
        evaluation = await workflow_service.evaluate_receipt_approval(
            receipt,
            current_user,
            company_id
        )
        
        return {
            "evaluation": evaluation,
            "workflow_used": {
                "id": str(workflow.id),
                "name": workflow.name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en evaluación de prueba: {str(e)}"
        )
