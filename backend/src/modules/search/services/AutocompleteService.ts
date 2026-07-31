import { SearchRepository } from '../repositories/SearchRepository.js';
import type { AutocompleteSuggestion, SearchSource } from '../types/search.types.js';

export const AutocompleteService = {
  async suggest(prefix: string, lang: string, limit = 8): Promise<AutocompleteSuggestion[]> {
    if (prefix.length < 2) return [];
    const rows = await SearchRepository.getAutocomplete(prefix, lang, limit);
    return rows.map(r => ({
      term:   r.term,
      source: r.source as SearchSource,
      count:  r.count,
    }));
  },

  async record(term: string, source: string, lang: string): Promise<void> {
    if (term.length < 2) return;
    void SearchRepository.incrementSuggestion(term.toLowerCase(), source, lang);
  },
};