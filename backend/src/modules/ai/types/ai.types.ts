export enum UserRole {
  Worker       = 'worker',
  Client       = 'client',
  Hotel        = 'hotel',
  Restaurant   = 'restaurant',
  Company      = 'company',
  Tourist      = 'tourist',
  Telecom      = 'telecom',
  Marketplace  = 'marketplace',
  Admin        = 'admin',
}

export enum HomeWidgetType {
  JobsFeed          = 'jobs_feed',
  WalletSummary     = 'wallet_summary',
  ChatInbox         = 'chat_inbox',
  Notifications     = 'notifications',
  Reservations      = 'reservations',
  RevenueToday      = 'revenue_today',
  OrdersLive        = 'orders_live',
  GuestsList        = 'guests_list',
  Inventory         = 'inventory',
  Analytics         = 'analytics',
  NearbyJobs        = 'nearby_jobs',
  AISuggestions     = 'ai_suggestions',
  Opportunities     = 'opportunities',
  SavedJobs         = 'saved_jobs',
  KitchenOrders     = 'kitchen_orders',
  SubscriberStats   = 'subscriber_stats',
  PackageSales      = 'package_sales',
  FlightsWeather    = 'flights_weather',
  CityMap           = 'city_map',
  TouristEvents     = 'tourist_events',
  HiringPipeline    = 'hiring_pipeline',
  PayrollSummary    = 'payroll_summary',
  RiskAlerts        = 'risk_alerts',
  ForecastKPIs      = 'forecast_kpis',
}

export interface HomeWidget {
  type:     HomeWidgetType;
  title:    string;
  priority: number;
  data?:    Record<string, unknown> | undefined;
}

export interface HomeConfig {
  role:     string;
  widgets:  HomeWidget[];
  theme?:   string | undefined;
  lang:     string;
  timezone: string;
}

export interface BriefingItem {
  icon:    string;
  label:   string;
  value:   string;
  cta?:    string | undefined;
  ctaUrl?: string | undefined;
  priority: number;
}

export interface DailyBriefing {
  userId:      string;
  greeting:    string;
  date:        string;
  items:       BriefingItem[];
  generatedAt: string;
}

export interface Opportunity {
  id:          string;
  userId:      string;
  type:        string;
  title:       string;
  description: string;
  actionUrl?:  string | undefined;
  score:       number;
  expiresAt?:  string | undefined;
  createdAt:   string;
}

export interface CityDashboard {
  city:           string;
  country:        string;
  topJobs:        Array<{ title: string; avgSalary: number; count: number }>;
  avgHotelPrice:  number;
  avgMealPrice:   number;
  weather?:       string | undefined;
  events?:        string[] | undefined;
  economyRating:  number;
  touristRating:  number;
  updatedAt:      string;
}

export interface TravelPlan {
  day:       string;
  city:      string;
  slots:     Array<{
    time:     string;
    activity: string;
    venue?:   string | undefined;
    type:     'food' | 'leisure' | 'transport' | 'accommodation' | 'culture' | 'shopping';
    note?:    string | undefined;
  }>;
}

export interface BusinessKPIs {
  revenueToday:   number;
  revenueMTD:     number;
  salesCount:     number;
  topCustomers:   Array<{ name: string; revenue: number }>;
  riskAlerts:     string[];
  inventoryAlert: string[];
  openPositions:  number;
  demandForecast: string;
  growthRate:     number;
  currency:       string;
}

export interface ExperienceScore {
  userId:            string;
  date:              string;
  appSpeedScore:     number;
  searchSuccessRate: number;
  bookingSuccessRate: number;
  jobSuccessRate:    number;
  paymentSuccessRate: number;
  avgResponseTimeMs: number;
  notifOpenRate:     number;
  conversionRate:    number;
  overallScore:      number;
}

export interface UserContext {
  userId:        string;
  role:          string;
  country:       string;
  lang:          string;
  timezone:      string;
  lat?:          number | undefined;
  lng?:          number | undefined;
  subscription?: string | undefined;
  deviceType?:   string | undefined;
  isOnline:      boolean;
  localHour:     number;
}

export interface AIPreference {
  userId:              string;
  briefingEnabled:     boolean;
  opportunitiesEnabled: boolean;
  cityIntelEnabled:    boolean;
  personalizationLevel: 'minimal' | 'standard' | 'full';
  shareLocation:       boolean;
  shareHistory:        boolean;
  updatedAt:           string;
}