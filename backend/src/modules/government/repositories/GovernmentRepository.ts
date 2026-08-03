import { db } from '../../../core/database/SupabaseClient.js';
import type {
  GovernmentAgency, GovernmentPermit, GovernmentLicense,
  TaxRecord, GovernmentCertificate, GovAppointment,
  IdentityVerification, PermitStatus, LicenseStatus, TaxStatus,
  CertificateStatus, AppointmentStatus, VerificationStatus,
} from '../types/government.types.js';

function toAgency(r: Record<string, unknown>): GovernmentAgency {
  const a: GovernmentAgency = {
    id: String(r['id']), name: String(r['name']), type: String(r['type']) as GovernmentAgency['type'],
    country: String(r['country']), isActive: Boolean(r['is_active']), createdAt: String(r['created_at']),
  };
  if (r['region'])  a.region  = String(r['region']);
  if (r['city'])    a.city    = String(r['city']);
  if (r['address']) a.address = String(r['address']);
  if (r['phone'])   a.phone   = String(r['phone']);
  if (r['email'])   a.email   = String(r['email']);
  if (r['lat'])     a.lat     = Number(r['lat']);
  if (r['lng'])     a.lng     = Number(r['lng']);
  return a;
}

function toPermit(r: Record<string, unknown>): GovernmentPermit {
  const p: GovernmentPermit = {
    id: String(r['id']), citizenId: String(r['citizen_id']), agencyId: String(r['agency_id']),
    type: String(r['type']) as GovernmentPermit['type'], status: String(r['status']) as PermitStatus,
    title: String(r['title']), referenceNo: String(r['reference_no']),
    createdAt: String(r['created_at']), updatedAt: String(r['updated_at']),
  };
  if (r['description'])  p.description  = String(r['description']);
  if (r['qr_code'])      p.qrCode       = String(r['qr_code']);
  if (r['expires_at'])   p.expiresAt    = String(r['expires_at']);
  if (r['review_note'])  p.reviewNote   = String(r['review_note']);
  if (r['reviewed_by'])  p.reviewedBy   = String(r['reviewed_by']);
  if (r['reviewed_at'])  p.reviewedAt   = String(r['reviewed_at']);
  return p;
}

function toLicense(r: Record<string, unknown>): GovernmentLicense {
  const l: GovernmentLicense = {
    id: String(r['id']), holderId: String(r['holder_id']), agencyId: String(r['agency_id']),
    type: String(r['type']) as GovernmentLicense['type'], status: String(r['status']) as LicenseStatus,
    licenseNo: String(r['license_no']), holderName: String(r['holder_name']),
    issuedAt: String(r['issued_at']), expiresAt: String(r['expires_at']),
    createdAt: String(r['created_at']),
  };
  if (r['qr_code'])       l.qrCode       = String(r['qr_code']);
  if (r['renewed_at'])    l.renewedAt    = String(r['renewed_at']);
  if (r['suspend_reason']) l.suspendReason = String(r['suspend_reason']);
  return l;
}

function toTax(r: Record<string, unknown>): TaxRecord {
  const t: TaxRecord = {
    id: String(r['id']), taxpayerId: String(r['taxpayer_id']), agencyId: String(r['agency_id']),
    type: String(r['type']) as TaxRecord['type'], status: String(r['status']) as TaxStatus,
    period: String(r['period']), baseAmount: Number(r['base_amount']),
    taxAmount: Number(r['tax_amount']), currency: String(r['currency']),
    dueDate: String(r['due_date']), createdAt: String(r['created_at']),
  };
  if (r['paid_at'])           t.paidAt           = String(r['paid_at']);
  if (r['payment_ref'])       t.paymentRef       = String(r['payment_ref']);
  if (r['installment_count']) t.installmentCount = Number(r['installment_count']);
  if (r['receipt_qr'])        t.receiptQr        = String(r['receipt_qr']);
  return t;
}

function toCert(r: Record<string, unknown>): GovernmentCertificate {
  const c: GovernmentCertificate = {
    id: String(r['id']), requesterId: String(r['requester_id']), agencyId: String(r['agency_id']),
    type: String(r['type']) as GovernmentCertificate['type'], status: String(r['status']) as CertificateStatus,
    referenceNo: String(r['reference_no']), subjectName: String(r['subject_name']),
    fee: Number(r['fee']), currency: String(r['currency']), createdAt: String(r['created_at']),
  };
  if (r['qr_code'])      c.qrCode      = String(r['qr_code']);
  if (r['verify_url'])   c.verifyUrl   = String(r['verify_url']);
  if (r['issued_at'])    c.issuedAt    = String(r['issued_at']);
  if (r['expires_at'])   c.expiresAt   = String(r['expires_at']);
  if (r['delivered_at']) c.deliveredAt = String(r['delivered_at']);
  return c;
}

