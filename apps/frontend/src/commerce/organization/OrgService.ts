/**
 * OrgService — Organization hierarchy CRUD.
 * HQ → Branches → Departments → Teams → Employees.
 */

import type { Organization, Branch, Department, Team, Employee, OrgType } from '../types';

function getAuth(): string {
  try {
    const u = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return u.token ? `Bearer ${u.token}` : '';
  } catch { return ''; }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: getAuth(), ...(init.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: `HTTP ${res.status}` })) as { message?: string };
    throw new Error(e.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const OrgService = {
  // ─── Organization ──────────────────────────────────────────────────────────

  async create(data: {
    name: string; type: OrgType; legalName?: string; taxId?: string;
    country: string; currency: string; description?: string;
  }): Promise<Organization> {
    return api<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) });
  },

  async get(id: string): Promise<Organization> {
    return api<Organization>(`/organizations/${id}`);
  },

  async getMyOrgs(): Promise<Organization[]> {
    return api<Organization[]>('/organizations/me');
  },

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return api<Organization>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async suspend(id: string, reason: string): Promise<Organization> {
    return api<Organization>(`/organizations/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  async activate(id: string): Promise<Organization> {
    return api<Organization>(`/organizations/${id}/activate`, { method: 'POST' });
  },

  // ─── Branches ─────────────────────────────────────────────────────────────

  async createBranch(orgId: string, data: Omit<Branch, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    return api<Branch>(`/organizations/${orgId}/branches`, { method: 'POST', body: JSON.stringify(data) });
  },

  async getBranches(orgId: string): Promise<Branch[]> {
    return api<Branch[]>(`/organizations/${orgId}/branches`);
  },

  async updateBranch(orgId: string, branchId: string, data: Partial<Branch>): Promise<Branch> {
    return api<Branch>(`/organizations/${orgId}/branches/${branchId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  // ─── Departments ──────────────────────────────────────────────────────────

  async createDepartment(orgId: string, data: Omit<Department, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    return api<Department>(`/organizations/${orgId}/departments`, { method: 'POST', body: JSON.stringify(data) });
  },

  async getDepartments(orgId: string, branchId?: string): Promise<Department[]> {
    const q = branchId ? `?branchId=${branchId}` : '';
    return api<Department[]>(`/organizations/${orgId}/departments${q}`);
  },

  // ─── Teams ────────────────────────────────────────────────────────────────

  async createTeam(orgId: string, data: Omit<Team, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    return api<Team>(`/organizations/${orgId}/teams`, { method: 'POST', body: JSON.stringify(data) });
  },

  async getTeams(orgId: string, departmentId?: string): Promise<Team[]> {
    const q = departmentId ? `?departmentId=${departmentId}` : '';
    return api<Team[]>(`/organizations/${orgId}/teams${q}`);
  },

  // ─── Employees ────────────────────────────────────────────────────────────

  async inviteEmployee(orgId: string, data: { email: string; roleId: string; departmentId?: string; teamId?: string }): Promise<Employee> {
    return api<Employee>(`/organizations/${orgId}/employees/invite`, { method: 'POST', body: JSON.stringify(data) });
  },

  async getEmployees(orgId: string, options?: { departmentId?: string; teamId?: string; status?: string }): Promise<Employee[]> {
    const p = new URLSearchParams();
    if (options?.departmentId) p.set('departmentId', options.departmentId);
    if (options?.teamId)       p.set('teamId',       options.teamId);
    if (options?.status)       p.set('status',       options.status);
    return api<Employee[]>(`/organizations/${orgId}/employees?${p.toString()}`);
  },

  async updateEmployeeRole(orgId: string, employeeId: string, roleId: string): Promise<Employee> {
    return api<Employee>(`/organizations/${orgId}/employees/${employeeId}/role`, {
      method: 'PATCH',
      body:   JSON.stringify({ roleId }),
    });
  },

  async removeEmployee(orgId: string, employeeId: string): Promise<void> {
    await api(`/organizations/${orgId}/employees/${employeeId}`, { method: 'DELETE' });
  },

  // ─── Roles & permissions ──────────────────────────────────────────────────

  async getRoles(orgId: string) {
    return api<unknown[]>(`/organizations/${orgId}/roles`);
  },

  async createRole(orgId: string, data: { name: string; permissions: string[]; isDefault?: boolean }) {
    return api<unknown>(`/organizations/${orgId}/roles`, { method: 'POST', body: JSON.stringify(data) });
  },

  // ─── Hierarchy helpers ────────────────────────────────────────────────────

  async getOrgTree(orgId: string): Promise<Organization & { branches: Branch[]; departments: Department[]; teams: Team[] }> {
    return api(`/organizations/${orgId}/tree`);
  },
};