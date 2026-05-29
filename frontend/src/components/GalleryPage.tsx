import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  usePublicConventions,
  usePublicSystems,
  useToggleLike,
  useToggleConventionLike,
  useForkConvention,
} from '../api/queries';
import { Card } from './ui';
import { SystemCard } from './SystemCard';
import type { ConventionSummary } from '../types';

type Sort = 'newest' | 'most_liked';
type Tab = 'systems' | 'conventions';

export function GalleryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<Tab>('systems');
  const [sort, setSort] = useState<Sort>('newest');
  const { data: systems } = usePublicSystems(sort);
  const { data: conventions } = usePublicConventions(sort);

  return (
    <div className="bg-bg">
      <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[30px] font-semibold tracking-[-0.015em] text-fg">
              {tab === 'systems' ? t('gallery.publicSystems') : t('gallery.publicConventions')}
            </h2>
            <p className="mb-0 mt-1.5 font-ui text-[15px] text-fg-muted">
              {tab === 'systems' ? t('gallery.browseSystems') : t('gallery.browseConventions')}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
              <SortTab active={tab === 'systems'} onClick={() => setTab('systems')}>
                {t('tabs.systems')}
              </SortTab>
              <SortTab active={tab === 'conventions'} onClick={() => setTab('conventions')}>
                {t('tabs.conventions')}
              </SortTab>
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
              <SortTab active={sort === 'newest'} onClick={() => setSort('newest')}>
                {t('sort.newest')}
              </SortTab>
              <SortTab active={sort === 'most_liked'} onClick={() => setSort('most_liked')}>
                {t('gallery.mostLiked')}
              </SortTab>
            </div>
          </div>
        </div>

        {tab === 'systems' ? (
          systems === undefined ? (
            <div className="text-[14px] text-fg-muted">{t('status.loading')}</div>
          ) : systems.length === 0 ? (
            <Card className="px-6 py-10 text-center text-fg-muted">
              <div className="mb-2.5 text-[32px] opacity-60">♣</div>
              <p className="m-0 font-ui text-[15px]">{t('gallery.noPublicSystems')}</p>
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
          )
        ) : conventions === undefined ? (
          <div className="text-[14px] text-fg-muted">{t('status.loading')}</div>
        ) : conventions.length === 0 ? (
          <Card className="px-6 py-10 text-center text-fg-muted">
            <div className="mb-2.5 text-[32px] opacity-60">♣</div>
            <p className="m-0 font-ui text-[15px]">{t('gallery.noPublicConventions')}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {conventions.map((c) => (
              <ConventionGalleryCard
                key={c.id}
                convention={c}
                onNavigateToLogin={() => navigate('/login')}
                onNavigateToConventions={() => navigate('/conventions')}
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

/** Convention gallery card with like and fork buttons. */
function ConventionGalleryCard({
  convention,
  onNavigateToLogin,
  onNavigateToConventions,
  isLoggedIn,
}: {
  convention: ConventionSummary;
  onNavigateToLogin: () => void;
  onNavigateToConventions: () => void;
  isLoggedIn: boolean;
}) {
  const { t } = useTranslation('common');
  const likeMut = useToggleConventionLike(convention.id);
  const forkMut = useForkConvention();
  const heartFilled = convention.likedByMe === true;

  const handleLike = () => {
    if (!isLoggedIn) {
      onNavigateToLogin();
      return;
    }
    likeMut.mutate({ liked: convention.likedByMe === true });
  };

  const handleFork = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onNavigateToLogin();
      return;
    }
    forkMut.mutate(convention.id, {
      onSuccess: () => onNavigateToConventions(),
    });
  };

  return (
    <div className="relative rounded-md border border-border bg-surface px-[22px] py-[18px] font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md">
      <button
        onClick={isLoggedIn ? onNavigateToConventions : undefined}
        className={'block w-full text-left' + (isLoggedIn ? ' cursor-pointer' : ' cursor-default')}
        disabled={!isLoggedIn}
        style={isLoggedIn ? undefined : { pointerEvents: 'none' }}
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
            {convention.name}
          </h3>
          {convention.isPublic && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-accent-ink">
              {t('tag.public')}
            </span>
          )}
        </div>

        <p className="mb-0 mt-1 font-ui text-[13px] text-fg-muted">
          by <span className="font-medium">@{convention.ownerUsername}</span>
          {convention.paramCount > 0 && (
            <span className="ml-2 text-fg-subtle">
              · {convention.paramCount} param{convention.paramCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>

        {convention.description && (
          <p className="mb-0 mt-2 line-clamp-2 font-ui text-[13px] text-fg-muted">
            {convention.description}
          </p>
        )}
      </button>

      {/* Bottom row: stats + actions */}
      <div className="mt-3 flex items-center gap-4">
        <span className="font-ui text-[13px] text-fg-muted">⑂ {convention.forkCount}</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          disabled={likeMut.isPending}
          className={
            'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[13px] transition-colors ' +
            (heartFilled ? 'text-suit-red' : 'text-fg-muted hover:text-suit-red')
          }
          title={heartFilled ? t('action.unlike') : t('action.like')}
        >
          <span aria-hidden="true">{heartFilled ? '♥' : '♡'}</span>
          <span>{convention.likeCount}</span>
        </button>

        {isLoggedIn && !convention.ownedByMe && (
          <button
            onClick={handleFork}
            disabled={forkMut.isPending}
            className="ml-auto rounded-sm border border-border px-2.5 py-1 font-ui text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {forkMut.isPending ? t('action.forking') : t('action.fork')}
          </button>
        )}
      </div>
    </div>
  );
}
