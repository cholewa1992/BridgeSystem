import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePublicSystems, useToggleLike } from '../api/queries';
import { Card } from './ui';
import { SystemCard } from './SystemCard';

type Sort = 'newest' | 'most_liked';

export function GalleryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sort, setSort] = useState<Sort>('newest');
  const { data: systems } = usePublicSystems(sort);

  return (
    <div className="bg-bg">
      <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[30px] font-semibold tracking-[-0.015em] text-fg">
              Public systems
            </h2>
            <p className="mb-0 mt-1.5 font-ui text-[15px] text-fg-muted">
              Browse bidding systems shared by the community.
            </p>
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            <SortTab active={sort === 'newest'} onClick={() => setSort('newest')}>
              Newest
            </SortTab>
            <SortTab active={sort === 'most_liked'} onClick={() => setSort('most_liked')}>
              Most Liked
            </SortTab>
          </div>
        </div>

        {systems === undefined ? (
          <div className="text-[14px] text-fg-muted">Loading…</div>
        ) : systems.length === 0 ? (
          <Card className="px-6 py-10 text-center text-fg-muted">
            <div className="mb-2.5 text-[32px] opacity-60">♣</div>
            <p className="m-0 font-ui text-[15px]">
              No public systems yet — be the first to publish one.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {systems.map((s) => (
              <GalleryCard
                key={s.id}
                system={s}
                onNavigateToLogin={() => navigate('/login')}
                onNavigateToSystem={() => navigate(`/systems/${s.id}`)}
                isLoggedIn={user !== null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-sm px-3 py-1.5 font-ui text-[13px] font-medium transition-colors ' +
        (active ? 'bg-accent text-white shadow-sm' : 'text-fg-muted hover:text-fg')
      }
    >
      {children}
    </button>
  );
}

/** Wrapper that wires up the toggle-like mutation per system. */
function GalleryCard({
  system,
  onNavigateToLogin,
  onNavigateToSystem,
  isLoggedIn,
}: {
  system: import('../types').SystemSummary;
  onNavigateToLogin: () => void;
  onNavigateToSystem: () => void;
  isLoggedIn: boolean;
}) {
  const likeMut = useToggleLike(system.id);

  const handleLike = () => {
    if (!isLoggedIn) {
      onNavigateToLogin();
      return;
    }
    likeMut.mutate({ liked: system.likedByMe === true });
  };

  return (
    <SystemCard
      system={system}
      showOwner
      onLike={handleLike}
      likeLoading={likeMut.isPending}
      onClick={isLoggedIn ? onNavigateToSystem : undefined}
    />
  );
}
