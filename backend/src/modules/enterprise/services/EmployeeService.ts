import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { Employee }         from '../types/enterprise.types.js';

let _nextSeq = 1000;
function nextEmpId(prefix = 'EMP'): string {
  return `${prefix}-${(++_nextSeq).toString().padStart(5, '0')}`;
}

export const EmployeeService = {
  async onboard(orgId: string, actorId: string, input: {
    userId: string; type: Employee['type']; roleId: string; title: string;
    branchId?: string; departmentId?: string; managerId?: string;
    salary?: number; hourlyRate?: number; currency?: string; startDate?: string;
  }): Promise<Employee> {
    const empId = nextEmpId();
    const emp   = await EnterpriseRepository.createEmployee({
      orgId, userId: input.userId, employeeId: empId, type: input.type,
      roleId: input.roleId, title: input.title,
      branchId: input.branchId, departmentId: input.departmentId, managerId: input.managerId,
      salary: input.salary, hourlyRate: input.hourlyRate,
      currency: input.currency ?? 'HTG', startDate: input.startDate ?? new Date().toISOString().slice(0, 10),
      status: 'probation',
    });
    await AuditLogService.log({
      orgId, userId: actorId, action: 'employee.onboarded', entity: 'employee', entityId: emp.id,
      after: { userId: emp.userId, title: emp.title, type: emp.type },
    });
    return emp;
  },

  async list(orgId: string, filters: { branchId?: string; deptId?: string; status?: string } = {}): Promise<Employee[]> {
    return EnterpriseRepository.listEmployees(orgId, filters);
  },

  async get(id: string): Promise<Employee | null> {
    return EnterpriseRepository.getEmployee(id);
  },

  async getByUser(orgId: string, userId: string): Promise<Employee | null> {
    return EnterpriseRepository.getEmployeeByUser(orgId, userId);
  },

  async update(empId: string, orgId: string, actorId: string, patch: Partial<Employee>): Promise<void> {
    const before = await EnterpriseRepository.getEmployee(empId);
    await EnterpriseRepository.updateEmployee(empId, patch);
    await AuditLogService.log({
      orgId, userId: actorId, action: 'employee.updated', entity: 'employee', entityId: empId,
      before: before as unknown as Record<string, unknown>,
      after:  patch as Record<string, unknown>,
    });
  },

  async terminate(empId: string, orgId: string, actorId: string, endDate: string): Promise<void> {
    await EnterpriseRepository.updateEmployee(empId, { status: 'terminated', endDate });
    await AuditLogService.log({
      orgId, userId: actorId, action: 'employee.terminated', entity: 'employee', entityId: empId,
      after: { status: 'terminated', endDate },
    });
  },
};