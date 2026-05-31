import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddShare, useRemoveShare, useShares } from '../api/queries';
import { Button, Input, Label } from './ui';

interface Props {
  systemId: string;
  onClose: () => void;
}

const selectClasses =
  'w-[110px] bg-surface border border-border-strong rounded-sm text-fg text-[14px] px-[12px] py-[8px] outline-none';

export function ShareDialog({ systemId, onClose }: Props) {
  const { t } = useTranslation(['editor', 'common']);
  const { data: shares, error: loadError } = useShares(systemId);
  const addMut = useAddShare(systemId);
  const removeMut = useRemoveShare(systemId);

  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'READ' | 'WRITE'>('READ');

  const error = (loadError ?? addMut.error ?? removeMut.error) as Error | null;

  const onAdd = async () => {
    if (!username.trim()) return;
    try {
      await addMut.mutateAsync({ username: username.trim(), permission });
      setUsername('');
    } catch {
      // surfaced via addMut.error
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(31,29,26,0.35)] p-6 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] max-w-full rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <div className="mb-[18px] flex items-start">
          <div>
            <h2 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-fg">
              {t('share.title')}
            </h2>
            <p className="mb-0 mt-1 font-ui text-[13px] text-fg-muted">{t('share.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common:action.close')}
            className="ml-auto cursor-pointer px-2 py-1 text-[16px] text-fg-muted"
          >
            ✕
          </button>
        </div>

        <div className="mb-[14px] flex items-stretch gap-2">
          <Input
            placeholder={t('share.usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'READ' | 'WRITE')}
            className={selectClasses}
          >
            <option value="READ">{t('share.permissionRead')}</option>
            <option value="WRITE">{t('share.permissionWrite')}</option>
          </select>
          <Button variant="primary" onClick={onAdd} disabled={addMut.isPending}>
            {addMut.isPending ? t('share.sharing') : t('share.share')}
          </Button>
        </div>

        {error && (
          <div className="mb-[14px] rounded-sm border border-[#e6c8c4] bg-danger-soft px-[12px] py-[8px] font-ui text-[13px] text-danger">
            {error.message}
          </div>
        )}

        <Label className="mb-2 block">{t('share.collaborators')}</Label>
        {shares === undefined ? (
          <div className="text-[13px] text-fg-muted">{t('common:status.loading')}</div>
        ) : shares.length === 0 ? (
          <div className="font-ui text-[13px] italic text-fg-muted">
            {t('share.noCollaborators')}
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-sm border border-border">
            {shares.map((s) => (
              <div
                key={s.username}
                className="flex items-center gap-2.5 border-t border-border bg-surface px-[14px] py-[10px] font-ui first:border-t-0"
              >
                <div>
                  <div className="text-[14px] text-fg">{s.displayName}</div>
                  <div className="text-[12px] text-fg-muted">@{s.username}</div>
                </div>
                <span
                  className={
                    'ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.05em] ' +
                    (s.permission === 'WRITE'
                      ? 'bg-success-soft text-success'
                      : 'bg-surface-sunken text-fg-muted')
                  }
                >
                  {s.permission}
                </span>
                <Button
                  variant="danger"
                  onClick={() => removeMut.mutate(s.username)}
                  disabled={removeMut.isPending}
                >
                  {t('share.remove')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
