import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders the sign-in view by default', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with passkey/ })).toBeInTheDocument();
  });

  it('toggles to the registration view', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /Create an account/ }));
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create passkey/ })).toBeInTheDocument();
  });
});
