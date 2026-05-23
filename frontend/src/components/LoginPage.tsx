import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from './ui';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        if (!username.trim() || !displayName.trim()) {
          throw new Error('Username and display name are required');
        }
        await register(username.trim(), displayName.trim());
      } else {
        await login(username.trim() || undefined);
      }
    } catch (e) {
      setError((e as Error).message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-[400px] max-w-full">
        <div className="mb-6 flex justify-center gap-1 text-[20px] opacity-85">
          <span className="text-suit-black">♠</span>
          <span className="text-suit-red">♥</span>
          <span className="text-suit-red">♦</span>
          <span className="text-suit-black">♣</span>
        </div>

        <Card elevated className="px-9 pb-7 pt-9">
          <h1 className="m-0 font-display text-[28px] font-semibold tracking-[-0.015em] text-fg">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mb-7 mt-2 font-ui text-[14px] text-fg-muted">
            {mode === 'login'
              ? 'Sign in with your passkey to continue.'
              : 'Set up a passkey — no passwords to remember.'}
          </p>

          <div className="flex flex-col gap-3">
            {mode === 'register' && (
              <Field label="Username">
                <Input
                  placeholder="alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
            )}
            {mode === 'register' && (
              <Field label="Display name">
                <Input
                  placeholder="Alice Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </Field>
            )}
            {mode === 'login' && (
              <Field label="Username" hint="Leave blank if your authenticator stores it">
                <Input
                  placeholder="alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
            )}

            <Button
              variant="primary"
              onClick={submit}
              disabled={busy}
              className="mt-2 w-full justify-center px-[16px] py-[11px]"
            >
              {busy
                ? 'Working…'
                : mode === 'register'
                  ? 'Create passkey'
                  : 'Sign in with passkey'}
            </Button>

            {error && (
              <div className="rounded-sm border border-[#e6c8c4] bg-danger-soft px-[12px] py-[10px] font-ui text-[13px] text-danger">
                {error}
              </div>
            )}
          </div>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-[14px] text-fg-muted"
          >
            {mode === 'login' ? (
              <>
                New here?{' '}
                <span className="ml-1 text-accent">Create an account</span>
              </>
            ) : (
              <>
                Already have a passkey?{' '}
                <span className="ml-1 text-accent">Sign in</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-ui text-[13px] font-medium text-fg-body">{label}</span>
      {children}
      {hint && <span className="font-ui text-[12px] text-fg-muted">{hint}</span>}
    </label>
  );
}
