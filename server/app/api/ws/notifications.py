from fastapi import WebSocket, WebSocketDisconnect, status
from typing import Dict
from app.api.deps import get_current_user_ws

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Conectar un WebSocket para un usuario específico"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"WebSocket conectado para usuario: {user_id}")
        print(f"Conexiones activas totales: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        """Desconectar un usuario específico"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"WebSocket desconectado para usuario: {user_id}")
            print(f"Conexiones activas restantes: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Enviar un mensaje a un usuario específico"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)
                print(f"Mensaje enviado a usuario {user_id}: {message.get('type', 'unknown')}")
                return True
            except Exception as e:
                print(f"Error enviando mensaje a {user_id}: {e}")
                # Remover conexión inválida
                self.disconnect(user_id)
                return False
        else:
            print(f"Usuario {user_id} no está conectado vía WebSocket")
            return False

    def get_connected_users(self) -> list:
        """Obtener lista de usuarios conectados"""
        return list(self.active_connections.keys())

    async def broadcast_message(self, message: dict, exclude_user: str = None):
        """Enviar mensaje a todos los usuarios conectados (opcional: excluir uno)"""
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_json(message)
                print(f"Mensaje broadcast enviado a usuario {user_id}")
            except Exception as e:
                print(f"Error en broadcast a {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Limpiar conexiones que fallaron
        for user_id in disconnected_users:
            self.disconnect(user_id)

# Instancia global del manejador de conexiones
manager = ConnectionManager()

async def notification_websocket(websocket: WebSocket, user_id: str, token: str):
    """
    Manejar conexión WebSocket para notificaciones en tiempo real.
    
    Args:
        websocket: La conexión WebSocket
        user_id: ID del usuario que se quiere conectar
        token: Token JWT para autenticación
    
    Returns:
        bool: True si la conexión fue exitosa, False si falló
    """
    
    # 1. Validar token JWT y verificar que corresponde al user_id
    try:
        print(f"Validando token para usuario {user_id}")
        user = await get_current_user_ws(token)
        
        # Verificar que el token corresponde al usuario solicitado
        if str(user.id) != user_id:
            print(f"Token no corresponde al usuario solicitado. Token: {user.id}, Solicitado: {user_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token mismatch")
            return False
            
        print(f"Usuario autenticado exitosamente: {user.email} (ID: {user.id})")
        
    except Exception as e:
        print(f"Error validando token para usuario {user_id}: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return False

    # 2. Conectar el WebSocket
    try:
        await manager.connect(websocket, user_id)
        
        # Enviar mensaje de bienvenida/confirmación
        await websocket.send_json({
            "type": "connection_established",
            "message": "Conexión WebSocket establecida para notificaciones",
            "user_id": user_id,
            "timestamp": str(websocket)  # Usar timestamp real en producción
        })
        
    except Exception as e:
        print(f"Error conectando WebSocket para usuario {user_id}: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Connection error")
        return False

    # 3. Mantener la conexión activa y procesar mensajes
    try:
        while True:
            # Esperar mensajes del cliente
            data = await websocket.receive_text()
            
            # Procesar mensajes del cliente si es necesario
            try:
                # Por ahora solo registramos el mensaje, pero aquí se puede agregar lógica
                print(f"Mensaje recibido de usuario {user_id}: {data}")
                
                # Opcional: enviar respuesta de confirmación
                await websocket.send_json({
                    "type": "message_received",
                    "message": "Mensaje procesado correctamente"
                })
                
            except Exception as e:
                print(f"Error procesando mensaje de {user_id}: {e}")
                # No cerramos la conexión por errores menores de procesamiento
                
    except WebSocketDisconnect:
        print(f"Cliente {user_id} desconectado normalmente")
        manager.disconnect(user_id)
        
    except Exception as e:
        print(f"Error inesperado en WebSocket para {user_id}: {e}")
        manager.disconnect(user_id)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Unexpected error")
    
    return True