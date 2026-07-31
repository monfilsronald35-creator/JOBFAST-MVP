import type { Express }                from 'express';
import searchRouter                   from './routes/search.routes.js';

export function registerSearchModule(app: Express): void {
  app.use('/api/search', searchRouter);
}

export { SearchOrchestratorService } from './services/SearchOrchestratorService.js';
export { SearchRepository }          from './repositories/SearchRepository.js';
export type { SearchIndexEntry }     from './types/search.types.js';
export { SearchSource }              from './types/search.types.js';