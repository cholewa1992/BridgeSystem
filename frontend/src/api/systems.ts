import { api } from './client';
import type { BidTreeRoot, SystemDetail, SystemSummary } from '../types';

export function listSystems(): Promise<SystemSummary[]> {
  return api<SystemSummary[]>('/api/systems');
}

export function getSystem(id: string): Promise<SystemDetail> {
  return api<SystemDetail>(`/api/systems/${id}`);
}

export function createSystem(name: string, description?: string): Promise<SystemDetail> {
  return api<SystemDetail>('/api/systems', {
    method: 'POST',
    body: JSON.stringify({ name, description: description ?? '' }),
  });
}

export function updateSystem(
  id: string,
  payload: { name: string; description: string | null; tree: BidTreeRoot },
): Promise<SystemDetail> {
  return api<SystemDetail>(`/api/systems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteSystem(id: string): Promise<void> {
  return api(`/api/systems/${id}`, { method: 'DELETE' });
}
