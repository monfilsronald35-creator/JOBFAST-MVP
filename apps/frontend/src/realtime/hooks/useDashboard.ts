/**
 * useDashboard — live KPIs, analytics, visitors, revenue, sales, alerts.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { KPIPayload, LiveAnalyticsPayload, LiveAlertPayload } from '../types';

export interface UseDashboardOptions {
  readonly scope?: 'global' | 'admin' | string;
  readonly autoSubscribe?: boolean;
}

export interface UseDashboardReturn {
  readonly kpis:       Readonly<Record<string, KPIPayload>>;
  readonly analytics:  LiveAnalyticsPayload | null;
  readonly alerts:     readonly LiveAlertPayload[];
  readonly subscribe:  () => void;
  readonly unsubscribe: () => void;
  readonly acknowledgeAlert: (alertId: string, userId: string) => void;
  readonly requestSnapshot:  () => void;
}

export function useDashboard({ scope, autoSubscribe = true }: UseDashboardOptions = {}): UseDashboardReturn {
  const { dashboard } = useRealtimeContext();
  const [kpis,      setKPIs]      = useState<Record<string, KPIPayload>>({});
  const [analytics, setAnalytics] = useState<LiveAnalyticsPayload | null>(null);
  const [alerts,    setAlerts]    = useState<LiveAlertPayload[]>([]);

  useEffect(() => {
    const offKPI      = dashboard.onKPIUpdate(k =>
      setKPIs(prev => ({ ...prev, [k.metric]: k }))
    );
    const offKPIBatch = dashboard.onKPIBatch(batch => {
      setKPIs(prev => {
        const next = { ...prev };
        batch.forEach(k => { next[k.metric] = k; });
        return next;
      });
    });
    const offAnalytics = dashboard.onAnalyticsUpdate(setAnalytics);
    const offAlert     = dashboard.onAlert(a =>
      setAlerts(prev => [a, ...prev.filter(x => x._id !== a._id)].slice(0, 100))
    );
    const offSnap = dashboard.onSnapshot(({ kpis: k, analytics: a, alerts: al }) => {
      const kpiMap: Record<string, KPIPayload> = {};
      k.forEach(kpi => { kpiMap[kpi.metric] = kpi; });
      setKPIs(kpiMap);
      setAnalytics(a);
      setAlerts(al);
    });

    if (autoSubscribe) dashboard.subscribe(scope);

    return () => {
      offKPI(); offKPIBatch(); offAnalytics(); offAlert(); offSnap();
      if (autoSubscribe) dashboard.unsubscribe(scope);
    };
  }, [dashboard, scope, autoSubscribe]);

  const subscribe    = useCallback(() => dashboard.subscribe(scope), [dashboard, scope]);
  const unsubscribe  = useCallback(() => dashboard.unsubscribe(scope), [dashboard, scope]);
  const acknowledgeAlert = useCallback((alertId: string, userId: string) =>
    dashboard.acknowledgeAlert(alertId, userId), [dashboard]);
  const requestSnapshot  = useCallback(() => dashboard.requestSnapshot(), [dashboard]);

  return { kpis, analytics, alerts, subscribe, unsubscribe, acknowledgeAlert, requestSnapshot };
}