import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  element: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [localAuthCheck, setLocalAuthCheck] = useState<boolean | null>(null);

  // Verificación local adicional del token en caso de que el contexto no se haya cargado correctamente
  useEffect(() => {
    // Solo hacer esta verificación adicional si el contexto dice que no está autenticado
    // y no estamos en proceso de carga
    if (!isAuthenticated && !loading) {
      const token = localStorage.getItem('token');
      if (token) {
        // Hay un token, vamos a verificar si parece válido
        try {
          // Decodificar el token JWT
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Verificar si el token ha expirado
            if (payload.exp && payload.exp * 1000 > Date.now()) {
              // Token válido, permitir acceso
              setLocalAuthCheck(true);
              return;
            }
          }
        } catch (e) {
          console.error('Error al verificar token localmente:', e);
        }
      }
      
      // Si llegamos aquí, no hay token válido
      setLocalAuthCheck(false);
    } else {
      // Si el contexto dice que está autenticado o aún está cargando,
      // usamos ese valor
      setLocalAuthCheck(isAuthenticated);
    }
  }, [isAuthenticated, loading]);

  // Mostrar carga mientras verificamos la autenticación
  if (loading || localAuthCheck === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no está autenticado después de ambas verificaciones, redirigir al login
  if (!isAuthenticated && !localAuthCheck) {
    // Guardar la ruta a la que intentaba acceder para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, mostrar el contenido protegido
  return <>{element}</>;
};

export default PrivateRoute;