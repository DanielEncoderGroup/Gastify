import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  element: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [localAuthCheck, setLocalAuthCheck] = useState<boolean | null>(null);
  const [skipRedirect, setSkipRedirect] = useState<boolean>(false);

  // Verificación local adicional del token en caso de que el contexto no se haya cargado correctamente
  useEffect(() => {
    console.log('PrivateRoute para ruta:', location.pathname, 'isAuthenticated:', isAuthenticated, 'loading:', loading);
    
    // Solo hacer verificación adicional si el contexto dice que no está autenticado
    // Esta es una verificación más robusta para evitar redirecciones innecesarias
    if (!isAuthenticated && !loading) {
      console.log('PrivateRoute: No autenticado según contexto, verificando token localmente');
      
      // Primero comprobamos si la ruta actual es la de perfil y damos más tiempo antes de decidir
      const isProfileRoute = location.pathname.includes('/app/profile');
      if (isProfileRoute) {
        console.log('PrivateRoute: Detectada ruta de perfil, aplicando verificación especial');
        // Para la ruta de perfil, damos un poco más de tiempo antes de decidir
        const tokenCheckTimeout = setTimeout(() => {
          checkTokenLocally();
        }, 200);
        return () => clearTimeout(tokenCheckTimeout);
      } else {
        // Para otras rutas, verificamos inmediatamente
        checkTokenLocally();
      }
    } else {
      setLocalAuthCheck(isAuthenticated);
    }
  }, [isAuthenticated, loading, location]);

  // Función para verificar localmente el token JWT
  const checkTokenLocally = () => {
    console.log('PrivateRoute: Verificando token localmente');
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Verificar el formato y validez del token JWT
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('PrivateRoute: Token con formato inválido');
          setLocalAuthCheck(false);
          return;
        }
        
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Verificar expiración
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          console.log('PrivateRoute: Token válido localmente, permitiendo acceso');
          setLocalAuthCheck(true);
          
          // Si la ruta es de perfil, marcamos para evitar redirección
          if (location.pathname.includes('/app/profile')) {
            setSkipRedirect(true);
          }
          return;
        } else {
          console.log('PrivateRoute: Token expirado:', new Date(payload.exp * 1000));
        }
      } catch (e) {
        console.error('PrivateRoute: Error al verificar token localmente:', e);
      }
    }
    
    setLocalAuthCheck(false);
  };

  // Si estamos verificando, mostrar spinner
  if (loading || localAuthCheck === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no está autenticado después de las verificaciones
  if (!isAuthenticated && !localAuthCheck && !skipRedirect) {
    console.log('PrivateRoute: Redirigiendo al login desde ruta:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado o skipRedirect está activo, mostrar el contenido protegido
  console.log('PrivateRoute: Acceso permitido a ruta protegida:', location.pathname);
  return <>{element}</>;
};

export default PrivateRoute;