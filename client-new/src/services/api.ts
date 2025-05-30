import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Configuración del API base
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Crear una instancia de axios con la configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para agregar el token de autenticación a las peticiones
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener el token del localStorage cada vez que se hace una petición
    // para asegurar que siempre tenemos el token más actualizado
    const token = localStorage.getItem('token');
    
    if (token) {
      // Configurar el encabezado de autorización con el token
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API: Token añadido a la petición');
    } else {
      console.log('API: No hay token disponible para la petición');
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('API: Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Procesar respuesta exitosa
    return response;
  },
  (error: AxiosError) => {
    // Manejar errores de autenticación (401)
    if (error.response && error.response.status === 401) {
      console.error('API: Error de autenticación 401, cerrando sesión');
      // Limpiar localStorage en caso de token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Opcionalmente, redirigir al login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Si el error es 401 (Unauthorized), limpiar el token
    // pero no redirigir automáticamente para permitir que los componentes manejen el error
    if (error.response && error.response.status === 401) {
      // Solo limpiamos el token si ya existía (para no afectar el intento de login)
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Removemos la redirección automática para que el componente pueda manejar el error
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  // Registrar un nuevo usuario
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Iniciar sesión
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Iniciando sesión con:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      
      // Verificar si el usuario ha confirmado su correo electrónico
      if (response.data.user && !response.data.user.isVerified) {
        console.error('Usuario no verificado');
        throw { response: { data: { message: 'Por favor, confirma tu correo electrónico antes de iniciar sesión.' } } };
      }
      
      console.log('Login exitoso, guardando datos en localStorage');
      
      // Guardar el token y datos de usuario en localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Verificar que se hayan guardado correctamente
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('Token guardado:', !!savedToken);
      console.log('Usuario guardado:', !!savedUser);
      
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Verificar el token de correo electrónico
  verifyEmail: async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reenviar correo de verificación
  resendVerificationEmail: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Solicitar restablecimiento de contraseña
  requestPasswordReset: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Restablecer contraseña
  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      // Actualizar los datos del usuario en localStorage
      if (response.data && response.data.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Verificar si el token ha expirado (opcional, dependiendo de si el token tiene fecha de expiración)
    try {
      // Decodificar el token JWT (asumiendo que es un JWT)
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Comprobar si el token ha expirado
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expirado, limpiar almacenamiento
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error al verificar token:', e);
      // En caso de error al analizar el token, consideramos que sigue siendo válido
      // para evitar cerrar sesión por errores en la validación
      return true;
    }
  },

  // Obtener el token del localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Obtener el usuario del localStorage
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Actualizar el usuario en localStorage
  updateLocalUser: (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  },
  
  // Cambiar contraseña
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      // Hacer la petición al backend para cambiar la contraseña
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Servicios para solicitudes
export const requestService = {
  getAll: async () => {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (requestData: any) => {
    try {
      const response = await api.post('/requests', requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, requestData: any) => {
    try {
      const response = await api.put(`/requests/${id}`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id: string, status: string, comment?: string) => {
    try {
      const response = await api.patch(`/requests/${id}/status`, { status, comment });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addComment: async (id: string, comment: string) => {
    try {
      const response = await api.post(`/requests/${id}/comments`, { content: comment });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadFile: async (id: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/requests/${id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteFile: async (requestId: string, fileId: string) => {
    try {
      const response = await api.delete(`/requests/${requestId}/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Servicios para reuniones
export const meetingService = {
  getAll: async () => {
    try {
      const response = await api.get('/meetings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/meetings/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (meetingData: any) => {
    try {
      const response = await api.post('/meetings', meetingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, meetingData: any) => {
    try {
      const response = await api.put(`/meetings/${id}`, meetingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/meetings/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/meetings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Exportar instancia de API para usos adicionales
export default api;