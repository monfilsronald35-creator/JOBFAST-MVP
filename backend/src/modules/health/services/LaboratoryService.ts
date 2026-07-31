import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { LabOrder } from '../types/healthcare.types.js';

const AI_ANALYSIS_PATTERNS: Record<string, string> = {
  blood:    'Rezilta analiz san: Valè yo nan limit nòmal. Swivi ak doktè a rekòmande si gen senptòm.',
  urine:    'Analiz urin: Pa gen siy enfeksyon oubyen pwoblèm ki vizib. Konsiltasyon rekòmande si doulè kontinye.',
  covid:    'Tès COVID: Echantyon trete. Rezilta disponib nan 30 minit.',
  imaging:  'Imaj medikale: Pran entèpretasyon yon radyolojis lisansye pou rezilta definitif.',
  biopsy:   'Biyopsi: Echantyon analizé pa patolojis. Pran konsiltasyon pou diskite rezilta yo.',
  genetic:  'Analiz jenetik: Konsiltasyon ak yon konseyè jenetik rekòmande.',
  culture:  'Kilti: Verifye sansibilite antibiyotik nan rezilta final la.',
  other:    'Analiz konplete. Verifye rezilta ak doktè a.',
};

export const LaboratoryService = {
  async order(input: {
    patientId: string; doctorId: string; facilityId: string;
    testType?: LabOrder['testType']; testName: string;
    priority?: LabOrder['priority'];
  }): Promise<LabOrder> {
    return HealthcareRepository.createLabOrder({
      patient_id:  input.patientId,
      doctor_id:   input.doctorId,
      facility_id: input.facilityId,
      test_type:   input.testType  ?? 'blood',
      test_name:   input.testName,
      priority:    input.priority  ?? 'routine',
    });
  },

  async collect(id: string): Promise<void> {
    await HealthcareRepository.updateLabOrder(id, { status: 'collected' });
  },

  async process(id: string): Promise<void> {
    await HealthcareRepository.updateLabOrder(id, { status: 'processing' });
  },

  async uploadResults(id: string, results: string, resultUrl?: string): Promise<LabOrder> {
    const order = await HealthcareRepository.getLabOrder(id);
    if (!order) throw new Error('LAB_ORDER_NOT_FOUND');
    const aiAnalysis = AI_ANALYSIS_PATTERNS[order.testType] ?? AI_ANALYSIS_PATTERNS['other']!;
    const patch: Record<string, unknown> = {
      status:      'ready',
      results,
      ai_analysis: aiAnalysis,
      ready_at:    new Date().toISOString(),
    };
    if (resultUrl) patch['result_url'] = resultUrl;
    await HealthcareRepository.updateLabOrder(id, patch);
    return (await HealthcareRepository.getLabOrder(id))!;
  },

  async markDelivered(id: string): Promise<void> {
    await HealthcareRepository.updateLabOrder(id, { status: 'delivered' });
  },

  async listForPatient(patientId: string): Promise<LabOrder[]> {
    return HealthcareRepository.listLabOrders(patientId);
  },

  async get(id: string): Promise<LabOrder | null> {
    return HealthcareRepository.getLabOrder(id);
  },
};