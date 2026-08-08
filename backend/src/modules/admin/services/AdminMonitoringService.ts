import { db } from '../../../core/database/SupabaseClient.js';

export type MonitorEventType =
  | 'transaction' | 'user_join' | 'job_posted' | 'message_sent'
  | 'payment' | 'wallet_op' | 'booking' | 'notification'
  | 'api_error' | 'search' | 'ai_request';

export interface MonitorEvent {
  id: string;
  type: MonitorEventType;
  userId?: string;
  service: string;
  summary: string;
  amount?: number;
  currency?: string;
  country?: string;
  at: number;
}

export const AdminMonitoringService = {
  async getLiveFeed(limit = 50, since?: number): Promise<MonitorEvent[]> {
    const events: MonitorEvent[] = [];

    // Recent transactions
    let txQ = db.client()
      .from('mon_revenue_events')
      .select('id, service, user_id, fee_amount, currency, country, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 2));
    if (since) txQ = txQ.gt('created_at', new Date(since).toISOString());

    const { data: txData } = await txQ;
    for (const row of ((txData ?? []) as Record<string, unknown>[])) {
      const e: MonitorEvent = {
        id:      row['id']      as string,
        type:    'transaction',
        service: row['service'] as string,
        summary: `${row['service'] as string}: ${(row['fee_amount'] as number) ?? 0} ${row['currency'] as string ?? 'HTG'} fee collected`,
        at:      new Date(row['created_at'] as string).getTime(),
      };
      if (row['user_id'])  e.userId   = row['user_id']   as string;
      if (row['fee_amount']) e.amount  = row['fee_amount'] as number;
      if (row['currency'])   e.currency = row['currency']  as string;
      if (row['country'])    e.country  = row['country']   as string;
      events.push(e);
    }

    // Recent new users
    let usersQ = db.client()
      .from('profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 4));
    if (since) usersQ = usersQ.gt('created_at', new Date(since).toISOString());

    const { data: usersData } = await usersQ;
    for (const row of ((usersData ?? []) as Record<string, unknown>[])) {
      events.push({
        id:      row['id']   as string,
        type:    'user_join',
        userId:  row['id']   as string,
        service: 'auth',
        summary: `Nouvo itilizatè rejiste: ${row['name'] as string} (${row['role'] as string})`,
        at:      new Date(row['created_at'] as string).getTime(),
      });
    }

    // Recent jobs
    let jobsQ = db.client()
      .from('jobs')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 4));
    if (since) jobsQ = jobsQ.gt('created_at', new Date(since).toISOString());

    const { data: jobsData } = await jobsQ;
    for (const row of ((jobsData ?? []) as Record<string, unknown>[])) {
      events.push({
        id:      row['id']    as string,
        type:    'job_posted',
        service: 'jobs',
        summary: `Nouvo travay: ${row['title'] as string}`,
        at:      new Date(row['created_at'] as string).getTime(),
      });
    }

    return events
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  },

  async getRecentErrors(limit = 20): Promise<Array<{ message: string; service: string; at: number; count: number }>> {
    // Placeholder — real implementation would query an error/log table
    return [];
  },
};
