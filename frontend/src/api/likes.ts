import { api } from './client';
import type { LikeResponse } from '../types';

export function likeSystem(id: string): Promise<LikeResponse> {
  return api<LikeResponse>(`/api/systems/${id}/like`, { method: 'POST' });
}

export function unlikeSystem(id: string): Promise<LikeResponse> {
  return api<LikeResponse>(`/api/systems/${id}/like`, { method: 'DELETE' });
}
