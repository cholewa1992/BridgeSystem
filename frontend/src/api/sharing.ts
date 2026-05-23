import { api } from './client';
import type { Share } from '../types';

export function listShares(systemId: string): Promise<Share[]> {
  return api<Share[]>(`/api/systems/${systemId}/shares`);
}

export function addShare(systemId: string, username: string, permission: 'READ' | 'WRITE'): Promise<Share> {
  return api<Share>(`/api/systems/${systemId}/shares`, {
    method: 'POST',
    body: JSON.stringify({ username, permission }),
  });
}

export function removeShare(systemId: string, username: string): Promise<void> {
  return api(`/api/systems/${systemId}/shares/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}
