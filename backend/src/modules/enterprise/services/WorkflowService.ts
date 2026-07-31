import { EnterpriseRepository }                  from '../repositories/EnterpriseRepository.js';
import { AuditLogService }                         from './AuditLogService.js';
import type { Workflow, WorkflowInstance, WorkflowType } from '../types/enterprise.types.js';

export const WorkflowService = {
  async create(orgId: string, userId: string, input: {
    name: string; type: WorkflowType;
    steps: Array<{ order: number; approverRole: string; label: string; timeoutHours?: number }>;
  }): Promise<Workflow> {
    const wf = await EnterpriseRepository.createWorkflow({
      orgId, name: input.name, type: input.type, steps: input.steps, isActive: true,
    });
    await AuditLogService.log({
      orgId, userId, action: 'workflow.created', entity: 'workflow', entityId: wf.id,
      after: { name: wf.name, type: wf.type, steps: wf.steps.length },
    });
    return wf;
  },

  async list(orgId: string): Promise<Workflow[]> {
    return EnterpriseRepository.listWorkflows(orgId);
  },

  async submit(orgId: string, submittedBy: string, input: {
    workflowId: string; entityType: string; entityId: string;
  }): Promise<WorkflowInstance> {
    const workflow = await EnterpriseRepository.getWorkflowInstance(input.workflowId)
      .then(() => EnterpriseRepository.listWorkflows(orgId))
      .then(wfs => wfs.find(w => w.id === input.workflowId));
    if (!workflow) throw new Error('Workflow not found');

    const instanceSteps = workflow.steps.map(s => ({
      order:  s.order,
      label:  s.label,
      status: 'pending' as const,
    }));

    const instance = await EnterpriseRepository.createWorkflowInstance({
      workflowId: workflow.id, orgId, entityType: input.entityType,
      entityId: input.entityId, currentStep: 0, status: 'pending',
      submittedBy, steps: instanceSteps,
    });

    await AuditLogService.log({
      orgId, userId: submittedBy, action: 'workflow.submitted',
      entity: input.entityType, entityId: input.entityId,
      after: { workflowId: workflow.id, instanceId: instance.id },
    });
    return instance;
  },

  async decide(instanceId: string, orgId: string, deciderId: string, decision: 'approved' | 'rejected', comment?: string): Promise<WorkflowInstance> {
    const inst = await EnterpriseRepository.getWorkflowInstance(instanceId);
    if (!inst) throw new Error('Workflow instance not found');
    if (inst.status !== 'pending') throw new Error('Workflow already completed');

    const updatedSteps = inst.steps.map((s, idx) => {
      if (idx !== inst.currentStep) return s;
      const updated = { ...s, status: decision, approvedBy: deciderId, decidedAt: new Date().toISOString() };
      if (comment) (updated as Record<string, unknown>)['comment'] = comment;
      return updated;
    });

    const isLastStep = inst.currentStep >= inst.steps.length - 1;
    const newStatus  = decision === 'rejected' ? 'rejected'
      : isLastStep ? 'approved' : 'pending';
    const nextStep   = decision === 'approved' && !isLastStep ? inst.currentStep + 1 : inst.currentStep;

    await EnterpriseRepository.updateWorkflowInstance(instanceId, {
      steps:       updatedSteps,
      currentStep: nextStep,
      status:      newStatus,
      ...(newStatus !== 'pending' ? { completedAt: new Date().toISOString() } : {}),
    });

    await AuditLogService.log({
      orgId, userId: deciderId, action: `workflow.step.${decision}`,
      entity: inst.entityType, entityId: inst.entityId,
      after: { instanceId, step: inst.currentStep, decision },
    });

    return (await EnterpriseRepository.getWorkflowInstance(instanceId))!;
  },

  async list(orgId: string, status?: string): Promise<WorkflowInstance[]> {
    return EnterpriseRepository.listWorkflowInstances(orgId, status);
  },
};