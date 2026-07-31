import { TravelRepository } from '../repositories/TravelRepository.js';
import type { Flight } from '../types/travel.types.js';

export const FlightService = {
  async addFlight(input: {
    airline: string; flightNumber: string; origin: string; destination: string;
    departureAt: string; arrivalAt: string; travelClass?: Flight['travelClass'];
    price: number; currency?: string; seatsAvailable: number;
    baggage?: string; stops?: number;
  }): Promise<Flight> {
    const depMs = new Date(input.departureAt).getTime();
    const arrMs = new Date(input.arrivalAt).getTime();
    const duration = Math.max(0, Math.round((arrMs - depMs) / 60000));
    return TravelRepository.createFlight({
      airline:         input.airline,
      flight_number:   input.flightNumber,
      origin:          input.origin,
      destination:     input.destination,
      departure_at:    input.departureAt,
      arrival_at:      input.arrivalAt,
      duration,
      travel_class:    input.travelClass     ?? 'economy',
      price:           input.price,
      currency:        input.currency        ?? 'USD',
      seats_available: input.seatsAvailable,
      baggage:         input.baggage         ?? '23kg',
      stops:           input.stops           ?? 0,
    });
  },

  async search(origin: string, destination: string, date?: string, travelClass?: string): Promise<Flight[]> {
    let flights = await TravelRepository.searchFlights(origin, destination, date);
    if (travelClass) flights = flights.filter(f => f.travelClass === travelClass);
    return flights;
  },

  async get(id: string): Promise<Flight | null> {
    return TravelRepository.getFlight(id);
  },

  async reserveSeats(flightId: string, count: number): Promise<void> {
    const flight = await TravelRepository.getFlight(flightId);
    if (!flight) throw new Error('FLIGHT_NOT_FOUND');
    if (flight.seatsAvailable < count) throw new Error('INSUFFICIENT_SEATS');
    await TravelRepository.decrementFlightSeats(flightId, count);
  },

  buildBoardingPass(flightId: string, passengerName: string, seatNumbers: string[]): string {
    const code = [flightId.slice(0, 8).toUpperCase(), passengerName.replace(/\s+/g, '').toUpperCase().slice(0, 8), seatNumbers.join('-')].join('-');
    return `BP-${code}`;
  },
};