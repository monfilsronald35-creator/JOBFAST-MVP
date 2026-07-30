// ——— Contract Type ————————————————————————————————————————————————————————
export enum ContractType {
  Employment  = 'employment',
  Freelance   = 'freelance',
  Service     = 'service',
  Internship  = 'internship',
  Temporary   = 'temporary',
}

// ——— Contract Status ——————————————————————————————————————————————————————
export enum ContractStatus {
  Draft      = 'draft',
  Sent       = 'sent',
  Active     = 'active',
  Completed  = 'completed',
  Terminated = 'terminated',
  Cancelled  = 'cancelled',
}

// ——— Contract entity ——————————————————————————————————————————————————————
export interface JobContract {
  id:                  string;
  jobId:               string;
  employerId:          string;
  workerId:            string;
  type:                ContractType;
  title?:              string;
  terms?:              string;
  salaryAmount:        number;   // integer minor units
  currency:            string;
  startDate:           string;
  endDate?:            string;
  status:              ContractStatus;
  employerSignedAt?:   string;
  workerSignedAt?:     string;
  terminatedAt?:       string;
  terminationReason?:  string;
  createdAt:           string;
  updatedAt:           string;
}

// ——— Schedule ——————————————————————————————————————————————————————————————
export enum ShiftStatus {
  Scheduled  = 'scheduled',
  Started    = 'started',
  Completed  = 'completed',
  Missed     = 'missed',
  Cancelled  = 'cancelled',
}

export interface WorkShift {
  id:         string;
  contractId: string;
  workerId:   string;
  shiftDate:  string;
  startTime:  string;
  endTime:    string;
  breakMins:  number;
  status:     ShiftStatus;
  notes?:     string;
  createdAt:  string;
}

// ——— Attendance ————————————————————————————————————————————————————————————
export interface AttendanceRecord {
  id:          string;
  scheduleId?: string;
  contractId:  string;
  workerId:    string;
  clockIn:     string;
  clockOut?:   string;
  hoursWorked?: number;
  status:      'present' | 'late' | 'absent' | 'half_day';
  lat?:        number;
  lng?:        number;
  notes?:      string;
  createdAt:   string;
}

// ——— Payroll ———————————————————————————————————————————————————————————————
export enum PayrollStatus {
  Pending   = 'pending',
  Approved  = 'approved',
  Processing= 'processing',
  Paid      = 'paid',
  Failed    = 'failed',
  Disputed  = 'disputed',
}

export interface PayrollRecord {
  id:           string;
  contractId:   string;
  employerId:   string;
  workerId:     string;
  periodStart:  string;
  periodEnd:    string;
  grossAmount:  number;   // integer minor units
  taxAmount:    number;
  bonusAmount:  number;
  netAmount:    number;
  currency:     string;
  status:       PayrollStatus;
  paidAt?:      string;
  paymentRef?:  string;
  createdAt:    string;
}
