import api from './api';

// -------------------------------
// projectService: CRUD de proyectos y tareas
// -------------------------------
export const projectService = {
  // Listar proyectos (paginado + filtros)
  getAll: async (
    status?: string,
    clientId?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    let url = `/projects?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    if (clientId) {
      // Registrar para depuración
      console.log(`Filtrando proyectos para cliente ID: ${clientId}`);
      
      // Intentar con ambos formatos de parámetros para compatibilidad
      url += `&clientId=${clientId}&client_id=${clientId}`;
    }
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener detalle de un proyecto
  getById: async (id: string) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo proyecto
  create: async (projectData: any) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar proyecto existente
  update: async (id: string, projectData: any) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar proyecto (solo admin)
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener el tablero Kanban de un proyecto
  getBoard: async (id: string) => {
    try {
      const response = await api.get(`/projects/${id}/board`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar el tablero Kanban (para drag & drop)
  updateBoard: async (id: string, boardData: any) => {
    try {
      const response = await api.put(`/projects/${id}/board`, boardData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear una nueva tarea en un proyecto
  createTask: async (projectId: string, taskData: any) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar una tarea existente
  updateTask: async (projectId: string, taskId: string, taskData: any) => {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar una tarea
  deleteTask: async (projectId: string, taskId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default projectService;
