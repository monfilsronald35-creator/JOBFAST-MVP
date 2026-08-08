// Single canonical API client — re-exports the axios instance from api/axios.ts
// All services must import from here; api/axios.ts is the implementation.
export { default } from '../api/axios';
export const STORAGE_KEY = 'jobfast_user';