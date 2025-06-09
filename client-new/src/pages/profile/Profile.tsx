import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  SparklesIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import HeaderActions from '../../components/layout/HeaderActions';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si no hay datos de usuario, no mostrar nada
  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Title and icon */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <UserCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                  Perfil de Usuario
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tu información personal y preferencias
                </p>
              </div>
            </div>

            {/* Right side - Header Actions */}
            <HeaderActions />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-4">
        {/* Tarjeta de información de perfil */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Información Personal</h2>
                <p className="text-indigo-100">Detalles de tu cuenta y perfil</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Layout de dos columnas para escritorio */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Columna izquierda: avatar y acciones */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="w-48 h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl overflow-hidden flex justify-center items-center border-4 border-white shadow-lg">
                  {userData.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt="Foto de perfil" 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <UserIcon className="w-24 h-24 text-gray-400" />
                  )}
                </div>
                
                <button 
                  onClick={refreshUserData} 
                  disabled={isRefreshing} 
                  className="mt-6 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Actualizando...' : 'Actualizar datos'}</span>
                </button>
                
                <div className={`mt-4 px-4 py-2 rounded-full text-sm flex items-center space-x-2 ${
                  userData.isVerified 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {userData.isVerified ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  )}
                  <span>{userData.isVerified ? 'Verificado' : 'Pendiente de verificación'}</span>
                </div>
              </div>

              {/* Columna derecha: información personal */}
              <div className="flex-1">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/20 h-full">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-indigo-600" />
                    <span>Datos Personales</span>
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-500 mb-2 flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Nombre</span>
                        </div>
                        <div className="font-medium text-gray-900 text-lg px-4 py-2 bg-gray-50 rounded-xl">
                          {userData.firstName || 'No especificado'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-2 flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Apellido</span>
                        </div>
                        <div className="font-medium text-gray-900 text-lg px-4 py-2 bg-gray-50 rounded-xl">
                          {userData.lastName || 'No especificado'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-2 flex items-center space-x-2">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span>Correo electrónico</span>
                      </div>
                      <div className="font-medium text-gray-900 px-4 py-2 bg-gray-50 rounded-xl">
                        {userData.email}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-2 flex items-center space-x-2">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>Rol</span>
                      </div>
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-xl font-semibold border border-indigo-200">
                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
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
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <KeyIcon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Cambio de Contraseña</h2>
                <p className="text-purple-100">Actualiza tu contraseña de acceso</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              {passwordError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <LockClosedIcon className="w-4 h-4" />
                    <span>Contraseña actual</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <KeyIcon className="w-4 h-4" />
                    <span>Nueva contraseña</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <LockClosedIcon className="w-4 h-4" />
                    <span>Confirmar nueva contraseña</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <LockClosedIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Requisitos de seguridad:</p>
                    <p className="text-sm text-blue-800">
                      La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, 
                      una minúscula, un número y un carácter especial.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {isChangingPassword ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <KeyIcon className="w-5 h-5" />
                  )}
                  <span>{isChangingPassword ? 'Procesando...' : 'Cambiar contraseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Informativo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-800">¿Necesitas ayuda con tu perfil?</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              Mantén tu información actualizada y protege tu cuenta con contraseñas seguras.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div>📧 Soporte: profile@encodergroup.cl</div>
              <div className="hidden sm:block">|</div>
              <div>📞 Teléfono: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Profile;