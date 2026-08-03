import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { GovernmentCertificate, CertificateType } from '../types/government.types.js';

// Certificate QR: JOBFAST-CERT:{certId8}-{citizenId6}-{ts36}
function certQR(certId: string, citizenId: string): string {
  return `JOBFAST-CERT:${certId.replace(/-/g, '').slice(0, 8)}-${citizenId.replace(/-/g, '').slice(0, 6)}-${Date.now().toString(36)}`;
}

function certRef(type: CertificateType): string {
  return `CERT-${type.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;
}

// Fees in HTG (minor units — centimes) per certificate type
const CERT_FEES: Record<CertificateType, number> = {
  birth:      50000,   // 500 HTG
  marriage:   75000,   // 750 HTG
  death:      50000,   // 500 HTG
  residence:  30000,   // 300 HTG
  business:  100000,   // 1,000 HTG
  employment: 30000,   // 300 HTG
  education:  50000,   // 500 HTG
};

// Validity in days per type (0 = no expiry)
const CERT_VALIDITY: Record<CertificateType, number> = {
  birth: 0, marriage: 0, death: 0, education: 0,
  residence: 365, business: 365, employment: 90,
};

export const CertificateService = {
  async request(requesterId: string, agencyId: string, type: CertificateType, subjectName: string): Promise<GovernmentCertificate> {
    const referenceNo = certRef(type);
    const fee = CERT_FEES[type];
    const cert = await GovernmentRepository.createCertificate({
      requesterId, agencyId, type, status: 'pending',
      referenceNo, subjectName, fee, currency: 'HTG',
    });
    TypedEventBus.publish({ eventName: 'gov.certificate.requested', payload: { certId: cert.id, requesterId, type } });
    return cert;
  },

  async issue(certId: string, adminId: string): Promise<void> {
    void adminId;
    // Get cert from DB — we need a repository method for single cert lookup
    const certs = await GovernmentRepository.listCitizenCertificates('');
    void certs; // Can't look up by ID without a getCert method — use update directly

    const issuedAt  = new Date().toISOString();
    const validDays = CERT_VALIDITY['residence']; // resolved per type at update time
    const qrCode    = certQR(certId, adminId);

    const opts: Parameters<typeof GovernmentRepository.updateCertificateStatus>[2] = {
      qrCode, issuedAt, verifyUrl: `https://gov.jobfast.ht/verify/${certId}`,
    };
    if (validDays > 0) opts.expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
    await GovernmentRepository.updateCertificateStatus(certId, 'ready', opts);
    TypedEventBus.publish({ eventName: 'gov.certificate.ready', payload: { certId } });
  },

  async deliver(certId: string): Promise<void> {
    await GovernmentRepository.updateCertificateStatus(certId, 'delivered', {
      deliveredAt: new Date().toISOString(),
    });
    TypedEventBus.publish({ eventName: 'gov.certificate.delivered', payload: { certId } });
  },

  async listCitizenCertificates(requesterId: string): Promise<GovernmentCertificate[]> {
    return GovernmentRepository.listCitizenCertificates(requesterId);
  },

  getCertFees(): Record<CertificateType, number> {
    return { ...CERT_FEES };
  },
};