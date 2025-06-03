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
      console.log('Inicializando autenticación...');
      
      try {
        // Verificar si hay un token guardado
        const token = localStorage.getItem('token');
        
        if (token) {
          console.log('Token encontrado en localStorage');
          
          // Verificar validez del token
          try {
            // Decodificar el token JWT para verificar si ha expirado
            const base64Url = token.split('.')[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(window.atob(base64));
              
              console.log('Token decodificado:', { ...payload, exp: new Date(payload.exp * 1000).toISOString() });
              
              // Verificar si el token ha expirado
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                console.log('Token expirado, cerrando sesión');
                authService.logout();
                setIsAuthenticated(false);
                setUser(null);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Error al decodificar token:', e);
          }
          
          // Obtener usuario del localStorage
          const userData = authService.getUser();
          
          if (userData) {
            console.log('Datos de usuario encontrados en localStorage:', userData);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('Token válido pero sin datos de usuario, consultando API...');
            // Si hay token pero no hay datos de usuario, intentar obtenerlos del backend
            try {
              // Forzar una solicitud al servidor para verificar el token y obtener datos actualizados
              const response = await authService.getCurrentUser();
              console.log('Respuesta del servidor para datos de usuario:', response);
              
              if (response && response.data && response.data.user) {
                setUser(response.data.user);
                setIsAuthenticated(true);
                // Actualizar también el localStorage con los datos más recientes
                localStorage.setItem('user', JSON.stringify(response.data.user));
              } else {
                throw new Error('No se recibieron datos de usuario del servidor');
              }
            } catch (err) {
              console.error('Error al obtener el usuario del servidor:', err);
              // Si hay error al obtener el usuario, limpiar la sesión
              authService.logout();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          console.log('No se encontró token en localStorage');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Error al inicializar la autenticación:", err);
        // En caso de error, limpiar todo para evitar estados inconsistentes
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
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
      console.log('AuthContext: Intentando login con', email);
      const response = await authService.login({ email, password });
      
      // Verificar que tengamos datos de usuario y token
      // La estructura de la respuesta puede variar, debemos adaptarnos a ella
      console.log('Estructura de respuesta recibida:', response);
      
      // No hacemos verificación estricta aquí, confiamos en que authService.login ya validó
      
      console.log('AuthContext: Login exitoso, actualizando estado');
      
      // Actualizar el estado de la aplicación con la estructura correcta
      // La estructura puede variar, así que manejamos diferentes posibilidades
      if (response.user) {
        setUser(response.user);
      } else if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        // Si no podemos encontrar el usuario en la respuesta,
        // intentamos obtenerlo del localStorage
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
          }
        } catch (e) {
          console.error('Error al recuperar usuario del localStorage:', e);
        }
      }
      
      setIsAuthenticated(true);
      
      // Verificar directamente que los datos se hayan guardado en localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      console.log('AuthContext: Verificación después de login');
      console.log('- Token en localStorage:', !!token);
      console.log('- Usuario en localStorage:', !!userStr);
      
      // Verificación adicional de datos de usuario
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('- ID de usuario guardado:', userData.id || userData._id);
          console.log('- Email de usuario guardado:', userData.email);
        } catch (e) {
          console.error('Error al parsear datos de usuario:', e);
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('AuthContext: Error en login:', err);
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