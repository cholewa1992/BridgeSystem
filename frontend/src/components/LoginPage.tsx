import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buttonGhost,
  buttonPrimary,
  cardElevatedStyle,
  inputStyle,
} from '../styles';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg)',
      }}
    >
      <div style={{ width: 400, maxWidth: '100%' }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            fontSize: 20,
            justifyContent: 'center',
            marginBottom: 24,
            opacity: 0.85,
          }}
        >
          <span style={{ color: 'var(--suit-black)' }}>♠</span>
          <span style={{ color: 'var(--suit-red)' }}>♥</span>
          <span style={{ color: 'var(--suit-red)' }}>♦</span>
          <span style={{ color: 'var(--suit-black)' }}>♣</span>
        </div>

        <div
          style={{
            ...cardElevatedStyle,
            padding: '36px 36px 28px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--fg)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.015em',
            }}
          >
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p
            style={{
              marginTop: 8,
              marginBottom: 28,
              color: 'var(--fg-muted)',
              fontSize: 14,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {mode === 'login'
              ? 'Sign in with your passkey to continue.'
              : 'Set up a passkey — no passwords to remember.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <Field label="Username">
                <input
                  placeholder="alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            )}
            {mode === 'register' && (
              <Field label="Display name">
                <input
                  placeholder="Alice Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            )}
            {mode === 'login' && (
              <Field label="Username" hint="Leave blank if your authenticator stores it">
                <input
                  placeholder="alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            )}

            <button
              onClick={submit}
              disabled={busy}
              style={{ ...buttonPrimary, padding: '11px 16px', marginTop: 8, justifyContent: 'center' }}
            >
              {busy
                ? 'Working…'
                : mode === 'register'
                ? 'Create passkey'
                : 'Sign in with passkey'}
            </button>

            {error && (
              <div
                style={{
                  background: 'var(--danger-soft)',
                  border: '1px solid #e6c8c4',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--danger)',
                  fontSize: 13,
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            style={{ ...buttonGhost, color: 'var(--fg-muted)', fontSize: 14 }}
          >
            {mode === 'login' ? (
              <>
                New here?{' '}
                <span style={{ color: 'var(--accent)', marginLeft: 4 }}>
                  Create an account
                </span>
              </>
            ) : (
              <>
                Already have a passkey?{' '}
                <span style={{ color: 'var(--accent)', marginLeft: 4 }}>Sign in</span>
              </>
            )}
          </button>
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        style={{
          fontSize: 13,
          color: 'var(--fg-body)',
          fontFamily: 'var(--font-ui)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            fontSize: 12,
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
