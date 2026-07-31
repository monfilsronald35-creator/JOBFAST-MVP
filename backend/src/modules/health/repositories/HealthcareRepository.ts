import { db } from '../../../core/database/SupabaseClient.js';
import type {
  HealthFacility, Patient, Doctor, DoctorSchedule, Appointment,
  MedicalRecord, Prescription, LabOrder, PharmacyOrder,
  InsurancePolicy, InsuranceClaim, EmergencyRequest, TelemedicineSession,
} from '../types/healthcare.types.js';

// ── Mappers ───────────────────────────────────────────────────────────────────
function mapFacility(r: Record<string, unknown>): HealthFacility {
  return {
    id: String(r['id']), ownerId: String(r['owner_id']), name: String(r['name']),
    type: r['type'] as HealthFacility['type'], country: String(r['country']),
    city: String(r['city']), address: String(r['address'] ?? ''),
    lat: r['lat'] != null ? Number(r['lat']) : undefined,
    lng: r['lng'] != null ? Number(r['lng']) : undefined,
    phone: String(r['phone'] ?? ''),
    email:   r['email']   != null ? String(r['email'])   : undefined,
    website: r['website'] != null ? String(r['website']) : undefined,
    isVerified: Boolean(r['is_verified']), isActive: Boolean(r['is_active']),
    currency: String(r['currency']), rating: Number(r['rating']),
    createdAt: String(r['created_at']),
  };
}

function mapPatient(r: Record<string, unknown>): Patient {
  return {
    id: String(r['id']), userId: String(r['user_id']), patientId: String(r['patient_id']),
    firstName: String(r['first_name']), lastName: String(r['last_name']),
    dateOfBirth: String(r['date_of_birth']),
    gender: r['gender'] as Patient['gender'],
    bloodType: r['blood_type'] != null ? r['blood_type'] as Patient['bloodType'] : undefined,
    country: String(r['country']), city: String(r['city']), phone: String(r['phone']),
    email:           r['email']             != null ? String(r['email'])             : undefined,
    allergies:       (r['allergies']         as string[]) ?? [],
    conditions:      (r['conditions']        as string[]) ?? [],
    medications:     (r['medications']       as string[]) ?? [],
    vaccinations:    (r['vaccinations']      as string[]) ?? [],
    emergencyContacts:(r['emergency_contacts'] as Patient['emergencyContacts']) ?? [],
    insuranceId:     r['insurance_id']      != null ? String(r['insurance_id'])      : undefined,
    preferredLanguage: String(r['preferred_language'] ?? 'ht'),
    primaryDoctorId: r['primary_doctor_id'] != null ? String(r['primary_doctor_id']) : undefined,
    consentAt: String(r['consent_at']), createdAt: String(r['created_at']),
  };
}

function mapDoctor(r: Record<string, unknown>): Doctor {
  return {
    id: String(r['id']), userId: String(r['user_id']),
    facilityId: r['facility_id'] != null ? String(r['facility_id']) : undefined,
    firstName: String(r['first_name']), lastName: String(r['last_name']),
    specialty: String(r['specialty']), licenseNumber: String(r['license_number']),
    country: String(r['country']), city: String(r['city']), phone: String(r['phone']),
    email: r['email'] != null ? String(r['email']) : undefined,
    languages:   (r['languages'] as string[]) ?? [],
    experience:  Number(r['experience']), consultationFee: Number(r['consultation_fee']),
    currency: String(r['currency']), telemedicineAvailable: Boolean(r['telemedicine_available']),
    rating: Number(r['rating']), reviewCount: Number(r['review_count']),
    isVerified: Boolean(r['is_verified']), isActive: Boolean(r['is_active']),
    createdAt: String(r['created_at']),
  };
}

function mapSchedule(r: Record<string, unknown>): DoctorSchedule {
  return {
    id: String(r['id']), doctorId: String(r['doctor_id']),
    dayOfWeek: Number(r['day_of_week']), startTime: String(r['start_time']),
    endTime: String(r['end_time']), slotMinutes: Number(r['slot_minutes']),
    isActive: Boolean(r['is_active']),
  };
}

