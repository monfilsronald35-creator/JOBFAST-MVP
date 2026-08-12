// ── Business Management Engine V5.0 ──────────────────────────────────────
//
// All 24 tables are FRONTEND SAFE (no backend-only tables in this migration).
//
// NEVER fields:
//   businesses.tax_id                        — sensitive financial identifier (EIN equivalent)
//   business_reviews_summary.ai_sentiment_score — AI behavioral scoring signal; enables gaming
//   business_dashboard_metrics.ai_health_score  — AI behavioral scoring signal; enables gaming
//
// Excluded (non-NEVER, still internal):
//   business_job_applications.notes — internal recruiter evaluation notes;
//       applicants can query their own records via RLS and must not see recruiter feedback
//
// Pending FK note:
//   business_wallet_links.wallet_id references wallet_accounts(id) which was
//   dropped by the prior migration. Types/service are valid; FK becomes active
//   once the new wallet migration runs.

// ── Core Business ─────────────────────────────────────────────────────────

export const INDUSTRY_TYPES = [
  'restaurant', 'hotel', 'retail', 'real_estate', 'hospital', 'school',
  'agency', 'logistics', 'technology', 'other',
] as const;
export type IndustryType = typeof INDUSTRY_TYPES[number];

export const BUSINESS_STATUSES = ['active', 'suspended', 'under_review', 'closed'] as const;
export type BusinessStatus = typeof BUSINESS_STATUSES[number];

