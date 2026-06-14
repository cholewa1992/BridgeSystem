import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, Field, Input } from './ui';
import { BrandLockup } from './BrandLockup';

export function LoginPage() {
  const { login, register } = useAuth();
  const { t } = useTranslation('auth');
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
          throw new Error(t('register.validationError'));
        }
        await register(username.trim(), displayName.trim());
      } else {
        await login();
      }
    } catch (e) {
      setError((e as Error).message || t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-[400px] max-w-full">
        <div className="mb-6 flex justify-center">
          <BrandLockup variant="stacked" height={64} />
        </div>

        <Card elevated className="px-9 pb-7 pt-9">
          <h1 className="m-0 font-display text-[28px] font-semibold tracking-[-0.015em] text-fg">
            {mode === 'login' ? t('login.title') : t('register.title')}
          </h1>
          <p className="mb-7 mt-2 text-sm text-fg-muted">
            {mode === 'login' ? t('login.subtitle') : t('register.subtitle')}
          </p>

          <div className="flex flex-col gap-3">
            {mode === 'register' && (
              <Field label={t('register.usernameLabel')}>
                <Input
                  placeholder={t('register.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
            )}
            {mode === 'register' && (
              <Field label={t('register.displayNameLabel')}>
                <Input
                  placeholder={t('register.displayNamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </Field>
            )}
            <Button
              variant="primary"
              loading={busy}
              onClick={submit}
              className="mt-2 w-full justify-center px-[16px] py-[11px]"
            >
              {mode === 'register' ? t('register.submitButton') : t('login.submitButton')}
            </Button>

            {error && <Alert>{error}</Alert>}
          </div>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-sm text-fg-muted"
          >
            {mode === 'login' ? (
              <>
                {t('login.switchPrompt')}{' '}
                <span className="ml-1 text-accent">{t('login.switchLink')}</span>
              </>
            ) : (
              <>
                {t('register.switchPrompt')}{' '}
                <span className="ml-1 text-accent">{t('register.switchLink')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
