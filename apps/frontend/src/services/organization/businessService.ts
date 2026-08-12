import { supabase } from '../../lib/supabase';
import type {
  Business,
  IndustryType,
  BusinessStatus,
  BusinessBranch,
  BusinessDepartment,
  BusinessRole,
  BusinessEmployee,
  EmploymentTypeBiz,
  EmployeeStatus,
  BusinessAttendance,
  AttendanceStatus,
  BusinessPayroll,
  PayrollStatus,
  BusinessSupplier,
  BusinessProduct,
  BusinessInventoryStock,
  BusinessInventoryTransaction,
  InventoryTransactionType,
  BusinessJobApplication,
  ApplicationStatus,
  BusinessCustomer,
  BusinessReviewsSummary,
  BusinessSupportTicket,
  TicketStatus,
  TicketPriority,
  BusinessBooking,
  BookingType,
  BookingStatus,
  BusinessWalletLink,
  BusinessOrder,
  OrderStatus,
  OrderType,
  BusinessInvoice,
  InvoiceStatus,
  BusinessCampaign,
  CampaignStatusBiz,
  BusinessDashboardMetrics,
  BusinessAnalytics,
  BusinessAiRecommendation,
  BusinessAiInsight,
  InsightType,
} from '../../types/business';

// All 24 tables in Business Management Engine V5.0 are FRONTEND SAFE.
//
// Sensitive field exclusions applied in column constants below:
//   businesses.tax_id                        — NEVER (EIN equivalent; sensitive financial identifier)
//   business_reviews_summary.ai_sentiment_score — NEVER (AI behavioral scoring signal)
//   business_dashboard_metrics.ai_health_score  — NEVER (AI behavioral scoring signal)
//   business_job_applications.notes             — internal recruiter notes; must not reach applicants

// ── Column constants ───────────────────────────────────────────────────────

const BIZ_COLS = [
  'id', 'profile_id', 'business_name', 'industry_type', 'registration_number',
  'email', 'phone', 'logo_url', 'banner_url', 'currency', 'status', 'settings',
  'created_at', 'updated_at',
].join(', ');
// tax_id excluded — NEVER (sensitive financial identifier; EIN equivalent)

const BRANCH_COLS = 'id, business_id, manager_profile_id, branch_name, address, city, country, phone, is_main, is_active, created_at';
const DEPT_COLS = 'id, business_id, department_name, created_at';
const ROLE_COLS = 'id, business_id, role_name, permissions, created_at';
const EMPLOYEE_COLS = 'id, business_id, profile_id, branch_id, department_id, business_role_id, role_title, employment_type, salary, status, hired_at, created_at';
const ATTENDANCE_COLS = 'id, employee_id, clock_in, clock_out, total_hours, status, notes, created_at';
const PAYROLL_COLS = 'id, employee_id, pay_period_start, pay_period_end, base_salary, bonuses, deductions, net_pay, status, paid_at, created_at';
const SUPPLIER_COLS = 'id, business_id, supplier_name, contact_email, phone, category, created_at';
const PRODUCT_COLS = 'id, business_id, supplier_id, name, sku, category, price, cost_price, is_service, is_active, metadata, created_at';
const STOCK_COLS = 'id, product_id, branch_id, stock_quantity, low_stock_threshold, updated_at';
const INV_TX_COLS = 'id, product_id, branch_id, transaction_type, quantity, created_at';
const JOB_APP_COLS = 'id, business_id, job_id, applicant_profile_id, status, resume_url, interview_date, created_at';
// notes excluded — internal recruiter evaluation; applicants can query own record via RLS
const CUSTOMER_COLS = 'id, business_id, profile_id, full_name, email, phone, customer_group, loyalty_points, total_spent, notes, created_at';
const REVIEW_SUMMARY_COLS = 'business_id, average_rating, total_reviews, positive_reviews, negative_reviews, updated_at';
// ai_sentiment_score excluded — NEVER (AI behavioral scoring signal)
const TICKET_COLS = 'id, business_id, customer_id, subject, description, priority, status, created_at';
const BOOKING_COLS = 'id, business_id, branch_id, customer_id, booking_type, start_time, end_time, total_amount, status, booking_details, created_at';
const WALLET_LINK_COLS = 'business_id, wallet_id, created_at';
const ORDER_COLS = 'id, business_id, branch_id, customer_id, order_type, total_amount, tax_amount, discount_amount, status, shipping_details, items_detail, created_at';
const INVOICE_COLS = 'id, business_id, customer_id, order_id, invoice_number, issue_date, due_date, subtotal, tax_total, grand_total, status, created_at';
const CAMPAIGN_COLS = 'id, business_id, campaign_name, budget, spent, impressions, clicks, conversions, status, ai_optimization_notes, created_at';
const METRICS_COLS = 'id, business_id, revenue_today, revenue_month, total_orders, total_customers, active_employees, average_rating, conversion_rate, updated_at';
// ai_health_score excluded — NEVER (AI behavioral scoring signal)
const ANALYTICS_COLS = 'id, business_id, metric_type, metric_value, metadata, recorded_date';
const AI_REC_COLS = 'id, business_id, recommendation_type, message, priority, created_at';
const AI_INSIGHT_COLS = 'id, business_id, insight_type, title, description, metrics_data, severity, created_at';

