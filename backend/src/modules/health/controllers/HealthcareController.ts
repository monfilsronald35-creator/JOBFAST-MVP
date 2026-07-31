import type { Request, Response, NextFunction } from 'express';
import { FacilityService }          from '../services/FacilityService.js';
import { PatientService }           from '../services/PatientService.js';
import { DoctorService }            from '../services/DoctorService.js';
import { AppointmentEngine }        from '../services/AppointmentEngine.js';
import { MedicalRecordsService }    from '../services/MedicalRecordsService.js';
import { PrescriptionEngine }       from '../services/PrescriptionEngine.js';
import { LaboratoryService }        from '../services/LaboratoryService.js';
import { PharmacyService }          from '../services/PharmacyService.js';
import { InsuranceEngine }          from '../services/InsuranceEngine.js';
import { EmergencyService }         from '../services/EmergencyService.js';
import { TelemedicineService }      from '../services/TelemedicineService.js';
import { HealthcareAIService }      from '../services/HealthcareAIService.js';
import { HealthcareAnalyticsService } from '../services/HealthcareAnalyticsService.js';
import type {
  HealthFacility, Patient, Appointment, MedicalRecord,
  InsuranceClaim, EmergencyRequest,
} from '../types/healthcare.types.js';

function bv(req: Request): Record<string, unknown>  { return req.body as Record<string, unknown>; }
function qv(req: Request): Record<string, unknown>  { return req.query as Record<string, unknown>; }
function uid(req: Request): string                   { return req.user!.sub; }
function pid(req: Request, k: string): string        { return String(req.params[k] ?? ''); }

