/**
 * Lista virtualizada optimizada para renderizar grandes cantidades de aprobaciones
 */

import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PendingApproval } from '../../services/workflowService';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface VirtualizedApprovalListProps {
  approvals: PendingApproval[];
  selectedApprovals: Set<string>;
  onApprovalSelect: (approvalId: string, selected: boolean) => void;
  onDecisionMade: (approvalId: string, decision: 'approve' | 'reject') => void;
  height: number;
  itemHeight: number;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    approvals: PendingApproval[];
    selectedApprovals: Set<string>;
    onApprovalSelect: (approvalId: string, selected: boolean) => void;
    onDecisionMade: (approvalId: string, decision: 'approve' | 'reject') => void;
  };
}

const ListItem = memo<ListItemProps>(({ index, style, data }) => {
  const { approvals, selectedApprovals, onApprovalSelect, onDecisionMade } = data;
  const approval = approvals[index];

  if (!approval) return null;

  const isSelected = selectedApprovals.has(approval.id);
  const urgencyColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div style={style} className="px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onApprovalSelect(approval.id, e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{approval.requester_name}</h4>
                <p className="text-sm text-gray-500">{approval.receipt_vendor}</p>
              </div>
              <div className={`px-3 py-1 rounded-full border text-xs font-medium ${urgencyColors[approval.urgency]}`}>
                {approval.urgency === 'high' && <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />}
                {approval.urgency === 'medium' && <ClockIcon className="w-3 h-3 inline mr-1" />}
                {approval.urgency.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Categoría</p>
                <p className="text-sm font-medium">{approval.receipt_category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monto</p>
                <p className="text-sm font-medium">${approval.receipt_amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Nivel {approval.current_level} de {approval.required_level}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => onDecisionMade(approval.id, 'reject')}
                  className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => onDecisionMade(approval.id, 'approve')}
                  className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 border border-emerald-600 rounded hover:bg-emerald-700"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const VirtualizedApprovalList: React.FC<VirtualizedApprovalListProps> = ({
  approvals,
  selectedApprovals,
  onApprovalSelect,
  onDecisionMade,
  height,
  itemHeight
}) => {
  if (approvals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay aprobaciones pendientes
        </h3>
        <p className="text-gray-600">
          Todas las boletas han sido procesadas o no hay boletas que requieran aprobación.
        </p>
      </div>
    );
  }

  const itemData = {
    approvals,
    selectedApprovals,
    onApprovalSelect,
    onDecisionMade
  };

  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <List
        height={height}
        width="100%"
        itemCount={approvals.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ListItem}
      </List>
    </div>
  );
};

export default memo(VirtualizedApprovalList);
