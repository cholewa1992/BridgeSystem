import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { api } from './client';
import type { CurrentUser } from '../types';

// Derive option types from the function signatures themselves so we don't
// depend on the exact export shape of `@simplewebauthn/browser`.
type RegisterOptionsJSON = Parameters<typeof startRegistration>[0]['optionsJSON'];
type LoginOptionsJSON = Parameters<typeof startAuthentication>[0]['optionsJSON'];

export async function registerPasskey(username: string, displayName: string): Promise<void> {
  const optionsJSON = await api<RegisterOptionsJSON>('/api/auth/register/start', {
    method: 'POST',
    body: JSON.stringify({ username, displayName }),
  });
  const credential = await startRegistration({ optionsJSON });
  await api('/api/auth/register/finish', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function loginPasskey(username?: string): Promise<void> {
  const optionsJSON = await api<LoginOptionsJSON>('/api/auth/login/start', {
    method: 'POST',
    body: JSON.stringify(username ? { username } : {}),
  });
  const credential = await startAuthentication({ optionsJSON });
  await api('/api/auth/login/finish', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function logout(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' });
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await api<CurrentUser>('/api/auth/me');
  } catch (e) {
    if ((e as { status?: number }).status === 401) return null;
    throw e;
  }
}
