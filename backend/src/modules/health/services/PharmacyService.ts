import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import { PrescriptionEngine }   from './PrescriptionEngine.js';
import type { PharmacyOrder } from '../types/healthcare.types.js';

export const PharmacyService = {
  async receiveOrder(input: {
    prescriptionId: string; pharmacyId: string; patientId: string;
    deliveryType?: 'pickup' | 'delivery'; deliveryAddress?: string;
    totalAmount?: number; currency?: string;
  }): Promise<PharmacyOrder> {
    const rx = await PrescriptionEngine.get(input.prescriptionId);
    if (!rx) throw new Error('PRESCRIPTION_NOT_FOUND');
    if (rx.status !== 'active') throw new Error('PRESCRIPTION_NOT_ACTIVE');

    const row: Record<string, unknown> = {
      prescription_id: input.prescriptionId,
      pharmacy_id:     input.pharmacyId,
      patient_id:      input.patientId,
      items:           rx.medications,
      status:          'received',
      total_amount:    input.totalAmount ?? 0,
      currency:        input.currency   ?? 'HTG',
      delivery_type:   input.deliveryType ?? 'pickup',
    };
    if (input.deliveryAddress) row['delivery_address'] = input.deliveryAddress;
    return HealthcareRepository.createPharmacyOrder(row);
  },

  async verify(orderId: string): Promise<void> {
    await HealthcareRepository.updatePharmacyOrder(orderId, { status: 'verifying' });
  },

  async prepare(orderId: string): Promise<void> {
    await HealthcareRepository.updatePharmacyOrder(orderId, { status: 'preparing' });
  },

  async markReady(orderId: string): Promise<void> {
    await HealthcareRepository.updatePharmacyOrder(orderId, { status: 'ready' });
  },

  async dispense(orderId: string): Promise<void> {
    const order = await HealthcareRepository.listPharmacyOrders('');
    const target = order.find(o => o.id === orderId);
    await HealthcareRepository.updatePharmacyOrder(orderId, { status: 'dispensed' });
    if (target) await PrescriptionEngine.dispense(target.prescriptionId, target.pharmacyId);
  },

  async deliver(orderId: string): Promise<void> {
    await HealthcareRepository.updatePharmacyOrder(orderId, { status: 'delivered' });
  },

  async listForPatient(patientId: string): Promise<PharmacyOrder[]> {
    return HealthcareRepository.listPharmacyOrders(patientId);
  },
};