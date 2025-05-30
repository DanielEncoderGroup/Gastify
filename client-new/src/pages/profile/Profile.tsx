import React, { useState, FormEvent } from 'react';
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
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`${
              activeTab === 'password'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ml-8`}
          >
            Contraseña
          </button>
        </nav>
      </div>

      {activeTab === 'password' && (
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Cambiar contraseña</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Actualiza tu contraseña para mantener segura tu cuenta</p>
          </div>
          <form className="mt-5" onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <div className="mt-1">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="mt-2">
                  <ul className="text-xs space-y-1">
                    <li className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Mínimo 8 caracteres
                    </li>
                    <li className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Al menos una letra mayúscula
                    </li>
                    <li className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Al menos una letra minúscula
                    </li>
                    <li className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Al menos un número
                    </li>
                    <li className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Al menos un carácter especial (@$!%*?&#)
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                {passwordData.confirmPassword && (
                  <p
                    className={`mt-2 text-sm ${
                      passwordValidation.passwordsMatch ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {passwordValidation.passwordsMatch
                      ? '✓ Las contraseñas coinciden'
                      : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Información de perfil</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Esta sección está en construcción. Pronto podrás editar tu información de perfil.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
