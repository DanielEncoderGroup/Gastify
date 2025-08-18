"""
Endpoints para sistema de invitaciones empleador→empleado
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Form
from bson import ObjectId

from app.api.deps import get_current_user, get_database, get_employer_user
from app.models.user import UserPublic, UserRole
from app.models.invitation import (
    InvitationCreate, InvitationPublic, InvitationStats,
    InvitationTokenData, AcceptInvitationRequest
)
from app.services.invitation_service import InvitationService
from app.services.email_service import EmailService

router = APIRouter()


@router.post("/invite-employee", response_model=InvitationPublic)
async def invite_employee(
    invitation_data: InvitationCreate,
    current_user: UserPublic = Depends(get_employer_user),
    db = Depends(get_database)
):
    """
    Empleador invita a un nuevo empleado via email
    """
    try:
        invitation_service = InvitationService(db)
        
        # Crear invitación
        invitation = await invitation_service.create_invitation(
            invitation_data=invitation_data,
            employer_id=current_user.id,
            employer_email=current_user.email,
            company_name=current_user.company_name or "Mi Empresa"
        )
        
        # Preparar datos del email
        employer_name = f"{current_user.firstName} {current_user.lastName}"
        email_data = invitation_service.prepare_invitation_email_data(
            invitation=invitation,
            employer_name=employer_name
        )
        
        # Enviar email de invitación
        email_service = EmailService()
        await email_service.send_invitation_email(email_data)
        
        # Convertir a respuesta pública
        return InvitationPublic(
            id=str(invitation.id),
            invited_email=invitation.invited_email,
            invited_first_name=invitation.invited_first_name,
            invited_last_name=invitation.invited_last_name,
            company_name=invitation.company_name,
            department=invitation.department,
            position=invitation.position,
            status=invitation.status,
            created_at=invitation.created_at,
            expires_at=invitation.expires_at,
            invitation_message=invitation.invitation_message
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando invitación: {str(e)}")


@router.get("/my-invitations", response_model=List[InvitationPublic])
async def get_my_invitations(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: UserPublic = Depends(get_employer_user),
    db = Depends(get_database)
):
    """
    Obtener lista de invitaciones enviadas por el empleador
    """
    try:
        invitation_service = InvitationService(db)
        
        invitations = await invitation_service.get_employer_invitations(
            employer_id=current_user.id,
            status=status,
            limit=limit
        )
        
        return invitations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo invitaciones: {str(e)}")


@router.get("/stats", response_model=InvitationStats)
async def get_invitation_stats(
    current_user: UserPublic = Depends(get_employer_user),
    db = Depends(get_database)
):
    """
    Obtener estadísticas de invitaciones del empleador
    """
    try:
        invitation_service = InvitationService(db)
        
        stats = await invitation_service.get_invitation_stats(
            employer_id=current_user.id
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@router.post("/cancel/{invitation_id}")
async def cancel_invitation(
    invitation_id: str,
    current_user: UserPublic = Depends(get_employer_user),
    db = Depends(get_database)
):
    """
    Cancelar una invitación pendiente
    """
    try:
        # Validar ObjectId
        if not ObjectId.is_valid(invitation_id):
            raise HTTPException(status_code=400, detail="ID de invitación inválido")
        
        invitation_service = InvitationService(db)
        
        success = await invitation_service.cancel_invitation(
            invitation_id=invitation_id,
            employer_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Invitación no encontrada o no se puede cancelar"
            )
        
        return {"message": "Invitación cancelada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelando invitación: {str(e)}")


@router.get("/validate-token/{token}", response_model=InvitationTokenData)
async def validate_invitation_token(
    token: str,
    db = Depends(get_database)
):
    """
    Validar token de invitación (público - sin autenticación)
    """
    try:
        invitation_service = InvitationService(db)
        
        token_data = await invitation_service.validate_invitation_token(token)
        
        return token_data
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validando token: {str(e)}")


@router.post("/accept-invitation/{token}")
async def accept_invitation(
    token: str,
    new_user_id: str = Form(...),
    db = Depends(get_database)
):
    """
    Aceptar invitación después de registro exitoso
    (Llamado internamente por el sistema de registro)
    """
    try:
        invitation_service = InvitationService(db)
        
        invitation = await invitation_service.accept_invitation(
            token=token,
            new_user_id=new_user_id
        )
        
        return {
            "message": "Invitación aceptada exitosamente",
            "company_name": invitation.company_name,
            "employer_id": str(invitation.employer_id)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error aceptando invitación: {str(e)}")


@router.post("/resend-invitation/{invitation_id}")
async def resend_invitation(
    invitation_id: str,
    current_user: UserPublic = Depends(get_employer_user),
    db = Depends(get_database)
):
    """
    Reenviar invitación pendiente
    """
    try:
        if not ObjectId.is_valid(invitation_id):
            raise HTTPException(status_code=400, detail="ID de invitación inválido")
        
        invitation_service = InvitationService(db)
        
        # Obtener invitación
        invitation_doc = await db.invitations.find_one({
            "_id": ObjectId(invitation_id),
            "employer_id": ObjectId(current_user.id),
            "status": "pending"
        })
        
        if not invitation_doc:
            raise HTTPException(
                status_code=404, 
                detail="Invitación no encontrada o no está pendiente"
            )
        
        # Crear modelo
        from app.models.invitation import InvitationModel
        invitation = InvitationModel(**invitation_doc)
        
        # Preparar y enviar email
        employer_name = f"{current_user.firstName} {current_user.lastName}"
        email_data = invitation_service.prepare_invitation_email_data(
            invitation=invitation,
            employer_name=employer_name
        )
        
        email_service = EmailService()
        await email_service.send_invitation_email(email_data)
        
        return {"message": "Invitación reenviada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reenviando invitación: {str(e)}")


@router.post("/cleanup-expired")
async def cleanup_expired_invitations(
    db = Depends(get_database)
):
    """
    Limpiar invitaciones expiradas (endpoint administrativo)
    """
    try:
        invitation_service = InvitationService(db)
        
        expired_count = await invitation_service.expire_old_invitations()
        
        return {
            "message": f"Se marcaron {expired_count} invitaciones como expiradas"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando invitaciones: {str(e)}")
