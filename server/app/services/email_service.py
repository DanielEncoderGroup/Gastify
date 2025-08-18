"""
Servicio de email mejorado para invitaciones y notificaciones
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List
from datetime import datetime

from app.core.config import settings
from app.models.invitation import InvitationEmailData


class EmailService:
    """Servicio completo de envío de emails"""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_ssl = settings.SMTP_SSL
        self.sender_email = settings.EMAIL_SENDER or settings.SMTP_USER

    async def send_invitation_email(self, invitation_data: InvitationEmailData) -> bool:
        """Enviar email de invitación de empleado"""
        
        subject = f"Invitación a unirse a {invitation_data.company_name} en Gastify"
        
        # HTML template para invitación
        html_content = self._generate_invitation_html(invitation_data)
        text_content = self._generate_invitation_text(invitation_data)
        
        return await self._send_email(
            to_email=invitation_data.invited_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

    def _generate_invitation_html(self, data: InvitationEmailData) -> str:
        """Generar contenido HTML para invitación"""
        
        position_info = ""
        if data.position:
            position_info = f"<p><strong>Cargo:</strong> {data.position}</p>"
        if data.department:
            position_info += f"<p><strong>Departamento:</strong> {data.department}</p>"
        
        custom_message = ""
        if data.invitation_message:
            custom_message = f"""
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <p><strong>Mensaje personal:</strong></p>
                <p style="font-style: italic;">"{data.invitation_message}"</p>
            </div>
            """
        
        expires_formatted = data.expires_at.strftime("%d de %B de %Y a las %H:%M")
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invitación a Gastify</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: white; padding: 30px; border: 1px solid #e0e0e0; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }}
                .btn {{ display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
                .btn:hover {{ background: #218838; }}
                .info-box {{ background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 ¡Te han invitado a Gastify!</h1>
                    <p>Sistema de gestión de gastos empresariales</p>
                </div>
                
                <div class="content">
                    <h2>Hola {data.invited_name},</h2>
                    
                    <p>¡Excelentes noticias! <strong>{data.employer_name}</strong> te ha invitado a unirte a <strong>{data.company_name}</strong> en la plataforma Gastify.</p>
                    
                    <div class="info-box">
                        <h3>📋 Detalles de la invitación:</h3>
                        <p><strong>Empresa:</strong> {data.company_name}</p>
                        <p><strong>Invitado por:</strong> {data.employer_name}</p>
                        {position_info}
                    </div>
                    
                    {custom_message}
                    
                    <h3>🚀 ¿Qué es Gastify?</h3>
                    <p>Gastify es una plataforma moderna que te permite:</p>
                    <ul>
                        <li>📱 <strong>Subir boletas fácilmente</strong> - Solo toma una foto</li>
                        <li>🤖 <strong>Procesamiento automático con IA</strong> - OCR y categorización inteligente</li>
                        <li>📊 <strong>Seguimiento de gastos en tiempo real</strong></li>
                        <li>📈 <strong>Reportes automáticos</strong> para tu empleador</li>
                        <li>🌍 <strong>Geolocalización automática</strong> de compras</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{data.invitation_url}" class="btn">Aceptar Invitación y Registrarse</a>
                    </div>
                    
                    <div class="warning">
                        <p><strong>⏰ Importante:</strong> Esta invitación expira el <strong>{expires_formatted}</strong></p>
                        <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #007bff;">{data.invitation_url}</p>
                    </div>
                    
                    <p>Si tienes alguna pregunta, puedes contactar directamente con {data.employer_name} o con nuestro equipo de soporte.</p>
                    
                    <p>¡Esperamos verte pronto en Gastify!</p>
                </div>
                
                <div class="footer">
                    <p>Este email fue enviado por <strong>Gastify</strong> - Sistema de gestión de gastos empresariales</p>
                    <p>© 2024 Gastify. Todos los derechos reservados.</p>
                    <p>Si no esperabas este email, puedes ignorarlo con seguridad.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _generate_invitation_text(self, data: InvitationEmailData) -> str:
        """Generar contenido de texto plano para invitación"""
        
        position_info = ""
        if data.position:
            position_info += f"Cargo: {data.position}\n"
        if data.department:
            position_info += f"Departamento: {data.department}\n"
        
        custom_message = ""
        if data.invitation_message:
            custom_message = f"\nMensaje personal:\n\"{data.invitation_message}\"\n"
        
        expires_formatted = data.expires_at.strftime("%d de %B de %Y a las %H:%M")
        
        return f"""
