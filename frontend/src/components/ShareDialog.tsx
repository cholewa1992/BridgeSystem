import { useEffect, useState } from 'react';
import { addShare, listShares, removeShare } from '../api/sharing';
import type { Share } from '../types';
import {
  buttonDanger,
  buttonGhost,
  buttonPrimary,
  cardElevatedStyle,
  inputStyle,
  labelStyle,
} from '../styles';

interface Props {
  systemId: string;
  onClose: () => void;
}

export function ShareDialog({ systemId, onClose }: Props) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'READ' | 'WRITE'>('READ');
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    listShares(systemId)
      .then(setShares)
      .catch((e) => setError((e as Error).message));
  };

  useEffect(refresh, [systemId]);

  const onAdd = async () => {
    if (!username.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addShare(systemId, username.trim(), permission);
      setUsername('');
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (u: string) => {
    try {
      await removeShare(systemId, u);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31, 29, 26, 0.35)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cardElevatedStyle,
          boxShadow: 'var(--shadow-lg)',
          padding: 24,
          width: 520,
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                color: 'var(--fg)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Share this system
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--fg-muted)',
                fontSize: 13,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Add a partner by username. Choose read or write access.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              ...buttonGhost,
              marginLeft: 'auto',
              color: 'var(--fg-muted)',
              fontSize: 16,
              padding: '4px 8px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 14,
            alignItems: 'stretch',
          }}
        >
          <input
            placeholder="Partner's username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'READ' | 'WRITE')}
            style={{ ...inputStyle, width: 110 }}
          >
            <option value="READ">Read</option>
            <option value="WRITE">Write</option>
          </select>
          <button onClick={onAdd} disabled={busy} style={buttonPrimary}>
            Share
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-soft)',
              border: '1px solid #e6c8c4',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              color: 'var(--danger)',
              fontSize: 13,
              marginBottom: 14,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ ...labelStyle, marginBottom: 8 }}>Collaborators</div>
        {shares === null ? (
          <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Loading…</div>
        ) : shares.length === 0 ? (
          <div
            style={{
              color: 'var(--fg-muted)',
              fontStyle: 'italic',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
            }}
          >
            No collaborators yet.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            {shares.map((s, i) => (
              <div
                key={s.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <div>
                  <div style={{ color: 'var(--fg)', fontSize: 14 }}>{s.displayName}</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>@{s.username}</div>
                </div>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color:
                      s.permission === 'WRITE' ? 'var(--success)' : 'var(--fg-muted)',
                    padding: '2px 8px',
                    background:
                      s.permission === 'WRITE'
                        ? 'var(--success-soft)'
                        : 'var(--surface-sunken)',
                    borderRadius: 999,
                  }}
                >
                  {s.permission}
                </span>
                <button onClick={() => onRemove(s.username)} style={buttonDanger}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
