import { api } from './client';
import type { SystemSummary } from '../types';

export function listPublicSystems(sort: 'newest' | 'most_liked' = 'newest'): Promise<SystemSummary[]> {
  return api<SystemSummary[]>(`/api/gallery?sort=${sort}`);
}
