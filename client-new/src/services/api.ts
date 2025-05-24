import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Configuración del API base
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear una instancia de axios con la configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a las peticiones
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
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
    name: string;
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
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
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