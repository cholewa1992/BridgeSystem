import { api } from './client';
import type { SystemSummary, ConventionSummary } from '../types';

export function listPublicSystems(
  sort: 'newest' | 'most_liked' = 'newest',
): Promise<SystemSummary[]> {
  return api<SystemSummary[]>(`/api/gallery?sort=${sort}`);
}

export function listPublicConventions(
  sort: 'newest' | 'most_liked' = 'newest',
): Promise<ConventionSummary[]> {
  return api<ConventionSummary[]>(`/api/gallery/conventions?sort=${sort}`);
}