export const HealthcareController = {
  // ── Facilities ────────────────────────────────────────────────────────────────
  async registerFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const f = await FacilityService.register(uid(req), {
        name:     String(b['name']    ?? ''),
        city:     String(b['city']    ?? ''),
        type:     b['type']     as HealthFacility['type'] | undefined,
        address:  b['address']  ? String(b['address'])  : undefined,
        country:  b['country']  ? String(b['country'])  : undefined,
        phone:    b['phone']    ? String(b['phone'])    : undefined,
        email:    b['email']    ? String(b['email'])    : undefined,
        website:  b['website']  ? String(b['website'])  : undefined,
        lat:      b['lat']      ? Number(b['lat'])      : undefined,
        lng:      b['lng']      ? Number(b['lng'])      : undefined,
        currency: b['currency'] ? String(b['currency']) : undefined,
      });
      res.status(201).json({ data: f });
    } catch (err) { next(err); }
  },

  async listFacilities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await FacilityService.list(
        q['type'] ? String(q['type']) : undefined,
        q['city'] ? String(q['city']) : undefined,
      ) });
    } catch (err) { next(err); }
  },

  async getFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const f = await FacilityService.get(pid(req, 'facilityId'));
      if (!f) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: f });
    } catch (err) { next(err); }
  },

  async findNearestFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await FacilityService.findNearest(
        Number(q['lat'] ?? 0), Number(q['lng'] ?? 0),
        q['type'] ? String(q['type']) : undefined,
      ) });
    } catch (err) { next(err); }
  },

  // ── Patients ──────────────────────────────────────────────────────────────────
  async registerPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const p = await PatientService.register(uid(req), {
        firstName:   String(b['firstName']   ?? ''),
        lastName:    String(b['lastName']    ?? ''),
        dateOfBirth: String(b['dateOfBirth'] ?? ''),
        gender:      b['gender']    as Patient['gender'] | undefined,
        bloodType:   b['bloodType'] as Patient['bloodType'] | undefined,
        country:     b['country']   ? String(b['country'])  : undefined,
        city:        b['city']      ? String(b['city'])     : undefined,
        phone:       b['phone']     ? String(b['phone'])    : undefined,
        email:       b['email']     ? String(b['email'])    : undefined,
        allergies:   b['allergies']  as string[] | undefined,
        conditions:  b['conditions'] as string[] | undefined,
        medications: b['medications']as string[] | undefined,
        vaccinations:b['vaccinations']as string[] | undefined,
        preferredLanguage: b['preferredLanguage'] ? String(b['preferredLanguage']) : undefined,
        insuranceId:       b['insuranceId']       ? String(b['insuranceId'])       : undefined,
      });
      res.status(201).json({ data: p });
    } catch (err) { next(err); }
  },

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await PatientService.getByUser(uid(req));
      if (!p) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: p });
    } catch (err) { next(err); }
  },

  async addVaccination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PatientService.addVaccination(pid(req, 'patientId'), String(bv(req)['vaccine'] ?? ''));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Doctors ───────────────────────────────────────────────────────────────────
  async registerDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const d = await DoctorService.register(uid(req), {
        firstName:     String(b['firstName']     ?? ''),
        lastName:      String(b['lastName']      ?? ''),
        specialty:     String(b['specialty']     ?? ''),
        licenseNumber: String(b['licenseNumber'] ?? ''),
        country:       b['country']   ? String(b['country'])   : undefined,
        city:          b['city']      ? String(b['city'])      : undefined,
        phone:         b['phone']     ? String(b['phone'])     : undefined,
        email:         b['email']     ? String(b['email'])     : undefined,
        languages:     b['languages']  as string[] | undefined,
        experience:    b['experience'] ? Number(b['experience']) : undefined,
        consultationFee: b['consultationFee'] ? Number(b['consultationFee']) : undefined,
        currency:      b['currency']  ? String(b['currency'])  : undefined,
        facilityId:    b['facilityId']? String(b['facilityId']): undefined,
        telemedicineAvailable: Boolean(b['telemedicineAvailable'] ?? false),
      });
      res.status(201).json({ data: d });
    } catch (err) { next(err); }
  },

  async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await DoctorService.list({
        specialty:   q['specialty']  ? String(q['specialty'])  : undefined,
        city:        q['city']       ? String(q['city'])       : undefined,
        telemedicine:q['telemedicine']!= null ? q['telemedicine'] === 'true' : undefined,
        facilityId:  q['facilityId'] ? String(q['facilityId']) : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const d = await DoctorService.get(pid(req, 'doctorId'));
      if (!d) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: d });
    } catch (err) { next(err); }
  },

  async addSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b  = bv(req);
      const sch = await DoctorService.addSchedule(pid(req, 'doctorId'), {
        dayOfWeek:   Number(b['dayOfWeek'] ?? 1),
        startTime:   b['startTime']   ? String(b['startTime'])   : undefined,
        endTime:     b['endTime']     ? String(b['endTime'])     : undefined,
        slotMinutes: b['slotMinutes'] ? Number(b['slotMinutes']) : undefined,
      });
      res.status(201).json({ data: sch });
    } catch (err) { next(err); }
  },

  async getDoctorSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await DoctorService.getSchedule(pid(req, 'doctorId')) }); } catch (err) { next(err); }
  },

  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q   = qv(req);
      const ok  = await DoctorService.checkAvailability(pid(req, 'doctorId'), String(q['at'] ?? ''));
      res.json({ data: { available: ok } });
    } catch (err) { next(err); }
  },

  // ── Appointments ──────────────────────────────────────────────────────────────
  async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b    = bv(req);
      const appt = await AppointmentEngine.book({
        patientId:   String(b['patientId']   ?? uid(req)),
        doctorId:    String(b['doctorId']    ?? ''),
        scheduledAt: String(b['scheduledAt'] ?? ''),
        type:        b['type']       as Appointment['type'] | undefined,
        reason:      b['reason']     ? String(b['reason'])     : undefined,
        facilityId:  b['facilityId'] ? String(b['facilityId']) : undefined,
        duration:    b['duration']   ? Number(b['duration'])   : undefined,
        fee:         b['fee']        ? Number(b['fee'])        : undefined,
        currency:    b['currency']   ? String(b['currency'])   : undefined,
      });
      res.status(201).json({ data: appt });
    } catch (err) {
      if (err instanceof Error && err.message === 'SLOT_TAKEN') {
        res.status(409).json({ code: 'SLOT_TAKEN', message: 'Slot sa a deja pran. Chwazi yon lòt lè.' });
        return;
      }
      next(err);
    }
  },

  async walkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b    = bv(req);
      const appt = await AppointmentEngine.bookWalkIn(
        String(b['doctorId']   ?? ''),
        String(b['patientId']  ?? uid(req)),
        String(b['facilityId'] ?? ''),
      );
      res.status(201).json({ data: appt });
    } catch (err) { next(err); }
  },

  async listMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await AppointmentEngine.listPatient(patient.id) });
    } catch (err) { next(err); }
  },

  async listDoctorAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await AppointmentEngine.listDoctor(pid(req, 'doctorId'), q['date'] ? String(q['date']) : undefined) });
    } catch (err) { next(err); }
  },

  async updateAppointmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action = pid(req, 'action');
      const id     = pid(req, 'appointmentId');
      const notes  = bv(req)['notes'] ? String(bv(req)['notes']) : undefined;
      switch (action) {
        case 'confirm':  await AppointmentEngine.confirm(id);       break;
        case 'arrive':   await AppointmentEngine.arrive(id);        break;
        case 'start':    await AppointmentEngine.start(id);         break;
        case 'complete': await AppointmentEngine.complete(id, notes);break;
        case 'cancel':   await AppointmentEngine.cancel(id);        break;
        case 'paid':     await AppointmentEngine.markPaid(id);      break;
        default: res.status(400).json({ code: 'INVALID_ACTION' }); return;
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Medical Records ───────────────────────────────────────────────────────────
  async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const r = await MedicalRecordsService.create({
        patientId:      String(b['patientId']  ?? ''),
        doctorId:       String(b['doctorId']   ?? uid(req)),
        title:          String(b['title']      ?? ''),
        content:        String(b['content']    ?? ''),
        type:           b['type']       as MedicalRecord['type'] | undefined,
        facilityId:     b['facilityId'] ? String(b['facilityId']) : undefined,
        attachments:    b['attachments'] as string[] | undefined,
        isConfidential: Boolean(b['isConfidential'] ?? false),
      });
      res.status(201).json({ data: r });
    } catch (err) { next(err); }
  },

  async listPatientRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await MedicalRecordsService.listForPatient(pid(req, 'patientId'), q['type'] ? String(q['type']) : undefined) });
    } catch (err) { next(err); }
  },

  async getRecordSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await MedicalRecordsService.summarize(pid(req, 'patientId')) }); } catch (err) { next(err); }
  },

  // ── Prescriptions ─────────────────────────────────────────────────────────────
  async createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b      = bv(req);
      const result = await PrescriptionEngine.create({
        patientId:   String(b['patientId']  ?? ''),
        doctorId:    String(b['doctorId']   ?? uid(req)),
        diagnosis:   String(b['diagnosis']  ?? ''),
        medications: (b['medications'] as never) ?? [],
        notes:       b['notes']      ? String(b['notes'])      : undefined,
        pharmacyId:  b['pharmacyId'] ? String(b['pharmacyId']) : undefined,
        validDays:   b['validDays']  ? Number(b['validDays'])  : undefined,
      });
      res.status(201).json({ data: result.prescription, alerts: result.interactionAlerts });
    } catch (err) { next(err); }
  },

  async listMyPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await PrescriptionEngine.listForPatient(patient.id) });
    } catch (err) { next(err); }
  },

  async renewPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await PrescriptionEngine.renew(pid(req, 'prescriptionId')) }); } catch (err) { next(err); }
  },

  // ── Laboratory ────────────────────────────────────────────────────────────────
  async orderLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const o = await LaboratoryService.order({
        patientId:  String(b['patientId']  ?? ''),
        doctorId:   String(b['doctorId']   ?? uid(req)),
        facilityId: String(b['facilityId'] ?? ''),
        testName:   String(b['testName']   ?? ''),
        testType:   b['testType'] as never,
        priority:   b['priority'] as never,
      });
      res.status(201).json({ data: o });
    } catch (err) { next(err); }
  },

  async updateLabStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action = pid(req, 'action');
      const id     = pid(req, 'orderId');
      const b      = bv(req);
      switch (action) {
        case 'collect':  await LaboratoryService.collect(id);                                           break;
        case 'process':  await LaboratoryService.process(id);                                           break;
        case 'results':  res.json({ data: await LaboratoryService.uploadResults(id, String(b['results'] ?? ''), b['resultUrl'] ? String(b['resultUrl']) : undefined) }); return;
        case 'deliver':  await LaboratoryService.markDelivered(id);                                     break;
        default: res.status(400).json({ code: 'INVALID_ACTION' }); return;
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async listMyLabOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await LaboratoryService.listForPatient(patient.id) });
    } catch (err) { next(err); }
  },

  // ── Pharmacy ──────────────────────────────────────────────────────────────────
  async receivePharmacyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const o = await PharmacyService.receiveOrder({
        prescriptionId: String(b['prescriptionId'] ?? ''),
        pharmacyId:     String(b['pharmacyId']     ?? ''),
        patientId:      String(b['patientId']      ?? ''),
        deliveryType:   b['deliveryType'] as 'pickup' | 'delivery' | undefined,
        deliveryAddress:b['deliveryAddress'] ? String(b['deliveryAddress']) : undefined,
        totalAmount:    b['totalAmount'] ? Number(b['totalAmount']) : undefined,
        currency:       b['currency']    ? String(b['currency'])    : undefined,
      });
      res.status(201).json({ data: o });
    } catch (err) { next(err); }
  },

  async updatePharmacyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action  = pid(req, 'action');
      const orderId = pid(req, 'orderId');
      switch (action) {
        case 'verify':  await PharmacyService.verify(orderId);  break;
        case 'prepare': await PharmacyService.prepare(orderId); break;
        case 'ready':   await PharmacyService.markReady(orderId);break;
        case 'dispense':await PharmacyService.dispense(orderId); break;
        case 'deliver': await PharmacyService.deliver(orderId);  break;
        default: res.status(400).json({ code: 'INVALID_ACTION' }); return;
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async listMyPharmacyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await PharmacyService.listForPatient(patient.id) });
    } catch (err) { next(err); }
  },

  // ── Insurance ─────────────────────────────────────────────────────────────────
  async registerPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const p = await InsuranceEngine.registerPolicy({
        patientId:     String(b['patientId']    ?? uid(req)),
        insurerId:     String(b['insurerId']    ?? ''),
        policyNumber:  String(b['policyNumber'] ?? ''),
        startDate:     String(b['startDate']    ?? ''),
        endDate:       String(b['endDate']      ?? ''),
        coverageTypes: b['coverageTypes'] as string[] | undefined,
        maxAnnual:     b['maxAnnual']  ? Number(b['maxAnnual'])  : undefined,
        currency:      b['currency']   ? String(b['currency'])   : undefined,
      });
      res.status(201).json({ data: p });
    } catch (err) { next(err); }
  },

  async verifyCoverage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await InsuranceEngine.verifyCoverage(
        String(q['patientId'] ?? ''),
        String(q['type'] ?? 'consultation') as InsuranceClaim['type'],
      ) });
    } catch (err) { next(err); }
  },

  async submitClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const c = await InsuranceEngine.submitClaim({
        patientId:     String(b['patientId']   ?? uid(req)),
        insurerId:     String(b['insurerId']   ?? ''),
        type:          String(b['type']        ?? 'consultation') as InsuranceClaim['type'],
        totalAmount:   Number(b['totalAmount'] ?? 0),
        currency:      b['currency']      ? String(b['currency'])      : undefined,
        deductible:    b['deductible']    ? Number(b['deductible'])    : undefined,
        facilityId:    b['facilityId']    ? String(b['facilityId'])    : undefined,
        appointmentId: b['appointmentId'] ? String(b['appointmentId']) : undefined,
        documents:     b['documents']     as string[] | undefined,
        notes:         b['notes']         ? String(b['notes'])         : undefined,
      });
      res.status(201).json({ data: c });
    } catch (err) { next(err); }
  },

  async updateClaimStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action = pid(req, 'action');
      const id     = pid(req, 'claimId');
      switch (action) {
        case 'approve': await InsuranceEngine.approveClaim(id);                                         break;
        case 'reject':  await InsuranceEngine.rejectClaim(id, bv(req)['notes'] ? String(bv(req)['notes']) : undefined); break;
        case 'paid':    await InsuranceEngine.markPaid(id);                                             break;
        default: res.status(400).json({ code: 'INVALID_ACTION' }); return;
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async listMyClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await InsuranceEngine.listClaims(patient.id) });
    } catch (err) { next(err); }
  },

  // ── Emergency ─────────────────────────────────────────────────────────────────
  async requestEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const e = await EmergencyService.request(uid(req), {
        lat:         Number(b['lat']         ?? 0),
        lng:         Number(b['lng']         ?? 0),
        description: String(b['description'] ?? ''),
        severity:    b['severity'] as EmergencyRequest['severity'] | undefined,
        address:     b['address']   ? String(b['address'])   : undefined,
        patientId:   b['patientId'] ? String(b['patientId']) : undefined,
      });
      res.status(201).json({ data: e, label: EmergencyService.getSeverityLabel(e.severity) });
    } catch (err) { next(err); }
  },

  async listActiveEmergencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await EmergencyService.listActive() }); } catch (err) { next(err); }
  },

  async updateEmergencyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action = pid(req, 'action');
      const id     = pid(req, 'emergencyId');
      if (action === 'ambulance') {
        await EmergencyService.assignAmbulance(id, String(bv(req)['ambulanceId'] ?? ''));
      } else {
        await EmergencyService.updateStatus(id, action as EmergencyRequest['status']);
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Telemedicine ──────────────────────────────────────────────────────────────
  async createTeleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b  = bv(req);
      const s  = await TelemedicineService.createSession({
        appointmentId: String(b['appointmentId'] ?? ''),
        patientId:     String(b['patientId']     ?? uid(req)),
        doctorId:      String(b['doctorId']      ?? ''),
        mode:          b['mode'] as never,
      });
      res.status(201).json({ data: s });
    } catch (err) { next(err); }
  },

  async startTeleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await TelemedicineService.start(pid(req, 'sessionId')) }); } catch (err) { next(err); }
  },

  async endTeleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      await TelemedicineService.end(pid(req, 'sessionId'), b['notes'] ? String(b['notes']) : undefined);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async scheduleFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TelemedicineService.scheduleFollowUp(pid(req, 'sessionId'), String(bv(req)['followUpAt'] ?? ''));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── AI ────────────────────────────────────────────────────────────────────────
  async triageSymptoms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b      = bv(req);
      const result = await HealthcareAIService.triage((b['symptoms'] as string[]) ?? []);
      res.json({ data: result });
    } catch (err) { next(err); }
  },

  async suggestAppointmentTimes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await HealthcareAIService.suggestAppointmentTime(pid(req, 'doctorId')) }); } catch (err) { next(err); }
  },

  async medicationReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getByUser(uid(req));
      if (!patient) { res.json({ data: [] }); return; }
      res.json({ data: await HealthcareAIService.medicationReminders(patient.id) });
    } catch (err) { next(err); }
  },

  async summarizeMedicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await HealthcareAIService.summarizeMedicalHistory(pid(req, 'patientId')) }); } catch (err) { next(err); }
  },

  async optimizeDoctorSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await HealthcareAIService.optimizeDoctorSchedule(pid(req, 'doctorId')) }); } catch (err) { next(err); }
  },

  async predictDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q   = qv(req);
      res.json({ data: await HealthcareAIService.predictDemand(pid(req, 'facilityId'), q['weeks'] ? Number(q['weeks']) : undefined) });
    } catch (err) { next(err); }
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q      = qv(req);
      const period = q['period'] ? String(q['period']) : new Date().toISOString().slice(0, 7);
      res.json({ data: await HealthcareAnalyticsService.generate(pid(req, 'facilityId'), period) });
    } catch (err) { next(err); }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await HealthcareAnalyticsService.getDashboard(uid(req), q['period'] ? String(q['period']) : undefined) });
    } catch (err) { next(err); }
  },
};