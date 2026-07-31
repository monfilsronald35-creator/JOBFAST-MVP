import { HomeWidgetType, UserRole } from '../types/ai.types.js';
import type { HomeConfig, HomeWidget, UserContext } from '../types/ai.types.js';

const ROLE_WIDGETS: Record<string, HomeWidget[]> = {
  [UserRole.Worker]: [
    { type: HomeWidgetType.JobsFeed,      title: 'Nouvo Travay',       priority: 1 },
    { type: HomeWidgetType.WalletSummary, title: 'Wallet',             priority: 2 },
    { type: HomeWidgetType.ChatInbox,     title: 'Mesaj',              priority: 3 },
    { type: HomeWidgetType.SavedJobs,     title: 'Travay Saved',       priority: 4 },
    { type: HomeWidgetType.NearbyJobs,    title: 'Travay Toupre',      priority: 5 },
    { type: HomeWidgetType.AISuggestions, title: 'AI Sijesyon',        priority: 6 },
    { type: HomeWidgetType.Notifications, title: 'Notifikasyon',       priority: 7 },
  ],
  [UserRole.Client]: [
    { type: HomeWidgetType.AISuggestions, title: 'Travayè Rekòmande',  priority: 1 },
    { type: HomeWidgetType.JobsFeed,      title: 'Travay Poste',       priority: 2 },
    { type: HomeWidgetType.WalletSummary, title: 'Wallet',             priority: 3 },
    { type: HomeWidgetType.ChatInbox,     title: 'Mesaj',              priority: 4 },
    { type: HomeWidgetType.Notifications, title: 'Notifikasyon',       priority: 5 },
  ],
  [UserRole.Hotel]: [
    { type: HomeWidgetType.Reservations,  title: 'Rezèvasyon',         priority: 1 },
    { type: HomeWidgetType.RevenueToday,  title: 'Revni Jodi a',       priority: 2 },
    { type: HomeWidgetType.GuestsList,    title: 'Envite',             priority: 3 },
    { type: HomeWidgetType.Analytics,     title: 'Analitik',           priority: 4 },
    { type: HomeWidgetType.WalletSummary, title: 'Peman',              priority: 5 },
    { type: HomeWidgetType.Notifications, title: 'Alèt',               priority: 6 },
  ],
  [UserRole.Restaurant]: [
    { type: HomeWidgetType.OrdersLive,    title: 'Kòmand',             priority: 1 },
    { type: HomeWidgetType.Reservations,  title: 'Rezèvasyon',         priority: 2 },
    { type: HomeWidgetType.KitchenOrders, title: 'Kwizin',             priority: 3 },
    { type: HomeWidgetType.Inventory,     title: 'Envantè',            priority: 4 },
    { type: HomeWidgetType.RevenueToday,  title: 'Revni',              priority: 5 },
    { type: HomeWidgetType.Analytics,     title: 'Analitik',           priority: 6 },
  ],
  [UserRole.Telecom]: [
    { type: HomeWidgetType.PackageSales,  title: 'Pakè Lanse',         priority: 1 },
    { type: HomeWidgetType.SubscriberStats, title: 'Abòne',            priority: 2 },
    { type: HomeWidgetType.RevenueToday,  title: 'Revni',              priority: 3 },
    { type: HomeWidgetType.Analytics,     title: 'Analitik',           priority: 4 },
    { type: HomeWidgetType.Notifications, title: 'Alèt',               priority: 5 },
  ],
  [UserRole.Marketplace]: [
    { type: HomeWidgetType.OrdersLive,    title: 'Kòmand',             priority: 1 },
    { type: HomeWidgetType.Inventory,     title: 'Pwodwi',             priority: 2 },
    { type: HomeWidgetType.RevenueToday,  title: 'Revni',              priority: 3 },
    { type: HomeWidgetType.Analytics,     title: 'Kliyan',             priority: 4 },
    { type: HomeWidgetType.Notifications, title: 'Pwomosyon',          priority: 5 },
  ],
  [UserRole.Company]: [
    { type: HomeWidgetType.HiringPipeline, title: 'Kandida',           priority: 1 },
    { type: HomeWidgetType.Analytics,     title: 'Pwojè',              priority: 2 },
    { type: HomeWidgetType.PayrollSummary, title: 'Pèman',             priority: 3 },
    { type: HomeWidgetType.ForecastKPIs,  title: 'Rapò',               priority: 4 },
    { type: HomeWidgetType.RiskAlerts,    title: 'Alèt',               priority: 5 },
  ],
  [UserRole.Tourist]: [
    { type: HomeWidgetType.FlightsWeather, title: 'Vòl ak Tan',        priority: 1 },
    { type: HomeWidgetType.Reservations,  title: 'Otèl',               priority: 2 },
    { type: HomeWidgetType.CityMap,       title: 'Kat Vil',            priority: 3 },
    { type: HomeWidgetType.TouristEvents, title: 'Evènman',            priority: 4 },
    { type: HomeWidgetType.AISuggestions, title: 'Plan Jodi a',        priority: 5 },
    { type: HomeWidgetType.WalletSummary, title: 'Monnaie',            priority: 6 },
  ],
};

const DEFAULT_WIDGETS: HomeWidget[] = [
  { type: HomeWidgetType.Notifications, title: 'Notifikasyon', priority: 1 },
  { type: HomeWidgetType.WalletSummary, title: 'Wallet',       priority: 2 },
  { type: HomeWidgetType.ChatInbox,     title: 'Mesaj',        priority: 3 },
];

export const SmartHomeEngine = {
  buildConfig(ctx: UserContext): HomeConfig {
    const widgets = ROLE_WIDGETS[ctx.role] ?? DEFAULT_WIDGETS;
    return {
      role:     ctx.role,
      widgets:  [...widgets].sort((a, b) => a.priority - b.priority),
      lang:     ctx.lang,
      timezone: ctx.timezone,
    };
  },
};