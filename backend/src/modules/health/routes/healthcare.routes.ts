import { Router }                from 'express';
import { requireAuth }           from '../../../core/middleware/auth.middleware.js';
import { HealthcareController }  from '../controllers/HealthcareController.js';

export const healthcareRouter = Router();
const R = requireAuth;
const C = HealthcareController;

// ── Facilities ────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/facilities',                                    R, C.registerFacility);
healthcareRouter.get   ('/facilities',                                    R, C.listFacilities);
healthcareRouter.get   ('/facilities/nearest',                            R, C.findNearestFacility);
healthcareRouter.get   ('/facilities/:facilityId',                        R, C.getFacility);

// ── Patients ──────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/patients',                                      R, C.registerPatient);
healthcareRouter.get   ('/patients/me',                                   R, C.getMyProfile);
healthcareRouter.post  ('/patients/:patientId/vaccinations',              R, C.addVaccination);

// ── Doctors ───────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/doctors',                                       R, C.registerDoctor);
healthcareRouter.get   ('/doctors',                                       R, C.listDoctors);
healthcareRouter.get   ('/doctors/:doctorId',                             R, C.getDoctor);
healthcareRouter.post  ('/doctors/:doctorId/schedule',                    R, C.addSchedule);
healthcareRouter.get   ('/doctors/:doctorId/schedule',                    R, C.getDoctorSchedule);
healthcareRouter.get   ('/doctors/:doctorId/availability',                R, C.checkAvailability);
healthcareRouter.get   ('/doctors/:doctorId/appointments',                R, C.listDoctorAppointments);
healthcareRouter.get   ('/doctors/:doctorId/ai/suggest-times',            R, C.suggestAppointmentTimes);
healthcareRouter.get   ('/doctors/:doctorId/ai/optimize',                 R, C.optimizeDoctorSchedule);

// ── Appointments ──────────────────────────────────────────────────────────────
healthcareRouter.post  ('/appointments',                                  R, C.bookAppointment);
healthcareRouter.post  ('/appointments/walk-in',                          R, C.walkIn);
healthcareRouter.get   ('/appointments/mine',                             R, C.listMyAppointments);
healthcareRouter.post  ('/appointments/:appointmentId/:action',           R, C.updateAppointmentStatus);

// ── Medical Records ───────────────────────────────────────────────────────────
healthcareRouter.post  ('/records',                                       R, C.createRecord);
healthcareRouter.get   ('/records/:patientId',                            R, C.listPatientRecords);
healthcareRouter.get   ('/records/:patientId/summary',                    R, C.getRecordSummary);

// ── Prescriptions ─────────────────────────────────────────────────────────────
healthcareRouter.post  ('/prescriptions',                                 R, C.createPrescription);
healthcareRouter.get   ('/prescriptions/mine',                            R, C.listMyPrescriptions);
healthcareRouter.post  ('/prescriptions/:prescriptionId/renew',           R, C.renewPrescription);

// ── Laboratory ────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/lab/orders',                                    R, C.orderLabTest);
healthcareRouter.get   ('/lab/orders/mine',                               R, C.listMyLabOrders);
healthcareRouter.post  ('/lab/orders/:orderId/:action',                   R, C.updateLabStatus);

// ── Pharmacy ──────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/pharmacy/orders',                               R, C.receivePharmacyOrder);
healthcareRouter.get   ('/pharmacy/orders/mine',                          R, C.listMyPharmacyOrders);
healthcareRouter.post  ('/pharmacy/orders/:orderId/:action',              R, C.updatePharmacyOrder);

// ── Insurance ─────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/insurance/policies',                            R, C.registerPolicy);
healthcareRouter.get   ('/insurance/coverage',                            R, C.verifyCoverage);
healthcareRouter.post  ('/insurance/claims',                              R, C.submitClaim);
healthcareRouter.get   ('/insurance/claims/mine',                         R, C.listMyClaims);
healthcareRouter.post  ('/insurance/claims/:claimId/:action',             R, C.updateClaimStatus);

// ── Emergency ─────────────────────────────────────────────────────────────────
healthcareRouter.post  ('/emergency',                                     R, C.requestEmergency);
healthcareRouter.get   ('/emergency/active',                              R, C.listActiveEmergencies);
healthcareRouter.post  ('/emergency/:emergencyId/:action',                R, C.updateEmergencyStatus);

// ── Telemedicine ──────────────────────────────────────────────────────────────
healthcareRouter.post  ('/telemedicine/sessions',                         R, C.createTeleSession);
healthcareRouter.post  ('/telemedicine/sessions/:sessionId/start',        R, C.startTeleSession);
healthcareRouter.post  ('/telemedicine/sessions/:sessionId/end',          R, C.endTeleSession);
healthcareRouter.post  ('/telemedicine/sessions/:sessionId/follow-up',    R, C.scheduleFollowUp);

// ── AI Healthcare ─────────────────────────────────────────────────────────────
healthcareRouter.post  ('/ai/triage',                                     R, C.triageSymptoms);
healthcareRouter.get   ('/ai/medication-reminders',                       R, C.medicationReminders);
healthcareRouter.get   ('/ai/history/:patientId',                         R, C.summarizeMedicalHistory);
healthcareRouter.get   ('/ai/demand/:facilityId',                         R, C.predictDemand);

// ── Analytics ─────────────────────────────────────────────────────────────────
healthcareRouter.get   ('/analytics/:facilityId',                         R, C.getAnalytics);
healthcareRouter.get   ('/analytics/:facilityId/dashboard',               R, C.getDashboard);