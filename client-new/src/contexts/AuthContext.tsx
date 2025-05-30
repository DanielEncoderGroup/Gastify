import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Definición de tipos
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  profileImage?: string;
  name?: string; // Keep for backward compatibility
  position?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (firstName: string, lastName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  clearError: () => void;
  updateUserProfile: (data: { firstName?: string; lastName?: string; position?: string; department?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

// Valor por defecto del contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  register: async () => {},
  login: async () => {},
  logout: () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  clearError: () => {},
  updateUserProfile: async () => {},
  changePassword: async () => {},
});

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Proveedor del contexto de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Cargar usuario desde localStorage al inicio
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Verificar si hay un token guardado
        if (authService.isAuthenticated()) {
          // Obtener usuario del localStorage
          const userData = authService.getUser();
          
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Si hay token pero no hay datos de usuario, intentar obtenerlos del backend
            try {
              const response = await authService.getCurrentUser();
              setUser(response.data);
              setIsAuthenticated(true);
            } catch (err) {
              // Si hay error al obtener el usuario, limpiar la sesión
              authService.logout();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Error al inicializar la autenticación:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Función para registrar un nuevo usuario
  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Llamar al servicio de autenticación
      await authService.register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      });
      // No autenticamos al usuario automáticamente, debe verificar su email
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el usuario');
      setLoading(false);
      throw err;
    }
  };

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
      setLoading(false);
      throw err;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Función para solicitar restablecimiento de contraseña
  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.requestPasswordReset(email);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al solicitar el restablecimiento de contraseña');
      setLoading(false);
      throw err;
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.resetPassword(token, password, confirmPassword);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
      setLoading(false);
      throw err;
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    setError(null);
  };

  // Función para actualizar el perfil del usuario
  const updateUserProfile = async (data: { firstName?: string; lastName?: string; position?: string; department?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Por ahora, simplemente actualizamos el usuario en el estado local
      // En una implementación real, aquí se haría una llamada a la API para actualizar el perfil
      if (user) {
        const updatedUser = {
          ...user,
          ...data
        };
        setUser(updatedUser);
        
        // Actualizar el usuario en localStorage
        authService.updateLocalUser(updatedUser);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
      setLoading(false);
      throw err;
    }
  };
  
  // Función para cambiar la contraseña del usuario
  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Llamar al servicio de autenticación para cambiar la contraseña
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
      setLoading(false);
      throw err;
    }
  };

  // Valores del contexto
  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    clearError,
    updateUserProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;