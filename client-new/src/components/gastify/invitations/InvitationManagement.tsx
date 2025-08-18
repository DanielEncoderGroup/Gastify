/**
 * Componente principal para gestión de invitaciones empleador→empleado
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  InvitationService, 
  InvitationCreate, 
  InvitationPublic, 
  InvitationStats 
} from '../../../services/invitationService';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';

export const InvitationManagement: React.FC = () => {
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [invitations, setInvitations] = useState<InvitationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas y lista de invitaciones en paralelo
      const [statsData, invitationsData] = await Promise.all([
        InvitationService.getInvitationStats(),
        InvitationService.getMyInvitations(
          selectedStatus === 'all' ? undefined : selectedStatus
        )
      ]);

      setStats(statsData);
      setInvitations(invitationsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationSent = () => {
    setShowInviteForm(false);
    loadData();
    toast.success('¡Invitación enviada exitosamente!');
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta invitación?')) return;

    try {
      await InvitationService.cancelInvitation(invitationId);
      toast.success('Invitación cancelada');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await InvitationService.resendInvitation(invitationId);
      toast.success('Invitación reenviada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Invitaciones</h1>
          <p className="text-gray-600">Invita empleados a unirse a tu empresa en Gastify</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <span className="mr-2">👤</span>
          Invitar Empleado
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && <InvitationStatsCards stats={stats} />}

      {/* Filtros */}
      <div className="flex space-x-2">
        {[
          { value: 'all', label: 'Todas', count: stats?.total_sent || 0 },
          { value: 'pending', label: 'Pendientes', count: stats?.pending || 0 },
          { value: 'accepted', label: 'Aceptadas', count: stats?.accepted || 0 },
          { value: 'expired', label: 'Expiradas', count: stats?.expired || 0 }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === filter.value
                ? 'bg-primary-100 text-primary-700 border-primary-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            } border`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Lista de invitaciones */}
      <InvitationsList
        invitations={invitations}
        onCancel={handleCancelInvitation}
        onResend={handleResendInvitation}
      />

      {/* Modal de invitación */}
      {showInviteForm && (
        <InviteEmployeeModal
          onClose={() => setShowInviteForm(false)}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </div>
  );
};

// Componente de tarjetas de estadísticas
const InvitationStatsCards: React.FC<{ stats: InvitationStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card variant="elevated" className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <span className="text-xl">📧</span>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Enviadas</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_sent}</p>
        </div>
      </div>
    </Card>

    <Card variant="elevated" className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <span className="text-xl">⏳</span>
        </div>
        <div>
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>
    </Card>

    <Card variant="elevated" className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <span className="text-xl">✅</span>
        </div>
        <div>
          <p className="text-sm text-gray-600">Aceptadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
      </div>
    </Card>

    <Card variant="elevated" className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <span className="text-xl">📈</span>
        </div>
        <div>
          <p className="text-sm text-gray-600">Tasa Aceptación</p>
          <p className="text-2xl font-bold text-purple-600">{stats.acceptance_rate}%</p>
        </div>
      </div>
    </Card>
  </div>
);

// Componente de lista de invitaciones
const InvitationsList: React.FC<{
  invitations: InvitationPublic[];
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
}> = ({ invitations, onCancel, onResend }) => {
  if (invitations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay invitaciones</h3>
        <p className="text-gray-600">
          Comienza invitando empleados a unirse a tu empresa en Gastify
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map(invitation => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onCancel={onCancel}
          onResend={onResend}
        />
      ))}
    </div>
  );
};

// Componente de tarjeta individual de invitación
const InvitationCard: React.FC<{
  invitation: InvitationPublic;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
}> = ({ invitation, onCancel, onResend }) => {
  const statusInfo = InvitationService.formatStatus(invitation.status);
  const daysLeft = InvitationService.getDaysUntilExpiration(invitation.expires_at);
  const isExpired = InvitationService.isExpired(invitation.expires_at);

  const employeeName = invitation.invited_first_name && invitation.invited_last_name
    ? `${invitation.invited_first_name} ${invitation.invited_last_name}`
    : invitation.invited_email;

  return (
    <Card variant="elevated" className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {employeeName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Información del empleado */}
          <div>
            <h3 className="font-medium text-gray-900">{employeeName}</h3>
            <p className="text-sm text-gray-600">{invitation.invited_email}</p>
            {invitation.position && (
              <p className="text-sm text-gray-500">
                {invitation.position}
                {invitation.department && ` • ${invitation.department}`}
              </p>
            )}
          </div>
        </div>

        {/* Estado y acciones */}
        <div className="flex items-center space-x-4">
          {/* Estado */}
          <div className="text-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
              {statusInfo.icon} {statusInfo.text}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {invitation.status === 'pending' && !isExpired && (
                `${daysLeft} días restantes`
              )}
              {invitation.status === 'accepted' && invitation.accepted_at && (
                `Aceptada ${InvitationService.formatDate(invitation.accepted_at)}`
              )}
              {invitation.status === 'expired' && 'Expiró'}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex space-x-2">
            {invitation.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResend(invitation.id)}
                  className="hover:bg-gray-50"
                >
                  📧
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(invitation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  ❌
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje personalizado */}
      {invitation.invitation_message && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Mensaje:</span> "{invitation.invitation_message}"
          </p>
        </div>
      )}
    </Card>
  );
};

// Modal para invitar empleado
const InviteEmployeeModal: React.FC<{
  onClose: () => void;
  onInvitationSent: () => void;
}> = ({ onClose, onInvitationSent }) => {
  const [formData, setFormData] = useState<InvitationCreate>({
    invited_email: '',
    invited_first_name: '',
    invited_last_name: '',
    department: '',
    position: '',
    invitation_message: '',
    expires_in_days: 7
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invited_email) {
      toast.error('El email es requerido');
      return;
    }

    try {
      setLoading(true);
      await InvitationService.inviteEmployee(formData);
      onInvitationSent();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Invitar Empleado</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email del empleado *
              </label>
              <input
                type="email"
                required
                value={formData.invited_email}
                onChange={e => setFormData({ ...formData, invited_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="empleado@empresa.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.invited_first_name}
                  onChange={e => setFormData({ ...formData, invited_first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.invited_last_name}
                  onChange={e => setFormData({ ...formData, invited_last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ej: Desarrollador, Contador"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ej: Tecnología, Finanzas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje personalizado (opcional)
              </label>
              <textarea
                value={formData.invitation_message}
                onChange={e => setFormData({ ...formData, invitation_message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Mensaje de bienvenida para el nuevo empleado..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días hasta expiración
              </label>
              <select
                value={formData.expires_in_days}
                onChange={e => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Enviar Invitación'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
