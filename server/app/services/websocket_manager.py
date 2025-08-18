from typing import Dict, List, Set, Optional, Any
import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketConnectionManager:
    """
    Manager para conexiones WebSocket que permite notificaciones en tiempo real.
    Mantiene conexiones activas por usuario y permite envío de mensajes broadcast.
    """
    
    def __init__(self):
        # Diccionario que mapea user_id -> Set[WebSocket]
        # Un usuario puede tener múltiples conexiones (diferentes tabs/devices)
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
        # Para debugging y estadísticas
        self.connection_count = 0
        self.total_messages_sent = 0

    async def connect(self, websocket: WebSocket, user_id: str):
        """
        Conectar un nuevo WebSocket para un usuario específico.
        
        Args:
            websocket: La conexión WebSocket
            user_id: ID del usuario conectándose
        """
        await websocket.accept()
        
        # Inicializar set si es el primer WebSocket del usuario
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        # Agregar la conexión al set del usuario
        self.active_connections[user_id].add(websocket)
        self.connection_count += 1
        
        logger.info(f"WebSocket conectado para usuario {user_id}. Total conexiones: {self.connection_count}")
        
        # Enviar mensaje de confirmación de conexión
        await self._send_to_websocket(websocket, {
            "type": "connection_established",
            "message": "Conectado exitosamente al sistema de notificaciones",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    def disconnect(self, websocket: WebSocket, user_id: str):
        """
        Desconectar un WebSocket específico.
        
        Args:
            websocket: La conexión WebSocket a desconectar
            user_id: ID del usuario
        """
        if user_id in self.active_connections:
            # Remover la conexión específica
            self.active_connections[user_id].discard(websocket)
            self.connection_count -= 1
            
            # Si no quedan conexiones para el usuario, remover la entrada
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket desconectado para usuario {user_id}. Total conexiones: {self.connection_count}")

    async def send_notification_to_user(self, user_id: str, notification_data: Dict[str, Any]) -> bool:
        """
        Enviar una notificación a todas las conexiones de un usuario específico.
        
        Args:
            user_id: ID del usuario destinatario
            notification_data: Datos de la notificación a enviar
            
        Returns:
            bool: True si se envió a al menos una conexión, False si el usuario no está conectado
        """
        if user_id not in self.active_connections or not self.active_connections[user_id]:
            logger.debug(f"Usuario {user_id} no está conectado vía WebSocket")
            return False
        
        # Hacer una copia del set para evitar problemas si se modifica durante la iteración
        connections = self.active_connections[user_id].copy()
        successful_sends = 0
        
        # Enviar a todas las conexiones del usuario
        for websocket in connections:
            try:
                await self._send_to_websocket(websocket, {
                    "type": "notification",
                    "data": notification_data,
                    "timestamp": datetime.utcnow().isoformat()
                })
                successful_sends += 1
                self.total_messages_sent += 1
                
            except WebSocketDisconnect:
                # Conexión cerrada, remover de la lista
                self.disconnect(websocket, user_id)
                logger.warning(f"WebSocket desconectado inesperadamente para usuario {user_id}")
                
            except Exception as e:
                logger.error(f"Error enviando notificación por WebSocket a usuario {user_id}: {e}")
                # Intentar desconectar la conexión problemática
                try:
                    self.disconnect(websocket, user_id)
                except:
                    pass
        
        logger.info(f"Notificación enviada a {successful_sends} conexiones para usuario {user_id}")
        return successful_sends > 0

    async def broadcast_to_all_users(self, message_data: Dict[str, Any]) -> int:
        """
        Enviar un mensaje broadcast a todos los usuarios conectados.
        
        Args:
            message_data: Datos del mensaje a enviar
            
        Returns:
            int: Número de usuarios que recibieron el mensaje
        """
        successful_users = 0
        
        # Enviar a cada usuario conectado
        for user_id in list(self.active_connections.keys()):
            success = await self.send_notification_to_user(user_id, message_data)
            if success:
                successful_users += 1
        
        logger.info(f"Mensaje broadcast enviado a {successful_users} usuarios")
        return successful_users

    async def send_system_announcement(self, title: str, message: str, notification_type: str = "system_notification") -> int:
        """
        Enviar un anuncio del sistema a todos los usuarios conectados.
        
        Args:
            title: Título del anuncio
            message: Contenido del mensaje
            notification_type: Tipo de notificación
            
        Returns:
            int: Número de usuarios que recibieron el anuncio
        """
        announcement_data = {
            "id": f"system_{int(datetime.utcnow().timestamp())}",
            "type": notification_type,
            "title": title,
            "message": message,
            "data": {"is_system_announcement": True},
            "read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        return await self.broadcast_to_all_users(announcement_data)

    async def _send_to_websocket(self, websocket: WebSocket, data: Dict[str, Any]):
        """
        Enviar datos JSON a un WebSocket específico.
        
        Args:
            websocket: Conexión WebSocket
            data: Datos a enviar (serán convertidos a JSON)
        """
        try:
            json_data = json.dumps(data, default=str)  # default=str maneja datetime, etc.
            await websocket.send_text(json_data)
            
        except WebSocketDisconnect:
            raise  # Re-raise para manejo upstream
        except Exception as e:
            logger.error(f"Error enviando datos por WebSocket: {e}")
            raise

    def get_connected_users(self) -> List[str]:
        """
        Obtener lista de usuarios actualmente conectados.
        
        Returns:
            List[str]: Lista de user_ids conectados
        """
        return list(self.active_connections.keys())

    def get_connection_stats(self) -> Dict[str, int]:
        """
        Obtener estadísticas de conexiones.
        
        Returns:
            Dict: Estadísticas de conexión
        """
        return {
            "total_connections": self.connection_count,
            "unique_users": len(self.active_connections),
            "total_messages_sent": self.total_messages_sent,
            "connections_per_user": {
                user_id: len(connections) 
                for user_id, connections in self.active_connections.items()
            }
        }

    async def ping_all_connections(self) -> Dict[str, int]:
        """
        Enviar ping a todas las conexiones para verificar estado.
        
        Returns:
            Dict: Estadísticas del ping
        """
        ping_data = {
            "type": "ping",
            "message": "ping",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        successful_pings = 0
        failed_pings = 0
        
        for user_id in list(self.active_connections.keys()):
            connections = self.active_connections[user_id].copy()
            
            for websocket in connections:
                try:
                    await self._send_to_websocket(websocket, ping_data)
                    successful_pings += 1
                    
                except (WebSocketDisconnect, Exception) as e:
                    failed_pings += 1
                    self.disconnect(websocket, user_id)
                    logger.warning(f"Ping falló para usuario {user_id}: {e}")
        
        return {
            "successful_pings": successful_pings,
            "failed_pings": failed_pings,
            "total_attempted": successful_pings + failed_pings
        }

# Instancia global del manager
websocket_manager = WebSocketConnectionManager()