function mapAppt(r: Record<string, unknown>): Appointment {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), doctorId: String(r['doctor_id']),
    facilityId: r['facility_id'] != null ? String(r['facility_id']) : undefined,
    type: r['type'] as Appointment['type'], status: r['status'] as Appointment['status'],
    scheduledAt: String(r['scheduled_at']), duration: Number(r['duration']),
    reason: String(r['reason']), notes: r['notes'] != null ? String(r['notes']) : undefined,
    fee: Number(r['fee']), currency: String(r['currency']), isPaid: Boolean(r['is_paid']),
    queueNumber:  r['queue_number'] != null ? Number(r['queue_number']) : undefined,
    reminderSent: Boolean(r['reminder_sent']), createdAt: String(r['created_at']),
  };
}

function mapRecord(r: Record<string, unknown>): MedicalRecord {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), doctorId: String(r['doctor_id']),
    facilityId: r['facility_id'] != null ? String(r['facility_id']) : undefined,
    type: r['type'] as MedicalRecord['type'], title: String(r['title']),
    content: String(r['content']), attachments: (r['attachments'] as string[]) ?? [],
    isConfidential: Boolean(r['is_confidential']), createdAt: String(r['created_at']),
  };
}

function mapPrescription(r: Record<string, unknown>): Prescription {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), doctorId: String(r['doctor_id']),
    medications: (r['medications'] as Prescription['medications']) ?? [],
    diagnosis: String(r['diagnosis']),
    notes:      r['notes']       != null ? String(r['notes'])       : undefined,
    qrCode: String(r['qr_code']), validUntil: String(r['valid_until']),
    pharmacyId: r['pharmacy_id'] != null ? String(r['pharmacy_id']) : undefined,
    status: r['status'] as Prescription['status'], renewalCount: Number(r['renewal_count']),
    createdAt: String(r['created_at']),
  };
}

function mapLabOrder(r: Record<string, unknown>): LabOrder {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), doctorId: String(r['doctor_id']),
    facilityId: String(r['facility_id']), testType: r['test_type'] as LabOrder['testType'],
    testName: String(r['test_name']), status: r['status'] as LabOrder['status'],
    priority: r['priority'] as LabOrder['priority'],
    results:    r['results']     != null ? String(r['results'])     : undefined,
    resultUrl:  r['result_url']  != null ? String(r['result_url'])  : undefined,
    aiAnalysis: r['ai_analysis'] != null ? String(r['ai_analysis']) : undefined,
    orderedAt: String(r['ordered_at']),
    readyAt:   r['ready_at'] != null ? String(r['ready_at']) : undefined,
  };
}

function mapPharmacyOrder(r: Record<string, unknown>): PharmacyOrder {
  return {
    id: String(r['id']), prescriptionId: String(r['prescription_id']),
    pharmacyId: String(r['pharmacy_id']), patientId: String(r['patient_id']),
    items: (r['items'] as PharmacyOrder['items']) ?? [],
    status: r['status'] as PharmacyOrder['status'],
    totalAmount: Number(r['total_amount']), currency: String(r['currency']),
    deliveryType: r['delivery_type'] as PharmacyOrder['deliveryType'],
    deliveryAddress: r['delivery_address'] != null ? String(r['delivery_address']) : undefined,
    createdAt: String(r['created_at']),
  };
}

function mapPolicy(r: Record<string, unknown>): InsurancePolicy {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), insurerId: String(r['insurer_id']),
    policyNumber: String(r['policy_number']), coverageTypes: (r['coverage_types'] as string[]) ?? [],
    maxAnnual: Number(r['max_annual']), currency: String(r['currency']),
    startDate: String(r['start_date']), endDate: String(r['end_date']),
    isActive: Boolean(r['is_active']), createdAt: String(r['created_at']),
  };
}

function mapClaim(r: Record<string, unknown>): InsuranceClaim {
  return {
    id: String(r['id']), patientId: String(r['patient_id']), insurerId: String(r['insurer_id']),
    facilityId:    r['facility_id']    != null ? String(r['facility_id'])    : undefined,
    appointmentId: r['appointment_id'] != null ? String(r['appointment_id']) : undefined,
    type: r['type'] as InsuranceClaim['type'], totalAmount: Number(r['total_amount']),
    coveredAmount: Number(r['covered_amount']), copayment: Number(r['copayment']),
    deductible: Number(r['deductible']), currency: String(r['currency']),
    status: r['status'] as InsuranceClaim['status'], documents: (r['documents'] as string[]) ?? [],
    notes: r['notes'] != null ? String(r['notes']) : undefined,
    createdAt: String(r['created_at']),
  };
}

