import { api } from './client';
import type { SystemSummary, UserProfile } from '../types';

export function getUserProfile(username: string): Promise<UserProfile> {
  return api<UserProfile>(`/api/users/${username}`);
}

export function getUserPublicSystems(username: string): Promise<SystemSummary[]> {
  return api<SystemSummary[]>(`/api/users/${username}/systems`);
}
