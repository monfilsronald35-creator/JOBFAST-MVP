import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { EnterpriseDocument, DocCategory } from '../types/enterprise.types.js';

export const DocumentCenterService = {
  async upload(orgId: string, actorId: string, input: {
    name: string; fileUrl: string; fileSize: number; mimeType: string;
    category: DocCategory; tags?: string[]; isConfidential?: boolean;
    branchId?: string; departmentId?: string; employeeId?: string; expiresAt?: string;
  }): Promise<EnterpriseDocument> {
    const doc = await EnterpriseRepository.createDocument({
      orgId, name: input.name, fileUrl: input.fileUrl, fileSize: input.fileSize,
      mimeType: input.mimeType, category: input.category,
      tags: input.tags ?? [], isConfidential: input.isConfidential ?? false,
      version: 1, uploadedBy: actorId,
      branchId: input.branchId, departmentId: input.departmentId,
      employeeId: input.employeeId, expiresAt: input.expiresAt,
    });

    await AuditLogService.log({
      orgId, userId: actorId, action: 'document.uploaded', entity: 'document', entityId: doc.id,
      after: { name: doc.name, category: doc.category, isConfidential: doc.isConfidential },
    });
    return doc;
  },

  async list(orgId: string, filters: { category?: string; employeeId?: string } = {}): Promise<EnterpriseDocument[]> {
    return EnterpriseRepository.listDocuments(orgId, filters);
  },

  async getExpiring(orgId: string, days = 30): Promise<EnterpriseDocument[]> {
    const docs = await EnterpriseRepository.listDocuments(orgId);
    const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    return docs.filter(d => d.expiresAt && d.expiresAt < threshold && d.expiresAt > new Date().toISOString());
  },
};