function mapEmergency(r: Record<string, unknown>): EmergencyRequest {
  return {
    id: String(r['id']), userId: String(r['user_id']),
    patientId:   r['patient_id']   != null ? String(r['patient_id'])   : undefined,
    lat: Number(r['lat']), lng: Number(r['lng']),
    address:     r['address']      != null ? String(r['address'])      : undefined,
    description: String(r['description']),
    severity: r['severity'] as EmergencyRequest['severity'],
    status:   r['status']   as EmergencyRequest['status'],
    ambulanceId: r['ambulance_id'] != null ? String(r['ambulance_id']) : undefined,
    hospitalId:  r['hospital_id']  != null ? String(r['hospital_id'])  : undefined,
    dispatchedAt:r['dispatched_at']!= null ? String(r['dispatched_at']): undefined,
    resolvedAt:  r['resolved_at']  != null ? String(r['resolved_at'])  : undefined,
    createdAt:   String(r['created_at']),
  };
}

function mapSession(r: Record<string, unknown>): TelemedicineSession {
  return {
    id: String(r['id']), appointmentId: String(r['appointment_id']),
    patientId: String(r['patient_id']), doctorId: String(r['doctor_id']),
    mode: r['mode'] as TelemedicineSession['mode'], status: r['status'] as TelemedicineSession['status'],
    startedAt:  r['started_at']  != null ? String(r['started_at'])  : undefined,
    endedAt:    r['ended_at']    != null ? String(r['ended_at'])    : undefined,
    duration:   r['duration']    != null ? Number(r['duration'])    : undefined,
    roomToken:  r['room_token']  != null ? String(r['room_token'])  : undefined,
    notes:      r['notes']       != null ? String(r['notes'])       : undefined,
    followUpAt: r['follow_up_at']!= null ? String(r['follow_up_at']): undefined,
    createdAt:  String(r['created_at']),
  };
}

