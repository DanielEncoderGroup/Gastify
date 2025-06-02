import { 
  RequestCreate, 
  RequestUpdate,
  StatusChangeRequest,
  CommentCreate,
  RequestsListResponse,
  RequestResponse,
  RequestStatus,
  RequestSummary,
  ProjectType,
  ProjectPriority,
  RequestStatusLabels
} from '../types/request';
import { mockRequests, getMockRequestDetail } from './mockData';

// Servicio de mock para desarrollo de frontend
export const mockRequestService = {
  // Obtener listado de solicitudes con filtros opcionales
  getAll: async (
    status?: RequestStatus,
    clientId?: string,
    search?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<RequestsListResponse> => {
    // Simulamos un delay para simular tiempo de respuesta de API
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredRequests = [...mockRequests];

    // Aplicamos filtros
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    if (clientId) {
      filteredRequests = filteredRequests.filter(req => req.clientId === clientId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredRequests = filteredRequests.filter(req => 
        req.title.toLowerCase().includes(searchLower) || 
        req.description.toLowerCase().includes(searchLower)
      );
    }

    // Total de resultados sin paginación
    const total = filteredRequests.length;

    // Aplicamos paginación
    const pagedRequests = filteredRequests.slice(skip, skip + limit);

    return {
      success: true,
      requests: pagedRequests,
      items: pagedRequests, // Alias opcional
      total,
      skip,
      limit,
      page: Math.floor(skip / limit),
      pages: Math.ceil(total / limit)
    };
  },

  // Obtener una solicitud por su ID
  getById: async (id: string): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const requestDetail = getMockRequestDetail(id);

    return {
      success: true,
      request: requestDetail
    };
  },

  // Crear una nueva solicitud
  create: async (request: RequestCreate): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generamos un ID único para la nueva solicitud
    const newId = (mockRequests.length + 1).toString();

    // Obtener el usuario actual del localStorage
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    // Creamos una nueva solicitud con los datos proporcionados
    const newRequest: RequestSummary = {
      id: newId,
      title: request.title,
      description: request.description,
      status: RequestStatus.SUBMITTED, // Cambiado a SUBMITTED para que sea visible en el admin
      statusLabel: 'Enviado',
      projectType: request.projectType,
      projectTypeLabel: request.projectType === ProjectType.WEB_APP ? 'Aplicación Web' :
                        request.projectType === ProjectType.MOBILE_APP ? 'Aplicación Móvil' :
                        request.projectType === ProjectType.DESKTOP_APP ? 'Aplicación de Escritorio' :
                        request.projectType === ProjectType.CLOUD_MIGRATION ? 'Migración a la Nube' :
                        request.projectType === ProjectType.E_COMMERCE ? 'Comercio Electrónico' :
                        'Otro',
      priority: request.priority || ProjectPriority.MEDIUM,
      priorityLabel: request.priority === ProjectPriority.HIGH ? 'Alta' :
                    request.priority === ProjectPriority.MEDIUM ? 'Media' :
                    request.priority === ProjectPriority.LOW ? 'Baja' :
                    request.priority === ProjectPriority.URGENT ? 'Urgente' :
                    'Media',
      clientId: currentUser?.id || 'unknown',
      client: currentUser ? {
        id: currentUser.id,
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Usuario'
      } : {
        id: 'unknown',
        firstName: 'Usuario',
        lastName: '',
        email: 'desconocido@ejemplo.com',
        name: 'Usuario Desconocido'
      },
      budget: request.budget,
      timeframe: request.timeframe,
      technicalRequirements: request.technicalRequirements,
      businessGoals: request.businessGoals,
      integrationsNeeded: request.integrationsNeeded,
      targetAudience: request.targetAudience,
      additionalInfo: request.additionalInfo,
      tags: request.tags || [],
      commentsCount: 0,
      filesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0
    };

    // Añadimos la nueva solicitud a nuestra colección mock
    mockRequests.unshift(newRequest);

    return {
      success: true,
      request: getMockRequestDetail(newId)
    };
  },

  // Actualizar una solicitud existente
  update: async (id: string, requestUpdate: RequestUpdate): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 700));

    // Encontramos la solicitud existente
    const index = mockRequests.findIndex(req => req.id === id);

    if (index === -1) {
      throw new Error('Solicitud no encontrada');
    }

    // Actualizamos la solicitud con los nuevos datos
    mockRequests[index] = {
      ...mockRequests[index],
      title: requestUpdate.title || mockRequests[index].title,
      description: requestUpdate.description || mockRequests[index].description,
      projectType: requestUpdate.projectType || mockRequests[index].projectType,
      projectTypeLabel: requestUpdate.projectType ?
                        (requestUpdate.projectType === ProjectType.WEB_APP ? 'Aplicación Web' :
                         requestUpdate.projectType === ProjectType.MOBILE_APP ? 'Aplicación Móvil' :
                         requestUpdate.projectType === ProjectType.DESKTOP_APP ? 'Aplicación de Escritorio' :
                         requestUpdate.projectType === ProjectType.CLOUD_MIGRATION ? 'Migración a la Nube' :
                         requestUpdate.projectType === ProjectType.E_COMMERCE ? 'Comercio Electrónico' :
                         'Otro') :
                        mockRequests[index].projectTypeLabel,
      priority: requestUpdate.priority || mockRequests[index].priority,
      priorityLabel: requestUpdate.priority ?
                    (requestUpdate.priority === ProjectPriority.HIGH ? 'Alta' :
                     requestUpdate.priority === ProjectPriority.MEDIUM ? 'Media' :
                     requestUpdate.priority === ProjectPriority.LOW ? 'Baja' :
                     requestUpdate.priority === ProjectPriority.URGENT ? 'Urgente' :
                     'Media') :
                    mockRequests[index].priorityLabel,
      budget: requestUpdate.budget !== undefined ? requestUpdate.budget : mockRequests[index].budget,
      timeframe: requestUpdate.timeframe || mockRequests[index].timeframe,
      technicalRequirements: requestUpdate.technicalRequirements || mockRequests[index].technicalRequirements,
      businessGoals: requestUpdate.businessGoals || mockRequests[index].businessGoals,
      integrationsNeeded: requestUpdate.integrationsNeeded || mockRequests[index].integrationsNeeded,
      targetAudience: requestUpdate.targetAudience || mockRequests[index].targetAudience,
      additionalInfo: requestUpdate.additionalInfo || mockRequests[index].additionalInfo,
      tags: requestUpdate.tags || mockRequests[index].tags,
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      request: getMockRequestDetail(id)
    };
  },

  // Cambiar el estado de una solicitud
  changeStatus: async (id: string, statusChange: StatusChangeRequest): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Encontramos la solicitud existente
    const index = mockRequests.findIndex(req => req.id === id);

    if (index === -1) {
      throw new Error('Solicitud no encontrada');
    }

    // Actualizamos el estado
    const prevStatus = mockRequests[index].status;
    const prevStatusLabel = mockRequests[index].statusLabel;

    mockRequests[index] = {
      ...mockRequests[index],
      status: statusChange.status,
      statusLabel: RequestStatusLabels[statusChange.status] || 'Desconocido',
      updatedAt: new Date().toISOString()
    };

    // Obtener detalle actualizado
    const updatedDetail = getMockRequestDetail(id);

    // Añadir histórico de estado
    updatedDetail.statusHistory.push({
      fromStatus: prevStatus,
      fromStatusLabel: prevStatusLabel,
      toStatus: statusChange.status,
      toStatusLabel: mockRequests[index].statusLabel,
      changedAt: new Date().toISOString(),
      reason: statusChange.reason || 'Cambio de estado',
      changedBy: {
        id: 'admin1',
        firstName: 'Admin',
        lastName: 'Usuario',
        email: 'admin@encodergroup.com',
        name: 'Admin Usuario'
      }
    });

    return {
      success: true,
      request: updatedDetail
    };
  },

  // Añadir un comentario a una solicitud
  addComment: async (id: string, comment: CommentCreate): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Encontramos la solicitud existente
    const index = mockRequests.findIndex(req => req.id === id);

    if (index === -1) {
      throw new Error('Solicitud no encontrada');
    }

    // Incrementamos el contador de comentarios
    mockRequests[index] = {
      ...mockRequests[index],
      commentsCount: mockRequests[index].commentsCount + 1,
      updatedAt: new Date().toISOString()
    };

    // Obtener detalle para añadir comentario
    const detail = getMockRequestDetail(id);

    // Añadir el nuevo comentario al inicio
    detail.comments.unshift({
      id: `c${detail.comments.length + 1}`,
      content: comment.content,
      createdAt: new Date().toISOString(),
      user: {
        id: 'client1',
        firstName: 'Cliente',
        lastName: 'Actual',
        email: 'cliente@example.com',
        name: 'Cliente Actual'
      }
    });

    return {
      success: true,
      request: detail
    };
  },

  // Enviar una solicitud para revisión (cambiar de DRAFT a SUBMITTED)
  submitRequest: async (id: string): Promise<RequestResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Encontramos la solicitud existente
    const index = mockRequests.findIndex(req => req.id === id);

    if (index === -1) {
      throw new Error('Solicitud no encontrada');
    }

    // Cambiamos el estado a SUBMITTED
    const prevStatus = mockRequests[index].status;
    const prevStatusLabel = mockRequests[index].statusLabel;

    mockRequests[index] = {
      ...mockRequests[index],
      status: RequestStatus.SUBMITTED,
      statusLabel: 'Enviado',
      updatedAt: new Date().toISOString()
    };

    // Obtener detalle actualizado
    const updatedDetail = getMockRequestDetail(id);

    // Añadir al historial
    updatedDetail.statusHistory.push({
      fromStatus: prevStatus,
      fromStatusLabel: prevStatusLabel,
      toStatus: RequestStatus.SUBMITTED,
      toStatusLabel: 'Enviado',
      changedAt: new Date().toISOString(),
      reason: 'Solicitud enviada para revisión',
      changedBy: {
        id: 'client1',
        firstName: 'Cliente',
        lastName: 'Actual',
        email: 'cliente@example.com',
        name: 'Cliente Actual'
      }
    });

    return {
      success: true,
      request: updatedDetail
    };
  }
};
