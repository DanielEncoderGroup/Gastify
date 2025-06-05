import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de perfil que muestra la información del usuario
 */
const Profile: React.FC = () => {
  const { user, loading, isAuthenticated, changePassword } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Validación de contraseña
  const validatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos una letra mayúscula');
      return false;
    }
    
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos una letra minúscula');
      return false;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos un número');
      return false;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos un carácter especial');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  // Manejar el cambio de contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    if (!validatePassword()) return;
    
    try {
      setIsChangingPassword(true);
      
      // Usar el contexto de autenticación para cambiar la contraseña
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      // Limpiar el formulario en caso de éxito
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('La contraseña ha sido cambiada exitosamente');
      
      // Opcional: cerrar el formulario después de un tiempo
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setPasswordError('No se pudo cambiar la contraseña. Verifica que la contraseña actual sea correcta.');
    } finally {
      setIsChangingPassword(false);
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
    <div className="max-w-4xl mx-auto my-8 space-y-8">
      {/* Tarjeta de información de perfil */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
          <p className="text-blue-100">Información de tu cuenta</p>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Layout de dos columnas para escritorio */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Columna izquierda: avatar y acciones */}
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
              
              <button 
                onClick={refreshUserData} 
                disabled={isRefreshing} 
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                <span className={`${isRefreshing ? 'animate-spin' : ''} mr-1`}>⟳</span>
                {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
              </button>
              
              <div className={`mt-4 px-4 py-2 rounded-full text-sm flex items-center gap-2 ${userData.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                <span className={`w-3 h-3 rounded-full inline-block ${userData.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {userData.isVerified ? 'Verificado' : 'Pendiente de verificación'}
              </div>
            </div>

            {/* Columna derecha: información personal */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-6 shadow-inner h-full">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Información Personal</h2>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-2 md:gap-6">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <span>👤</span>
                        <span>Nombre</span>
                      </div>
                      <div className="font-medium text-gray-900 text-lg">{userData.firstName || 'No especificado'}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <span>👤</span>
                        <span>Apellido</span>
                      </div>
                      <div className="font-medium text-gray-900 text-lg">{userData.lastName || 'No especificado'}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <span>✉️</span>
                      <span>Correo electrónico</span>
                    </div>
                    <div className="font-medium text-gray-900">{userData.email}</div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <span>🔑</span>
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
      </div>
      
      {/* Tarjeta separada para cambio de contraseña */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">Cambio de Contraseña</h2>
          <p className="text-indigo-100">Actualiza tu contraseña de acceso</p>
        </div>
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleChangePassword} className="space-y-5">
            {passwordError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-md">
                {passwordSuccess}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            
            <div className="md:col-span-3">
              <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                <span className="font-medium">Requisitos de seguridad:</span> La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, 
                una minúscula, un número y un carácter especial.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-md"
              >
                {isChangingPassword && (
                  <span className="animate-spin mr-2">⟳</span>
                )}
                {isChangingPassword ? 'Procesando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;