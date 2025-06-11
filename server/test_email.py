import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

# Configuración SMTP
SMTP_HOST = 'smtp.example.com'
SMTP_PORT = 465
SMTP_USER = 'noreply@example.com'
SMTP_PASSWORD = 'your_smtp_password'

# Dirección de mail-tester.com (reemplaza con la que recibas del sitio)
TARGET_EMAIL = 'your-test-email@example.com'

# Crear mensaje
msg = MIMEMultipart('alternative')
msg['Subject'] = Header("Prueba de correo desde EncoderGroup", 'utf-8')
msg['From'] = SMTP_USER
msg['To'] = TARGET_EMAIL

# Contenido de texto
text = """
Este es un correo de prueba enviado desde EncoderGroup para verificar la configuración del servidor SMTP.
"""

# Contenido HTML
html = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba de correo</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h1 style="color: #1E88E5;">Prueba de correo desde EncoderGroup</h1>
        <p>Este es un correo de prueba enviado desde EncoderGroup para verificar la configuración del servidor SMTP.</p>
        <p>Si estás viendo esto, la estructura HTML del correo está funcionando correctamente.</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">© 2025 EncoderGroup. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
"""

# Adjuntar partes
part1 = MIMEText(text, 'plain', 'utf-8')
part2 = MIMEText(html, 'html', 'utf-8')
msg.attach(part1)
msg.attach(part2)

try:
    # Configurar contexto SSL
    context = ssl.create_default_context()
    # Deshabilitar verificación de certificados
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    
    print(f"Conectando a {SMTP_HOST}:{SMTP_PORT}...")
    
    # Enviar correo
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, TARGET_EMAIL, msg.as_string())
        print(f"Correo enviado exitosamente a {TARGET_EMAIL}")
        
except Exception as e:
    print(f"Error al enviar el correo: {str(e)}")
    
print("Proceso completado. Verifica mail-tester.com para ver los resultados.")