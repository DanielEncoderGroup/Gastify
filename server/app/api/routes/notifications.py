from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional
from app.services.notification_service import NotificationService
from app.api.deps import get_current_user
from app.models.user import UserPublic
from app.api.ws.notifications import notification_websocket, manager

router = APIRouter(tags=["Notifications"])

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: str = Query(..., description="JWT token para autenticación")
):
    """
    Endpoint WebSocket para notificaciones en tiempo real.
    
    Parameters:
    - user_id: ID del usuario que se conecta
    - token: Token JWT válido en query parameter
    
    Example:
    ws://localhost/api/notifications/ws/notifications/USER_ID?token=JWT_TOKEN
    """
    print(f"Nueva conexión WebSocket solicitada para usuario {user_id}")
    await notification_websocket(websocket, user_id, token)

@router.get("/", response_model=List[dict])
async def get_notifications(
    skip: int = Query(0, ge=0, description="Número de notificaciones a omitir"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de notificaciones a devolver"),
    unread_only: bool = Query(False, description="Solo obtener notificaciones no leídas"),
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Obtener notificaciones del usuario actual con paginación.
    
    Parameters:
    - skip: Offset para paginación
    - limit: Cantidad máxima de resultados (máximo 100)
    - unread_only: Si es True, solo devuelve notificaciones no leídas
    
    Returns:
    - Lista de notificaciones del usuario
    """
    try:
        notifications = await NotificationService.get_user_notifications(
            str(current_user.id), limit, skip, unread_only
        )
        print(f"Devueltas {len(notifications)} notificaciones para usuario {current_user.id}")
        return notifications
    except Exception as e:
        print(f"Error obteniendo notificaciones para usuario {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener notificaciones"
        )

@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Obtener cantidad de notificaciones no leídas del usuario actual.
    
    Returns:
    - Objeto con el conteo de notificaciones no leídas
    """
    try:
        # Obtener notificaciones no leídas
        unread_notifications = await NotificationService.get_user_notifications(
            str(current_user.id), limit=1000, skip=0, unread_only=True
        )
        unread_count = len(unread_notifications)
        
        print(f"Usuario {current_user.id} tiene {unread_count} notificaciones no leídas")
        return {"unread_count": unread_count}
        
    except Exception as e:
        print(f"Error obteniendo conteo de no leídas para usuario {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener conteo de notificaciones"
        )

@router.post("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Marcar una notificación específica como leída.
    
    Parameters:
    - notification_id: ID de la notificación a marcar como leída
    
    Returns:
    - Objeto indicando el éxito de la operación
    """
    try:
        success = await NotificationService.mark_as_read(notification_id)
        
        if success:
            print(f"Notificación {notification_id} marcada como leída por usuario {current_user.id}")
            return {"success": True, "message": "Notificación marcada como leída"}
        else:
            print(f"No se pudo marcar notificación {notification_id} como leída para usuario {current_user.id}")
            return {"success": False, "message": "No se pudo marcar la notificación como leída"}
            
    except Exception as e:
        print(f"Error marcando notificación {notification_id} como leída para usuario {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al marcar notificación como leída"
        )

@router.post("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Marcar todas las notificaciones del usuario como leídas.
    
    Returns:
    - Objeto con el éxito de la operación y cantidad de notificaciones marcadas
    """
    try:
        count = await NotificationService.mark_all_as_read(str(current_user.id))
        
        print(f"Marcadas {count} notificaciones como leídas para usuario {current_user.id}")
        return {
            "success": True, 
            "marked_read": count,
            "message": f"Se marcaron {count} notificaciones como leídas"
        }
        
    except Exception as e:
        print(f"Error marcando todas las notificaciones como leídas para usuario {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al marcar todas las notificaciones como leídas"
        )

# Endpoints adicionales para administración (opcional)
@router.get("/status", response_model=dict)
async def get_notification_status():
    """
    Obtener estado del sistema de notificaciones.
    Útil para monitoreo y debugging.
    """
    try:
        connected_users = manager.get_connected_users()
        return {
            "service_status": "active",
            "connected_users_count": len(connected_users),
            "connected_users": connected_users
        }
    except Exception as e:
        print(f"Error obteniendo estado de notificaciones: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener estado"
        )

@router.post("/test/{user_id}", response_model=dict)
async def send_test_notification(
    user_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Enviar notificación de prueba via WebSocket (solo para testing).
    En producción, este endpoint debería estar restringido a admins.
    """
    try:
        test_notification = {
            "type": "test_notification",
            "title": "Notificación de Prueba",
            "message": f"Esta es una notificación de prueba enviada por {current_user.email}",
            "timestamp": "2025-06-07T14:30:00Z"  # En producción usar datetime real
        }
        
        success = await manager.send_personal_message(test_notification, user_id)
        
        if success:
            return {"success": True, "message": f"Notificación de prueba enviada a usuario {user_id}"}
        else:
            return {"success": False, "message": f"Usuario {user_id} no está conectado"}
            
    except Exception as e:
        print(f"Error enviando notificación de prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al enviar notificación de prueba"
        )