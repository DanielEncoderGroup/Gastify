// client-new/src/services/requestService.ts

import api from './api';
import {
  RequestCreate,
  RequestUpdate,
  StatusChangeRequest,
  CommentCreate,
  RequestsListResponse,
  RequestResponse,
  RequestStatus
} from '../types/request';

/**
 * Servicio para gestión de solicitudes
 */
export const requestService = {
  /**
   * Obtener listado de solicitudes con filtros opcionales
   * @param status Filtro por estado
   * @param clientId (solo admin) filtrar por ID de cliente
   * @param search Texto libre para buscar en título/descripcion
   * @param skip Offset de paginación
   * @param limit Cantidad máxima a devolver
   */
  getAll: async (
    status?: RequestStatus,
    clientId?: string,
    search?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<RequestsListResponse> => {

    try {
      // La baseURL de `api` ya apunta a "/api"
      let url = `/requests?skip=${skip}&limit=${limit}`;

      if (status) {
        url += `&status=${status}`;
      }
      if (clientId) {
        // El backend espera "client_id" como query param
        url += `&client_id=${clientId}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await api.get<RequestsListResponse>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener una solicitud por su ID
   * @param id ID de la solicitud
   */
  getById: async (id: string): Promise<RequestResponse> => {

    try {
      const response = await api.get<RequestResponse>(`/requests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear una nueva solicitud
   * @param request RequestCreate (todos los campos que definimos en el modelo)
   */
  create: async (request: RequestCreate): Promise<{ requestId: string }> => {

    try {
      // El backend retorna: { success: true, message: "...", requestId: "abc123" }
      const response = await api.post<{
        success: boolean;
        message: string;
        requestId: string;
      }>('/requests', request);

      return { requestId: response.data.requestId };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar una solicitud existente
   * @param id ID de la solicitud
   * @param request Datos de RequestUpdate (todos opcionales)
   */
  update: async (id: string, request: RequestUpdate): Promise<void> => {

    try {
      await api.put(`/requests/${id}`, request);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar una solicitud
   * @param id ID de la solicitud
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {

    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/requests/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cambiar el estado de una solicitud (solo admin)
   * @param id ID de la solicitud
   * @param statusChange Objeto StatusChangeRequest { status, reason? }
   */
  changeStatus: async (
    id: string,
    statusChange: StatusChangeRequest
  ): Promise<void> => {
    

    try {
      await api.patch(`/requests/${id}/status`, statusChange);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Añadir un comentario a una solicitud
   * @param id ID de la solicitud
   * @param comment Objeto CommentCreate { content }
   */
  addComment: async (
    id: string,
    comment: CommentCreate
  ): Promise<void> => {
    

    try {
      await api.post(`/requests/${id}/comments`, comment);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enviar una solicitud para revisión (cambiar de DRAFT a SUBMITTED)
   * @param id ID de la solicitud
   */
  submitRequest: async (id: string): Promise<void> => {


    try {
      await api.post(`/requests/${id}/submit`);
    } catch (error) {
      throw error;
    }
  }
};

export default requestService;
