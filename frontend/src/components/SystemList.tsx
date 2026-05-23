import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSystem, listSystems } from '../api/systems';
import type { SystemSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  cardStyle,
  inputStyle,
  labelStyle,
} from '../styles';

export function SystemList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [systems, setSystems] = useState<SystemSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    listSystems()
      .then(setSystems)
      .catch((e) => setError((e as Error).message));
  }, []);

  const onCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createSystem(newName.trim(), newDescription.trim() || undefined);
      navigate(`/systems/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 3, fontSize: 16, opacity: 0.85 }}>
          <span style={{ color: 'var(--suit-black)' }}>♠</span>
          <span style={{ color: 'var(--suit-red)' }}>♥</span>
          <span style={{ color: 'var(--suit-red)' }}>♦</span>
          <span style={{ color: 'var(--suit-black)' }}>♣</span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--fg)',
            fontFamily: 'var(--font-ui)',
            letterSpacing: 0,
          }}
        >
          Bridge System
        </h1>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              color: 'var(--fg-muted)',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {user?.displayName}
          </span>
          <button onClick={() => logout()} style={buttonGhost}>
            Sign out
          </button>
        </div>
      </header>

      {/* Page body */}
      <main
        style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: '48px 32px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 600,
                color: 'var(--fg)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.015em',
              }}
            >
              Your bidding systems
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                color: 'var(--fg-muted)',
                fontSize: 15,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Document agreements you share with a partner.
            </p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)} style={buttonPrimary}>
              New system
            </button>
          )}
        </div>

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
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {creating && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>New system</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Name (e.g. 2/1 Game Force)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inputStyle}
                autoFocus
              />
              <input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={onCreate} style={buttonPrimary}>
                  Create
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                  style={buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {systems === null ? (
          <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Loading…</div>
        ) : systems.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              padding: '40px 24px',
              textAlign: 'center',
              color: 'var(--fg-muted)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>♣</div>
            <p style={{ margin: 0, fontSize: 15, fontFamily: 'var(--font-ui)' }}>
              No systems yet — create one to start documenting your agreements.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {systems.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/systems/${s.id}`)}
                style={{
                  ...cardStyle,
                  display: 'block',
                  textAlign: 'left',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-ui)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 19,
                      color: 'var(--fg)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {s.name}
                  </h3>
                  <Tag tone={s.ownedByMe ? 'accent' : 'neutral'}>
                    {s.ownedByMe
                      ? 'Owner'
                      : `Shared by ${s.ownerUsername} · ${s.permission}`}
                  </Tag>
                </div>
                {s.description && (
                  <p
                    style={{
                      margin: '8px 0 0',
                      color: 'var(--fg-body)',
                      fontSize: 14,
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {s.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: 'accent' | 'neutral';
  children: React.ReactNode;
}) {
  const accent = tone === 'accent';
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 999,
        background: accent ? 'var(--accent-soft)' : 'var(--surface-sunken)',
        color: accent ? 'var(--accent-ink)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {children}
    </span>
  );
}
