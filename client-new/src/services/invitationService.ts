/**
 * Servicio frontend para gestión de invitaciones empleador→empleado
 */

import api from './api';

// Interfaces para invitaciones
export interface InvitationCreate {
  invited_email: string;
  invited_first_name?: string;
  invited_last_name?: string;
  department?: string;
  position?: string;
  invitation_message?: string;
  expires_in_days?: number;
}

export interface InvitationPublic {
  id: string;
  invited_email: string;
  invited_first_name?: string;
  invited_last_name?: string;
  company_name: string;
  department?: string;
  position?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  invitation_message?: string;
}

export interface InvitationStats {
  total_sent: number;
  pending: number;
  accepted: number;
  expired: number;
  acceptance_rate: number;
  recent_invitations: InvitationPublic[];
}

export interface InvitationTokenData {
  invitation_id: string;
  employer_id: string;
  invited_email: string;
  company_name: string;
  department?: string;
  position?: string;
  expires_at: string;
}

export class InvitationService {
  /**
   * Invitar nuevo empleado (solo empleadores)
   */
  static async inviteEmployee(invitationData: InvitationCreate): Promise<InvitationPublic> {
    try {
      const response = await api.post('/invitations/invite-employee', invitationData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error enviando invitación');
    }
  }

  /**
   * Obtener lista de invitaciones del empleador
   */
  static async getMyInvitations(
    status?: string,
    limit: number = 50
  ): Promise<InvitationPublic[]> {
    try {
      const params: any = { limit };
      if (status) params.status = status;

      const response = await api.get('/invitations/my-invitations', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error obteniendo invitaciones');
    }
  }

  /**
   * Obtener estadísticas de invitaciones
   */
  static async getInvitationStats(): Promise<InvitationStats> {
    try {
      const response = await api.get('/invitations/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error obteniendo estadísticas');
    }
  }

  /**
   * Cancelar invitación pendiente
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await api.post(`/invitations/cancel/${invitationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error cancelando invitación');
    }
  }

  /**
   * Reenviar invitación
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    try {
      await api.post(`/invitations/resend-invitation/${invitationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error reenviando invitación');
    }
  }

  /**
   * Validar token de invitación (público - sin autenticación)
   */
  static async validateInvitationToken(token: string): Promise<InvitationTokenData> {
    try {
      const response = await api.get(`/invitations/validate-token/${token}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Token de invitación inválido');
    }
  }

  /**
   * Aceptar invitación (interno - llamado por sistema de registro)
   */
  static async acceptInvitation(token: string, newUserId: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('new_user_id', newUserId);

      const response = await api.post(`/invitations/accept-invitation/${token}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error aceptando invitación');
    }
  }

  /**
   * Generar URL de invitación para compartir
   */
  static generateInvitationURL(token: string): string {
    const baseURL = window.location.origin;
    return `${baseURL}/auth/register/invitation/${token}`;
  }

  /**
   * Formatear estado de invitación para mostrar
   */
  static formatStatus(status: string): { text: string; color: string; icon: string } {
    const statusMap = {
      pending: { text: 'Pendiente', color: 'yellow', icon: '⏳' },
      accepted: { text: 'Aceptada', color: 'green', icon: '✅' },
      expired: { text: 'Expirada', color: 'red', icon: '⏰' },
      cancelled: { text: 'Cancelada', color: 'gray', icon: '❌' },
    };

    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      color: 'gray', 
      icon: '❓' 
    };
  }

  /**
   * Verificar si la invitación está expirada
   */
  static isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Calcular días restantes para expiración
   */
  static getDaysUntilExpiration(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Formatear fecha de manera legible
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
