import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { Patient, BloodType, EmergencyContact } from '../types/healthcare.types.js';

export const PatientService = {
  async register(userId: string, input: {
    firstName: string; lastName: string; dateOfBirth: string;
    gender?: Patient['gender']; bloodType?: BloodType;
    country?: string; city?: string; phone?: string; email?: string;
    allergies?: string[]; conditions?: string[]; medications?: string[];
    vaccinations?: string[]; emergencyContacts?: EmergencyContact[];
    preferredLanguage?: string; insuranceId?: string;
  }): Promise<Patient> {
    const patientId = await HealthcareRepository.nextPatientId();
    const row: Record<string, unknown> = {
      user_id:     userId,
      patient_id:  patientId,
      first_name:  input.firstName,
      last_name:   input.lastName,
      date_of_birth: input.dateOfBirth,
      gender:      input.gender             ?? 'other',
      country:     input.country            ?? 'HT',
      city:        input.city               ?? '',
      phone:       input.phone              ?? '',
      allergies:   input.allergies          ?? [],
      conditions:  input.conditions         ?? [],
      medications: input.medications        ?? [],
      vaccinations:input.vaccinations       ?? [],
      emergency_contacts: input.emergencyContacts ?? [],
      preferred_language: input.preferredLanguage ?? 'ht',
    };
    if (input.email)      row['email']       = input.email;
    if (input.bloodType)  row['blood_type']  = input.bloodType;
    if (input.insuranceId)row['insurance_id']= input.insuranceId;
    return HealthcareRepository.createPatient(row);
  },

  async getByUser(userId: string): Promise<Patient | null> {
    return HealthcareRepository.getPatientByUser(userId);
  },

  async get(id: string): Promise<Patient | null> {
    return HealthcareRepository.getPatient(id);
  },

  async updateAllergies(patientId: string, allergies: string[]): Promise<void> {
    await HealthcareRepository.updatePatient(patientId, { allergies });
  },

  async updateMedications(patientId: string, medications: string[]): Promise<void> {
    await HealthcareRepository.updatePatient(patientId, { medications });
  },

  async addVaccination(patientId: string, vaccine: string): Promise<void> {
    const patient = await HealthcareRepository.getPatient(patientId);
    if (!patient) throw new Error('PATIENT_NOT_FOUND');
    const updated = [...patient.vaccinations, vaccine];
    await HealthcareRepository.updatePatient(patientId, { vaccinations: updated });
  },

  async updateEmergencyContacts(patientId: string, contacts: EmergencyContact[]): Promise<void> {
    await HealthcareRepository.updatePatient(patientId, { emergency_contacts: contacts });
  },

  async setPrimaryDoctor(patientId: string, doctorId: string): Promise<void> {
    await HealthcareRepository.updatePatient(patientId, { primary_doctor_id: doctorId });
  },
};