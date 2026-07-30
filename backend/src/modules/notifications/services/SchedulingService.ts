import { db } from '../../../core/database/SupabaseClient.js';

export const SchedulingService = {
  async scheduleDelayed(notifId: string, runAt: string, timezone?: string | undefined): Promise<void> {
    const row: Record<string, unknown> = {
      notif_id:      notifId,
      schedule_type: 'delayed',
      run_at:        runAt,
    };
    if (timezone) row['timezone'] = timezone;
    await db.client().from('notif_schedules').insert(row);
  },

  async scheduleRecurring(notifId: string, cronExpr: string, timezone?: string | undefined): Promise<void> {
    const row: Record<string, unknown> = {
      notif_id:      notifId,
      schedule_type: 'recurring',
      run_at:        new Date().toISOString(),
      cron_expr:     cronExpr,
    };
    if (timezone) row['timezone'] = timezone;
    await db.client().from('notif_schedules').insert(row);
  },

  async getPendingSchedules(): Promise<Array<{ id: string; notifId: string }>> {
    const { data } = await db.client()
      .from('notif_schedules')
      .select('id, notif_id')
      .eq('processed', false)
      .lte('run_at', new Date().toISOString())
      .limit(50);
    return (data ?? []).map(r => ({
      id:      String((r as Record<string, unknown>)['id'] ?? ''),
      notifId: String((r as Record<string, unknown>)['notif_id'] ?? ''),
    }));
  },

  async markProcessed(scheduleId: string): Promise<void> {
    await db.client()
      .from('notif_schedules')
      .update({ processed: true })
      .eq('id', scheduleId);
  },
};