import { useState, useCallback } from 'react';
import type { Workflow, WorkflowRun, TriggerEvent } from '../types';
import { AutomationEngine } from '../engines/AutomationEngine';

export function useAutomation(orgId?: string, vendorId?: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs,      setRuns]      = useState<WorkflowRun[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list = await AutomationEngine.getWorkflows(orgId, vendorId);
      setWorkflows(list);
      return list;
    } catch (e) {
      setError((e as Error).message); return [];
    } finally {
      setLoading(false);
    }
  }, [orgId, vendorId]);

  const create = useCallback(async (data: Parameters<typeof AutomationEngine.createWorkflow>[0]): Promise<Workflow | null> => {
    setLoading(true); setError(null);
    try {
      const wf = await AutomationEngine.createWorkflow(data);
      setWorkflows(prev => [...prev, wf]);
      return wf;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = useCallback(async (id: string, active: boolean): Promise<Workflow | null> => {
    setLoading(true); setError(null);
    try {
      const wf = active
        ? await AutomationEngine.activateWorkflow(id)
        : await AutomationEngine.deactivateWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? wf : w));
      return wf;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      await AutomationEngine.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRuns = useCallback(async (workflowId: string) => {
    setLoading(true); setError(null);
    try {
      const r = await AutomationEngine.getRuns(workflowId);
      setRuns(r);
      return r;
    } catch (e) {
      setError((e as Error).message); return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const emit = useCallback((event: TriggerEvent, data: unknown) => {
    return AutomationEngine.emit(event, data);
  }, []);

  return {
    workflows, runs, loading, error,
    loadWorkflows, create, toggle, deleteWorkflow, loadRuns, emit,
    presets: AutomationEngine.presets,
  };
}