/**
 * Componente para configurar workflows de aprobación
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  CogIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { workflowService, Workflow, WorkflowRule } from '../../services/workflowService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface WorkflowConfigurationProps {
  onWorkflowSaved?: (workflow: Workflow) => void;
}

const WorkflowConfiguration: React.FC<WorkflowConfigurationProps> = ({ onWorkflowSaved }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    rules: [] as WorkflowRule[]
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const workflowsData = await workflowService.getWorkflows();
      setWorkflows(workflowsData);
    } catch (error: any) {
      console.error('Error loading workflows:', error);
      toast.error('Error al cargar workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    setFormData({
      name: '',
      description: '',
      is_default: false,
      rules: []
    });
    setEditingWorkflow(null);
    setShowCreateForm(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      is_default: workflow.is_default,
      rules: workflow.rules
    });
    setEditingWorkflow(workflow);
    setShowCreateForm(true);
  };

  const handleSaveWorkflow = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del workflow es requerido');
      return;
    }

    try {
      setSaving(true);
      let savedWorkflow: Workflow;

      if (editingWorkflow) {
        savedWorkflow = await workflowService.updateWorkflow(editingWorkflow.id, formData);
        toast.success('Workflow actualizado exitosamente');
      } else {
        savedWorkflow = await workflowService.createWorkflow({
          ...formData,
          company_id: 'default_company', // TODO: Get from user context
          created_by: 'current_user', // TODO: Get from auth context
          is_active: true
        });
        toast.success('Workflow creado exitosamente');
      }

      setShowCreateForm(false);
      loadWorkflows();
      onWorkflowSaved?.(savedWorkflow);
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast.error('Error al guardar el workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este workflow?')) return;

    try {
      await workflowService.deleteWorkflow(workflowId);
      toast.success('Workflow eliminado');
      loadWorkflows();
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      toast.error('Error al eliminar workflow');
    }
  };

  const addRule = () => {
    const newRule: WorkflowRule = {
      id: `rule_${Date.now()}`,
      name: '',
      condition_type: 'amount',
      condition_value: 0,
      action: 'require_approval',
      approval_level: 1,
      required_approvers: 1,
      approver_roles: ['EMPLOYER']
    };

    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const updateRule = (index: number, updates: Partial<WorkflowRule>) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const loadTemplate = async (templateType: 'basic' | 'enterprise') => {
    try {
      const template = templateType === 'basic' 
        ? await workflowService.getBasicWorkflowTemplate()
        : await workflowService.getEnterpriseWorkflowTemplate();

      setFormData({
        name: template.name,
        description: template.description,
        is_default: false,
        rules: template.rules
      });
      
      toast.success(`Plantilla ${templateType} cargada`);
    } catch (error: any) {
      console.error('Error loading template:', error);
      toast.error('Error al cargar la plantilla');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Workflows</h2>
          <p className="text-gray-600">Define reglas de aprobación para tu empresa</p>
        </div>
        <Button
          onClick={handleCreateWorkflow}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Crear Workflow
        </Button>
      </div>

      {/* Lista de workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} variant="elevated" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {workflow.is_default && (
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                    Por defecto
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                {workflow.rules.length} regla(s)
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Niveles: {Math.max(...workflow.rules.map(r => r.approval_level), 0)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditWorkflow(workflow)}
                className="flex-1"
              >
                <CogIcon className="w-4 h-4 mr-1" />
                Editar
              </Button>
              
              {!workflow.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay workflows configurados</h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer workflow o usa una plantilla predefinida
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={handleCreateWorkflow}>
                Crear Workflow
              </Button>
              <Button variant="outline" onClick={() => loadTemplate('basic')}>
                Usar Plantilla Básica
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de creación/edición */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingWorkflow ? 'Editar Workflow' : 'Crear Workflow'}
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Workflow *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="ej: Aprobación de Gastos Básica"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-7">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                    Usar como workflow por defecto
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Describe el propósito y alcance de este workflow..."
                />
              </div>

              {/* Plantillas rápidas */}
              {!editingWorkflow && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plantillas Rápidas
                  </label>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate('basic')}
                    >
                      📋 Plantilla Básica
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate('enterprise')}
                    >
                      🏢 Plantilla Empresarial
                    </Button>
                  </div>
                </div>
              )}

              {/* Reglas */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Reglas de Aprobación</h4>
                  <Button onClick={addRule} size="sm">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Agregar Regla
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.rules.map((rule, index) => (
                    <Card key={rule.id} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h5 className="font-medium text-gray-900">Regla {index + 1}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => updateRule(index, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="ej: Gastos mayores a $100K"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Condición
                          </label>
                          <select
                            value={rule.condition_type}
                            onChange={(e) => updateRule(index, { condition_type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="amount">💰 Monto</option>
                            <option value="category">🏷️ Categoría</option>
                            <option value="role">👤 Rol</option>
                            <option value="combination">🔗 Combinación</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor
                          </label>
                          {rule.condition_type === 'amount' ? (
                            <input
                              type="number"
                              value={rule.condition_value}
                              onChange={(e) => updateRule(index, { condition_value: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="100000"
                            />
                          ) : (
                            <input
                              type="text"
                              value={rule.condition_value}
                              onChange={(e) => updateRule(index, { condition_value: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Valor de la condición"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Acción
                          </label>
                          <select
                            value={rule.action}
                            onChange={(e) => updateRule(index, { action: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="require_approval">❗ Requiere Aprobación</option>
                            <option value="auto_approve">✅ Auto-aprobar</option>
                            <option value="flag_for_review">🚩 Marcar para Revisión</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nivel
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={rule.approval_level}
                            onChange={(e) => updateRule(index, { approval_level: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aprobadores Requeridos
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={rule.required_approvers}
                            onChange={(e) => updateRule(index, { required_approvers: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {formData.rules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No hay reglas definidas</p>
                      <p className="text-sm">Agrega reglas para configurar el flujo de aprobación</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveWorkflow}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-4 h-4 mr-1" />}
                {editingWorkflow ? 'Actualizar' : 'Crear'} Workflow
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowConfiguration;