¡Te han invitado a Gastify!

Hola {data.invited_name},

¡Excelentes noticias! {data.employer_name} te ha invitado a unirte a {data.company_name} en la plataforma Gastify.

DETALLES DE LA INVITACIÓN:
- Empresa: {data.company_name}
- Invitado por: {data.employer_name}
{position_info}
{custom_message}

¿QUÉ ES GASTIFY?
Gastify es una plataforma moderna que te permite:
- Subir boletas fácilmente (solo toma una foto)
- Procesamiento automático con IA
- Seguimiento de gastos en tiempo real
- Reportes automáticos para tu empleador
- Geolocalización automática de compras

PARA ACEPTAR LA INVITACIÓN:
Visita este enlace: {data.invitation_url}

IMPORTANTE: Esta invitación expira el {expires_formatted}

Si tienes alguna pregunta, puedes contactar directamente con {data.employer_name} o con nuestro equipo de soporte.

¡Esperamos verte pronto en Gastify!

---
Este email fue enviado por Gastify - Sistema de gestión de gastos empresariales
© 2024 Gastify. Todos los derechos reservados.
        """

    async def send_notification_email(
        self, 
        to_email: str, 
        subject: str, 
        message: str,
        notification_type: str = "info"
    ) -> bool:
        """Enviar email de notificación general"""
        
        # Iconos por tipo de notificación
        icons = {
            "info": "ℹ️",
            "success": "✅", 
            "warning": "⚠️",
            "error": "❌",
            "receipt": "🧾",
            "approval": "✅"
        }
        
        icon = icons.get(notification_type, "📧")
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                <h2>{icon} {subject}</h2>
            </div>
            <div style="padding: 20px; background: white;">
                <p>{message}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px;">
                <p>Gastify - Sistema de gestión de gastos</p>
            </div>
        </div>
        """
        
        return await self._send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=message
        )

    async def _send_email(
        self, 
        to_email: str, 
        subject: str,
        html_content: str = None,
        text_content: str = None,
        attachments: List[str] = None
    ) -> bool:
        """Enviar email usando SMTP"""
        
        try:
            # Crear mensaje
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"Gastify <{self.sender_email}>"
            message["To"] = to_email
            
            # Agregar contenido de texto
            if text_content:
                text_part = MIMEText(text_content, "plain", "utf-8")
                message.attach(text_part)
            
            # Agregar contenido HTML
            if html_content:
                html_part = MIMEText(html_content, "html", "utf-8")
                message.attach(html_part)
            
            # Agregar archivos adjuntos si los hay
            if attachments:
                for file_path in attachments:
                    self._attach_file(message, file_path)
            
            # Configurar conexión SMTP
            if self.smtp_ssl:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            
            # Autenticar y enviar
            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
            
            server.sendmail(self.sender_email, to_email, message.as_string())
            server.quit()
            
            print(f"✅ Email enviado exitosamente a {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Error enviando email a {to_email}: {str(e)}")
            return False

    def _attach_file(self, message: MIMEMultipart, file_path: str):
        """Adjuntar archivo al email"""
        try:
            with open(file_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {file_path.split("/")[-1]}'
            )
            
            message.attach(part)
        except Exception as e:
            print(f"Error adjuntando archivo {file_path}: {str(e)}")

    def is_configured(self) -> bool:
        """Verificar si el servicio de email está configurado"""
        return bool(
            self.smtp_host and 
            self.smtp_port and 
            self.smtp_user and 
            self.smtp_password
        )
