import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { GovernmentLicense, LicenseType } from '../types/government.types.js';

// License QR: JOBFAST-LIC:{licId8}-{holderId6}-{ts36}
function licenseQR(licId: string, holderId: string): string {
  return `JOBFAST-LIC:${licId.replace(/-/g, '').slice(0, 8)}-${holderId.replace(/-/g, '').slice(0, 6)}-${Date.now().toString(36)}`;
}

function licenseNo(type: LicenseType): string {
  return `LIC-${type.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;
}

// Validity in days per license type
const LICENSE_VALIDITY: Record<LicenseType, number> = {
  business: 365, professional: 365, construction: 365,
  taxi: 365, restaurant: 365, hotel: 365, healthcare: 365,
};

export const LicenseService = {
  async issueLicense(holderId: string, agencyId: string, type: LicenseType, holderName: string): Promise<GovernmentLicense> {
    const licNo     = licenseNo(type);
    const issuedAt  = new Date().toISOString();
    const expiresAt = new Date(Date.now() + LICENSE_VALIDITY[type] * 86400000).toISOString();
    const license   = await GovernmentRepository.createLicense({
      holderId, agencyId, type, status: 'active', licenseNo: licNo,
      holderName, issuedAt, expiresAt,
    });
    // Generate QR after creation
    const qrCode = licenseQR(license.id, holderId);
    await GovernmentRepository.updateLicenseStatus(license.id, 'active', {});
    TypedEventBus.publish({ eventName: 'gov.license.issued', payload: { licenseId: license.id, holderId, type } });
    return { ...license, qrCode };
  },

  async renewLicense(licenseId: string, holderId: string): Promise<void> {
    const licenses = await GovernmentRepository.listCitizenLicenses(holderId);
    const lic = licenses.find(l => l.id === licenseId);
    if (!lic) throw new Error('Lisans pa jwenn');
    const renewedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + LICENSE_VALIDITY[lic.type] * 86400000).toISOString();
    await GovernmentRepository.updateLicenseStatus(licenseId, 'active', { renewedAt, expiresAt });
    TypedEventBus.publish({ eventName: 'gov.license.renewed', payload: { licenseId, holderId } });
  },

  async suspendLicense(licenseId: string, adminId: string, reason: string): Promise<void> {
    await GovernmentRepository.updateLicenseStatus(licenseId, 'suspended', { suspendReason: reason });
    TypedEventBus.publish({ eventName: 'gov.license.suspended', payload: { licenseId, adminId, reason } });
  },

  async getExpiringLicenses(withinDays = 30): Promise<GovernmentLicense[]> {
    return GovernmentRepository.getExpiringLicenses(withinDays);
  },

  async listCitizenLicenses(holderId: string): Promise<GovernmentLicense[]> {
    return GovernmentRepository.listCitizenLicenses(holderId);
  },
};