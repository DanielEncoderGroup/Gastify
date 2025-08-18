/**
 * Servicio para gestión de workflows de aprobación
 */

import api from './api';

export interface WorkflowRule {
  id: string;
  name: string;
  condition_type: 'amount' | 'category' | 'role' | 'combination';
  condition_value: any;
  action: 'require_approval' | 'auto_approve' | 'flag_for_review';
  approval_level: number;
  required_approvers: number;
  approver_roles: string[];
}

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  rules: WorkflowRule[];
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ApprovalInstance {
  id: string;
  workflow_id: string;
  receipt_id: string;
  requester_id: string;
  current_level: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decisions: ApprovalDecision[];
  created_at: string;
  completed_at?: string;
  receipt_data?: any;
}

export interface ApprovalDecision {
  id: string;
  instance_id: string;
  approver_id: string;
  approver_role: string;
  level: number;
  decision: 'approve' | 'reject';
  comments?: string;
  decided_at: string;
}

export interface PendingApproval {
  id: string;
  workflow_name: string;
  requester_name: string;
  requester_email: string;
  receipt_id: string;
  receipt_vendor: string;
  receipt_amount: number;
  receipt_date: string;
  receipt_category: string;
  current_level: number;
  required_level: number;
  created_at: string;
  urgency: 'low' | 'medium' | 'high';
  receipt_image_url?: string;
}

export interface WorkflowAnalytics {
  total_approvals: number;
  pending_approvals: number;
  approved_this_month: number;
  rejected_this_month: number;
  average_approval_time: number;
  approval_rate: number;
  by_category: Array<{
    category: string;
    count: number;
    avg_amount: number;
    approval_rate: number;
  }>;
  by_approver: Array<{
    approver_name: string;
    approved_count: number;
    rejected_count: number;
    avg_response_time: number;
  }>;
}

class WorkflowService {
  // Workflows CRUD
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows/');
    return response.data;
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  }

  async getDefaultWorkflow(): Promise<Workflow> {
    const response = await api.get('/workflows/default/current');
    return response.data;
  }

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const response = await api.post('/workflows/', workflow);
    return response.data;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const response = await api.put(`/workflows/${id}`, updates);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  }

  // Aprobaciones
  async getPendingApprovals(): Promise<PendingApproval[]> {
    const response = await api.get('/workflows/approvals/pending');
    return response.data;
  }

  async getApprovalInstance(id: string): Promise<ApprovalInstance> {
    const response = await api.get(`/workflows/approvals/${id}`);
    return response.data;
  }

  async processApprovalDecision(
    instanceId: string,
    decision: 'approve' | 'reject',
    comments?: string
  ): Promise<ApprovalInstance> {
    const response = await api.post(`/workflows/approvals/${instanceId}/decision`, {
      decision,
      comments
    });
    return response.data;
  }

  // Analytics
  async getWorkflowAnalytics(
    workflowId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<WorkflowAnalytics> {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflow_id', workflowId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/workflows/analytics/summary?${params.toString()}`);
    return response.data;
  }

  // Plantillas
  async getBasicWorkflowTemplate() {
    const response = await api.get('/workflows/templates/basic');
    return response.data;
  }

  async getEnterpriseWorkflowTemplate() {
    const response = await api.get('/workflows/templates/enterprise');
    return response.data;
  }

  // Utilidades
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  }

  calculateDaysOverdue(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays - 3); // 3 días es el tiempo normal de aprobación
  }
}

export const workflowService = new WorkflowService();
