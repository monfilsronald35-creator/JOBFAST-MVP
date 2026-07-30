/**
 * useJobFeed — live job feed, instant match, application status.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type {
  LiveJobPayload, JobMatchPayload,
  ApplicationUpdatePayload, AvailabilityPayload,
} from '../types';

export interface JobFeedFilters {
  readonly category?:  string;
  readonly lat?:       number;
  readonly lng?:       number;
  readonly radiusKm?:  number;
  readonly minBudget?: number;
}

export interface UseJobFeedReturn {
  readonly jobs:           readonly LiveJobPayload[];
  readonly matches:        readonly JobMatchPayload[];
  readonly applicationUpdates: readonly ApplicationUpdatePayload[];
  readonly subscribe:      (filters?: JobFeedFilters) => void;
  readonly unsubscribe:    () => void;
  readonly publishAvailability: (payload: AvailabilityPayload) => void;
  readonly apply:          (jobId: string, message?: string) => void;
}

export function useJobFeed(userId?: string): UseJobFeedReturn {
  const { jobs: jobChannel, isConnected } = useRealtimeContext();
  const [jobs,   setJobs]   = useState<LiveJobPayload[]>([]);
  const [matches, setMatches] = useState<JobMatchPayload[]>([]);
  const [appUpdates, setAppUpdates] = useState<ApplicationUpdatePayload[]>([]);

  useEffect(() => {
    const offNew     = jobChannel.onNewJob(j =>
      setJobs(prev => [j, ...prev.filter(p => p._id !== j._id)].slice(0, 100))
    );
    const offUpdated = jobChannel.onJobUpdated(u =>
      setJobs(prev => prev.map(j => j._id === u._id ? { ...j, ...u } : j))
    );
    const offClosed  = jobChannel.onJobClosed(({ jobId }) =>
      setJobs(prev => prev.filter(j => j._id !== jobId))
    );
    const offMatch   = jobChannel.onInstantMatch(m =>
      setMatches(prev => [m, ...prev].slice(0, 20))
    );
    const offApp     = jobChannel.onApplicationUpdate(u =>
      setAppUpdates(prev => [u, ...prev.filter(a => a.applicationId !== u.applicationId)])
    );

    return () => { offNew(); offUpdated(); offClosed(); offMatch(); offApp(); };
  }, [jobChannel]);

  const subscribe = useCallback((filters?: JobFeedFilters) =>
    jobChannel.subscribeToFeed(filters), [jobChannel]);

  const unsubscribe = useCallback(() =>
    jobChannel.unsubscribeFromFeed(), [jobChannel]);

  const publishAvailability = useCallback((payload: AvailabilityPayload) =>
    jobChannel.publishAvailability(payload), [jobChannel]);

  const apply = useCallback((jobId: string, message?: string) => {
    if (!userId) return;
    jobChannel.applyToJob(jobId, userId, message);
  }, [jobChannel, userId]);

  return {
    jobs, matches, applicationUpdates: appUpdates,
    subscribe, unsubscribe, publishAvailability, apply,
  };
}