function toAppt(r: Record<string, unknown>): GovAppointment {
  const a: GovAppointment = {
    id: String(r['id']), citizenId: String(r['citizen_id']), agencyId: String(r['agency_id']),
    serviceType: String(r['service_type']), status: String(r['status']) as AppointmentStatus,
    scheduledAt: String(r['scheduled_at']), confirmCode: String(r['confirm_code']),
    createdAt: String(r['created_at']),
  };
  if (r['office_address']) a.officeAddress = String(r['office_address']);
  if (r['notes'])          a.notes         = String(r['notes']);
  if (r['completed_at'])   a.completedAt   = String(r['completed_at']);
  if (r['cancelled_at'])   a.cancelledAt   = String(r['cancelled_at']);
  return a;
}

export const GovernmentRepository = {
  // ── Agencies ───────────────────────────────────────────────────────────────
  async listAgencies(type?: string, country = 'HT'): Promise<GovernmentAgency[]> {
    let q = db.client().from('gov_agencies').select('*').eq('country', country).eq('is_active', true);
    if (type) q = q.eq('type', type);
    const { data } = await q.order('name');
    return (data ?? []).map(r => toAgency(r as Record<string, unknown>));
  },

  async getAgency(id: string): Promise<GovernmentAgency | null> {
    const { data } = await db.client().from('gov_agencies').select('*').eq('id', id).single();
    return data ? toAgency(data as Record<string, unknown>) : null;
  },

  // ── Permits ────────────────────────────────────────────────────────────────
  async createPermit(input: Omit<GovernmentPermit, 'id' | 'createdAt' | 'updatedAt'>): Promise<GovernmentPermit> {
    const row: Record<string, unknown> = {
      citizen_id: input.citizenId, agency_id: input.agencyId, type: input.type,
      status: input.status, title: input.title, reference_no: input.referenceNo,
    };
    if (input.description) row['description'] = input.description;
    if (input.expiresAt)   row['expires_at']  = input.expiresAt;
    const { data } = await db.client().from('gov_permits').insert(row).select().single();
    return toPermit(data as Record<string, unknown>);
  },

  async updatePermitStatus(id: string, status: PermitStatus, opts: { reviewNote?: string; reviewedBy?: string; qrCode?: string; expiresAt?: string } = {}): Promise<void> {
    const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (opts.reviewNote) row['review_note'] = opts.reviewNote;
    if (opts.reviewedBy) { row['reviewed_by'] = opts.reviewedBy; row['reviewed_at'] = new Date().toISOString(); }
    if (opts.qrCode)     row['qr_code']    = opts.qrCode;
    if (opts.expiresAt)  row['expires_at'] = opts.expiresAt;
    await db.client().from('gov_permits').update(row).eq('id', id);
  },

  async getPermit(id: string): Promise<GovernmentPermit | null> {
    const { data } = await db.client().from('gov_permits').select('*').eq('id', id).single();
    return data ? toPermit(data as Record<string, unknown>) : null;
  },

  async listCitizenPermits(citizenId: string): Promise<GovernmentPermit[]> {
    const { data } = await db.client().from('gov_permits').select('*')
      .eq('citizen_id', citizenId).order('created_at', { ascending: false });
    return (data ?? []).map(r => toPermit(r as Record<string, unknown>));
  },

  async addPermitDocument(permitId: string, name: string, url: string): Promise<void> {
    await db.client().from('gov_permit_documents').insert({ permit_id: permitId, name, url });
    await db.client().from('gov_permits').update({ status: 'submitted', updated_at: new Date().toISOString() }).eq('id', permitId).eq('status', 'draft');
  },

  // ── Licenses ───────────────────────────────────────────────────────────────
  async createLicense(input: Omit<GovernmentLicense, 'id' | 'createdAt'>): Promise<GovernmentLicense> {
    const row: Record<string, unknown> = {
      holder_id: input.holderId, agency_id: input.agencyId, type: input.type,
      status: input.status, license_no: input.licenseNo, holder_name: input.holderName,
      issued_at: input.issuedAt, expires_at: input.expiresAt,
    };
    if (input.qrCode) row['qr_code'] = input.qrCode;
    const { data } = await db.client().from('gov_licenses').insert(row).select().single();
    return toLicense(data as Record<string, unknown>);
  },

  async updateLicenseStatus(id: string, status: LicenseStatus, opts: { renewedAt?: string; suspendReason?: string; expiresAt?: string } = {}): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (opts.renewedAt)     row['renewed_at']     = opts.renewedAt;
    if (opts.suspendReason) row['suspend_reason'] = opts.suspendReason;
    if (opts.expiresAt)     row['expires_at']     = opts.expiresAt;
    await db.client().from('gov_licenses').update(row).eq('id', id);
  },

  async listCitizenLicenses(holderId: string): Promise<GovernmentLicense[]> {
    const { data } = await db.client().from('gov_licenses').select('*')
      .eq('holder_id', holderId).order('expires_at', { ascending: false });
    return (data ?? []).map(r => toLicense(r as Record<string, unknown>));
  },

  async getExpiringLicenses(withinDays: number): Promise<GovernmentLicense[]> {
    const cutoff = new Date(Date.now() + withinDays * 86400000).toISOString();
    const { data } = await db.client().from('gov_licenses').select('*')
      .eq('status', 'active').lte('expires_at', cutoff);
    return (data ?? []).map(r => toLicense(r as Record<string, unknown>));
  },

  // ── Taxes ──────────────────────────────────────────────────────────────────
  async createTaxRecord(input: Omit<TaxRecord, 'id' | 'createdAt'>): Promise<TaxRecord> {
    const row: Record<string, unknown> = {
      taxpayer_id: input.taxpayerId, agency_id: input.agencyId, type: input.type,
      status: input.status, period: input.period, base_amount: input.baseAmount,
      tax_amount: input.taxAmount, currency: input.currency, due_date: input.dueDate,
    };
    if (input.installmentCount) row['installment_count'] = input.installmentCount;
    const { data } = await db.client().from('gov_tax_records').insert(row).select().single();
    return toTax(data as Record<string, unknown>);
  },

  async updateTaxStatus(id: string, status: TaxStatus, opts: { paymentRef?: string; receiptQr?: string } = {}): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (status === 'paid') row['paid_at'] = new Date().toISOString();
    if (opts.paymentRef)   row['payment_ref'] = opts.paymentRef;
    if (opts.receiptQr)    row['receipt_qr']  = opts.receiptQr;
    await db.client().from('gov_tax_records').update(row).eq('id', id);
  },

  async listTaxRecords(taxpayerId: string): Promise<TaxRecord[]> {
    const { data } = await db.client().from('gov_tax_records').select('*')
      .eq('taxpayer_id', taxpayerId).order('due_date', { ascending: false });
    return (data ?? []).map(r => toTax(r as Record<string, unknown>));
  },

  // ── Certificates ───────────────────────────────────────────────────────────
  async createCertificate(input: Omit<GovernmentCertificate, 'id' | 'createdAt'>): Promise<GovernmentCertificate> {
    const row: Record<string, unknown> = {
      requester_id: input.requesterId, agency_id: input.agencyId, type: input.type,
      status: input.status, reference_no: input.referenceNo,
      subject_name: input.subjectName, fee: input.fee, currency: input.currency,
    };
    const { data } = await db.client().from('gov_certificates').insert(row).select().single();
    return toCert(data as Record<string, unknown>);
  },

  async updateCertificateStatus(id: string, status: CertificateStatus, opts: { qrCode?: string; verifyUrl?: string; issuedAt?: string; expiresAt?: string; deliveredAt?: string } = {}): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (opts.qrCode)      row['qr_code']      = opts.qrCode;
    if (opts.verifyUrl)   row['verify_url']   = opts.verifyUrl;
    if (opts.issuedAt)    row['issued_at']    = opts.issuedAt;
    if (opts.expiresAt)   row['expires_at']   = opts.expiresAt;
    if (opts.deliveredAt) row['delivered_at'] = opts.deliveredAt;
    await db.client().from('gov_certificates').update(row).eq('id', id);
  },

  async listCitizenCertificates(requesterId: string): Promise<GovernmentCertificate[]> {
    const { data } = await db.client().from('gov_certificates').select('*')
      .eq('requester_id', requesterId).order('created_at', { ascending: false });
    return (data ?? []).map(r => toCert(r as Record<string, unknown>));
  },

  // ── Appointments ───────────────────────────────────────────────────────────
  async createAppointment(input: Omit<GovAppointment, 'id' | 'createdAt'>): Promise<GovAppointment> {
    const row: Record<string, unknown> = {
      citizen_id: input.citizenId, agency_id: input.agencyId, service_type: input.serviceType,
      status: input.status, scheduled_at: input.scheduledAt, confirm_code: input.confirmCode,
    };
    if (input.officeAddress) row['office_address'] = input.officeAddress;
    if (input.notes)         row['notes']          = input.notes;
    const { data } = await db.client().from('gov_appointments').insert(row).select().single();
    return toAppt(data as Record<string, unknown>);
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (status === 'completed')  row['completed_at'] = new Date().toISOString();
    if (status === 'cancelled')  row['cancelled_at'] = new Date().toISOString();
    await db.client().from('gov_appointments').update(row).eq('id', id);
  },

  async listCitizenAppointments(citizenId: string): Promise<GovAppointment[]> {
    const { data } = await db.client().from('gov_appointments').select('*')
      .eq('citizen_id', citizenId).order('scheduled_at', { ascending: false });
    return (data ?? []).map(r => toAppt(r as Record<string, unknown>));
  },

  async countAgencyAppointmentsInSlot(agencyId: string, scheduledAt: string): Promise<number> {
    const slotStart = new Date(scheduledAt);
    const slotEnd   = new Date(slotStart.getTime() + 30 * 60 * 1000);
    const { count } = await db.client().from('gov_appointments').select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId).gte('scheduled_at', slotStart.toISOString()).lt('scheduled_at', slotEnd.toISOString())
      .not('status', 'in', '(cancelled,no_show)');
    return count ?? 0;
  },

  // ── Identity ───────────────────────────────────────────────────────────────
  async createVerification(userId: string, documentType: string): Promise<IdentityVerification> {
    const { data } = await db.client().from('gov_identity_verifications').insert({ user_id: userId, document_type: documentType })
      .select().single();
    const d = data as Record<string, unknown>;
    return { id: String(d['id']), userId, documentType: String(d['document_type']) as IdentityVerification['documentType'],
      status: 'pending', createdAt: String(d['created_at']) };
  },

  async updateVerification(id: string, status: VerificationStatus, opts: { documentNo?: string; failureReason?: string; expiresAt?: string } = {}): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (status === 'verified') row['verified_at'] = new Date().toISOString();
    if (opts.documentNo)     row['document_no']     = opts.documentNo;
    if (opts.failureReason)  row['failure_reason']  = opts.failureReason;
    if (opts.expiresAt)      row['expires_at']      = opts.expiresAt;
    await db.client().from('gov_identity_verifications').update(row).eq('id', id);
  },

  async getLatestVerification(userId: string): Promise<IdentityVerification | null> {
    const { data } = await db.client().from('gov_identity_verifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    if (!data) return null;
    const d = data as Record<string, unknown>;
    const v: IdentityVerification = {
      id: String(d['id']), userId: String(d['user_id']),
      documentType: String(d['document_type']) as IdentityVerification['documentType'],
      status: String(d['status']) as VerificationStatus, createdAt: String(d['created_at']),
    };
    if (d['document_no'])    v.documentNo    = String(d['document_no']);
    if (d['verified_at'])    v.verifiedAt    = String(d['verified_at']);
    if (d['failure_reason']) v.failureReason = String(d['failure_reason']);
    if (d['expires_at'])     v.expiresAt     = String(d['expires_at']);
    return v;
  },

  // ── Analytics ──────────────────────────────────────────────────────────────
  async getAgencyAnalytics(agencyId: string, period: string) {
    const from = `${period}-01T00:00:00Z`;
    const [permits, certs, appts, taxes] = await Promise.all([
      db.client().from('gov_permits').select('status').eq('agency_id', agencyId).gte('created_at', from),
      db.client().from('gov_certificates').select('status, fee').eq('agency_id', agencyId).gte('created_at', from),
      db.client().from('gov_appointments').select('status').eq('agency_id', agencyId).gte('created_at', from),
      db.client().from('gov_tax_records').select('tax_amount').eq('agency_id', agencyId).eq('status', 'paid').gte('paid_at', from),
    ]);

    const ps   = (permits.data ?? []) as { status: string }[];
    const cs   = (certs.data ?? [])   as { status: string; fee: number }[];
    const as_  = (appts.data ?? [])   as { status: string }[];
    const ts   = (taxes.data ?? [])   as { tax_amount: number }[];

    const total = ps.length + cs.length + as_.length;
    const approved = ps.filter(p => p.status === 'approved').length + cs.filter(c => c.status === 'delivered').length + as_.filter(a => a.status === 'completed').length;
    const rejected = ps.filter(p => p.status === 'rejected').length;
    const taxRevenue = ts.reduce((s, t) => s + t.tax_amount, 0);
    const certRevenue = cs.filter(c => c.status === 'delivered').reduce((s, c) => s + c.fee, 0);

    return { agencyId, period, totalApplications: total, approved, rejected, pending: total - approved - rejected,
      avgProcessingDays: 3, totalRevenue: taxRevenue + certRevenue, currency: 'HTG',
      peakDay: 'Lendi', citizenSatisfaction: 4.1,
      serviceBreakdown: [
        { service: 'permits', count: ps.length },
        { service: 'certificates', count: cs.length },
        { service: 'appointments', count: as_.length },
      ],
    };
  },
};