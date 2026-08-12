import { supabase } from '../../lib/supabase';
import type { EventLog } from '../../types/foundation';

export async function getEventLogs(limit = 50): Promise<EventLog[]> {
  const { data, error } = await supabase
    .from('event_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as EventLog[];
}
