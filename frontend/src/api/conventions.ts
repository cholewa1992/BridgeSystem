import { api } from './client';
import type { ConventionDetail, ConventionSummary, Share } from '../types';
import type { BidNode, ConventionParam } from '../types';

export function listMyConventions(): Promise<ConventionDetail[]> {
  return api<ConventionDetail[]>('/api/conventions');
}

export function getConvention(id: string): Promise<ConventionDetail> {
  return api<ConventionDetail>(`/api/conventions/${id}`);
}

export function createConvention(name: string, description?: string): Promise<ConventionDetail> {
  return api<ConventionDetail>('/api/conventions', {
    method: 'POST',
    body: JSON.stringify({ name, description: description ?? '' }),
  });
}

export function updateConvention(
  id: string,
  payload: {
    name: string;
    description: string | null;
    parameters: ConventionParam[];
    root: BidNode;
  },
): Promise<ConventionDetail> {
  return api<ConventionDetail>(`/api/conventions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteConvention(id: string): Promise<void> {
  return api(`/api/conventions/${id}`, { method: 'DELETE' });
}

export function updateConventionVisibility(id: string, isPublic: boolean): Promise<ConventionDetail> {
  return api<ConventionDetail>(`/api/conventions/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublic }),
  });
}

export function forkConvention(id: string): Promise<ConventionDetail> {
  return api<ConventionDetail>(`/api/conventions/${id}/fork`, { method: 'POST' });
}

export function getSystemConventions(systemId: string): Promise<ConventionDetail[]> {
  return api<ConventionDetail[]>(`/api/systems/${systemId}/conventions`);
}

export function likeConvention(id: string): Promise<unknown> {
  return api(`/api/conventions/${id}/like`, { method: 'POST' });
}

export function unlikeConvention(id: string): Promise<unknown> {
  return api(`/api/conventions/${id}/like`, { method: 'DELETE' });
}

export function listConventionShares(id: string): Promise<Share[]> {
  return api<Share[]>(`/api/conventions/${id}/shares`);
}

export function addConventionShare(
  id: string,
  username: string,
  permission: 'READ' | 'WRITE',
): Promise<Share> {
  return api<Share>(`/api/conventions/${id}/shares`, {
    method: 'POST',
    body: JSON.stringify({ username, permission }),
  });
}

export function removeConventionShare(id: string, username: string): Promise<void> {
  return api(`/api/conventions/${id}/shares/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

export { type ConventionSummary };
