from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.responses import HTMLResponse
import logging
from app.services.websocket_manager import websocket_manager
from app.services.notification_service import NotificationService
from app.api.deps import get_current_user_websocket

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint para notificaciones en tiempo real.
    
    Args:
        websocket: Conexión WebSocket
        user_id: ID del usuario que se conecta
    """
    try:
        # TODO: En producción, agregar autenticación WebSocket
        # Por ahora, acepta cualquier user_id para desarrollo
        
        # Conectar el WebSocket
        await websocket_manager.connect(websocket, user_id)
        
        # Enviar notificaciones pendientes al conectarse
        try:
            unread_notifications = await NotificationService.get_user_notifications(
                user_id=user_id,
                limit=10,
                unread_only=True
            )
            
            if unread_notifications:
                await websocket_manager.send_notification_to_user(user_id, {
                    "type": "initial_notifications",
                    "notifications": unread_notifications,
                    "count": len(unread_notifications)
                })
                
        except Exception as e:
            logger.error(f"Error enviando notificaciones iniciales a {user_id}: {e}")
        
        # Mantener conexión activa y escuchar mensajes
        while True:
            try:
                # Recibir mensajes del cliente (opcional, para ping/pong, etc.)
                data = await websocket.receive_text()
                logger.debug(f"Mensaje recibido de {user_id}: {data}")
                
                # Responder a pings
                if data.strip().lower() == "ping":
                    await websocket.send_text("pong")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error procesando mensaje WebSocket de {user_id}: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket desconectado para usuario {user_id}")
    except Exception as e:
        logger.error(f"Error en WebSocket para usuario {user_id}: {e}")
    finally:
        # Limpiar conexión
        websocket_manager.disconnect(websocket, user_id)

@router.get("/test-notification/{user_id}")
async def test_notification_endpoint(user_id: str, message: str = Query("Mensaje de prueba")):
    """
    Endpoint de testing para enviar notificaciones de prueba.
    SOLO para desarrollo - remover en producción.
    """
    try:
        # Crear notificación de prueba en base de datos
        notification_id = await NotificationService.create_notification(
            user_id=user_id,
            type="test_notification",
            title="Notificación de prueba",
            message=message,
            data={"test": True, "source": "test_endpoint"}
        )
        
        # Obtener la notificación creada
        notifications = await NotificationService.get_user_notifications(
            user_id=user_id,
            limit=1
        )
        
        if notifications:
            notification = notifications[0]
            
            # Enviar vía WebSocket si el usuario está conectado
            sent_via_websocket = await websocket_manager.send_notification_to_user(
                user_id, 
                notification
            )
            
            return {
                "success": True,
                "notification_id": notification_id,
                "sent_via_websocket": sent_via_websocket,
                "notification": notification
            }
        else:
            return {
                "success": True,
                "notification_id": notification_id,
                "sent_via_websocket": False,
                "message": "Notificación creada pero no encontrada para envío WebSocket"
            }
            
    except Exception as e:
        logger.error(f"Error en test notification: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/websocket-stats")
async def get_websocket_stats():
    """
    Obtener estadísticas de conexiones WebSocket.
    """
    try:
        stats = websocket_manager.get_connection_stats()
        connected_users = websocket_manager.get_connected_users()
        
        return {
            "success": True,
            "stats": stats,
            "connected_users": connected_users
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas WebSocket: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/broadcast-announcement")
async def broadcast_announcement(
    title: str = Query(..., description="Título del anuncio"),
    message: str = Query(..., description="Mensaje del anuncio")
):
    """
    Enviar un anuncio del sistema a todos los usuarios conectados.
    SOLO para administradores - agregar autenticación en producción.
    """
    try:
        users_reached = await websocket_manager.send_system_announcement(
            title=title,
            message=message
        )
        
        return {
            "success": True,
            "users_reached": users_reached,
            "message": f"Anuncio enviado a {users_reached} usuarios conectados"
        }
        
    except Exception as e:
        logger.error(f"Error enviando anuncio: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/ping-all")
async def ping_all_connections():
    """
    Ping a todas las conexiones WebSocket para verificar estado.
    """
    try:
        ping_results = await websocket_manager.ping_all_connections()
        
        return {
            "success": True,
            "ping_results": ping_results
        }
        
    except Exception as e:
        logger.error(f"Error en ping all: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/test-websocket-page")
async def get_test_websocket_page():
    """
    Página HTML simple para testing de WebSockets.
    SOLO para desarrollo.
    """
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Gastify WebSocket Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .log { background: #f5f5f5; padding: 10px; height: 400px; overflow-y: scroll; border: 1px solid #ccc; }
            .controls { margin: 20px 0; }
            button { padding: 10px 15px; margin: 5px; background: #007bff; color: white; border: none; cursor: pointer; }
            input { padding: 8px; margin: 5px; width: 200px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Gastify WebSocket Test</h1>
            
            <div class="controls">
                <input type="text" id="userId" placeholder="User ID" value="test-user-123">
                <button onclick="connect()">Conectar</button>
                <button onclick="disconnect()">Desconectar</button>
                <button onclick="clearLog()">Limpiar Log</button>
            </div>
            
            <div class="controls">
                <input type="text" id="testMessage" placeholder="Mensaje de prueba" value="Hola desde WebSocket">
                <button onclick="sendTestNotification()">Enviar Notificación de Prueba</button>
            </div>
            
            <div id="status">Estado: Desconectado</div>
            <div class="log" id="log"></div>
        </div>

        <script>
            let socket = null;
            let userId = null;

            function log(message) {
                const logDiv = document.getElementById('log');
                const timestamp = new Date().toLocaleTimeString();
                logDiv.innerHTML += `<div>[${timestamp}] ${message}</div>`;
                logDiv.scrollTop = logDiv.scrollHeight;
            }

            function updateStatus(status) {
                document.getElementById('status').textContent = `Estado: ${status}`;
            }

            function connect() {
                userId = document.getElementById('userId').value;
                if (!userId) {
                    alert('Ingresa un User ID');
                    return;
                }

                const wsUrl = `ws://localhost:8000/api/v1/websockets/ws/${userId}`;
                log(`Conectando a: ${wsUrl}`);

                socket = new WebSocket(wsUrl);

                socket.onopen = function(event) {
                    log('✅ Conectado exitosamente');
                    updateStatus('Conectado');
                };

                socket.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        log(`📨 Mensaje recibido: ${JSON.stringify(data, null, 2)}`);
                    } catch (e) {
                        log(`📨 Mensaje de texto: ${event.data}`);
                    }
                };

                socket.onclose = function(event) {
                    log('🔌 Conexión cerrada');
                    updateStatus('Desconectado');
                    socket = null;
                };

                socket.onerror = function(error) {
                    log(`❌ Error: ${error}`);
                    updateStatus('Error');
                };
            }

            function disconnect() {
                if (socket) {
                    socket.close();
                    log('🔌 Desconectando...');
                }
            }

            function sendTestNotification() {
                if (!userId) {
                    alert('Conecta primero');
                    return;
                }

                const message = document.getElementById('testMessage').value;
                const url = `/api/v1/websockets/test-notification/${userId}?message=${encodeURIComponent(message)}`;
                
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        log(`🔔 Respuesta test notification: ${JSON.stringify(data, null, 2)}`);
                    })
                    .catch(error => {
                        log(`❌ Error enviando test notification: ${error}`);
                    });
            }

            function clearLog() {
                document.getElementById('log').innerHTML = '';
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