// ── Row types ─────────────────────────────────────────────────────────────

type BizRow = { id: string; profile_id: string | null; business_name: string; industry_type: IndustryType; registration_number: string | null; email: string; phone: string | null; logo_url: string | null; banner_url: string | null; currency: string; status: BusinessStatus; settings: Record<string, unknown>; created_at: string; updated_at: string; };
type BranchRow = { id: string; business_id: string; manager_profile_id: string | null; branch_name: string; address: string; city: string; country: string; phone: string | null; is_main: boolean; is_active: boolean; created_at: string; };
type DeptRow = { id: string; business_id: string; department_name: string; created_at: string; };
type RoleRow = { id: string; business_id: string; role_name: string; permissions: Record<string, unknown>; created_at: string; };
type EmployeeRow = { id: string; business_id: string; profile_id: string; branch_id: string | null; department_id: string | null; business_role_id: string | null; role_title: string; employment_type: EmploymentTypeBiz; salary: number; status: EmployeeStatus; hired_at: string; created_at: string; };
type AttendanceRow = { id: string; employee_id: string; clock_in: string; clock_out: string | null; total_hours: number; status: AttendanceStatus; notes: string | null; created_at: string; };
type PayrollRow = { id: string; employee_id: string; pay_period_start: string; pay_period_end: string; base_salary: number; bonuses: number; deductions: number; net_pay: number; status: PayrollStatus; paid_at: string | null; created_at: string; };
type SupplierRow = { id: string; business_id: string; supplier_name: string; contact_email: string | null; phone: string | null; category: string | null; created_at: string; };
type ProductRow = { id: string; business_id: string; supplier_id: string | null; name: string; sku: string | null; category: string | null; price: number; cost_price: number; is_service: boolean; is_active: boolean; metadata: Record<string, unknown>; created_at: string; };
type StockRow = { id: string; product_id: string; branch_id: string; stock_quantity: number; low_stock_threshold: number; updated_at: string; };
type InvTxRow = { id: string; product_id: string; branch_id: string; transaction_type: InventoryTransactionType; quantity: number; created_at: string; };
type JobAppRow = { id: string; business_id: string; job_id: string | null; applicant_profile_id: string; status: ApplicationStatus; resume_url: string | null; interview_date: string | null; created_at: string; };
type CustomerRow = { id: string; business_id: string; profile_id: string | null; full_name: string; email: string | null; phone: string | null; customer_group: string; loyalty_points: number; total_spent: number; notes: string | null; created_at: string; };
type ReviewSummaryRow = { business_id: string; average_rating: number; total_reviews: number; positive_reviews: number; negative_reviews: number; updated_at: string; };
type TicketRow = { id: string; business_id: string; customer_id: string; subject: string; description: string; priority: TicketPriority; status: TicketStatus; created_at: string; };
type BookingRow = { id: string; business_id: string; branch_id: string | null; customer_id: string | null; booking_type: BookingType; start_time: string; end_time: string; total_amount: number; status: BookingStatus; booking_details: Record<string, unknown>; created_at: string; };
type WalletLinkRow = { business_id: string; wallet_id: string | null; created_at: string; };
type OrderRow = { id: string; business_id: string; branch_id: string | null; customer_id: string | null; order_type: OrderType; total_amount: number; tax_amount: number; discount_amount: number; status: OrderStatus; shipping_details: Record<string, unknown>; items_detail: unknown[]; created_at: string; };
type InvoiceRow = { id: string; business_id: string; customer_id: string | null; order_id: string | null; invoice_number: string; issue_date: string; due_date: string; subtotal: number; tax_total: number; grand_total: number; status: InvoiceStatus; created_at: string; };
type CampaignRow = { id: string; business_id: string; campaign_name: string; budget: number; spent: number; impressions: number; clicks: number; conversions: number; status: CampaignStatusBiz; ai_optimization_notes: string | null; created_at: string; };
type MetricsRow = { id: string; business_id: string; revenue_today: number; revenue_month: number; total_orders: number; total_customers: number; active_employees: number; average_rating: number; conversion_rate: number; updated_at: string; };
type AnalyticsRow = { id: string; business_id: string; metric_type: string; metric_value: number; metadata: Record<string, unknown>; recorded_date: string; };
type AiRecRow = { id: string; business_id: string; recommendation_type: string; message: string; priority: BusinessAiRecommendation['priority']; created_at: string; };
type AiInsightRow = { id: string; business_id: string; insight_type: InsightType; title: string; description: string; metrics_data: Record<string, unknown>; severity: BusinessAiInsight['severity']; created_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapBiz = (r: BizRow): Business => ({ id: r.id, profileId: r.profile_id, businessName: r.business_name, industryType: r.industry_type, registrationNumber: r.registration_number, email: r.email, phone: r.phone, logoUrl: r.logo_url, bannerUrl: r.banner_url, currency: r.currency, status: r.status, settings: r.settings, createdAt: r.created_at, updatedAt: r.updated_at });
const mapBranch = (r: BranchRow): BusinessBranch => ({ id: r.id, businessId: r.business_id, managerProfileId: r.manager_profile_id, branchName: r.branch_name, address: r.address, city: r.city, country: r.country, phone: r.phone, isMain: r.is_main, isActive: r.is_active, createdAt: r.created_at });
const mapDept = (r: DeptRow): BusinessDepartment => ({ id: r.id, businessId: r.business_id, departmentName: r.department_name, createdAt: r.created_at });
const mapRole = (r: RoleRow): BusinessRole => ({ id: r.id, businessId: r.business_id, roleName: r.role_name, permissions: r.permissions, createdAt: r.created_at });
const mapEmployee = (r: EmployeeRow): BusinessEmployee => ({ id: r.id, businessId: r.business_id, profileId: r.profile_id, branchId: r.branch_id, departmentId: r.department_id, businessRoleId: r.business_role_id, roleTitle: r.role_title, employmentType: r.employment_type, salary: r.salary, status: r.status, hiredAt: r.hired_at, createdAt: r.created_at });
const mapAttendance = (r: AttendanceRow): BusinessAttendance => ({ id: r.id, employeeId: r.employee_id, clockIn: r.clock_in, clockOut: r.clock_out, totalHours: r.total_hours, status: r.status, notes: r.notes, createdAt: r.created_at });
const mapPayroll = (r: PayrollRow): BusinessPayroll => ({ id: r.id, employeeId: r.employee_id, payPeriodStart: r.pay_period_start, payPeriodEnd: r.pay_period_end, baseSalary: r.base_salary, bonuses: r.bonuses, deductions: r.deductions, netPay: r.net_pay, status: r.status, paidAt: r.paid_at, createdAt: r.created_at });
const mapSupplier = (r: SupplierRow): BusinessSupplier => ({ id: r.id, businessId: r.business_id, supplierName: r.supplier_name, contactEmail: r.contact_email, phone: r.phone, category: r.category, createdAt: r.created_at });
const mapProduct = (r: ProductRow): BusinessProduct => ({ id: r.id, businessId: r.business_id, supplierId: r.supplier_id, name: r.name, sku: r.sku, category: r.category, price: r.price, costPrice: r.cost_price, isService: r.is_service, isActive: r.is_active, metadata: r.metadata, createdAt: r.created_at });
const mapStock = (r: StockRow): BusinessInventoryStock => ({ id: r.id, productId: r.product_id, branchId: r.branch_id, stockQuantity: r.stock_quantity, lowStockThreshold: r.low_stock_threshold, updatedAt: r.updated_at });
const mapInvTx = (r: InvTxRow): BusinessInventoryTransaction => ({ id: r.id, productId: r.product_id, branchId: r.branch_id, transactionType: r.transaction_type, quantity: r.quantity, createdAt: r.created_at });
const mapJobApp = (r: JobAppRow): BusinessJobApplication => ({ id: r.id, businessId: r.business_id, jobId: r.job_id, applicantProfileId: r.applicant_profile_id, status: r.status, resumeUrl: r.resume_url, interviewDate: r.interview_date, createdAt: r.created_at });
const mapCustomer = (r: CustomerRow): BusinessCustomer => ({ id: r.id, businessId: r.business_id, profileId: r.profile_id, fullName: r.full_name, email: r.email, phone: r.phone, customerGroup: r.customer_group, loyaltyPoints: r.loyalty_points, totalSpent: r.total_spent, notes: r.notes, createdAt: r.created_at });
const mapReviewSummary = (r: ReviewSummaryRow): BusinessReviewsSummary => ({ businessId: r.business_id, averageRating: r.average_rating, totalReviews: r.total_reviews, positiveReviews: r.positive_reviews, negativeReviews: r.negative_reviews, updatedAt: r.updated_at });
const mapTicket = (r: TicketRow): BusinessSupportTicket => ({ id: r.id, businessId: r.business_id, customerId: r.customer_id, subject: r.subject, description: r.description, priority: r.priority, status: r.status, createdAt: r.created_at });
const mapBooking = (r: BookingRow): BusinessBooking => ({ id: r.id, businessId: r.business_id, branchId: r.branch_id, customerId: r.customer_id, bookingType: r.booking_type, startTime: r.start_time, endTime: r.end_time, totalAmount: r.total_amount, status: r.status, bookingDetails: r.booking_details, createdAt: r.created_at });
const mapWalletLink = (r: WalletLinkRow): BusinessWalletLink => ({ businessId: r.business_id, walletId: r.wallet_id, createdAt: r.created_at });
const mapOrder = (r: OrderRow): BusinessOrder => ({ id: r.id, businessId: r.business_id, branchId: r.branch_id, customerId: r.customer_id, orderType: r.order_type, totalAmount: r.total_amount, taxAmount: r.tax_amount, discountAmount: r.discount_amount, status: r.status, shippingDetails: r.shipping_details, itemsDetail: r.items_detail, createdAt: r.created_at });
const mapInvoice = (r: InvoiceRow): BusinessInvoice => ({ id: r.id, businessId: r.business_id, customerId: r.customer_id, orderId: r.order_id, invoiceNumber: r.invoice_number, issueDate: r.issue_date, dueDate: r.due_date, subtotal: r.subtotal, taxTotal: r.tax_total, grandTotal: r.grand_total, status: r.status, createdAt: r.created_at });
const mapCampaign = (r: CampaignRow): BusinessCampaign => ({ id: r.id, businessId: r.business_id, campaignName: r.campaign_name, budget: r.budget, spent: r.spent, impressions: r.impressions, clicks: r.clicks, conversions: r.conversions, status: r.status, aiOptimizationNotes: r.ai_optimization_notes, createdAt: r.created_at });
const mapMetrics = (r: MetricsRow): BusinessDashboardMetrics => ({ id: r.id, businessId: r.business_id, revenueToday: r.revenue_today, revenueMonth: r.revenue_month, totalOrders: r.total_orders, totalCustomers: r.total_customers, activeEmployees: r.active_employees, averageRating: r.average_rating, conversionRate: r.conversion_rate, updatedAt: r.updated_at });
const mapAnalytics = (r: AnalyticsRow): BusinessAnalytics => ({ id: r.id, businessId: r.business_id, metricType: r.metric_type, metricValue: r.metric_value, metadata: r.metadata, recordedDate: r.recorded_date });
const mapAiRec = (r: AiRecRow): BusinessAiRecommendation => ({ id: r.id, businessId: r.business_id, recommendationType: r.recommendation_type, message: r.message, priority: r.priority, createdAt: r.created_at });
const mapAiInsight = (r: AiInsightRow): BusinessAiInsight => ({ id: r.id, businessId: r.business_id, insightType: r.insight_type, title: r.title, description: r.description, metricsData: r.metrics_data, severity: r.severity, createdAt: r.created_at });

// ── Business functions ────────────────────────────────────────────────────

export async function getMyBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase.from('businesses').select(BIZ_COLS).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BizRow[]).map(mapBiz);
}

