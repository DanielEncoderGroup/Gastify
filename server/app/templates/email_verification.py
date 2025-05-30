def get_email_verification_template(user_name, verification_url):
    """
    Genera la plantilla HTML para el correo de verificación.
    
    Args:
        user_name (str): Nombre del usuario
        verification_url (str): URL para verificar el correo
        
    Returns:
        tuple: (html_content, text_content)
    """
    
    # Versión HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verificación de Correo - EncoderGroup</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="background-color: #111827; padding: 15px; border-radius: 5px; display: inline-block;">
                    <span style="color: #2563EB; font-size: 24px; font-weight: bold;">Encoder</span><span style="color: white; font-size: 24px; font-weight: bold;">Group</span>
                </div>
                <h1 style="color: #2563EB; margin-top: 15px;">Verificación de Correo Electrónico</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
                <p>Hola {user_name},</p>
                <p>¡Gracias por registrarte en EncoderGroup! Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" style="display: inline-block; background-color: #2563EB; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                        Verificar mi correo electrónico
                    </a>
                </div>
                
                <p>O puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; background-color: #f7f7f7; padding: 10px; border-radius: 3px;">{verification_url}</p>
                
                <p>Este enlace expirará en 24 horas por razones de seguridad.</p>
                
                <p>Si no has solicitado esta verificación, puedes ignorar este correo electrónico.</p>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
                <p>&copy; 2025 EncoderGroup. Todos los derechos reservados.</p>
                <p>Si tienes alguna pregunta, contáctanos en <a href="mailto:soporte@encodergroup.cl" style="color: #2563EB;">soporte@encodergroup.cl</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Versión de texto plano
    text_content = f"""
    Verificación de Correo - EncoderGroup
    
    Hola {user_name},
    
    ¡Gracias por registrarte en EncoderGroup! Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de correo electrónico visitando el siguiente enlace:
    
    {verification_url}
    
    Este enlace expirará en 24 horas por razones de seguridad.
    
    Si no has solicitado esta verificación, puedes ignorar este correo electrónico.
    
    --
    © 2025 EncoderGroup. Todos los derechos reservados.
    """
    
    return (html_content, text_content)