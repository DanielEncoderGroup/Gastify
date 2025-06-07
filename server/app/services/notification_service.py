from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime
from app.core.database import get_database
from app.models.notification import Notification, NotificationType

class NotificationService:
    """
    Servicio para manejar notificaciones del sistema.
    Incluye creación, lectura, y marcado de notificaciones.
    """
    
    @staticmethod
    async def create_notification(
        user_id: str,
        type: str,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> str:
        """
        Crear una nueva notificación para un usuario.
        
        Args:
            user_id: ID del usuario destinatario
            type: Tipo de notificación (usando NotificationType)
            title: Título de la notificación
            message: Mensaje/contenido de la notificación
            data: Datos adicionales opcionales
            
        Returns:
            str: ID de la notificación creada
        """
        try:
            print(f"Creando notificación para usuario {user_id}: {title}")
            
            db = get_database()
            
            # Validar que el usuario existe
            user_exists = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user_exists:
                print(f"ADVERTENCIA: Usuario {user_id} no existe al crear notificación")
                # No fallar, solo registrar la advertencia
            
            notification_doc = {
                "user_id": ObjectId(user_id),
                "type": type,
                "title": title,
                "message": message,
                "data": data or {},
                "read": False,
                "created_at": datetime.utcnow(),
                "read_at": None
            }
            
            print(f"Documento de notificación: {notification_doc}")
            
            result = await db.notifications.insert_one(notification_doc)
            notification_id = str(result.inserted_id)
            
            print(f"Notificación creada exitosamente: {notification_id}")
            return notification_id
            
        except Exception as e:
            print(f"ERROR creando notificación para usuario {user_id}: {e}")
            raise e

    @staticmethod
    async def get_user_notifications(
        user_id: str,
        limit: int = 20,
        skip: int = 0,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Obtener notificaciones de un usuario con paginación.
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de notificaciones a devolver
            skip: Número de notificaciones a omitir (para paginación)
            unread_only: Si True, solo devuelve notificaciones no leídas
            
        Returns:
            List[Dict]: Lista de notificaciones formateadas para el frontend
        """
        try:
            print(f"Obteniendo notificaciones para usuario {user_id} (limit: {limit}, skip: {skip}, unread_only: {unread_only})")
            
            db = get_database()
            
            # Construir query
            query = {"user_id": ObjectId(user_id)}
            if unread_only:
                query["read"] = False
            
            print(f"Query MongoDB: {query}")
            
            # Ejecutar query con ordenamiento y paginación
            cursor = db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
            
            # Procesar resultados
            notifications = []
            async for doc in cursor:
                try:
                    # Convertir ObjectId a string para el frontend
                    processed_doc = {
                        "id": str(doc["_id"]),
                        "user_id": str(doc["user_id"]),
                        "type": doc.get("type", "info"),
                        "title": doc.get("title", "Sin título"),
                        "message": doc.get("message", ""),
                        "data": doc.get("data", {}),
                        "read": doc.get("read", False),
                        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
                        "read_at": doc.get("read_at").isoformat() if doc.get("read_at") else None
                    }
                    
                    notifications.append(processed_doc)
                    
                except Exception as doc_error:
                    print(f"Error procesando documento de notificación {doc.get('_id')}: {doc_error}")
                    # Continuar con las demás notificaciones
                    continue
            
            print(f"Devueltas {len(notifications)} notificaciones para usuario {user_id}")
            return notifications
            
        except Exception as e:
            print(f"ERROR obteniendo notificaciones para usuario {user_id}: {e}")
            # Retornar lista vacía en caso de error en lugar de fallar
            return []

    @staticmethod
    async def mark_as_read(notification_id: str) -> bool:
        """
        Marcar una notificación como leída.
        
        Args:
            notification_id: ID de la notificación
            
        Returns:
            bool: True si se marcó exitosamente, False si no
        """
        try:
            print(f"Marcando notificación {notification_id} como leída")
            
            db = get_database()
            
            # Verificar que la notificación existe
            existing_notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
            if not existing_notification:
                print(f"Notificación {notification_id} no existe")
                return False
            
            # Si ya está marcada como leída, no hacer nada
            if existing_notification.get("read", False):
                print(f"Notificación {notification_id} ya estaba marcada como leída")
                return True
            
            # Marcar como leída
            result = await db.notifications.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.utcnow()
                    }
                }
            )
            
            success = result.modified_count > 0
            if success:
                print(f"Notificación {notification_id} marcada como leída exitosamente")
            else:
                print(f"No se pudo marcar notificación {notification_id} como leída")
            
            return success
            
        except Exception as e:
            print(f"ERROR marcando notificación {notification_id} como leída: {e}")
            return False

    @staticmethod
    async def mark_all_as_read(user_id: str) -> int:
        """
        Marcar todas las notificaciones de un usuario como leídas.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            int: Número de notificaciones marcadas como leídas
        """
        try:
            print(f"Marcando todas las notificaciones como leídas para usuario {user_id}")
            
            db = get_database()
            
            # Marcar todas las notificaciones no leídas del usuario como leídas
            result = await db.notifications.update_many(
                {
                    "user_id": ObjectId(user_id),
                    "read": False
                },
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.utcnow()
                    }
                }
            )
            
            marked_count = result.modified_count
            print(f"Marcadas {marked_count} notificaciones como leídas para usuario {user_id}")
            
            return marked_count
            
        except Exception as e:
            print(f"ERROR marcando todas las notificaciones como leídas para usuario {user_id}: {e}")
            return 0

    @staticmethod
    async def delete_notification(notification_id: str, user_id: str) -> bool:
        """
        Eliminar una notificación específica (opcional).
        
        Args:
            notification_id: ID de la notificación
            user_id: ID del usuario (para verificar propiedad)
            
        Returns:
            bool: True si se eliminó exitosamente
        """
        try:
            print(f"Eliminando notificación {notification_id} para usuario {user_id}")
            
            db = get_database()
            
            result = await db.notifications.delete_one({
                "_id": ObjectId(notification_id),
                "user_id": ObjectId(user_id)
            })
            
            success = result.deleted_count > 0
            if success:
                print(f"Notificación {notification_id} eliminada exitosamente")
            else:
                print(f"No se pudo eliminar notificación {notification_id} (no existe o no pertenece al usuario)")
            
            return success
            
        except Exception as e:
            print(f"ERROR eliminando notificación {notification_id}: {e}")
            return False

    @staticmethod
    async def get_notifications_stats(user_id: str) -> Dict[str, int]:
        """
        Obtener estadísticas de notificaciones para un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Dict: Estadísticas (total, read, unread, by_type)
        """
        try:
            print(f"Obteniendo estadísticas de notificaciones para usuario {user_id}")
            
            db = get_database()
            
            # Contar total de notificaciones
            total = await db.notifications.count_documents({"user_id": ObjectId(user_id)})
            
            # Contar leídas
            read = await db.notifications.count_documents({
                "user_id": ObjectId(user_id),
                "read": True
            })
            
            # Contar no leídas
            unread = await db.notifications.count_documents({
                "user_id": ObjectId(user_id),
                "read": False
            })
            
            # Contar por tipo
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id)}},
                {"$group": {"_id": "$type", "count": {"$sum": 1}}}
            ]
            
            by_type = {}
            async for doc in db.notifications.aggregate(pipeline):
                by_type[doc["_id"]] = doc["count"]
            
            stats = {
                "total": total,
                "read": read,
                "unread": unread,
                "by_type": by_type
            }
            
            print(f"Estadísticas para usuario {user_id}: {stats}")
            return stats
            
        except Exception as e:
            print(f"ERROR obteniendo estadísticas para usuario {user_id}: {e}")
            return {"total": 0, "read": 0, "unread": 0, "by_type": {}}