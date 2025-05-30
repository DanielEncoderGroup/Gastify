import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationType {
  type: 'success' | 'error' | '';
  message: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [userData, setUserData] = useState(user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Depuración para ver los datos del usuario
  console.log('Datos del usuario en Profile:', user);
  
  // Función para actualizar los datos del usuario desde el servidor
  const refreshUserData = async () => {
    try {
      setIsRefreshing(true);
      console.log('Iniciando obtención de datos del usuario...');
      
      // Intento 1: Obtener datos del localStorage (donde se guardan durante el login)
      const storedUser = localStorage.getItem('user');
      let userFromStorage = null;
      
      if (storedUser) {
        try {
          userFromStorage = JSON.parse(storedUser);
          console.log('Usuario obtenido de localStorage:', userFromStorage);
        } catch (e) {
          console.error('Error al parsear usuario de localStorage:', e);
        }
      }
      
      // Intento 2: Obtener datos desde el contexto de autenticación
      console.log('Usuario desde el contexto de autenticación:', user);
      
      // Intento 3: Obtener datos directamente desde el servidor
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Datos obtenidos del servidor:', data);
          
          // Extraer datos del usuario desde cualquiera de las posibles estructuras
          const serverUserData = data.data || data.user || data;
          
          if (serverUserData) {
            console.log('Datos extraídos del servidor:', serverUserData);
            
            // Actualizar datos en localStorage
            localStorage.setItem('user', JSON.stringify(serverUserData));
            
            // Usar estos datos del servidor
            setUserData(serverUserData);
            return;
          }
        }
      } catch (serverError) {
        console.error('Error al obtener datos del servidor:', serverError);
      }
      
      // Si llegamos aquí, intentemos usar los datos del localStorage o del contexto
      if (userFromStorage) {
        setUserData(userFromStorage);
      } else if (user) {
        setUserData(user);
      } else {
        // Intentemos construir un objeto de usuario a partir de los datos disponibles en el localStorage
        // Esta es una solución de respaldo por si la estructura no coincide con lo esperado
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Intentar extraer información del token JWT (si es posible)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            console.log('Payload del token:', payload);
            
            if (payload.email) {
              // Construir un usuario completo con valores por defecto para cumplir con la interfaz User
              const minimalUser = {
                id: payload.sub || 'unknown-id',
                firstName: payload.given_name || 'Usuario',
                lastName: payload.family_name || '',
                email: payload.email,
                role: payload.role || 'user',
                isVerified: true, // Asumimos que está verificado si tiene token
                // Campos opcionales
                name: payload.name,
                position: payload.position,
                department: payload.department,
                profileImage: payload.profileImage
              };
              setUserData(minimalUser);
            }
          } catch (e) {
            console.error('Error al extraer datos del token:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error general al obtener datos de usuario:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    refreshUserData();
  }, []);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationType>({ type: '', message: '' });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  });

  // Maneja cambios en los campos de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });

    if (name === 'newPassword') {
      validatePassword(value);
    }

    if (name === 'confirmPassword' || name === 'newPassword') {
      setPasswordValidation(prev => ({
        ...prev,
        passwordsMatch: passwordData.newPassword === value || (name === 'newPassword' && passwordData.confirmPassword === value)
      }));
    }
  };

  // Valida la contraseña según los requisitos
  const validatePassword = (password: string) => {
    setPasswordValidation({
      ...passwordValidation,
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\\d/.test(password),
      hasSpecialChar: /[@$!%*?&#]/.test(password),
      passwordsMatch: password === passwordData.confirmPassword
    });
  };

  // Valida el formulario de cambio de contraseña
  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setNotification({ type: 'error', message: 'Por favor, introduce tu contraseña actual' });
      return false;
    }
    if (!passwordData.newPassword) {
      setNotification({ type: 'error', message: 'Por favor, introduce una nueva contraseña' });
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ type: 'error', message: 'Las contraseñas no coinciden' });
      return false;
    }
    if (
      !passwordValidation.minLength ||
      !passwordValidation.hasUpperCase ||
      !passwordValidation.hasLowerCase ||
      !passwordValidation.hasNumber ||
      !passwordValidation.hasSpecialChar
    ) {
      setNotification({ type: 'error', message: 'La contraseña no cumple con los requisitos' });
      return false;
    }
    return true;
  };

  // Maneja el envío del formulario de cambio de contraseña
  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validatePasswordForm()) {
      return;
    }
    setIsLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword);
      setNotification({ type: 'success', message: 'Contraseña actualizada con éxito' });
      // Limpiar los campos después de un cambio exitoso
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al actualizar la contraseña. Verifique su contraseña actual.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      {notification.type && (
        <div className={`rounded-md p-4 mb-4 ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification({ type: '', message: '' })}
                  className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
            } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-base transition-all duration-200 ease-in-out`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
            } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-base transition-all duration-200 ease-in-out ml-8`}
          >
            Contraseña
          </button>
        </nav>
      </div>

      {activeTab === 'password' && (
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-600">
            <p>Actualiza tu contraseña para mantener segura tu cuenta</p>
          </div>
          <form className="mt-6" onSubmit={handlePasswordSubmit}>
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <div>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 text-base border-gray-300 rounded-md transition-all duration-200"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 text-base border-gray-300 rounded-md transition-all duration-200"
                    placeholder="Crea una nueva contraseña"
                  />
                </div>
                <div className="mt-3">
                  <ul className="text-sm space-y-2 bg-gray-50 p-3 rounded-md">
                    <li className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordValidation.minLength ? '✓' : '○'}</span>
                      Mínimo 8 caracteres
                    </li>
                    <li className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordValidation.hasUpperCase ? '✓' : '○'}</span>
                      Al menos una letra mayúscula
                    </li>
                    <li className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordValidation.hasLowerCase ? '✓' : '○'}</span>
                      Al menos una letra minúscula
                    </li>
                    <li className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '○'}</span>
                      Al menos un número
                    </li>
                    <li className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '○'}</span>
                      Al menos un carácter especial (@$!%*?&#)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 text-base border-gray-300 rounded-md transition-all duration-200"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
                {passwordData.confirmPassword && (
                  <p
                    className={`mt-3 text-sm flex items-center ${
                      passwordValidation.passwordsMatch ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span className="mr-2">
                      {passwordValidation.passwordsMatch ? '✓' : '✗'}
                    </span>
                    {passwordValidation.passwordsMatch
                      ? 'Las contraseñas coinciden'
                      : 'Las contraseñas no coinciden'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 min-w-[200px] justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cambiando...
                  </>
                ) : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4">Información de perfil</h3>
          
          <div className="mt-5 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <h4 className="text-base font-medium text-gray-800 mb-2">Foto de perfil</h4>
                  <p className="text-sm text-gray-500">Esta imagen se mostrará en tu perfil y comentarios</p>
                </div>
                <div className="flex items-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Foto de perfil"
                      className="h-24 w-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <button 
                    type="button"
                    className="ml-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    onClick={() => alert('Funcionalidad en desarrollo')}
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-200">
              {/* Datos personales */}
              <div className="p-6">
                <h4 className="text-base font-medium text-gray-800 mb-4">Datos personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Nombre</p>
                    <p className="text-base text-gray-900">
                      {userData && userData.firstName ? userData.firstName : (userData && userData.name ? userData.name.split(' ')[0] : 'No disponible')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Apellido</p>
                    <p className="text-base text-gray-900">
                      {userData && userData.lastName ? userData.lastName : (userData && userData.name && userData.name.split(' ').length > 1 ? userData.name.split(' ').slice(1).join(' ') : 'No disponible')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Correo electrónico</p>
                    <p className="text-base text-gray-900">
                      {userData?.email || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Información laboral */}
              <div className="p-6">
                <h4 className="text-base font-medium text-gray-800 mb-4">Información laboral</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Posición</p>
                    <p className="text-base text-gray-900">
                      {userData?.position || 'No especificada'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Departamento</p>
                    <p className="text-base text-gray-900">
                      {userData?.department || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Estado de la cuenta */}
              <div className="p-6">
                <h4 className="text-base font-medium text-gray-800 mb-4">Estado de la cuenta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Rol</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${userData?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {userData?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Estado de verificación</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${userData?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {userData?.isVerified ? 'Verificado' : 'Pendiente de verificación'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {isRefreshing && (
              <div className="mt-4 p-4 text-center text-sm text-gray-600 bg-gray-50 rounded-md">
                <svg className="animate-spin inline h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando datos...
              </div>
            )}
            
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px] justify-center transition-all duration-200"
                onClick={() => alert('Funcionalidad en desarrollo')}
              >
                Editar información
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
