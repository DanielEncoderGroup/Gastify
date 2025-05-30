import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // En lugar de mantener un componente oculto con formulario que podría interferir,
    // simplemente redireccionamos a la página principal con el modal de login
    navigate('/?showLogin=true', { replace: true });
  }, [navigate]);

  // Mostrar un mensaje de carga mientras se redirecciona
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redireccionando al inicio de sesión...</p>
    </div>
  );
};

export default Login;