export type ExtPresenceStatus =
  | 'online' | 'offline' | 'away' | 'busy' | 'invisible'
  | 'typing' | 'recording_voice' | 'recording_video';

export type GpsRole =
  | 'worker' | 'taxi' | 'courier' | 'shuttle'
  | 'guide' | 'delivery' | 'emergency' | 'company_vehicle';

export type SyncOpType = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id:       string;
  type:     SyncOpType;
  entity:   string;
  entityId: string;
  data:     Record<string, unknown>;
  ts:       number;
}

export interface GpsUpdate {
  userId:   string;
  lat:      number;
  lng:      number;
  role:     GpsRole;
  speed?:   number;
  heading?: number;
  ts:       number;
}

export interface PresenceSnapshot {
  userId:   string;
  status:   ExtPresenceStatus;
  lastSeen: string | null;
}

export interface DashboardMetrics {
  users:         number;
  openJobs:      number;
  pendingOrders: number;
  ts:            number;
}

export interface AnalyticsLiveMetrics {
  activeUsers:      number;
  connectedSockets: number;
  ts:               number;
}