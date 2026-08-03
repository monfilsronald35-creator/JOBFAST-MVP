import type { Request, Response } from 'express';
import { AuditEngine }             from '../services/AuditEngine.js';
import { FraudEngine }             from '../services/FraudEngine.js';
import { DeviceIntelligence }      from '../services/DeviceIntelligence.js';
import { ThreatDetectionService }  from '../services/ThreatDetectionService.js';
import { IncidentResponseService } from '../services/IncidentResponseService.js';
import { SecurityMonitor }         from '../services/SecurityMonitor.js';
import { ComplianceEngine }        from '../services/ComplianceEngine.js';
import type { IncidentSeverity, IncidentStatus, AuditResult, IncidentType } from '../types/security.types.js';
import type { ConsentType }        from '../services/ComplianceEngine.js';

function uid(req: Request): string { return (req as unknown as { user?: { sub?: string } }).user?.sub ?? ''; }
function b(req: Request): Record<string, unknown> { return req.body as Record<string, unknown>; }
function q(req: Request): Record<string, unknown> { return req.query as Record<string, unknown>; }

export const SecurityController = {
  // ── Stats ──────────────────────────────────────────────────────────────────
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await SecurityMonitor.getStats();
    res.json({ success: true, data: stats });
  },

  // ── Audit log ──────────────────────────────────────────────────────────────
  async searchAuditLog(req: Request, res: Response): Promise<void> {
    const qp = q(req);
    const logs = await AuditEngine.search({
      userId:   qp['userId']   ? String(qp['userId'])   : undefined,
      action:   qp['action']   ? String(qp['action'])   : undefined,
      ip:       qp['ip']       ? String(qp['ip'])       : undefined,
      result:   qp['result']   ? String(qp['result']) as AuditResult : undefined,
      fromDate: qp['from']     ? String(qp['from'])     : undefined,
      toDate:   qp['to']       ? String(qp['to'])       : undefined,
      minRisk:  qp['minRisk']  ? Number(qp['minRisk'])  : undefined,
      page:     qp['page']     ? Number(qp['page'])     : 1,
      limit:    qp['limit']    ? Number(qp['limit'])    : 50,
    });
    res.json({ success: true, data: logs });
  },

  // ── Fraud ─────────────────────────────────────────────────────────────────
  async getUserRiskScore(req: Request, res: Response): Promise<void> {
    const targetId = String(req.params['userId'] ?? uid(req));
    const result   = await FraudEngine.scoreUser(targetId);
    res.json({ success: true, data: result });
  },

  // ── Devices ───────────────────────────────────────────────────────────────
  async listMyDevices(req: Request, res: Response): Promise<void> {
    const devices = await DeviceIntelligence.listUserDevices(uid(req));
    res.json({ success: true, data: devices });
  },

  async trustDevice(req: Request, res: Response): Promise<void> {
    const { fingerprint } = b(req);
    if (!fingerprint) { res.status(400).json({ error: 'fingerprint obligatwa' }); return; }
    await DeviceIntelligence.trustDevice(uid(req), String(fingerprint));
    res.json({ success: true, message: 'Aparèy ou fye kounye a.' });
  },

  async revokeDevice(req: Request, res: Response): Promise<void> {
    const { fingerprint } = b(req);
    if (!fingerprint) { res.status(400).json({ error: 'fingerprint obligatwa' }); return; }
    await DeviceIntelligence.revokeDevice(uid(req), String(fingerprint));
    res.json({ success: true, message: 'Aparèy revokey.' });
  },

  // ── Incidents ─────────────────────────────────────────────────────────────
  async listIncidents(req: Request, res: Response): Promise<void> {
    const qp     = q(req);
    const status   = qp['status']   ? String(qp['status'])   as IncidentStatus   : undefined;
    const severity = qp['severity'] ? String(qp['severity']) as IncidentSeverity : undefined;
    const page     = qp['page']     ? Number(qp['page'])     : 1;
    const incidents = await IncidentResponseService.list(status, severity, page);
    res.json({ success: true, data: incidents });
  },

  async createIncident(req: Request, res: Response): Promise<void> {
    const { type, severity, description, ip, userId } = b(req);
    if (!type || !severity || !description) { res.status(400).json({ error: 'type, severity, description obligatwa' }); return; }
    const inc = await IncidentResponseService.create(
      String(type) as IncidentType, String(severity) as IncidentSeverity,
      String(description), ip ? String(ip) : undefined, userId ? String(userId) : undefined,
    );
    res.status(201).json({ success: true, data: inc });
  },

  async resolveIncident(req: Request, res: Response): Promise<void> {
    const { resolution } = b(req);
    if (!resolution) { res.status(400).json({ error: 'resolution obligatwa' }); return; }
    await IncidentResponseService.resolve(String(req.params['id'] ?? ''), uid(req), String(resolution));
    res.json({ success: true });
  },

  async assignIncident(req: Request, res: Response): Promise<void> {
    const { assignedTo } = b(req);
    if (!assignedTo) { res.status(400).json({ error: 'assignedTo obligatwa' }); return; }
    await IncidentResponseService.assign(String(req.params['id'] ?? ''), String(assignedTo));
    res.json({ success: true });
  },

  async falsePositive(req: Request, res: Response): Promise<void> {
    await IncidentResponseService.markFalsePositive(String(req.params['id'] ?? ''), uid(req));
    res.json({ success: true });
  },

  // ── Blocked entities ──────────────────────────────────────────────────────
  async listBlocked(req: Request, res: Response): Promise<void> {
    const type   = q(req)['type'] ? String(q(req)['type']) : undefined;
    const list   = await SecurityMonitor.listBlockedEntities(type);
    res.json({ success: true, data: list });
  },

  async blockEntity(req: Request, res: Response): Promise<void> {
    const { type, value, reason, blockedUntil } = b(req);
    if (!type || !value || !reason) { res.status(400).json({ error: 'type, value, reason obligatwa' }); return; }
    await SecurityMonitor.blockEntity(String(type) as 'ip' | 'device' | 'user', String(value), String(reason), uid(req), blockedUntil ? String(blockedUntil) : undefined);
    res.status(201).json({ success: true });
  },

  async unblockEntity(req: Request, res: Response): Promise<void> {
    const { type, value } = b(req);
    if (!type || !value) { res.status(400).json({ error: 'type, value obligatwa' }); return; }
    await SecurityMonitor.unblockEntity(String(type), String(value));
    res.json({ success: true });
  },

  // ── Threats ───────────────────────────────────────────────────────────────
  async getThreats(req: Request, res: Response): Promise<void> {
    const hours   = q(req)['hours'] ? Number(q(req)['hours']) : 24;
    const threats = await ThreatDetectionService.getRecentThreats(hours);
    res.json({ success: true, data: threats });
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  async getConsent(req: Request, res: Response): Promise<void> {
    const record = await ComplianceEngine.getConsentRecord(uid(req));
    res.json({ success: true, data: record });
  },

  async grantConsent(req: Request, res: Response): Promise<void> {
    const { consentType } = b(req);
    if (!consentType) { res.status(400).json({ error: 'consentType obligatwa' }); return; }
    const ip = req.secCtx?.ip ?? req.ip ?? '';
    const ua = req.headers['user-agent'] ?? '';
    await ComplianceEngine.grantConsent(uid(req), String(consentType) as ConsentType, ip, ua);
    res.json({ success: true });
  },

  async revokeConsent(req: Request, res: Response): Promise<void> {
    const { consentType } = b(req);
    if (!consentType) { res.status(400).json({ error: 'consentType obligatwa' }); return; }
    await ComplianceEngine.revokeConsent(uid(req), String(consentType) as ConsentType);
    res.json({ success: true });
  },

  async requestErasure(req: Request, res: Response): Promise<void> {
    const result = await ComplianceEngine.requestErasure(uid(req));
    res.json({ success: true, data: result, message: 'Demann efasaj planifye. Ou pral resevwa yon konfirmasyon nan 30 jou.' });
  },

  async getRetentionPolicy(_req: Request, res: Response): Promise<void> {
    const categories = ['audit_log', 'chat_messages', 'analytics_events', 'medical_records', 'government_docs', 'payment_records', 'session_data', 'device_data'];
    const policies   = Object.fromEntries(categories.map(c => [c, ComplianceEngine.getRetentionPolicy(c)]));
    res.json({ success: true, data: policies });
  },
};