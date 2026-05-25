import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSystem, useSystems } from '../api/queries';
import { Button, Card, Input, Label } from './ui';

export function SystemList() {
  const navigate = useNavigate();
  const { data: systems, error: loadError } = useSystems();
  const createMut = useCreateSystem();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const error = (loadError ?? createMut.error) as Error | null;

  const onCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createMut.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      navigate(`/systems/${created.id}`);
    } catch {
      // surfaced via createMut.error
    }
  };

  return (
    <div className="bg-bg">
      <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[30px] font-semibold tracking-[-0.015em] text-fg">
              Your bidding systems
            </h2>
            <p className="mb-0 mt-1.5 font-ui text-[15px] text-fg-muted">
              Document agreements you share with a partner.
            </p>
          </div>
          {!creating && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              New system
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-sm border border-[#e6c8c4] bg-danger-soft px-[12px] py-[10px] font-ui text-[13px] text-danger">
            {error.message}
          </div>
        )}

        {creating && (
          <Card className="mb-6 p-5">
            <Label className="mb-3 block">New system</Label>
            <div className="flex flex-col gap-2.5">
              <Input
                placeholder="Name (e.g. 2/1 Game Force)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="mt-1 flex gap-2">
                <Button variant="primary" onClick={onCreate} disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {systems === undefined ? (
          <div className="text-[14px] text-fg-muted">Loading…</div>
        ) : systems.length === 0 ? (
          <Card className="px-6 py-10 text-center text-fg-muted">
            <div className="mb-2.5 text-[32px] opacity-60">♣</div>
            <p className="m-0 font-ui text-[15px]">
              No systems yet — create one to start documenting your agreements.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {systems.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/systems/${s.id}`)}
                className="block cursor-pointer rounded-md border border-border bg-surface px-[22px] py-[18px] text-left font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
                    {s.name}
                  </h3>
                  <Tag tone={s.ownedByMe ? 'accent' : 'neutral'}>
                    {s.ownedByMe ? 'Owner' : `Shared by ${s.ownerUsername} · ${s.permission}`}
                  </Tag>
                  {s.isPublic && <Tag tone="public">Public</Tag>}
                </div>
                {s.description && (
                  <p className="mb-0 mt-2 font-ui text-[14px] text-fg-body">{s.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 font-ui text-[13px] text-fg-muted">
                  <span>♥ {s.likeCount}</span>
                  <span>⑂ {s.forkCount}</span>
                </div>
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
  tone: 'accent' | 'neutral' | 'public';
  children: React.ReactNode;
}) {
  const classes =
    tone === 'accent'
      ? 'bg-accent-soft text-accent-ink'
      : tone === 'public'
        ? 'bg-accent-soft text-accent-ink'
        : 'bg-surface-sunken text-fg-muted';
  return (
    <span
      className={
        'rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] ' +
        classes
      }
    >
      {children}
    </span>
  );
}
