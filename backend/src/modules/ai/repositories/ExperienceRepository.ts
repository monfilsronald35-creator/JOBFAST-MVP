import { db }              from '../../../core/database/SupabaseClient.js';
import type {
  DailyBriefing, BriefingItem, AIPreference, Opportunity, ExperienceScore,
} from '../types/ai.types.js';

export const ExperienceRepository = {
  // ── Briefings ──────────────────────────────────────────────────────────────
  async getBriefing(userId: string, date: string): Promise<DailyBriefing | null> {
    const { data } = await db.client()
      .from('ai_briefings')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      userId:      userId,
      greeting:    String(r['greeting'] ?? ''),
      date,
      items:       (r['items'] as BriefingItem[]) ?? [],
      generatedAt: String(r['generated_at'] ?? ''),
    };
  },

  async saveBriefing(briefing: DailyBriefing): Promise<void> {
    await db.client().from('ai_briefings').upsert({
      user_id:      briefing.userId,
      date:         briefing.date,
      greeting:     briefing.greeting,
      items:        briefing.items,
      generated_at: briefing.generatedAt,
      expires_at:   new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    }, { onConflict: 'user_id,date' });
  },

  // ── Preferences ────────────────────────────────────────────────────────────
  async getPreferences(userId: string): Promise<AIPreference | null> {
    const { data } = await db.client()
      .from('ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      userId:               userId,
      briefingEnabled:      Boolean(r['briefing_enabled']      ?? true),
      opportunitiesEnabled: Boolean(r['opportunities_enabled'] ?? true),
      cityIntelEnabled:     Boolean(r['city_intel_enabled']    ?? true),
      personalizationLevel: (r['personalization_level'] as AIPreference['personalizationLevel']) ?? 'standard',
      shareLocation:        Boolean(r['share_location']  ?? false),
      shareHistory:         Boolean(r['share_history']   ?? true),
      updatedAt:            String(r['updated_at'] ?? ''),
    };
  },

  async savePreferences(pref: AIPreference): Promise<void> {
    await db.client().from('ai_preferences').upsert({
      user_id:               pref.userId,
      briefing_enabled:      pref.briefingEnabled,
      opportunities_enabled: pref.opportunitiesEnabled,
      city_intel_enabled:    pref.cityIntelEnabled,
      personalization_level: pref.personalizationLevel,
      share_location:        pref.shareLocation,
      share_history:         pref.shareHistory,
    }, { onConflict: 'user_id' });
  },

  // ── Opportunities ──────────────────────────────────────────────────────────
  async listOpportunities(userId: string, limit = 10): Promise<Opportunity[]> {
    const { data } = await db.client()
      .from('ai_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_seen', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('score', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      const opp: Opportunity = {
        id:          String(row['id'] ?? ''),
        userId,
        type:        String(row['type'] ?? ''),
        title:       String(row['title'] ?? ''),
        description: String(row['description'] ?? ''),
        score:       Number(row['score'] ?? 0),
        createdAt:   String(row['created_at'] ?? ''),
      };
      if (row['action_url']) opp.actionUrl = String(row['action_url']);
      if (row['expires_at']) opp.expiresAt = String(row['expires_at']);
      return opp;
    });
  },

  async saveOpportunity(opp: Omit<Opportunity, 'id' | 'createdAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      user_id:     opp.userId,
      type:        opp.type,
      title:       opp.title,
      description: opp.description,
      score:       opp.score,
    };
    if (opp.actionUrl) row['action_url'] = opp.actionUrl;
    if (opp.expiresAt) row['expires_at'] = opp.expiresAt;
    await db.client().from('ai_opportunities').insert(row);
  },

  async markOpportunitySeen(id: string, userId: string): Promise<void> {
    await db.client()
      .from('ai_opportunities')
      .update({ is_seen: true })
      .eq('id', id)
      .eq('user_id', userId);
  },

  // ── Experience Score ───────────────────────────────────────────────────────
  async getScore(userId: string, date: string): Promise<ExperienceScore | null> {
    const { data } = await db.client()
      .from('ai_experience_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      userId,
      date,
      appSpeedScore:      Number(r['app_speed_score']      ?? 0),
      searchSuccessRate:  Number(r['search_success_rate']  ?? 0),
      bookingSuccessRate: Number(r['booking_success_rate'] ?? 0),
      jobSuccessRate:     Number(r['job_success_rate']     ?? 0),
      paymentSuccessRate: Number(r['payment_success_rate'] ?? 0),
      avgResponseTimeMs:  Number(r['avg_response_ms']      ?? 0),
      notifOpenRate:      Number(r['notif_open_rate']      ?? 0),
      conversionRate:     Number(r['conversion_rate']      ?? 0),
      overallScore:       Number(r['overall_score']        ?? 0),
    };
  },

  async upsertScore(score: ExperienceScore): Promise<void> {
    await db.client().from('ai_experience_scores').upsert({
      user_id:              score.userId,
      date:                 score.date,
      app_speed_score:      score.appSpeedScore,
      search_success_rate:  score.searchSuccessRate,
      booking_success_rate: score.bookingSuccessRate,
      job_success_rate:     score.jobSuccessRate,
      payment_success_rate: score.paymentSuccessRate,
      avg_response_ms:      score.avgResponseTimeMs,
      notif_open_rate:      score.notifOpenRate,
      conversion_rate:      score.conversionRate,
      overall_score:        score.overallScore,
    }, { onConflict: 'user_id,date' });
  },

  // ── City Cache ─────────────────────────────────────────────────────────────
  async getCityCache(city: string, country: string): Promise<Record<string, unknown> | null> {
    const { data } = await db.client()
      .from('ai_city_cache')
      .select('data')
      .eq('city', city)
      .eq('country', country)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (!data) return null;
    return (data as Record<string, unknown>)['data'] as Record<string, unknown>;
  },

  async invalidateBriefing(userId: string): Promise<void> {
    await db.client()
      .from('ai_briefings')
      .delete()
      .eq('user_id', userId);
  },

  async saveCityCache(city: string, country: string, data: Record<string, unknown>): Promise<void> {
    await db.client().from('ai_city_cache').upsert({
      city,
      country,
      data,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    }, { onConflict: 'city,country' });
  },
};