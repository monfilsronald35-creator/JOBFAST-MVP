export interface EventLog {
  id: string;

  event_type: string;

  service_name: string | null;

  correlation_id: string | null;

  payload: Record<string, unknown> | null;

  status: string;

  retry_count: number;

  processed_at: string | null;

  event_version: string;

  event_source: string | null;

  priority: number;

  next_retry_at: string;

  error_message: string | null;

  worker_id: string | null;

  created_at: string;
}
