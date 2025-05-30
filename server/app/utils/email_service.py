from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_password_reset_email(recipient_email, recipient_name, reset_url):
        """
        Envía un correo electrónico de restablecimiento de contraseña usando SendGrid
        
        Args:
            recipient_email (str): El correo electrónico del destinatario
            recipient_name (str): El nombre del destinatario
            reset_url (str): URL para restablecer la contraseña
            
        Returns:
            bool: True si el correo se envió correctamente, False en caso contrario
        """
        if not settings.SENDGRID_API_KEY or not settings.EMAIL_SENDER:
            logger.warning("SendGrid API key o Email sender no configurados. No se enviará el correo.")
            return False
        
        # Crear el contenido del correo
        html_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                h1 {{ color: #2c3e50; }}
                .btn {{ display: inline-block; background-color: #3498db; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }}
                .note {{ font-size: 0.8em; color: #7f8c8d; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Recuperación de Contraseña</h1>
                <p>Hola {recipient_name},</p>
                <p>Has solicitado restablecer tu contraseña para tu cuenta de EncoderGroup.</p>
                <p>Por favor, haz clic en el siguiente botón para establecer una nueva contraseña:</p>
                <a href="{reset_url}" style="display: inline-block; background-color: #3498db; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0;">Restablecer Contraseña</a>
                <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
                <p>Este enlace expirará en 30 minutos por razones de seguridad.</p>
                <div class="note">
                    <p>Si tienes problemas con el botón, puedes copiar y pegar la siguiente URL en tu navegador:</p>
                    <p>{reset_url}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            # Configurar el mensaje
            message = Mail(
                from_email=Email(settings.EMAIL_SENDER),
                to_emails=To(recipient_email),
                subject="Recuperación de Contraseña - EncoderGroup",
                html_content=HtmlContent(html_content)
            )
            
            # Enviar el correo
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            
            # Verificar estado de la respuesta
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Correo enviado exitosamente a {recipient_email}")
                return True
            else:
                logger.error(f"Error al enviar correo. Código de estado: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error al enviar correo con SendGrid: {str(e)}")
            return False