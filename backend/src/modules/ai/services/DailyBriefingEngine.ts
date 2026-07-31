import { db }                   from '../../../core/database/SupabaseClient.js';
import { ExperienceRepository }  from '../repositories/ExperienceRepository.js';
import { PersonalizationEngine } from './PersonalizationEngine.js';
import type { DailyBriefing, BriefingItem, UserContext } from '../types/ai.types.js';

async function fetchWalletBalance(userId: string): Promise<{ balance: number; currency: string } | null> {
  const { data } = await db.client()
    .from('wlt_wallets')
    .select('available_balance, currency')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return { balance: Number(r['available_balance'] ?? 0), currency: String(r['currency'] ?? 'HTG') };
}

async function fetchUnreadMessages(userId: string): Promise<number> {
  const { count } = await db.client()
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .neq('sender_id', userId);
  return count ?? 0;
}

async function fetchUnreadNotifications(userId: string): Promise<number> {
  const { count } = await db.client()
    .from('notif_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count ?? 0;
}

async function fetchNewJobs(country: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.client()
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('country', country)
    .gte('created_at', since);
  return count ?? 0;
}

async function fetchNewClients(userId: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { count } = await db.client()
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', userId)
    .gte('created_at', since);
  return count ?? 0;
}

async function fetchTodayRevenue(userId: string): Promise<{ amount: number; currency: string } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await db.client()
    .from('wlt_transactions')
    .select('amount, currency')
    .eq('user_id', userId)
    .eq('type', 'credit')
    .gte('created_at', `${today}T00:00:00Z`);
  if (!data || data.length === 0) return null;
  const rows = data as Array<Record<string, unknown>>;
  const total = rows.reduce((s, r) => s + Number(r['amount'] ?? 0), 0);
  return { amount: total, currency: String(rows[0]?.['currency'] ?? 'HTG') };
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export const DailyBriefingEngine = {
  async generate(ctx: UserContext, fullName: string): Promise<DailyBriefing> {
    const today = new Date().toISOString().slice(0, 10);

    // Return cached briefing if fresh
    const cached = await ExperienceRepository.getBriefing(ctx.userId, today);
    if (cached) return cached;

    const greeting = PersonalizationEngine.getGreeting(fullName, ctx.localHour, ctx.lang);
    const items: BriefingItem[] = [];

    // Aggregate concurrently
    const [wallet, messages, notifications, newJobs, revenue] = await Promise.all([
      fetchWalletBalance(ctx.userId),
      fetchUnreadMessages(ctx.userId),
      fetchUnreadNotifications(ctx.userId),
      ctx.role === 'worker' || ctx.role === 'client' ? fetchNewJobs(ctx.country) : Promise.resolve(0),
      ctx.role === 'worker' || ctx.role === 'company' ? fetchTodayRevenue(ctx.userId) : Promise.resolve(null),
    ]);

    // New jobs
    if (newJobs > 0) {
      items.push({
        icon: '💼', label: 'Nouvo travay', value: `${newJobs}`,
        cta: 'Wè travay yo', ctaUrl: '/jobs', priority: 1,
      });
    }

    // New clients (workers)
    if (ctx.role === 'worker') {
      const clients = await fetchNewClients(ctx.userId);
      if (clients > 0) {
        items.push({ icon: '👤', label: 'Nouvo kliyan', value: `${clients}`, priority: 2 });
      }
    }

    // Wallet balance
    if (wallet) {
      items.push({
        icon: '💰', label: 'Wallet', value: formatMoney(wallet.balance, wallet.currency),
        cta: 'Wè detay', ctaUrl: '/wallet', priority: 3,
      });
    }

    // Today's revenue
    if (revenue && revenue.amount > 0) {
      items.push({
        icon: '📈', label: "Revni jodi a", value: formatMoney(revenue.amount, revenue.currency),
        ctaUrl: '/wallet', priority: 3,
      });
    }

    // Messages
    if (messages > 0) {
      items.push({
        icon: '💬', label: 'Mesaj', value: `${messages}`,
        cta: 'Lire mesaj', ctaUrl: '/chat', priority: 4,
      });
    }

    // Notifications
    if (notifications > 0) {
      items.push({
        icon: '🔔', label: 'Notifikasyon', value: `${notifications}`,
        ctaUrl: '/notifications', priority: 5,
      });
    }

    // Weather stub (real integration requires external API key)
    items.push({
      icon: '🌤️', label: 'Tan', value: '29°C', priority: 6,
    });

    // AI recommendation stub
    items.push({
      icon: '🤖', label: 'AI rekòmande', value: 'Eseye aplikayon pou 5 travay jodi a',
      cta: 'Wè rekòmandasyon', ctaUrl: '/ai/opportunities', priority: 7,
    });

    const briefing: DailyBriefing = {
      userId:      ctx.userId,
      greeting,
      date:        today,
      items:       items.sort((a, b) => a.priority - b.priority),
      generatedAt: new Date().toISOString(),
    };

    void ExperienceRepository.saveBriefing(briefing);
    return briefing;
  },

  async invalidate(userId: string): Promise<void> {
    await db.client()
      .from('ai_briefings')
      .update({ expires_at: new Date().toISOString() })
      .eq('user_id', userId);
  },
};