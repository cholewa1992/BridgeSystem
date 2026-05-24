import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToggleLike, useUserProfile, useUserSystems } from '../api/queries';
import { ApiError } from '../api/client';
import { Button, Card } from './ui';
import { SystemCard } from './SystemCard';
import type { SystemSummary } from '../types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, error: profileError } = useUserProfile(username ?? '');
  const { data: systems } = useUserSystems(username ?? '');

  // 404 handling
  if (profileError) {
    const is404 = profileError instanceof ApiError && profileError.status === 404;
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader user={user} onNavigate={navigate} />
        <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
          <Card className="px-6 py-10 text-center text-fg-muted">
            <div className="mb-2.5 text-[32px] opacity-60">♠</div>
            <p className="m-0 font-ui text-[15px]">
              {is404 ? 'User not found.' : (profileError as Error).message}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const joinYear = profile ? new Date(profile.createdAt).getFullYear() : null;

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader user={user} onNavigate={navigate} />

      <main className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[48px]">
        {/* Profile header section */}
        {profile === undefined ? (
          <div className="text-[14px] text-fg-muted">Loading…</div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="m-0 font-display text-[30px] font-semibold tracking-[-0.015em] text-fg">
                {profile.displayName}
              </h2>
              <p className="mb-0 mt-1 font-ui text-[15px] text-fg-muted">
                @{profile.username}
              </p>
              <div className="mt-2 flex items-center gap-4 font-ui text-[13px] text-fg-muted">
                <span>Member since {joinYear}</span>
                <span>{profile.publicSystemCount} public system{profile.publicSystemCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <h3 className="mb-4 m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
              Public systems
            </h3>

            {systems === undefined ? (
              <div className="text-[14px] text-fg-muted">Loading…</div>
            ) : systems.length === 0 ? (
              <Card className="px-6 py-10 text-center text-fg-muted">
                <div className="mb-2.5 text-[32px] opacity-60">♣</div>
                <p className="m-0 font-ui text-[15px]">
                  {profile.displayName} hasn't published any systems yet.
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

function PageHeader({
  user,
  onNavigate,
}: {
  user: import('../types').CurrentUser | null;
  onNavigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <header className="flex items-center gap-[14px] border-b border-border bg-surface px-8 py-[14px]">
      <div className="flex gap-[3px] text-[16px] opacity-85">
        <span className="text-suit-black">♠</span>
        <span className="text-suit-red">♥</span>
        <span className="text-suit-red">♦</span>
        <span className="text-suit-black">♣</span>
      </div>
      <Link to={user ? '/' : '/gallery'} className="m-0 font-ui text-[16px] font-semibold text-fg no-underline">
        Bridge System
      </Link>
      <div className="ml-auto flex items-center gap-[14px]">
        <Button variant="ghost" onClick={() => onNavigate('/gallery')}>
          Gallery
        </Button>
        {user ? (
          <Button variant="ghost" onClick={() => onNavigate('/')}>
            My Systems
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => onNavigate('/login')}>
            Log in
          </Button>
        )}
      </div>
    </header>
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
