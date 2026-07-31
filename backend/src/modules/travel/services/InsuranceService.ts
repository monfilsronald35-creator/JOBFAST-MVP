import { TravelRepository } from '../repositories/TravelRepository.js';
import type { TravelInsurance } from '../types/travel.types.js';

const PREMIUM_RATES: Record<string, number> = {
  medical:       0.015,  // 1.5% of coverage
  flight_delay:  0.008,
  cancellation:  0.010,
  lost_luggage:  0.012,
  accident:      0.020,
  comprehensive: 0.025,
};

export const InsuranceService = {
  calculatePremium(type: TravelInsurance['type'], coverage: number, days: number): number {
    const rate = PREMIUM_RATES[type] ?? 0.015;
    const base = Math.round(coverage * rate);
    const durationFactor = 1 + Math.max(0, days - 7) * 0.01;
    return Math.round(base * durationFactor);
  },

  async purchase(userId: string, input: {
    type: TravelInsurance['type'];
    coverage: number;
    currency?: string;
    startDate: string;
    endDate: string;
    destination: string;
  }): Promise<TravelInsurance> {
    const days = Math.max(1, Math.round(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
    ));
    const premium = InsuranceService.calculatePremium(input.type, input.coverage, days);
    return TravelRepository.createInsurance({
      user_id:     userId,
      type:        input.type,
      coverage:    input.coverage,
      currency:    input.currency ?? 'USD',
      premium,
      start_date:  input.startDate,
      end_date:    input.endDate,
      destination: input.destination,
      status:      'active',
    });
  },

  async listMine(userId: string): Promise<TravelInsurance[]> {
    return TravelRepository.listInsurance(userId);
  },

  async claim(id: string, details: string): Promise<void> {
    await TravelRepository.claimInsurance(id, details);
  },
};