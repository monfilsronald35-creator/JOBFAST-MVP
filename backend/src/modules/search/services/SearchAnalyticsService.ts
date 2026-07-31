import { SearchAnalyticsRepository } from '../repositories/SearchAnalyticsRepository.js';

export const SearchAnalyticsService = {
  async getMostSearched(days = 30, limit = 10) {
    return SearchAnalyticsRepository.getMostSearched(days, limit);
  },

  async getZeroResults(days = 7, limit = 10) {
    return SearchAnalyticsRepository.getZeroResultSearches(days, limit);
  },

  async getTrending(country = 'HT', lang = 'ht', days = 7, limit = 10) {
    return SearchAnalyticsRepository.getTrending(country, lang, days, limit);
  },

  async getPerformance(days = 7) {
    return SearchAnalyticsRepository.getPerformanceStats(days);
  },
};