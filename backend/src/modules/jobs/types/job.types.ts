// ——— Job Type ————————————————————————————————————————————————————————————
export enum JobType {
  FullTime     = 'full_time',
  PartTime     = 'part_time',
  Contract     = 'contract',
  Freelance    = 'freelance',
  Internship   = 'internship',
  Temporary    = 'temporary',
  Seasonal     = 'seasonal',
  Remote       = 'remote',
  Hybrid       = 'hybrid',
  OnSite       = 'on_site',
  ShiftWork    = 'shift_work',
  Hourly       = 'hourly',
  Daily        = 'daily',
  Weekly       = 'weekly',
  Monthly      = 'monthly',
  ProjectBased = 'project_based',
  International= 'international',
}

// ——— Industry ——————————————————————————————————————————————————————————————
export enum Industry {
  Construction  = 'construction',
  Hospitality   = 'hospitality',
  Healthcare    = 'healthcare',
  Education     = 'education',
  Tourism       = 'tourism',
  Logistics     = 'logistics',
  Technology    = 'technology',
  Telecom       = 'telecom',
  Government    = 'government',
  Manufacturing = 'manufacturing',
  Agriculture   = 'agriculture',
  Retail        = 'retail',
  Banking       = 'banking',
  Insurance     = 'insurance',
  Legal         = 'legal',
  Energy        = 'energy',
  Transportation= 'transportation',
  Media         = 'media',
  Entertainment = 'entertainment',
  Other         = 'other',
}

// ——— Work Mode ————————————————————————————————————————————————————————————
export enum WorkMode {
  OnSite  = 'on_site',
  Remote  = 'remote',
  Hybrid  = 'hybrid',
}

// ——— Salary Period ————————————————————————————————————————————————————————
export enum SalaryPeriod {
  Hourly   = 'hourly',
  Daily    = 'daily',
  Weekly   = 'weekly',
  Monthly  = 'monthly',
  Yearly   = 'yearly',
  Project  = 'project',
}

// ——— Job Status (lifecycle) ————————————————————————————————————————————————
export enum JobStatus {
  Draft       = 'draft',
  Review      = 'review',
  Published   = 'published',
  Distributed = 'distributed',
  Screening   = 'screening',
  Interview   = 'interview',
  Hiring      = 'hiring',
  Contracted  = 'contracted',
  Active      = 'active',
  Completed   = 'completed',
  Cancelled   = 'cancelled',
  Archived    = 'archived',
  Expired     = 'expired',
}

// ——— Job entity ————————————————————————————————————————————————————————————
export interface JobPosting {
  id:               string;
  employerId:       string;
  title:            string;
  description:      string;
  responsibilities?: string;
  requirements?:    string;
  skills:           string[];
  experienceYears?: number;
  educationLevel?:  string;
  languages:        string[];
  // Compensation (integer minor units per governance)
  salaryMin?:       number;
  salaryMax?:       number;
  salaryPeriod?:    SalaryPeriod;
  currency:         string;
  benefits:         string[];
  // Classification
  category?:        string;
  industry:         string;
  jobType:          JobType;
  workMode:         WorkMode;
  // Location
  country?:         string;
  city?:            string;
  address?:         string;
  lat?:             number;
  lng?:             number;
  // Posting details
  positions:        number;
  deadline?:        string;
  status:           JobStatus;
  isUrgent:         boolean;
  isVerified:       boolean;
  isSponsored:      boolean;
  isInternational:  boolean;
  isRemoteOk:       boolean;
  // Stats
  viewsCount:       number;
  applicationsCount:number;
  hiredCount:       number;
  // Timestamps
  publishedAt?:     string;
  expiresAt?:       string;
  createdAt:        string;
  updatedAt:        string;
}

// ——— AI Match Score ————————————————————————————————————————————————————————
export interface JobMatchScore {
  id:           string;
  jobId:        string;
  workerId:     string;
  matchScore:   number;   // 0–100 overall
  skillsScore:  number;
  expScore:     number;
  distScore:    number;
  salaryScore:  number;
  langScore:    number;
  availScore:   number;
  repScore:     number;
  breakdown:    Record<string, unknown>;
  computedAt:   string;
}

// ——— Job Search filters ————————————————————————————————————————————————————
export interface JobSearchQuery {
  q?:           string;
  industry?:    string;
  jobType?:     string;
  workMode?:    string;
  country?:     string;
  city?:        string;
  skills?:      string[];
  salaryMin?:   number;
  salaryMax?:   number;
  currency?:    string;
  isUrgent?:    boolean;
  isRemoteOk?:  boolean;
  isVerified?:  boolean;
  isSponsored?: boolean;
  isInternational?: boolean;
  limit?:       number;
  cursor?:      string;
}
