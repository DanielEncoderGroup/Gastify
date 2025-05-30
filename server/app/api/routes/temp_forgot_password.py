@router.post("/forgotpassword", response_model=dict)
async def forgot_password(email_data: ForgotPassword = Body(...)) -> Any:
    """
    Request password reset for a user
    """
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": email_data.email})
    if not user:
        # No need to tell the client that the user doesn't exist
        return {"success": True, "message": "Email sent with password reset instructions"}
    
    # Generate reset token and expiration
    reset_token = create_reset_token(email_data.email)
    token_expiry = datetime.utcnow() + timedelta(minutes=30)
    
    # Update user with reset token
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "resetPasswordToken": reset_token,
            "resetPasswordExpire": token_expiry
        }}
    )
    
    # Crear URL para restablecer contraseña
    reset_url = f"{settings.CLIENT_URL}/reset-password/{reset_token}"
    
    # Mostrar información de debug para el desarrollador
    print(f"\n\n=== INFORMACIÓN DE RESTABLECIMIENTO DE CONTRASEÑA ===")
    print(f"Usuario: {user['firstName']} {user['lastName']}")
    print(f"Email: {email_data.email}")
    print(f"Token: {reset_token}")
    print(f"URL para restablecer: {reset_url}")
    print(f"Expira en: {token_expiry}")
    print(f"========================================\n\n")
    
    # Try to resolve host to check if DNS is working
    try:
        # Intentar resolver la dirección IP del servidor SMTP
        smtp_ip = socket.gethostbyname(settings.SMTP_HOST)
        print(f"Resolviendo {settings.SMTP_HOST} -> {smtp_ip}")
        
        # Send email using cPanel SMTP
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                # Obtener el nombre completo del usuario
                user_name = f"{user['firstName']} {user['lastName']}"
                
                # Usar la plantilla mejorada con logo para recuperación de contraseña
                html_content, text_content = get_password_reset_template(user_name, reset_url)
                
                # Enviar el correo electrónico
                send_email(
                    to_email=email_data.email,
                    subject="Recuperación de contraseña - EncoderGroup",
                    text_content=text_content,
                    html_content=html_content
                )
                
                return {"success": True, "message": "Email sent with password reset instructions"}
            except Exception as e:
                print(f"Error al enviar el correo: {e}")
                # Graceful fallback if SMTP fails - show the token in logs
                return {"success": True, "message": "Error sending email, but password reset token was generated", "debug": {"resetToken": reset_token}}
        else:
            # Si no hay configuración SMTP, mostrar token para desarrollo
            return {"success": True, "message": "No SMTP configuration, but password reset token was generated", "debug": {"resetToken": reset_token}}
    except socket.gaierror as e:
        print(f"Error resolviendo el host SMTP: {e}")
        # Graceful fallback if DNS fails
        return {"success": True, "message": "Error with DNS resolution, but password reset token was generated", "debug": {"resetToken": reset_token}}
    except Exception as e:
        print(f"Error general: {e}")
        # Graceful fallback for any other error
        return {"success": True, "message": "Error occurred, but password reset token was generated", "debug": {"resetToken": reset_token}}