import { Link } from 'react-router-dom';
import type { SystemSummary } from '../types';

export interface SystemCardProps {
  system: SystemSummary;
  /** Show "by @username" — true in gallery/profile pages. */
  showOwner?: boolean;
  /** Called when the like button is clicked. If undefined, no like button is shown. */
  onLike?: () => void;
  likeLoading?: boolean;
  /** Navigate to editor. */
  onClick?: () => void;
}

export function SystemCard({ system, showOwner, onLike, likeLoading, onClick }: SystemCardProps) {
  const heartFilled = system.likedByMe === true;

  return (
    <div className="relative rounded-md border border-border bg-surface px-[22px] py-[18px] font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md">
      {/* Main clickable area */}
      <button
        onClick={onClick}
        className={'block w-full cursor-pointer text-left' + (onClick ? '' : ' cursor-default')}
        disabled={!onClick}
        style={onClick ? undefined : { pointerEvents: 'none' }}
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
            {system.name}
          </h3>
          {system.isPublic && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-accent-ink">
              Public
            </span>
          )}
        </div>

        {showOwner && (
          <p
            className="mb-0 mt-1 font-ui text-[13px] text-fg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            by{' '}
            <Link
              to={`/users/${system.ownerUsername}`}
              className="text-fg-muted underline-offset-2 hover:underline"
            >
              @{system.ownerUsername}
            </Link>
          </p>
        )}

        {system.description && (
          <p className="mb-0 mt-2 line-clamp-2 font-ui text-[13px] text-fg-muted">
            {system.description}
          </p>
        )}
      </button>

      {/* Bottom row: stats + like button */}
      <div className="mt-3 flex items-center gap-4">
        <span className="font-ui text-[13px] text-fg-muted">⑂ {system.forkCount}</span>

        {onLike ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            disabled={likeLoading}
            className={
              'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[13px] transition-colors ' +
              (heartFilled ? 'text-suit-red' : 'text-fg-muted hover:text-suit-red')
            }
            title={heartFilled ? 'Unlike' : 'Like'}
          >
            <span aria-hidden="true">{heartFilled ? '♥' : '♡'}</span>
            <span>{system.likeCount}</span>
          </button>
        ) : (
          <span className="font-ui text-[13px] text-fg-muted">♥ {system.likeCount}</span>
        )}
      </div>
    </div>
  );
}