export interface Business {
  id: string;
  profileId: string | null;
  businessName: string;
  industryType: IndustryType;
  registrationNumber: string | null;
  // tax_id excluded — NEVER (sensitive financial identifier; EIN equivalent)
  email: string;
  phone: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  currency: string;
  status: BusinessStatus;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Branches ──────────────────────────────────────────────────────────────

export interface BusinessBranch {
  id: string;
  businessId: string;
  managerProfileId: string | null;
  branchName: string;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
}

// ── Departments & Roles ───────────────────────────────────────────────────

export interface BusinessDepartment {
  id: string;
  businessId: string;
  departmentName: string;
  createdAt: string;
}

export interface BusinessRole {
  id: string;
  businessId: string;
  roleName: string;
  permissions: Record<string, unknown>;
  createdAt: string;
}

// ── Employees, Attendance & Payroll ──────────────────────────────────────

export const EMPLOYMENT_TYPES_BIZ = ['full_time', 'part_time', 'contractor', 'intern'] as const;
export type EmploymentTypeBiz = typeof EMPLOYMENT_TYPES_BIZ[number];

export const EMPLOYEE_STATUSES = ['active', 'on_leave', 'terminated', 'resigned'] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUSES[number];

export interface BusinessEmployee {
  id: string;
  businessId: string;
  profileId: string;
  branchId: string | null;
  departmentId: string | null;
  businessRoleId: string | null;
  roleTitle: string;
  employmentType: EmploymentTypeBiz;
  salary: number;
  status: EmployeeStatus;
  hiredAt: string;
  createdAt: string;
}

export const ATTENDANCE_STATUSES = ['present', 'late', 'absent', 'on_leave'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export interface BusinessAttendance {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
}

export const PAYROLL_STATUSES = ['pending', 'approved', 'paid'] as const;
export type PayrollStatus = typeof PAYROLL_STATUSES[number];

export interface BusinessPayroll {
  id: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  paidAt: string | null;
  createdAt: string;
}

// ── Suppliers, Products & Inventory ──────────────────────────────────────

export interface BusinessSupplier {
  id: string;
  businessId: string;
  supplierName: string;
  contactEmail: string | null;
  phone: string | null;
  category: string | null;
  createdAt: string;
}

export interface BusinessProduct {
  id: string;
  businessId: string;
  supplierId: string | null;
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  costPrice: number;
  isService: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BusinessInventoryStock {
  id: string;
  productId: string;
  branchId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export const INVENTORY_TRANSACTION_TYPES = ['purchase', 'sale', 'return', 'adjustment', 'damage'] as const;
export type InventoryTransactionType = typeof INVENTORY_TRANSACTION_TYPES[number];

export interface BusinessInventoryTransaction {
  id: string;
  productId: string;
  branchId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  createdAt: string;
}

// ── Recruitment ───────────────────────────────────────────────────────────

export const APPLICATION_STATUSES = ['submitted', 'reviewing', 'interview', 'accepted', 'rejected'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export interface BusinessJobApplication {
  id: string;
  businessId: string;
  jobId: string | null;
  applicantProfileId: string;
  status: ApplicationStatus;
  resumeUrl: string | null;
  interviewDate: string | null;
  // notes excluded — internal recruiter evaluation; applicants can query own record via RLS
  createdAt: string;
}

// ── CRM & Support ─────────────────────────────────────────────────────────

export interface BusinessCustomer {
  id: string;
  businessId: string;
  profileId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  customerGroup: string;
  loyaltyPoints: number;
  totalSpent: number;
  notes: string | null;
  createdAt: string;
}

export interface BusinessReviewsSummary {
  businessId: string;
  averageRating: number;
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  // ai_sentiment_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  updatedAt: string;
}

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = typeof TICKET_PRIORITIES[number];

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = typeof TICKET_STATUSES[number];

export interface BusinessSupportTicket {
  id: string;
  businessId: string;
  customerId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
}

// ── Bookings & Orders ─────────────────────────────────────────────────────

export const BOOKING_TYPES = ['hotel', 'restaurant', 'appointment', 'rental'] as const;
export type BookingType = typeof BOOKING_TYPES[number];

export const BOOKING_STATUSES = ['reserved', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];

export interface BusinessBooking {
  id: string;
  businessId: string;
  branchId: string | null;
  customerId: string | null;
  bookingType: BookingType;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: BookingStatus;
  bookingDetails: Record<string, unknown>;
  createdAt: string;
}

export interface BusinessWalletLink {
  businessId: string;
  walletId: string | null;
  createdAt: string;
}

export const ORDER_TYPES = ['retail', 'service', 'wholesale'] as const;
export type OrderType = typeof ORDER_TYPES[number];

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export interface BusinessOrder {
  id: string;
  businessId: string;
  branchId: string | null;
  customerId: string | null;
  orderType: OrderType;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: OrderStatus;
  shippingDetails: Record<string, unknown>;
  itemsDetail: unknown[];
  createdAt: string;
}

export const INVOICE_STATUSES = ['draft', 'unpaid', 'paid', 'overdue', 'cancelled'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export interface BusinessInvoice {
  id: string;
  businessId: string;
  customerId: string | null;
  orderId: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: InvoiceStatus;
  createdAt: string;
}

// ── Campaigns, Analytics & AI ─────────────────────────────────────────────

export const CAMPAIGN_STATUSES_BIZ = ['draft', 'active', 'paused', 'completed'] as const;
export type CampaignStatusBiz = typeof CAMPAIGN_STATUSES_BIZ[number];

export interface BusinessCampaign {
  id: string;
  businessId: string;
  campaignName: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: CampaignStatusBiz;
  aiOptimizationNotes: string | null;
  createdAt: string;
}

export interface BusinessDashboardMetrics {
  id: string;
  businessId: string;
  revenueToday: number;
  revenueMonth: number;
  totalOrders: number;
  totalCustomers: number;
  activeEmployees: number;
  averageRating: number;
  conversionRate: number;
  // ai_health_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  updatedAt: string;
}

export interface BusinessAnalytics {
  id: string;
  businessId: string;
  metricType: string;
  metricValue: number;
  metadata: Record<string, unknown>;
  recordedDate: string;
}

export const AI_REC_PRIORITIES = ['info', 'warning', 'urgent'] as const;
export type AiRecPriority = typeof AI_REC_PRIORITIES[number];

export interface BusinessAiRecommendation {
  id: string;
  businessId: string;
  recommendationType: string;
  message: string;
  priority: AiRecPriority;
  createdAt: string;
}

export const INSIGHT_TYPES = ['revenue_prediction', 'hiring_suggestion', 'fraud_detection', 'inventory_forecast', 'health_score'] as const;
export type InsightType = typeof INSIGHT_TYPES[number];

export const INSIGHT_SEVERITIES = ['info', 'warning', 'critical', 'success'] as const;
export type InsightSeverity = typeof INSIGHT_SEVERITIES[number];

export interface BusinessAiInsight {
  id: string;
  businessId: string;
  insightType: InsightType;
  title: string;
  description: string;
  metricsData: Record<string, unknown>;
  severity: InsightSeverity;
  createdAt: string;
}