// ── Repository ────────────────────────────────────────────────────────────────
export const HealthcareRepository = {
  // Facilities
  async createFacility(row: Record<string, unknown>): Promise<HealthFacility> {
    const { data, error } = await db.client().from('hc_facilities').insert(row).select().single();
    if (error) throw error;
    return mapFacility(data as Record<string, unknown>);
  },
  async listFacilities(type?: string, city?: string): Promise<HealthFacility[]> {
    let q = db.client().from('hc_facilities').select('*').eq('is_active', true);
    if (type) q = q.eq('type', type);
    if (city) q = q.ilike('city', `%${city}%`);
    const { data } = await q.order('rating', { ascending: false });
    return (data ?? []).map(r => mapFacility(r as Record<string, unknown>));
  },
  async getFacility(id: string): Promise<HealthFacility | null> {
    const { data } = await db.client().from('hc_facilities').select('*').eq('id', id).single();
    return data ? mapFacility(data as Record<string, unknown>) : null;
  },
  async getNearbyFacilities(lat: number, lng: number, type?: string): Promise<HealthFacility[]> {
    let q = db.client().from('hc_facilities').select('*').eq('is_active', true);
    if (type) q = q.eq('type', type);
    const { data } = await q;
    const all = (data ?? []).map(r => mapFacility(r as Record<string, unknown>));
    return all
      .filter(f => f.lat != null && f.lng != null)
      .sort((a, b) => {
        const distA = Math.sqrt((a.lat! - lat) ** 2 + (a.lng! - lng) ** 2);
        const distB = Math.sqrt((b.lat! - lat) ** 2 + (b.lng! - lng) ** 2);
        return distA - distB;
      })
      .slice(0, 5);
  },

  // Patients
  async createPatient(row: Record<string, unknown>): Promise<Patient> {
    const { data, error } = await db.client().from('hc_patients').insert(row).select().single();
    if (error) throw error;
    return mapPatient(data as Record<string, unknown>);
  },
  async getPatient(id: string): Promise<Patient | null> {
    const { data } = await db.client().from('hc_patients').select('*').eq('id', id).single();
    return data ? mapPatient(data as Record<string, unknown>) : null;
  },
  async getPatientByUser(userId: string): Promise<Patient | null> {
    const { data } = await db.client().from('hc_patients').select('*').eq('user_id', userId).single();
    return data ? mapPatient(data as Record<string, unknown>) : null;
  },
  async updatePatient(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_patients').update(patch).eq('id', id);
  },
  async nextPatientId(): Promise<string> {
    const { count } = await db.client().from('hc_patients').select('*', { count: 'exact', head: true });
    const n = (count ?? 0) + 1;
    return `JF-PAT-${String(n).padStart(6, '0')}`;
  },

  // Doctors
  async createDoctor(row: Record<string, unknown>): Promise<Doctor> {
    const { data, error } = await db.client().from('hc_doctors').insert(row).select().single();
    if (error) throw error;
    return mapDoctor(data as Record<string, unknown>);
  },
  async listDoctors(filter: { specialty?: string; city?: string; telemedicine?: boolean; facilityId?: string }): Promise<Doctor[]> {
    let q = db.client().from('hc_doctors').select('*').eq('is_active', true);
    if (filter.specialty)  q = q.eq('specialty', filter.specialty);
    if (filter.city)       q = q.ilike('city', `%${filter.city}%`);
    if (filter.telemedicine != null) q = q.eq('telemedicine_available', filter.telemedicine);
    if (filter.facilityId) q = q.eq('facility_id', filter.facilityId);
    const { data } = await q.order('rating', { ascending: false });
    return (data ?? []).map(r => mapDoctor(r as Record<string, unknown>));
  },
  async getDoctor(id: string): Promise<Doctor | null> {
    const { data } = await db.client().from('hc_doctors').select('*').eq('id', id).single();
    return data ? mapDoctor(data as Record<string, unknown>) : null;
  },
  async createSchedule(row: Record<string, unknown>): Promise<DoctorSchedule> {
    const { data, error } = await db.client().from('hc_doctor_schedules').insert(row).select().single();
    if (error) throw error;
    return mapSchedule(data as Record<string, unknown>);
  },
  async getSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const { data } = await db.client().from('hc_doctor_schedules').select('*').eq('doctor_id', doctorId).eq('is_active', true);
    return (data ?? []).map(r => mapSchedule(r as Record<string, unknown>));
  },

  // Appointments
  async createAppointment(row: Record<string, unknown>): Promise<Appointment> {
    const { data, error } = await db.client().from('hc_appointments').insert(row).select().single();
    if (error) throw error;
    return mapAppt(data as Record<string, unknown>);
  },
  async getAppointment(id: string): Promise<Appointment | null> {
    const { data } = await db.client().from('hc_appointments').select('*').eq('id', id).single();
    return data ? mapAppt(data as Record<string, unknown>) : null;
  },
  async listPatientAppointments(patientId: string): Promise<Appointment[]> {
    const { data } = await db.client().from('hc_appointments').select('*').eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false });
    return (data ?? []).map(r => mapAppt(r as Record<string, unknown>));
  },
  async listDoctorAppointments(doctorId: string, date?: string): Promise<Appointment[]> {
    let q = db.client().from('hc_appointments').select('*').eq('doctor_id', doctorId);
    if (date) q = q.gte('scheduled_at', `${date}T00:00:00Z`).lte('scheduled_at', `${date}T23:59:59Z`);
    const { data } = await q.order('scheduled_at');
    return (data ?? []).map(r => mapAppt(r as Record<string, unknown>));
  },
  async updateAppointment(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_appointments').update(patch).eq('id', id);
  },
  async countDoctorAppointmentsInSlot(doctorId: string, scheduledAt: string): Promise<number> {
    const { count } = await db.client().from('hc_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).eq('scheduled_at', scheduledAt)
      .not('status', 'in', '("cancelled","no_show")');
    return count ?? 0;
  },

  // Medical Records
  async createRecord(row: Record<string, unknown>): Promise<MedicalRecord> {
    const { data, error } = await db.client().from('hc_medical_records').insert(row).select().single();
    if (error) throw error;
    return mapRecord(data as Record<string, unknown>);
  },
  async listPatientRecords(patientId: string, type?: string): Promise<MedicalRecord[]> {
    let q = db.client().from('hc_medical_records').select('*').eq('patient_id', patientId);
    if (type) q = q.eq('type', type);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapRecord(r as Record<string, unknown>));
  },

  // Prescriptions
  async createPrescription(row: Record<string, unknown>): Promise<Prescription> {
    const { data, error } = await db.client().from('hc_prescriptions').insert(row).select().single();
    if (error) throw error;
    return mapPrescription(data as Record<string, unknown>);
  },
  async getPrescription(id: string): Promise<Prescription | null> {
    const { data } = await db.client().from('hc_prescriptions').select('*').eq('id', id).single();
    return data ? mapPrescription(data as Record<string, unknown>) : null;
  },
  async listPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    const { data } = await db.client().from('hc_prescriptions').select('*').eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapPrescription(r as Record<string, unknown>));
  },
  async updatePrescription(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_prescriptions').update(patch).eq('id', id);
  },

  // Lab Orders
  async createLabOrder(row: Record<string, unknown>): Promise<LabOrder> {
    const { data, error } = await db.client().from('hc_lab_orders').insert(row).select().single();
    if (error) throw error;
    return mapLabOrder(data as Record<string, unknown>);
  },
  async getLabOrder(id: string): Promise<LabOrder | null> {
    const { data } = await db.client().from('hc_lab_orders').select('*').eq('id', id).single();
    return data ? mapLabOrder(data as Record<string, unknown>) : null;
  },
  async listLabOrders(patientId: string): Promise<LabOrder[]> {
    const { data } = await db.client().from('hc_lab_orders').select('*').eq('patient_id', patientId)
      .order('ordered_at', { ascending: false });
    return (data ?? []).map(r => mapLabOrder(r as Record<string, unknown>));
  },
  async updateLabOrder(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_lab_orders').update(patch).eq('id', id);
  },

  // Pharmacy Orders
  async createPharmacyOrder(row: Record<string, unknown>): Promise<PharmacyOrder> {
    const { data, error } = await db.client().from('hc_pharmacy_orders').insert(row).select().single();
    if (error) throw error;
    return mapPharmacyOrder(data as Record<string, unknown>);
  },
  async updatePharmacyOrder(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_pharmacy_orders').update(patch).eq('id', id);
  },
  async listPharmacyOrders(patientId: string): Promise<PharmacyOrder[]> {
    const { data } = await db.client().from('hc_pharmacy_orders').select('*').eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapPharmacyOrder(r as Record<string, unknown>));
  },

  // Insurance
  async createPolicy(row: Record<string, unknown>): Promise<InsurancePolicy> {
    const { data, error } = await db.client().from('hc_insurance_policies').insert(row).select().single();
    if (error) throw error;
    return mapPolicy(data as Record<string, unknown>);
  },
  async getActivePolicy(patientId: string): Promise<InsurancePolicy | null> {
    const { data } = await db.client().from('hc_insurance_policies').select('*')
      .eq('patient_id', patientId).eq('is_active', true).single();
    return data ? mapPolicy(data as Record<string, unknown>) : null;
  },
  async createClaim(row: Record<string, unknown>): Promise<InsuranceClaim> {
    const { data, error } = await db.client().from('hc_insurance_claims').insert(row).select().single();
    if (error) throw error;
    return mapClaim(data as Record<string, unknown>);
  },
  async listClaims(patientId: string): Promise<InsuranceClaim[]> {
    const { data } = await db.client().from('hc_insurance_claims').select('*').eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapClaim(r as Record<string, unknown>));
  },
  async updateClaim(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_insurance_claims').update(patch).eq('id', id);
  },

  // Emergency
  async createEmergency(row: Record<string, unknown>): Promise<EmergencyRequest> {
    const { data, error } = await db.client().from('hc_emergencies').insert(row).select().single();
    if (error) throw error;
    return mapEmergency(data as Record<string, unknown>);
  },
  async updateEmergency(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_emergencies').update(patch).eq('id', id);
  },
  async listActiveEmergencies(): Promise<EmergencyRequest[]> {
    const { data } = await db.client().from('hc_emergencies').select('*')
      .not('status', 'eq', 'resolved').order('created_at', { ascending: false });
    return (data ?? []).map(r => mapEmergency(r as Record<string, unknown>));
  },

  // Telemedicine
  async createSession(row: Record<string, unknown>): Promise<TelemedicineSession> {
    const { data, error } = await db.client().from('hc_tele_sessions').insert(row).select().single();
    if (error) throw error;
    return mapSession(data as Record<string, unknown>);
  },
  async getSession(id: string): Promise<TelemedicineSession | null> {
    const { data } = await db.client().from('hc_tele_sessions').select('*').eq('id', id).single();
    return data ? mapSession(data as Record<string, unknown>) : null;
  },
  async updateSession(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('hc_tele_sessions').update(patch).eq('id', id);
  },

  // Analytics
  async countAppointmentsByFacility(facilityId: string, period: string): Promise<number> {
    const from = `${period}-01T00:00:00Z`;
    const { count } = await db.client().from('hc_appointments')
      .select('*', { count: 'exact', head: true }).eq('facility_id', facilityId).gte('created_at', from);
    return count ?? 0;
  },
  async countPatients(): Promise<number> {
    const { count } = await db.client().from('hc_patients').select('*', { count: 'exact', head: true });
    return count ?? 0;
  },
};