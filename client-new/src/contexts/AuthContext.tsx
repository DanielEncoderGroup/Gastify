import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Definición de tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  profileImage?: string;
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;