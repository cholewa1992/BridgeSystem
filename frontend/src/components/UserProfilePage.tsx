import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToggleLike, useUserProfile, useUserSystems } from '../api/queries';
import { ApiError } from '../api/client';
import { Card } from './ui';
import { SystemCard } from './SystemCard';
import type { SystemSummary } from '../types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const { data: profile, error: profileError } = useUserProfile(username ?? '');
  const { data: systems } = useUserSystems(username ?? '');

  // 404 handling
  if (profileError) {
    const is404 = profileError instanceof ApiError && profileError.status === 404;
    return (
      <div className="bg-bg">
        <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
          <Card className="px-6 py-10 text-center text-fg-muted">
            <div className="mb-2.5 text-[32px] opacity-60">♠</div>
            <p className="m-0 font-ui text-[15px]">
              {is404 ? t('profile.userNotFound') : (profileError as Error).message}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const joinYear = profile ? new Date(profile.createdAt).getFullYear() : null;

  return (
    <div className="bg-bg">
      <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
        {/* Profile header section */}
        {profile === undefined ? (
          <div className="text-[14px] text-fg-muted">{t('status.loading')}</div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="m-0 font-display text-[30px] font-semibold tracking-[-0.015em] text-fg">
                {profile.displayName}
              </h2>
              <p className="mb-0 mt-1 font-ui text-[15px] text-fg-muted">@{profile.username}</p>
              <div className="mt-2 flex items-center gap-4 font-ui text-[13px] text-fg-muted">
                <span>{t('profile.memberSince', { year: joinYear })}</span>
                <span>{t('profile.publicSystemCount', { count: profile.publicSystemCount })}</span>
              </div>
            </div>

            <h3 className="mb-4 m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
              {t('profile.publicSystems')}
            </h3>

            {systems === undefined ? (
              <div className="text-[14px] text-fg-muted">{t('status.loading')}</div>
            ) : systems.length === 0 ? (
              <Card className="px-6 py-10 text-center text-fg-muted">
                <div className="mb-2.5 text-[32px] opacity-60">♣</div>
                <p className="m-0 font-ui text-[15px]">
                  {t('profile.noSystemsYet', { displayName: profile.displayName })}
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2.5">
                {systems.map((s) => (
                  <ProfileCard
                    key={s.id}
                    system={s}
                    isLoggedIn={user !== null}
                    onNavigateToLogin={() => navigate('/login')}
                    onNavigateToSystem={() => navigate(`/systems/${s.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/** Wrapper that wires up the toggle-like mutation per system. */
function ProfileCard({
  system,
  isLoggedIn,
  onNavigateToLogin,
  onNavigateToSystem,
}: {
  system: SystemSummary;
  isLoggedIn: boolean;
  onNavigateToLogin: () => void;
  onNavigateToSystem: () => void;
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
      showOwner={false}
      onLike={handleLike}
      likeLoading={likeMut.isPending}
      onClick={isLoggedIn ? onNavigateToSystem : undefined}
    />
  );
}
