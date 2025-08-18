/**
 * Componente para aprobar/rechazar boletas individuales
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

import { workflowService, PendingApproval } from '../../services/workflowService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ReceiptApprovalFlowProps {
  approval: PendingApproval;
  onDecisionMade: (approvalId: string, decision: 'approve' | 'reject') => void;
  showFullDetails?: boolean;
}

export const ReceiptApprovalFlow: React.FC<ReceiptApprovalFlowProps> = ({
  approval,
  onDecisionMade,
  showFullDetails = false
}) => {
  const [showDetails, setShowDetails] = useState(showFullDetails);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null);

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !comments.trim()) {
      setShowCommentForm(true);
      setPendingDecision(decision);
      return;
    }

    try {
      setProcessing(true);
      await workflowService.processApprovalDecision(
        approval.id,
        decision,
        comments || undefined
      );

      toast.success(
        decision === 'approve' 
          ? '✅ Boleta aprobada exitosamente'
          : '❌ Boleta rechazada'
      );

      onDecisionMade(approval.id, decision);
    } catch (error: any) {
      console.error('Error processing decision:', error);
      toast.error(`Error al ${decision === 'approve' ? 'aprobar' : 'rechazar'} la boleta`);
    } finally {
      setProcessing(false);
      setPendingDecision(null);
      setShowCommentForm(false);
      setComments('');
    }
  };

  const handleCommentSubmit = () => {
    if (pendingDecision && comments.trim()) {
      handleDecision(pendingDecision);
    }
  };

  const urgencyColor = workflowService.getUrgencyColor(approval.urgency);
  const daysOverdue = workflowService.calculateDaysOverdue(approval.created_at);
  const isOverdue = daysOverdue > 0;

  return (
    <Card variant="elevated" className="p-6">
      {/* Header con información básica */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {/* Avatar del empleado */}
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-emerald-600" />
          </div>

          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {approval.requester_name}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full bg-${urgencyColor}-100 text-${urgencyColor}-800`}>
                {approval.urgency === 'high' ? '🔥 Urgente' : 
                 approval.urgency === 'medium' ? '⚡ Moderada' : '📋 Normal'}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  {daysOverdue} días vencida
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{approval.requester_email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Enviado {workflowService.formatDate(approval.created_at)}
            </p>
          </div>
        </div>

        {/* Botón ver detalles */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="shrink-0"
        >
          {showDetails ? 'Ocultar' : 'Ver'} detalles
        </Button>
      </div>

      {/* Información del recibo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Monto</p>
            <p className="font-semibold text-green-700">
              {workflowService.formatCurrency(approval.receipt_amount)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Proveedor</p>
            <p className="font-semibold text-gray-900">{approval.receipt_vendor}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Fecha</p>
            <p className="font-semibold text-gray-900">
              {new Date(approval.receipt_date).toLocaleDateString('es-CL')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <TagIcon className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Categoría</p>
            <p className="font-semibold text-gray-900">{approval.receipt_category}</p>
          </div>
        </div>
      </div>

      {/* Información del workflow */}
      <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <ClockIcon className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-700">
          Nivel {approval.current_level} de {approval.required_level} • 
          Workflow: <strong>{approval.workflow_name}</strong>
        </span>
      </div>

      {/* Detalles expandidos */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Imagen del recibo</h4>
              {approval.receipt_image_url ? (
                <img
                  src={approval.receipt_image_url}
                  alt="Imagen del recibo"
                  className="max-w-full h-64 object-contain rounded-lg border"
                />
              ) : (
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  <DocumentTextIcon className="w-5 h-5 mr-3" />
                  Imagen no disponible
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario de comentarios */}
      <AnimatePresence>
        {showCommentForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              <h4 className="font-medium text-yellow-900">
                {pendingDecision === 'reject' ? 'Razón del rechazo (requerida)' : 'Comentarios adicionales'}
              </h4>
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                pendingDecision === 'reject'
                  ? 'Explique por qué está rechazando esta boleta...'
                  : 'Agregue comentarios si es necesario...'
              }
              rows={3}
              className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
            <div className="flex justify-end space-x-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCommentForm(false);
                  setPendingDecision(null);
                  setComments('');
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={pendingDecision === 'reject' && !comments.trim()}
                className={
                  pendingDecision === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {pendingDecision === 'approve' ? '✅ Aprobar' : '❌ Rechazar'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => handleDecision('reject')}
          disabled={processing}
          className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          {processing && pendingDecision === 'reject' ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <XCircleIcon className="w-4 h-4 mr-1" />
              Rechazar
            </>
          )}
        </Button>

        <Button
          onClick={() => {
            setShowCommentForm(true);
            setPendingDecision('approve');
          }}
          disabled={processing}
          className="bg-green-600 hover:bg-green-700"
        >
          {processing && pendingDecision === 'approve' ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <CheckCircleIconSolid className="w-4 h-4 mr-1" />
              Aprobar
            </>
          )}
        </Button>
      </div>

      {/* Indicador de procesamiento */}
      {processing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2"
        >
          <LoadingSpinner size="sm" />
          <span className="text-blue-800">
            Procesando {pendingDecision === 'approve' ? 'aprobación' : 'rechazo'}...
          </span>
        </motion.div>
      )}
    </Card>
  );
};

export default ReceiptApprovalFlow;
