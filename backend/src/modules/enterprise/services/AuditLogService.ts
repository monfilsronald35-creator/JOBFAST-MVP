import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import type { AuditLog }        from '../types/enterprise.types.js';

type AuditInput = Omit<AuditLog, 'id' | 'createdAt'>;

export const AuditLogService = {
  async log(input: AuditInput): Promise<void> {
    try {
      await EnterpriseRepository.writeAuditLog(input);
    } catch { /* audit must never break the main flow */ }
  },

  async list(orgId: string, limit = 100, offset = 0): Promise<AuditLog[]> {
    return EnterpriseRepository.listAuditLogs(orgId, limit, offset);
  },

  fromRequest(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): Pick<AuditLog, 'ip' | 'device'> {
    const result: Pick<AuditLog, 'ip' | 'device'> = {};
    const rawIp = req.headers['x-forwarded-for'] ?? req.ip ?? '';
    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    if (ip) result.ip = String(ip).split(',')[0]?.trim() ?? '';
    const ua = req.headers['user-agent'];
    if (ua) result.device = String(Array.isArray(ua) ? ua[0] : ua).slice(0, 200);
    return result;
  },
};