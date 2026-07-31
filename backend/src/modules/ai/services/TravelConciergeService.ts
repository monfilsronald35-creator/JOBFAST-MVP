import type { TravelPlan } from '../types/ai.types.js';

type SlotType = TravelPlan['slots'][number]['type'];

interface PlanSlot {
  time:     string;
  activity: string;
  type:     SlotType;
  venue?:   string | undefined;
  note?:    string | undefined;
}

const TOURIST_SLOTS: PlanSlot[] = [
  { time: '08:00', activity: 'Dejene',            type: 'food',     note: 'Restoran otèl la oswa yon restoran lokal' },
  { time: '10:00', activity: 'Plaj',              type: 'leisure',  note: 'Plaj pou nage ak detann' },
  { time: '13:00', activity: 'Dejene midi',       type: 'food',     note: 'Restoran bòdmè, manje kreyòl' },
  { time: '15:00', activity: 'Shopping',          type: 'shopping', note: 'Atizana lokal, souvenir' },
  { time: '18:00', activity: 'Relaksasyon',       type: 'leisure',  note: 'Repo nan otèl la' },
  { time: '19:30', activity: 'Dine',              type: 'food',     note: 'Restoran bon kalite' },
  { time: '21:00', activity: 'Aktivite lannwit',  type: 'culture',  note: 'Mizik, dans oswa promenad' },
];

const CITY_SUGGESTIONS: Record<string, Partial<PlanSlot>[]> = {
  'Port-au-Prince': [
    { activity: 'Visite Citadelle Laferrière', type: 'culture' },
    { activity: 'Marché de Fer', type: 'shopping' },
    { activity: 'Plage Mousse', type: 'leisure' },
  ],
  'Cap-Haïtien': [
    { activity: 'Citadelle Henry', type: 'culture' },
    { activity: 'Plage Labadee', type: 'leisure' },
    { activity: 'Marché local', type: 'shopping' },
  ],
  'Punta Cana': [
    { activity: 'Plaj Bavaro', type: 'leisure' },
    { activity: 'Excursion Saona', type: 'leisure' },
    { activity: 'Shopping Palma Real', type: 'shopping' },
  ],
};

export const TravelConciergeService = {
  generateDayPlan(city: string, lang: string): TravelPlan {
    const day = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const slots = [...TOURIST_SLOTS];
    const citySpecific = CITY_SUGGESTIONS[city] ?? [];

    // Inject city-specific activities into the plan
    citySpecific.forEach((cs, i) => {
      const slotIdx = i + 2;
      if (slotIdx < slots.length) {
        const existing = slots[slotIdx];
        if (existing) {
          slots[slotIdx] = { ...existing, activity: cs.activity ?? existing.activity, type: cs.type ?? existing.type };
        }
      }
    });

    return { day, city, slots };
  },

  getActivitySuggestions(city: string): Partial<PlanSlot>[] {
    return CITY_SUGGESTIONS[city] ?? [];
  },
};