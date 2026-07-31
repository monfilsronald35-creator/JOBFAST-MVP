import { TravelRepository } from '../repositories/TravelRepository.js';

export interface ItineraryDay {
  day:        number;
  date:       string;
  morning:    string;
  afternoon:  string;
  evening:    string;
  lodging:    string;
  budget:     number;
  currency:   string;
  tips:       string[];
}

export interface TravelItinerary {
  userId:      string;
  destination: string;
  days:        number;
  totalBudget: number;
  currency:    string;
  itinerary:   ItineraryDay[];
  mustSee:     string[];
  warnings:    string[];
  generatedAt: string;
}

const HAITI_SPOTS: Record<string, { morning: string; afternoon: string; evening: string; tips: string[] }> = {
  'Port-au-Prince': {
    morning:   'Vizit Musée du Panthéon National (MUPANAH) ak Katedral',
    afternoon: 'Eksplore Mache Fè a ak resto lokal Pétion-Ville',
    evening:   'Souper nan restoran Lakay la oswa Quartier Latin',
    tips:      ['Pran yon gid lokal', 'Evite kite lavil pou aswè', 'Chanje kòb nan bank ofisyèl'],
  },
  'Jacmel': {
    morning:   'Plaj Cyvadier ak Plaj Raymond-les-Bains',
    afternoon: 'Galri atizana ak mas Jacmel nan Rue du Commerce',
    evening:   'Festival kiltirèl oswa manje pwason fre bòdmè',
    tips:      ['Meilleur moman: Janvye-Mas pou kanaval', 'Artizana mas papye mache'],
  },
  'Cap-Haïtien': {
    morning:   'Vizit Citadelle Laferrière ak Sans-Souci (Patrimwàn UNESCO)',
    afternoon: 'Plaj Labadee ak Cormier',
    evening:   'Restoran Roi Christophe ak mize istorik',
    tips:      ['Dlo sitadèl la — pote boutèy dlo', 'Chwal disponib pou monte tèt la'],
  },
};

function buildItinerary(destination: string, days: number, startDate: string, budgetPerDay: number, currency: string): ItineraryDay[] {
  const spot = HAITI_SPOTS[destination] ?? HAITI_SPOTS['Port-au-Prince']!;
  const itinerary: ItineraryDay[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    itinerary.push({
      day: i + 1,
      date: date.toISOString().slice(0, 10),
      morning:   spot.morning,
      afternoon: spot.afternoon,
      evening:   spot.evening,
      lodging:   i === 0 ? 'Arivan ak check-in otèl' : (i === days - 1 ? 'Check-out ak preparasyon depa' : `Nwit ${i + 1} nan otèl`),
      budget:    budgetPerDay,
      currency,
      tips:      i === 0 ? spot.tips : [],
    });
  }
  return itinerary;
}

export const TravelAIService = {
  async planItinerary(userId: string, input: {
    destination: string;
    days: number;
    startDate: string;
    budgetPerDay?: number;
    currency?: string;
    interests?: string[];
  }): Promise<TravelItinerary> {
    const currency    = input.currency ?? 'HTG';
    const budgetPerDay = input.budgetPerDay ?? 5000;
    const itinerary   = buildItinerary(input.destination, input.days, input.startDate, budgetPerDay, currency);
    const totalBudget = budgetPerDay * input.days;

    const mustSee: string[] = [];
    if (input.destination === 'Cap-Haïtien' || input.interests?.includes('history')) {
      mustSee.push('Citadelle Laferrière', 'Sans-Souci');
    }
    if (input.destination === 'Jacmel' || input.interests?.includes('art')) {
      mustSee.push('Mache Artizana Jacmel', 'Festival Kanaval');
    }
    mustSee.push('Plaj Labadie', 'Mache lokal');

    return {
      userId, destination: input.destination, days: input.days,
      totalBudget, currency, itinerary, mustSee,
      warnings: ['Verifye konsèy sekirite anvan vwayaj', 'Pran asirans vwayaj'],
      generatedAt: new Date().toISOString(),
    };
  },

  async getDestinationInsights(destination: string): Promise<{
    destination: string;
    bestSeason: string;
    avgTemp: string;
    currency: string;
    language: string;
    safety: string;
    highlights: string[];
    budgetLevel: 'budget' | 'mid-range' | 'luxury';
  }> {
    const insights: Record<string, {
      bestSeason: string; avgTemp: string; safety: string; highlights: string[]; budgetLevel: 'budget' | 'mid-range' | 'luxury';
    }> = {
      'Port-au-Prince': {
        bestSeason: 'Desanm-Mas (sèzon sèch)',
        avgTemp: '25-32°C', safety: 'Fè atansyon — evite sòti aswè san gid',
        highlights: ['Citadelle', 'MUPANAH', 'Pétion-Ville', 'Kanaval'],
        budgetLevel: 'budget',
      },
      'Jacmel': {
        bestSeason: 'Janvye-Avril',
        avgTemp: '24-30°C', safety: 'Relativman an sekirite pou touris',
        highlights: ['Kanaval Jacmel', 'Plaj Cyvadier', 'Galri atizana'],
        budgetLevel: 'mid-range',
      },
      'Cap-Haïtien': {
        bestSeason: 'Novanm-Avril',
        avgTemp: '26-33°C', safety: 'Bon pou touris ak gid lokal',
        highlights: ['UNESCO Citadelle', 'Labadee', 'Plaj kristal'],
        budgetLevel: 'mid-range',
      },
    };
    const info = insights[destination] ?? insights['Port-au-Prince']!;
    return { destination, currency: 'HTG', language: 'Kreyòl ayisyen / Fransè', ...info };
  },

  async recommendDestinations(userId: string): Promise<Array<{
    destination: string; reason: string; score: number;
  }>> {
    const bookings = await TravelRepository.listBookings(userId);
    const visited  = new Set(bookings.map(b => b.refId));
    const all = [
      { destination: 'Cap-Haïtien',   reason: 'Patrimwàn UNESCO, plaj bèl, touris kiltirèl',   score: 95 },
      { destination: 'Jacmel',        reason: 'Art, kanaval, plaj kalm, atizana',               score: 90 },
      { destination: 'Port-au-Prince',reason: 'Kapital, restoran, mache, nwit aktif',            score: 85 },
      { destination: 'Les Cayes',     reason: 'Île-à-Vache, plaj izole, nati',                  score: 80 },
      { destination: 'Pétionville',   reason: 'Boutik, restoran, galri atizana',                score: 75 },
    ];
    return all.filter(d => !visited.has(d.destination)).slice(0, 4);
  },
};