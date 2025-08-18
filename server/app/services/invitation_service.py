"""
Servicio para gestión de invitaciones empleador→empleado
"""

import secrets
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.invitation import (
    InvitationModel, InvitationCreate, InvitationPublic, 
    InvitationTokenData, InvitationStats, InvitationStatus,
    InvitationEmailData
)
from app.models.user import UserRole, UserModel
from app.core.security import create_access_token


class InvitationService:
    """Servicio para gestión completa de invitaciones"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.invitations

    async def create_invitation(
        self, 
        invitation_data: InvitationCreate, 
        employer_id: str,
        employer_email: str,
        company_name: str
    ) -> InvitationModel:
        """Crear nueva invitación de empleado"""
        
        # Verificar que el email no esté ya registrado
        existing_user = await self.db.users.find_one({"email": invitation_data.invited_email})
        if existing_user:
            raise ValueError(f"El email {invitation_data.invited_email} ya está registrado en el sistema")
        
        # Verificar que no hay invitación pendiente para este email
        existing_invitation = await self.collection.find_one({
            "invited_email": invitation_data.invited_email,
            "employer_id": ObjectId(employer_id),
            "status": InvitationStatus.PENDING
        })
        if existing_invitation:
            raise ValueError(f"Ya existe una invitación pendiente para {invitation_data.invited_email}")

        # Generar token único
        invitation_token = self._generate_invitation_token()
        
        # Calcular fecha de expiración
        expires_at = datetime.utcnow() + timedelta(days=invitation_data.expires_in_days)
        
        # Crear modelo de invitación
        invitation = InvitationModel(
            employer_id=ObjectId(employer_id),
            employer_email=employer_email,
            company_name=company_name,
            invited_email=invitation_data.invited_email,
            invited_first_name=invitation_data.invited_first_name,
            invited_last_name=invitation_data.invited_last_name,
            department=invitation_data.department,
            position=invitation_data.position,
            invitation_token=invitation_token,
            expires_at=expires_at,
            invitation_message=invitation_data.invitation_message
        )
        
        # Guardar en base de datos
        result = await self.collection.insert_one(invitation.dict(by_alias=True, exclude={"id"}))
        invitation.id = result.inserted_id
        
        return invitation

    async def get_invitation_by_token(self, token: str) -> Optional[InvitationModel]:
        """Obtener invitación por token"""
        invitation_doc = await self.collection.find_one({"invitation_token": token})
        if not invitation_doc:
            return None
        
        return InvitationModel(**invitation_doc)

    async def validate_invitation_token(self, token: str) -> InvitationTokenData:
        """Validar token de invitación y retornar datos"""
        invitation = await self.get_invitation_by_token(token)
        
        if not invitation:
            raise ValueError("Token de invitación inválido")
        
        if invitation.status != InvitationStatus.PENDING:
            raise ValueError(f"Esta invitación ya fue {invitation.status}")
        
        if datetime.utcnow() > invitation.expires_at:
            # Marcar como expirada
            await self.collection.update_one(
                {"_id": invitation.id},
                {"$set": {"status": InvitationStatus.EXPIRED}}
            )
            raise ValueError("Esta invitación ha expirado")
        
        return InvitationTokenData(
            invitation_id=str(invitation.id),
            employer_id=str(invitation.employer_id),
            invited_email=invitation.invited_email,
            company_name=invitation.company_name,
            department=invitation.department,
            position=invitation.position,
            expires_at=invitation.expires_at
        )

    async def accept_invitation(
        self, 
        token: str, 
        new_user_id: str
    ) -> InvitationModel:
        """Marcar invitación como aceptada después de registro exitoso"""
        
        invitation = await self.get_invitation_by_token(token)
        if not invitation:
            raise ValueError("Token de invitación inválido")
        
        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("Esta invitación ya no está disponible")
        
        # Actualizar estado de la invitación
        await self.collection.update_one(
            {"_id": invitation.id},
            {
                "$set": {
                    "status": InvitationStatus.ACCEPTED,
                    "accepted_at": datetime.utcnow(),
                    "accepted_user_id": ObjectId(new_user_id)
                }
            }
        )
        
        # Actualizar usuario con datos del empleador
        await self.db.users.update_one(
            {"_id": ObjectId(new_user_id)},
            {
                "$set": {
                    "employer_id": invitation.employer_id,
                    "company_name": invitation.company_name,
                    "department": invitation.department,
                    "position": invitation.position,
                    "role": UserRole.EMPLOYEE
                }
            }
        )
        
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.utcnow()
        
        return invitation

    async def cancel_invitation(self, invitation_id: str, employer_id: str) -> bool:
        """Cancelar invitación pendiente"""
        result = await self.collection.update_one(
            {
                "_id": ObjectId(invitation_id),
                "employer_id": ObjectId(employer_id),
                "status": InvitationStatus.PENDING
            },
            {"$set": {"status": InvitationStatus.CANCELLED}}
        )
        
        return result.modified_count > 0

    async def get_employer_invitations(
        self, 
        employer_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[InvitationPublic]:
        """Obtener invitaciones de un empleador"""
        
        query = {"employer_id": ObjectId(employer_id)}
        if status:
            query["status"] = status
        
        cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
        invitations = await cursor.to_list(length=limit)
        
        return [
            InvitationPublic(
                id=str(inv["_id"]),
                invited_email=inv["invited_email"],
                invited_first_name=inv.get("invited_first_name"),
                invited_last_name=inv.get("invited_last_name"),
                company_name=inv["company_name"],
                department=inv.get("department"),
                position=inv.get("position"),
                status=inv["status"],
                created_at=inv["created_at"],
                expires_at=inv["expires_at"],
                accepted_at=inv.get("accepted_at"),
                invitation_message=inv.get("invitation_message")
            )
            for inv in invitations
        ]

    async def get_invitation_stats(self, employer_id: str) -> InvitationStats:
        """Obtener estadísticas de invitaciones del empleador"""
        
        # Pipeline de agregación para estadísticas
        pipeline = [
            {"$match": {"employer_id": ObjectId(employer_id)}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        stats_cursor = self.collection.aggregate(pipeline)
        stats_raw = await stats_cursor.to_list(length=None)
        
        # Procesar estadísticas
        stats_dict = {item["_id"]: item["count"] for item in stats_raw}
        
        total_sent = sum(stats_dict.values())
        pending = stats_dict.get(InvitationStatus.PENDING, 0)
        accepted = stats_dict.get(InvitationStatus.ACCEPTED, 0)
        expired = stats_dict.get(InvitationStatus.EXPIRED, 0)
        
        acceptance_rate = (accepted / total_sent * 100) if total_sent > 0 else 0
        
        # Obtener invitaciones recientes
        recent_invitations = await self.get_employer_invitations(employer_id, limit=5)
        
        return InvitationStats(
            total_sent=total_sent,
            pending=pending,
            accepted=accepted,
            expired=expired,
            acceptance_rate=round(acceptance_rate, 2),
            recent_invitations=recent_invitations
        )

    async def expire_old_invitations(self) -> int:
        """Marcar como expiradas las invitaciones vencidas (tarea programada)"""
        result = await self.collection.update_many(
            {
                "status": InvitationStatus.PENDING,
                "expires_at": {"$lt": datetime.utcnow()}
            },
            {"$set": {"status": InvitationStatus.EXPIRED}}
        )
        
        return result.modified_count

    def _generate_invitation_token(self) -> str:
        """Generar token único para invitación"""
        return f"inv_{secrets.token_urlsafe(32)}"

    def generate_invitation_url(self, token: str, base_url: str = "http://localhost:3000") -> str:
        """Generar URL completa de invitación"""
        return f"{base_url}/auth/register/invitation/{token}"

    def prepare_invitation_email_data(
        self, 
        invitation: InvitationModel,
        employer_name: str,
        base_url: str = "http://localhost:3000"
    ) -> InvitationEmailData:
        """Preparar datos para email de invitación"""
        
        invited_name = f"{invitation.invited_first_name or ''} {invitation.invited_last_name or ''}".strip()
        if not invited_name:
            invited_name = invitation.invited_email.split('@')[0]
        
        invitation_url = self.generate_invitation_url(invitation.invitation_token, base_url)
        
        return InvitationEmailData(
            invited_email=invitation.invited_email,
            invited_name=invited_name,
            employer_name=employer_name,
            company_name=invitation.company_name,
            position=invitation.position,
            department=invitation.department,
            invitation_url=invitation_url,
            expires_at=invitation.expires_at,
            invitation_message=invitation.invitation_message
        )