export async function getBusiness(id: string): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select(BIZ_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapBiz(data as BizRow) : null;
}

export async function getBusinessesByIndustry(industryType: IndustryType, options: { status?: BusinessStatus; limit?: number } = {}): Promise<Business[]> {
  let q = supabase.from('businesses').select(BIZ_COLS).eq('industry_type', industryType);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.limit(options.limit ?? 50);
  if (error) throw error;
  return (data as BizRow[]).map(mapBiz);
}

// ── Branch functions ──────────────────────────────────────────────────────

export async function getBusinessBranches(businessId: string): Promise<BusinessBranch[]> {
  const { data, error } = await supabase.from('business_branches').select(BRANCH_COLS).eq('business_id', businessId).eq('is_active', true).order('is_main', { ascending: false });
  if (error) throw error;
  return (data as BranchRow[]).map(mapBranch);
}

export async function getBranch(id: string): Promise<BusinessBranch | null> {
  const { data, error } = await supabase.from('business_branches').select(BRANCH_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapBranch(data as BranchRow) : null;
}

// ── Department & Role functions ───────────────────────────────────────────

export async function getBusinessDepartments(businessId: string): Promise<BusinessDepartment[]> {
  const { data, error } = await supabase.from('business_departments').select(DEPT_COLS).eq('business_id', businessId).order('department_name');
  if (error) throw error;
  return (data as DeptRow[]).map(mapDept);
}

export async function getBusinessRoles(businessId: string): Promise<BusinessRole[]> {
  const { data, error } = await supabase.from('business_roles').select(ROLE_COLS).eq('business_id', businessId).order('role_name');
  if (error) throw error;
  return (data as RoleRow[]).map(mapRole);
}

// ── Employee functions ────────────────────────────────────────────────────

export async function getBusinessEmployees(businessId: string, options: { status?: EmployeeStatus; branchId?: string; departmentId?: string; limit?: number } = {}): Promise<BusinessEmployee[]> {
  let q = supabase.from('business_employees').select(EMPLOYEE_COLS).eq('business_id', businessId);
  if (options.status) q = q.eq('status', options.status);
  if (options.branchId) q = q.eq('branch_id', options.branchId);
  if (options.departmentId) q = q.eq('department_id', options.departmentId);
  const { data, error } = await q.order('hired_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as EmployeeRow[]).map(mapEmployee);
}

export async function getMyEmployeeRecord(businessId: string): Promise<BusinessEmployee | null> {
  const { data, error } = await supabase.from('business_employees').select(EMPLOYEE_COLS).eq('business_id', businessId).maybeSingle();
  if (error) throw error;
  return data ? mapEmployee(data as EmployeeRow) : null;
}

// ── Attendance functions ──────────────────────────────────────────────────

export async function getEmployeeAttendance(employeeId: string, options: { from?: string; to?: string; status?: AttendanceStatus; limit?: number } = {}): Promise<BusinessAttendance[]> {
  let q = supabase.from('business_attendance').select(ATTENDANCE_COLS).eq('employee_id', employeeId);
  if (options.from) q = q.gte('clock_in', options.from);
  if (options.to) q = q.lte('clock_in', options.to);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('clock_in', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AttendanceRow[]).map(mapAttendance);
}

// ── Payroll functions ─────────────────────────────────────────────────────

export async function getEmployeePayroll(employeeId: string, options: { status?: PayrollStatus; limit?: number } = {}): Promise<BusinessPayroll[]> {
  let q = supabase.from('business_payroll').select(PAYROLL_COLS).eq('employee_id', employeeId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('pay_period_start', { ascending: false }).limit(options.limit ?? 24);
  if (error) throw error;
  return (data as PayrollRow[]).map(mapPayroll);
}

export async function getPendingPayrolls(businessId: string): Promise<BusinessPayroll[]> {
  const { data, error } = await supabase.from('business_payroll').select(`${PAYROLL_COLS}, business_employees!inner(business_id)`).eq('business_employees.business_id', businessId).eq('status', 'pending').order('pay_period_start', { ascending: false });
  if (error) throw error;
  return (data as PayrollRow[]).map(mapPayroll);
}

// ── Supplier functions ────────────────────────────────────────────────────

export async function getBusinessSuppliers(businessId: string, options: { category?: string; limit?: number } = {}): Promise<BusinessSupplier[]> {
  let q = supabase.from('business_suppliers').select(SUPPLIER_COLS).eq('business_id', businessId);
  if (options.category) q = q.eq('category', options.category);
  const { data, error } = await q.order('supplier_name').limit(options.limit ?? 100);
  if (error) throw error;
  return (data as SupplierRow[]).map(mapSupplier);
}

// ── Product functions ─────────────────────────────────────────────────────

export async function getBusinessProducts(businessId: string, options: { category?: string; isService?: boolean; isActive?: boolean; limit?: number } = {}): Promise<BusinessProduct[]> {
  let q = supabase.from('business_products').select(PRODUCT_COLS).eq('business_id', businessId);
  if (options.category) q = q.eq('category', options.category);
  if (options.isService !== undefined) q = q.eq('is_service', options.isService);
  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);
  const { data, error } = await q.order('name').limit(options.limit ?? 100);
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getLowStockProducts(businessId: string): Promise<BusinessInventoryStock[]> {
  const { data, error } = await supabase.from('business_inventory_stock').select(`${STOCK_COLS}, business_products!inner(business_id)`).eq('business_products.business_id', businessId).filter('stock_quantity', 'lte', 'low_stock_threshold');
  if (error) throw error;
  return (data as StockRow[]).map(mapStock);
}

export async function getBranchInventory(branchId: string): Promise<BusinessInventoryStock[]> {
  const { data, error } = await supabase.from('business_inventory_stock').select(STOCK_COLS).eq('branch_id', branchId).order('stock_quantity', { ascending: true });
  if (error) throw error;
  return (data as StockRow[]).map(mapStock);
}

export async function getInventoryTransactions(productId: string, options: { transactionType?: InventoryTransactionType; limit?: number } = {}): Promise<BusinessInventoryTransaction[]> {
  let q = supabase.from('business_inventory_transactions').select(INV_TX_COLS).eq('product_id', productId);
  if (options.transactionType) q = q.eq('transaction_type', options.transactionType);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as InvTxRow[]).map(mapInvTx);
}

// ── Recruitment functions ─────────────────────────────────────────────────

export async function getJobApplications(businessId: string, options: { jobId?: string; status?: ApplicationStatus; limit?: number } = {}): Promise<BusinessJobApplication[]> {
  let q = supabase.from('business_job_applications').select(JOB_APP_COLS).eq('business_id', businessId);
  if (options.jobId) q = q.eq('job_id', options.jobId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as JobAppRow[]).map(mapJobApp);
}

export async function getMyApplicationsForBusiness(businessId: string): Promise<BusinessJobApplication[]> {
  const { data, error } = await supabase.from('business_job_applications').select(JOB_APP_COLS).eq('business_id', businessId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobAppRow[]).map(mapJobApp);
}

// ── Customer functions ────────────────────────────────────────────────────

export async function getBusinessCustomers(businessId: string, options: { customerGroup?: string; limit?: number; before?: string } = {}): Promise<BusinessCustomer[]> {
  let q = supabase.from('business_customers').select(CUSTOMER_COLS).eq('business_id', businessId);
  if (options.customerGroup) q = q.eq('customer_group', options.customerGroup);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as CustomerRow[]).map(mapCustomer);
}

export async function getTopCustomers(businessId: string, options: { limit?: number } = {}): Promise<BusinessCustomer[]> {
  const { data, error } = await supabase.from('business_customers').select(CUSTOMER_COLS).eq('business_id', businessId).order('total_spent', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as CustomerRow[]).map(mapCustomer);
}

// ── Reviews & Support functions ───────────────────────────────────────────

export async function getBusinessReviewsSummary(businessId: string): Promise<BusinessReviewsSummary | null> {
  const { data, error } = await supabase.from('business_reviews_summary').select(REVIEW_SUMMARY_COLS).eq('business_id', businessId).single();
  if (error) throw error;
  return data ? mapReviewSummary(data as ReviewSummaryRow) : null;
}

export async function getSupportTickets(businessId: string, options: { status?: TicketStatus; priority?: TicketPriority; limit?: number } = {}): Promise<BusinessSupportTicket[]> {
  let q = supabase.from('business_support_tickets').select(TICKET_COLS).eq('business_id', businessId);
  if (options.status) q = q.eq('status', options.status);
  if (options.priority) q = q.eq('priority', options.priority);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TicketRow[]).map(mapTicket);
}

