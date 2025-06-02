import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Configuración del API base (se toma de .env o, en su defecto, '/api')
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 segundos de timeout
});

// -------------------------------
// Interceptores de petición/respuesta
// -------------------------------

// 1) Interceptor para inyectar el token en cada llamada
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
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

// 2) Interceptor para capturar errores 401 y limpiar almacenamiento si corresponde
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.error('API: Error de autenticación 401, limpiando token/user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Opción de redirigir al login:
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// -------------------------------
// authService: registro, login, logout, etc.
// -------------------------------
export const authService = {
  // Registrar nuevo usuario
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

  // Iniciar sesión (login)
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Iniciando sesión con:', credentials.email);
      const response = await api.post('/auth/login', credentials);

      // El backend envía el JWT dentro de response.data.user.token
      const jwt = response.data.user.token;
      if (!jwt) {
        console.error('API: No se recibió token en la respuesta de login');
        throw new Error('No se pudo obtener el token de autenticación');
      }

      console.log('Login exitoso, guardando datos en localStorage');
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('Token guardado:', !!localStorage.getItem('token'));
      console.log('Usuario guardado:', !!localStorage.getItem('user'));

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

  // Restablecer contraseña utilizando token
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

  // Obtener datos del usuario actual
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      // Si la respuesta viene en response.data.user, lo guardamos
      if (response.data && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si hay un JWT válido en almacenamiento
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error al verificar token:', e);
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

  // Actualizar el usuario almacenado
  updateLocalUser: (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  },

  // Cambiar contraseña
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// -------------------------------
// requestService: CRUD de solicitudes
// -------------------------------
export const requestService = {
  /**
   * Listar solicitudes (paginado + filtros)
   *   status?: RequestStatus
   *   clientId?: string    ← sólo se envía si es administrador
   *   search?: string
   *   skip: number
   *   limit: number
   */
  getAll: async (
    status?: string,
    clientId?: string,
    search?: string,
    skip: number = 0,
    limit: number = 10
  ) => {
    let url = `/requests?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    if (clientId) {
      url += `&client_id=${clientId}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener detalle de una solicitud
  getById: async (id: string) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nueva solicitud
  create: async (requestData: any) => {
    try {
      const response = await api.post('/requests', requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar solicitud existente
  update: async (id: string, requestData: any) => {
    try {
      const response = await api.put(`/requests/${id}`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cambiar estado (sólo admin)
  updateStatus: async (id: string, status: string, comment?: string) => {
    try {
      const response = await api.patch(`/requests/${id}/status`, { status, reason: comment });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Añadir comentario al request
  addComment: async (id: string, comment: string) => {
    try {
      const response = await api.post(`/requests/${id}/comments`, { content: comment });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Subir archivo adjunto
  uploadFile: async (id: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/requests/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar archivo adjunto
  deleteFile: async (requestId: string, fileId: string) => {
    try {
      const response = await api.delete(`/requests/${requestId}/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// -------------------------------
// meetingService: CRUD de reuniones (igual patrón)
// -------------------------------
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
  },
};

export default api;
