import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de perfil que muestra la información del usuario
 */
const Profile: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Función para actualizar los datos del usuario desde el servidor
   * Mantiene todas las validaciones de token y localStorage
   */
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token disponible, no se puede actualizar datos');
      return;
    }

    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const body = await response.json();
        
        // Aseguramos que venga body.user
        if (body.user) {
          // Actualizamos el localStorage con los datos más recientes
          localStorage.setItem('user', JSON.stringify(body.user));

          // Y actualizamos el estado local
          setUserData(body.user);

          // También actualizamos el estado de verificación en localStorage
          localStorage.setItem('user_verified', body.user.isVerified ? 'true' : 'false');
        }
      } else {
        console.warn('Respuesta no OK de /api/auth/me:', response.status);
        // Si el servidor responde con error, usamos los datos del contexto
        if (user) {
          setUserData(user);
        }
      }
    } catch (serverError) {
      console.error('Error al obtener datos del servidor:', serverError);
      // Fallback a datos locales si hay error con el servidor
      if (user) {
        setUserData(user);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Esperar a que la autenticación esté completa antes de cargar datos
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Primero establecemos los datos del contexto
      setUserData(user);
      // Luego solicitamos datos actualizados del servidor
      refreshUserData();
    }
  }, [loading, isAuthenticated, user]);

  // Función para obtener el rol formateado en español
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'user':
        return 'Usuario';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Si estamos cargando, mostrar spinner
  if (loading || (!userData && isAuthenticated)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay datos de usuario, no mostrar nada
  if (!userData) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg max-w-4xl mx-auto my-8 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        <p className="text-blue-100">Información de tu cuenta</p>
      </div>

      {/* Contenido principal */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Columna de avatar */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-200 rounded-full overflow-hidden flex justify-center items-center border-4 border-gray-100 shadow-md">
            {userData.avatar ? (
              <img 
                src={userData.avatar} 
                alt="Foto de perfil" 
                className="object-cover w-full h-full" 
              />
            ) : (
              <div className="text-gray-400 flex items-center justify-center w-full h-full text-6xl">
                <span>👤</span>
              </div>
            )}
          </div>

          {/* Botón para actualizar */}
          <button 
            onClick={refreshUserData}
            disabled={isRefreshing}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            <span className={`${isRefreshing ? 'animate-spin' : ''} mr-1`}>⟳</span>
            {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          </button>

          {/* Verificación */}
          <div className={`mt-4 px-4 py-2 rounded-full text-sm flex items-center gap-2 ${userData.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            <span className={`w-3 h-3 rounded-full inline-block ${userData.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {userData.isVerified ? 'Verificado' : 'Pendiente de verificación'}
          </div>
        </div>

        {/* Columna de información */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Información Personal</h2>

            <div className="space-y-6">
              {/* Nombre completo */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-6">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <span>👤</span>
                    <span>Nombre</span>
                  </div>
                  <div className="font-medium text-lg">{userData.firstName || '-'}</div>
                </div>

                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Apellido</div>
                  <div className="font-medium text-lg">{userData.lastName || '-'}</div>
                </div>
              </div>

              {/* Correo */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <span>✉️</span>
                  <span>Correo electrónico</span>
                </div>
                <div className="font-medium text-lg">{userData.email}</div>
              </div>

              {/* Rol */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <span>🔖</span>
                  <span>Rol</span>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-block font-semibold">
                  {getRoleDisplay(userData.role)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