// ── Booking functions ─────────────────────────────────────────────────────

export async function getBusinessBookings(businessId: string, options: { bookingType?: BookingType; status?: BookingStatus; from?: string; to?: string; limit?: number } = {}): Promise<BusinessBooking[]> {
  let q = supabase.from('business_bookings').select(BOOKING_COLS).eq('business_id', businessId);
  if (options.bookingType) q = q.eq('booking_type', options.bookingType);
  if (options.status) q = q.eq('status', options.status);
  if (options.from) q = q.gte('start_time', options.from);
  if (options.to) q = q.lte('start_time', options.to);
  const { data, error } = await q.order('start_time', { ascending: true }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
}

export async function getUpcomingBookings(businessId: string, options: { limit?: number } = {}): Promise<BusinessBooking[]> {
  const { data, error } = await supabase.from('business_bookings').select(BOOKING_COLS).eq('business_id', businessId).in('status', ['reserved', 'confirmed']).gt('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
}

// ── Wallet link functions ─────────────────────────────────────────────────

export async function getBusinessWalletLink(businessId: string): Promise<BusinessWalletLink | null> {
  const { data, error } = await supabase.from('business_wallet_links').select(WALLET_LINK_COLS).eq('business_id', businessId).maybeSingle();
  if (error) throw error;
  return data ? mapWalletLink(data as WalletLinkRow) : null;
}

// ── Order functions ───────────────────────────────────────────────────────

export async function getBusinessOrders(businessId: string, options: { status?: OrderStatus; orderType?: string; limit?: number; before?: string } = {}): Promise<BusinessOrder[]> {
  let q = supabase.from('business_orders').select(ORDER_COLS).eq('business_id', businessId);
  if (options.status) q = q.eq('status', options.status);
  if (options.orderType) q = q.eq('order_type', options.orderType);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as OrderRow[]).map(mapOrder);
}

export async function getOrder(id: string): Promise<BusinessOrder | null> {
  const { data, error } = await supabase.from('business_orders').select(ORDER_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

// ── Invoice functions ─────────────────────────────────────────────────────

export async function getBusinessInvoices(businessId: string, options: { status?: InvoiceStatus; limit?: number } = {}): Promise<BusinessInvoice[]> {
  let q = supabase.from('business_invoices').select(INVOICE_COLS).eq('business_id', businessId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as InvoiceRow[]).map(mapInvoice);
}

export async function getOverdueInvoices(businessId: string): Promise<BusinessInvoice[]> {
  const { data, error } = await supabase.from('business_invoices').select(INVOICE_COLS).eq('business_id', businessId).eq('status', 'overdue').order('due_date', { ascending: true });
  if (error) throw error;
  return (data as InvoiceRow[]).map(mapInvoice);
}

// ── Campaign functions ────────────────────────────────────────────────────

export async function getBusinessCampaigns(businessId: string, options: { status?: CampaignStatusBiz; limit?: number } = {}): Promise<BusinessCampaign[]> {
  let q = supabase.from('business_campaigns').select(CAMPAIGN_COLS).eq('business_id', businessId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CampaignRow[]).map(mapCampaign);
}

// ── Dashboard & Analytics functions ──────────────────────────────────────

export async function getDashboardMetrics(businessId: string): Promise<BusinessDashboardMetrics | null> {
  const { data, error } = await supabase.from('business_dashboard_metrics').select(METRICS_COLS).eq('business_id', businessId).single();
  if (error) throw error;
  return data ? mapMetrics(data as MetricsRow) : null;
}

export async function getBusinessAnalytics(businessId: string, options: { metricType?: string; from?: string; to?: string; limit?: number } = {}): Promise<BusinessAnalytics[]> {
  let q = supabase.from('business_analytics').select(ANALYTICS_COLS).eq('business_id', businessId);
  if (options.metricType) q = q.eq('metric_type', options.metricType);
  if (options.from) q = q.gte('recorded_date', options.from);
  if (options.to) q = q.lte('recorded_date', options.to);
  const { data, error } = await q.order('recorded_date', { ascending: false }).limit(options.limit ?? 90);
  if (error) throw error;
  return (data as AnalyticsRow[]).map(mapAnalytics);
}

// ── AI functions ──────────────────────────────────────────────────────────

export async function getAiRecommendations(businessId: string, options: { limit?: number } = {}): Promise<BusinessAiRecommendation[]> {
  const { data, error } = await supabase.from('business_ai_recommendations').select(AI_REC_COLS).eq('business_id', businessId).order('created_at', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as AiRecRow[]).map(mapAiRec);
}

export async function getAiInsights(businessId: string, options: { insightType?: InsightType; limit?: number } = {}): Promise<BusinessAiInsight[]> {
  let q = supabase.from('business_ai_insights').select(AI_INSIGHT_COLS).eq('business_id', businessId);
  if (options.insightType) q = q.eq('insight_type', options.insightType);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as AiInsightRow[]).map(mapAiInsight);
}
