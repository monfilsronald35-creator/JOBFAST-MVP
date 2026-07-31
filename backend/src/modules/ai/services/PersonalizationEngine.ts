import { db }             from '../../../core/database/SupabaseClient.js';
import type { UserContext } from '../types/ai.types.js';

export const PersonalizationEngine = {
  async buildContext(userId: string, headers: Record<string, string | undefined>): Promise<UserContext> {
    const { data: profile } = await db.client()
      .from('profiles')
      .select('role, country, preferred_lang, timezone, lat, lng, subscription_tier')
      .eq('id', userId)
      .single();

    const p = (profile as Record<string, unknown> | null) ?? {};

    const lang     = String(p['preferred_lang'] ?? headers['accept-language']?.slice(0, 2) ?? 'ht');
    const timezone = String(p['timezone']       ?? 'America/Port-au-Prince');
    const role     = String(p['role']           ?? 'worker');
    const country  = String(p['country']        ?? 'HT');

    const localHour = Number(
      new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
    );

    const context: UserContext = {
      userId,
      role,
      country,
      lang,
      timezone,
      isOnline:     true,
      localHour:    isNaN(localHour) ? 8 : localHour,
    };

    if (p['lat'] != null) context.lat = Number(p['lat']);
    if (p['lng'] != null) context.lng = Number(p['lng']);
    if (p['subscription_tier']) context.subscription = String(p['subscription_tier']);

    const ua = headers['user-agent'] ?? '';
    context.deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop';

    return context;
  },

  getGreeting(fullName: string, localHour: number, lang: string): string {
    const firstName = fullName.split(' ')[0] ?? fullName;
    const timeGreet = localHour < 12 ? { ht: 'Bonjou', en: 'Good morning', fr: 'Bonjour', es: 'Buenos días' }
                    : localHour < 18 ? { ht: 'Bonswa', en: 'Good afternoon', fr: 'Bon après-midi', es: 'Buenas tardes' }
                    :                  { ht: 'Bonswa', en: 'Good evening', fr: 'Bonne soirée', es: 'Buenas noches' };
    const greet = timeGreet[lang as keyof typeof timeGreet] ?? timeGreet.ht;
    return `${greet} ${firstName} 👋`;
  },
};