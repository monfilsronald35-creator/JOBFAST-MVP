// ——— Application Status ——————————————————————————————————————————————————
export enum ApplicationStatus {
  Applied              = 'applied',
  Screening            = 'screening',
  Shortlisted          = 'shortlisted',
  InterviewScheduled   = 'interview_scheduled',
  InterviewCompleted   = 'interview_completed',
  OfferSent            = 'offer_sent',
  OfferAccepted        = 'offer_accepted',
  Hired                = 'hired',
  Onboarding           = 'onboarding',
  Active               = 'active',
  Completed            = 'completed',
  Rejected             = 'rejected',
  Withdrawn            = 'withdrawn',
}

// ——— Hiring Pipeline Stage ——————————————————————————————————————————————
export enum PipelineStage {
  Applied              = 'applied',
  Shortlisted          = 'shortlisted',
  InterviewScheduled   = 'interview_scheduled',
  InterviewCompleted   = 'interview_completed',
  OfferSent            = 'offer_sent',
  OfferAccepted        = 'offer_accepted',
  Hired                = 'hired',
  Onboarding           = 'onboarding',
  Active               = 'active',
  Completed            = 'completed',
}

// ——— Application entity ————————————————————————————————————————————————
export interface JobApplication {
  id:            string;
  jobId:         string;
  applicantId:   string;
  status:        ApplicationStatus;
  coverLetter?:  string;
  resumeUrl?:    string;
  videoUrl?:     string;
  portfolioUrls: string[];
  matchScore?:   number;
  notes?:        string;
  appliedAt:     string;
  updatedAt:     string;
}

// ——— Pipeline stage record ————————————————————————————————————————————
export interface PipelineRecord {
  id:              string;
  applicationId:   string;
  stage:           PipelineStage;
  scheduledAt?:    string;
  completedAt?:    string;
  notes?:          string;
  metadata:        Record<string, unknown>;
  createdAt:       string;
}

// ——— Status transition map ————————————————————————————————————————————
export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.Applied]:            [ApplicationStatus.Screening, ApplicationStatus.Shortlisted, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.Screening]:          [ApplicationStatus.Shortlisted, ApplicationStatus.Rejected],
  [ApplicationStatus.Shortlisted]:        [ApplicationStatus.InterviewScheduled, ApplicationStatus.Rejected],
  [ApplicationStatus.InterviewScheduled]: [ApplicationStatus.InterviewCompleted, ApplicationStatus.Rejected],
  [ApplicationStatus.InterviewCompleted]: [ApplicationStatus.OfferSent, ApplicationStatus.Rejected],
  [ApplicationStatus.OfferSent]:          [ApplicationStatus.OfferAccepted, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.OfferAccepted]:      [ApplicationStatus.Hired],
  [ApplicationStatus.Hired]:              [ApplicationStatus.Onboarding],
  [ApplicationStatus.Onboarding]:         [ApplicationStatus.Active],
  [ApplicationStatus.Active]:             [ApplicationStatus.Completed],
  [ApplicationStatus.Completed]:          [],
  [ApplicationStatus.Rejected]:           [],
  [ApplicationStatus.Withdrawn]:          [],
};
