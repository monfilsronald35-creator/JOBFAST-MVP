import type { Request, Response } from 'express';
import { GovernmentRepository }         from '../repositories/GovernmentRepository.js';
import { PermitService }                from '../services/PermitService.js';
import { LicenseService }               from '../services/LicenseService.js';
import { TaxService }                   from '../services/TaxService.js';
import { CertificateService }           from '../services/CertificateService.js';
import { AppointmentEngine }            from '../services/AppointmentEngine.js';
import { IdentityVerificationService }  from '../services/IdentityVerificationService.js';
import { GovAIAssistant }               from '../services/GovAIAssistant.js';
import type { PermitType, LicenseType, TaxType, CertificateType, IdDocumentType } from '../types/government.types.js';

function uid(req: Request): string { return (req as unknown as { user?: { sub?: string } }).user?.sub ?? ''; }
function b(req: Request): Record<string, unknown> { return req.body as Record<string, unknown>; }
function q(req: Request): Record<string, unknown> { return req.query as Record<string, unknown>; }
function pid(req: Request): string { return String(req.params['id'] ?? ''); }

export const GovernmentController = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getCitizenDashboard(req: Request, res: Response): Promise<void> {
    const citizenId = uid(req);
    const [permits, licenses, taxes, certs, appts, identity] = await Promise.all([
      PermitService.listCitizenPermits(citizenId),
      LicenseService.listCitizenLicenses(citizenId),
      TaxService.listTaxRecords(citizenId),
      CertificateService.listCitizenCertificates(citizenId),
      AppointmentEngine.listCitizenAppointments(citizenId),
      IdentityVerificationService.getStatus(citizenId),
    ]);
    const pendingPayments = taxes.filter(t => t.status === 'declared' || t.status === 'overdue').length +
      certs.filter(c => c.status === 'pending').length;
    res.json({ success: true, data: {
      citizenId, permits, licenses, taxes, certificates: certs, appointments: appts,
      identityStatus: identity?.status ?? 'not_started',
      pendingPayments, notifications: [],
    }});
  },

  // ── Agencies ──────────────────────────────────────────────────────────────
  async listAgencies(req: Request, res: Response): Promise<void> {
    const type    = q(req)['type']    ? String(q(req)['type'])    : undefined;
    const country = q(req)['country'] ? String(q(req)['country']) : 'HT';
    const agencies = await GovernmentRepository.listAgencies(type, country);
    res.json({ success: true, data: agencies });
  },

  // ── Permits ───────────────────────────────────────────────────────────────
  async applyPermit(req: Request, res: Response): Promise<void> {
    const { agencyId, type, title, description } = b(req);
    if (!agencyId || !type || !title) { res.status(400).json({ error: 'agencyId, type, title obligatwa' }); return; }
    const permit = await PermitService.apply(uid(req), String(agencyId), String(type) as PermitType, String(title), description ? String(description) : undefined);
    res.status(201).json({ success: true, data: permit });
  },

  async uploadPermitDocument(req: Request, res: Response): Promise<void> {
    const { docName, docUrl } = b(req);
    if (!docName || !docUrl) { res.status(400).json({ error: 'docName, docUrl obligatwa' }); return; }
    await PermitService.submitDocument(pid(req), uid(req), String(docName), String(docUrl));
    res.json({ success: true, message: 'Dokiman soumèt. Pèmi an pase nan estati "submitted".' });
  },

  async reviewPermit(req: Request, res: Response): Promise<void> {
    const { decision, note } = b(req);
    if (decision !== 'approved' && decision !== 'rejected') { res.status(400).json({ error: 'decision dwe "approved" oswa "rejected"' }); return; }
    await PermitService.reviewPermit(pid(req), uid(req), decision as 'approved' | 'rejected', note ? String(note) : undefined);
    res.json({ success: true });
  },

  async listMyPermits(req: Request, res: Response): Promise<void> {
    const permits = await PermitService.listCitizenPermits(uid(req));
    res.json({ success: true, data: permits });
  },

  // ── Licenses ──────────────────────────────────────────────────────────────
  async issueLicense(req: Request, res: Response): Promise<void> {
    const { holderId, agencyId, type, holderName } = b(req);
    if (!holderId || !agencyId || !type || !holderName) { res.status(400).json({ error: 'holderId, agencyId, type, holderName obligatwa' }); return; }
    const license = await LicenseService.issueLicense(String(holderId), String(agencyId), String(type) as LicenseType, String(holderName));
    res.status(201).json({ success: true, data: license });
  },

  async renewLicense(req: Request, res: Response): Promise<void> {
    await LicenseService.renewLicense(pid(req), uid(req));
    res.json({ success: true, message: 'Lisans renouvle.' });
  },

  async suspendLicense(req: Request, res: Response): Promise<void> {
    const { reason } = b(req);
    if (!reason) { res.status(400).json({ error: 'reason obligatwa' }); return; }
    await LicenseService.suspendLicense(pid(req), uid(req), String(reason));
    res.json({ success: true, message: 'Lisans sispan.' });
  },

  async listMyLicenses(req: Request, res: Response): Promise<void> {
    const licenses = await LicenseService.listCitizenLicenses(uid(req));
    res.json({ success: true, data: licenses });
  },

  // ── Taxes ─────────────────────────────────────────────────────────────────
  async declareTax(req: Request, res: Response): Promise<void> {
    const { agencyId, type, period, baseAmount, installments } = b(req);
    if (!agencyId || !type || !period || !baseAmount) { res.status(400).json({ error: 'agencyId, type, period, baseAmount obligatwa' }); return; }
    const record = await TaxService.declareTax(uid(req), String(agencyId), String(type) as TaxType, String(period), Number(baseAmount), installments ? Number(installments) : 1);
    res.status(201).json({ success: true, data: record });
  },

  async payTax(req: Request, res: Response): Promise<void> {
    const { paymentRef } = b(req);
    if (!paymentRef) { res.status(400).json({ error: 'paymentRef obligatwa' }); return; }
    await TaxService.payTax(pid(req), uid(req), String(paymentRef));
    res.json({ success: true, message: 'Taks peye. Resi QR disponib.' });
  },

  async listMyTaxes(req: Request, res: Response): Promise<void> {
    const taxes = await TaxService.listTaxRecords(uid(req));
    res.json({ success: true, data: taxes });
  },

  async getTaxRates(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: TaxService.getTaxRates() });
  },

  // ── Certificates ──────────────────────────────────────────────────────────
  async requestCertificate(req: Request, res: Response): Promise<void> {
    const { agencyId, type, subjectName } = b(req);
    if (!agencyId || !type || !subjectName) { res.status(400).json({ error: 'agencyId, type, subjectName obligatwa' }); return; }
    const cert = await CertificateService.request(uid(req), String(agencyId), String(type) as CertificateType, String(subjectName));
    res.status(201).json({ success: true, data: cert });
  },

  async issueCertificate(req: Request, res: Response): Promise<void> {
    await CertificateService.issue(pid(req), uid(req));
    res.json({ success: true, message: 'Sètifika prèt. QR jenere.' });
  },

  async deliverCertificate(req: Request, res: Response): Promise<void> {
    await CertificateService.deliver(pid(req));
    res.json({ success: true, message: 'Sètifika delivre.' });
  },

  async listMyCertificates(req: Request, res: Response): Promise<void> {
    const certs = await CertificateService.listCitizenCertificates(uid(req));
    res.json({ success: true, data: certs });
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  async bookAppointment(req: Request, res: Response): Promise<void> {
    const { agencyId, serviceType, scheduledAt, officeAddress, notes } = b(req);
    if (!agencyId || !serviceType || !scheduledAt) { res.status(400).json({ error: 'agencyId, serviceType, scheduledAt obligatwa' }); return; }
    try {
      const appt = await AppointmentEngine.book(uid(req), String(agencyId), String(serviceType), String(scheduledAt), officeAddress ? String(officeAddress) : undefined, notes ? String(notes) : undefined);
      res.status(201).json({ success: true, data: appt });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'SLOT_FULL') { res.status(409).json({ code: 'SLOT_FULL', message: e.message }); return; }
      throw err;
    }
  },

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    await AppointmentEngine.cancel(pid(req), uid(req));
    res.json({ success: true, message: 'Randevou anile.' });
  },

  async listMyAppointments(req: Request, res: Response): Promise<void> {
    const appts = await AppointmentEngine.listCitizenAppointments(uid(req));
    res.json({ success: true, data: appts });
  },

  // ── Identity ──────────────────────────────────────────────────────────────
  async startIdentityVerification(req: Request, res: Response): Promise<void> {
    const { documentType } = b(req);
    if (!documentType) { res.status(400).json({ error: 'documentType obligatwa' }); return; }
    const record = await IdentityVerificationService.startVerification(uid(req), String(documentType) as IdDocumentType);
    res.status(201).json({ success: true, data: record });
  },

  async verifyDocument(req: Request, res: Response): Promise<void> {
    const { documentNo } = b(req);
    if (!documentNo) { res.status(400).json({ error: 'documentNo obligatwa' }); return; }
    await IdentityVerificationService.verifyDocument(pid(req), String(documentNo));
    res.json({ success: true, message: 'Verifikasyon trete.' });
  },

  async getIdentityStatus(req: Request, res: Response): Promise<void> {
    const status = await IdentityVerificationService.getStatus(uid(req));
    res.json({ success: true, data: status ?? { status: 'not_started' } });
  },

  // ── AI Assistant ──────────────────────────────────────────────────────────
  async aiQuery(req: Request, res: Response): Promise<void> {
    const { question } = b(req);
    if (!question) { res.status(400).json({ error: 'question obligatwa' }); return; }
    const result = GovAIAssistant.query(String(question));
    res.json({ success: true, data: result });
  },

  async validateForm(req: Request, res: Response): Promise<void> {
    const { formType, fields } = b(req);
    let result: unknown;
    if (formType === 'permit')    result = GovAIAssistant.validatePermitForm(fields as Record<string, unknown>);
    else if (formType === 'tax')  result = GovAIAssistant.validateTaxDeclaration(fields as Record<string, unknown>);
    else                           result = { valid: false, errors: ['formType pa rekonèt'] };
    res.json({ success: true, data: result });
  },

  // ── Analytics (admin) ─────────────────────────────────────────────────────
  async getAgencyAnalytics(req: Request, res: Response): Promise<void> {
    const agencyId = String(req.params['agencyId'] ?? '');
    const period   = q(req)['period'] ? String(q(req)['period']) : new Date().toISOString().slice(0, 7);
    const stats    = await GovernmentRepository.getAgencyAnalytics(agencyId, period);
    res.json({ success: true, data: stats });
  },
};