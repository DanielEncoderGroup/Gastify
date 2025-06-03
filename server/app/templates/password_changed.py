def get_password_changed_template(user_name):
    """
    Genera la plantilla HTML para el correo de confirmación de cambio de contraseña.
    
    Args:
        user_name (str): Nombre del usuario
        
    Returns:
        tuple: (html_content, text_content)
    """
    
    # Versión HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Contraseña Actualizada - EncoderGroup</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="background-color: #111827; padding: 15px; border-radius: 5px; display: inline-block;">
                    <span style="color: #2563EB; font-size: 24px; font-weight: bold;">Encoder</span><span style="color: white; font-size: 24px; font-weight: bold;">Group</span>
                </div>
                <h1 style="color: #2563EB; margin-top: 15px;">Contraseña Actualizada</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
                <p>Hola {user_name},</p>
                <p>Te confirmamos que tu contraseña ha sido actualizada correctamente.</p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Información importante:</strong></p>
                    <p style="margin: 10px 0 0 0;">Si no realizaste este cambio, por favor contacta inmediatamente con nuestro equipo de soporte.</p>
                </div>
                
                <p>Puedes iniciar sesión en tu cuenta utilizando tu nueva contraseña.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost" style="display: inline-block; background-color: #2563EB; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                        Ir a EncoderGroup
                    </a>
                </div>
                
                <p>Si tienes alguna pregunta o inquietud, no dudes en contactarnos.</p>
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
    Contraseña Actualizada - EncoderGroup
    
    Hola {user_name},
    
    Te confirmamos que tu contraseña ha sido actualizada correctamente.
    
    INFORMACIÓN IMPORTANTE:
    Si no realizaste este cambio, por favor contacta inmediatamente con nuestro equipo de soporte.
    
    Puedes iniciar sesión en tu cuenta utilizando tu nueva contraseña.
    
    Visita nuestro sitio: http://localhost
    
    Si tienes alguna pregunta o inquietud, no dudes en contactarnos.
    
    --
    © 2025 EncoderGroup. Todos los derechos reservados.
    """
    
    return (html_content, text_content)
