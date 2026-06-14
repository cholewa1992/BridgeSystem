import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CurrentUser } from '../types';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/webauthn', () => ({
  fetchCurrentUser: vi.fn(),
  loginPasskey: vi.fn(),
  registerPasskey: vi.fn(),
  logout: vi.fn(),
}));

import {
  fetchCurrentUser,
  loginPasskey,
  registerPasskey,
  logout as apiLogout,
} from '../api/webauthn';

const mockFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockLoginPasskey = vi.mocked(loginPasskey);
const mockRegisterPasskey = vi.mocked(registerPasskey);
const mockApiLogout = vi.mocked(apiLogout);

const sampleUser: CurrentUser = { id: '1', username: 'alice', displayName: 'Alice' };

function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <button onClick={() => login()}>login</button>
      <button onClick={() => register('alice', 'Alice')}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts loading=true, then resolves to user=null when fetchCurrentUser rejects', async () => {
    mockFetchCurrentUser.mockRejectedValueOnce(new Error('network error'));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('sets the user and loading=false when fetchCurrentUser resolves with a user', async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(sampleUser);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('alice');
  });

  it('login() calls loginPasskey then fetchCurrentUser and sets the user', async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleUser);
    mockLoginPasskey.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(mockLoginPasskey).toHaveBeenCalledWith();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('register() calls registerPasskey then fetchCurrentUser and sets the user', async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleUser);
    mockRegisterPasskey.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    expect(mockRegisterPasskey).toHaveBeenCalledWith('alice', 'Alice');
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
  });

  it('logout() calls the logout API and clears the user to null', async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(sampleUser);
    mockApiLogout.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(mockApiLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });

  it('useAuth() throws when used outside AuthProvider', () => {
    function Standalone() {
      useAuth();
      return null;
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Standalone />)).toThrow('useAuth must be used inside AuthProvider');
    consoleError.mockRestore();
  });
});
