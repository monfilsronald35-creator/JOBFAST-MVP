import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { EventEnvelope }    from '../../../core/events/DomainEvent.js';
import { EVENT_NAMES }           from '@shared-events';
import { ExperienceRepository }  from '../repositories/ExperienceRepository.js';
import { PersonalizationEngine } from './PersonalizationEngine.js';
import type { Opportunity }      from '../types/ai.types.js';
import { db }                    from '../../../core/database/SupabaseClient.js';

function pld<T>(ev: EventEnvelope): T {
  return (ev.payload as unknown) as T;
}

function genId(): string {
  return `opp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function saveOpp(opp: Opportunity): Promise<void> {
  try {
    await ExperienceRepository.saveOpportunity(opp);
  } catch { /* non-critical */ }
}

async function getUserLang(userId: string): Promise<string> {
  const { data } = await db.client()
    .from('profiles')
    .select('language')
    .eq('id', userId)
    .single();
  return String((data as Record<string, unknown> | null)?.['language'] ?? 'ht');
}

export function registerRecommendationPipeline(): void {
  // ── New job posted → notify matching workers ───────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.JOB_CREATED as string, async (ev: EventEnvelope) => {
    const payload = pld<{ jobId: string; category: string; budget: number; currency: string; clientId: string }>(ev);

    const { data: workers } = await db.client()
      .from('profiles')
      .select('id, language')
      .eq('role', 'worker')
      .limit(50);

    for (const w of workers ?? []) {
      const wRec = w as Record<string, unknown>;
      const wId  = String(wRec['id'] ?? '');
      const lang = String(wRec['language'] ?? 'ht');
      if (!wId) continue;

      const opp: Opportunity = {
        id:          genId(),
        userId:      wId,
        type:        'job',
        title:       lang === 'en' ? 'New Job Available' : 'Nouvo Travay Disponib',
        description: lang === 'en'
          ? `A new ${payload.category} job has been posted`
          : `Yon nouvo travay ${payload.category} te poste`,
        actionUrl:   `/jobs/${payload.jobId}`,
        score:       75,
        expiresAt:   new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt:   new Date().toISOString(),
      };
      await saveOpp(opp);
    }
  });

  // ── Job completed → recommend review / repeat booking ─────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.JOB_COMPLETED, async (ev: EventEnvelope) => {
    const payload = pld<{ jobId: string; workerId: string; clientId: string }>(ev);

    const [workerLang, clientLang] = await Promise.all([
      getUserLang(payload.workerId),
      getUserLang(payload.clientId),
    ]);

    await saveOpp({
      id:          genId(),
      userId:      payload.workerId,
      type:        'service',
      title:       workerLang === 'en' ? 'Boost Your Profile' : 'Ranfòse Pwofil Ou',
      description: workerLang === 'en'
        ? 'Your job was completed! Ask the client for a review'
        : 'Travay ou te fini! Mande kliyan an yon avis',
      actionUrl:   `/jobs/${payload.jobId}/review`,
      score:       80,
      expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt:   new Date().toISOString(),
    });

    await saveOpp({
      id:          genId(),
      userId:      payload.clientId,
      type:        'service',
      title:       clientLang === 'en' ? 'Book Again' : 'Rezève Ankò',
      description: clientLang === 'en'
        ? 'Your job was completed successfully. Book this worker again?'
        : 'Travay ou te fini avèk siksè. Rezève travayè sa a ankò?',
      actionUrl:   `/workers/${payload.workerId}`,
      score:       70,
      expiresAt:   new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt:   new Date().toISOString(),
    });
  });

  // ── Payment received → suggest wallet ────────────────────────────────────
  TypedEventBus.subscribe('payment.completed', async (ev: EventEnvelope) => {
    const payload = pld<{ userId: string; amount: number; currency: string }>(ev);
    const lang    = await getUserLang(payload.userId);

    await saveOpp({
      id:          genId(),
      userId:      payload.userId,
      type:        'financial',
      title:       lang === 'en' ? 'Payment Received' : 'Peman Resevwa',
      description: lang === 'en'
        ? `You received ${payload.amount / 100} ${payload.currency}. Consider saving or reinvesting.`
        : `Ou resevwa ${payload.amount / 100} ${payload.currency}. Konsidere ekonomize oswa reinvesti.`,
      actionUrl:   '/wallet',
      score:       60,
      expiresAt:   new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt:   new Date().toISOString(),
    });
  });

  // ── New chat message → suggest profile completion ─────────────────────────
  TypedEventBus.subscribe('chat.message.sent', async (ev: EventEnvelope) => {
    const payload = pld<{ senderId: string; recipientId: string }>(ev);
    const userId  = payload.recipientId;
    if (!userId) return;
    const lang = await getUserLang(userId);

    const { data: p } = await db.client()
      .from('profiles')
      .select('bio, avatar_url')
      .eq('id', userId)
      .single();
    const prof = p as Record<string, unknown> | null;
    if (prof && (!prof['bio'] || !prof['avatar_url'])) {
      await saveOpp({
        id:          genId(),
        userId,
        type:        'profile',
        title:       lang === 'en' ? 'Complete Your Profile' : 'Konplete Pwofil Ou',
        description: lang === 'en'
          ? 'A complete profile gets 3x more responses'
          : 'Yon pwofil konplè resevwa 3x plis repons',
        actionUrl:   '/profile/edit',
        score:       65,
        expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt:   new Date().toISOString(),
      });
    }
  });

  // ── User registered → welcome + onboarding ────────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.USER_REGISTERED, async (ev: EventEnvelope) => {
    const payload = pld<{ userId: string; role: string }>(ev);
    const lang    = await getUserLang(payload.userId);
    const ctx     = await PersonalizationEngine.buildContext(payload.userId, {});

    await saveOpp({
      id:          genId(),
      userId:      payload.userId,
      type:        'profile',
      title:       lang === 'en' ? 'Welcome to Jobfast!' : 'Byenveni nan Jobfast!',
      description: lang === 'en'
        ? 'Complete your profile to start earning'
        : 'Konplete pwofil ou pou kòmanse touche',
      actionUrl:   '/profile/edit',
      score:       90,
      expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt:   new Date().toISOString(),
    });

    void ctx;
  });

  // ── Wallet credited → notify ──────────────────────────────────────────────
  TypedEventBus.subscribe('wallet.credited', async (ev: EventEnvelope) => {
    const payload = pld<{ userId: string; amount: number; currency: string }>(ev);
    const lang    = await getUserLang(payload.userId);

    await saveOpp({
      id:          genId(),
      userId:      payload.userId,
      type:        'financial',
      title:       lang === 'en' ? 'Wallet Credited' : 'Pòtmonè Krédite',
      description: lang === 'en'
        ? `${payload.amount / 100} ${payload.currency} added to your wallet`
        : `${payload.amount / 100} ${payload.currency} ajoute nan pòtmonè ou`,
      actionUrl:   '/wallet',
      score:       55,
      expiresAt:   new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt:   new Date().toISOString(),
    });
  });
}