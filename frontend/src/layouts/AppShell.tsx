import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Globe,
  Library,
  LogIn,
  LogOut,
  TreePine,
  User,
  Users,
} from 'lucide-react';
import { BrandLockup } from '../components/BrandLockup';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'list', icon: BookOpen, label: 'My systems', route: '/' },
  { id: 'gallery', icon: Globe, label: 'Gallery', route: '/gallery' },
  { id: 'partners', icon: Users, label: 'Partners', route: '/partners', stub: true },
  { id: 'history', icon: Clock, label: 'Recent edits', route: '/history', stub: true },
] as const;

function isRouteActive(id: string, route: string, pathname: string): boolean {
  if (id === 'list') return pathname === '/' || pathname.startsWith('/systems/');
  return pathname === route || pathname.startsWith(route + '/');
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  stub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  stub?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex w-full items-center gap-[10px] rounded-[6px] px-3 py-2 font-ui text-[14px] font-medium transition-colors ' +
        (active
          ? 'border border-accent-border bg-accent-soft text-accent-ink'
          : 'border border-transparent bg-transparent text-fg-body hover:bg-surface-2')
      }
    >
      <Icon size={15} className="shrink-0 opacity-70" />
      <span className="flex-1 text-left">{label}</span>
      {stub && (
        <span className="ml-auto font-ui text-[10px] uppercase tracking-[0.05em] text-fg-subtle">
          Soon
        </span>
      )}
    </button>
  );
}

function SidebarContent({ onNav }: { onNav: (route: string) => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Extract system ID when on a system route: /systems/:id or /systems/:id/conventions
  const systemRouteMatch = location.pathname.match(/^\/systems\/([^/]+)/);
  const systemId = systemRouteMatch ? systemRouteMatch[1] : null;

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-surface py-4" style={{ width: 240 }}>
      {/* Brand */}
      <div className="flex items-center px-3 py-[6px] pb-[14px]">
        <BrandLockup height={22} />
      </div>

      {/* Workspace section */}
      <div className="px-3 pb-1.5 pt-3.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
        Workspace
      </div>

      <div className="flex flex-col gap-0.5 px-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(item.id, item.route, location.pathname);
          const stub = 'stub' in item ? item.stub : false;
          return (
            <NavButton
              key={item.id}
              active={active}
              onClick={() => onNav(item.route)}
              icon={item.icon}
              label={item.label}
              stub={stub}
            />
          );
        })}
      </div>

      {/* Context-sensitive: system nav */}
      {systemId && (
        <>
          <div className="px-3 pb-1.5 pt-4 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            This system
          </div>
          <div className="flex flex-col gap-0.5 px-1.5">
            <NavButton
              active={location.pathname === `/systems/${systemId}`}
              onClick={() => onNav(`/systems/${systemId}`)}
              icon={TreePine}
              label="Bidding tree"
            />
            <NavButton
              active={location.pathname === `/systems/${systemId}/conventions`}
              onClick={() => onNav(`/systems/${systemId}/conventions`)}
              icon={Library}
              label="Conventions"
            />
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Account section */}
      <div className="px-3 pb-1.5 pt-3.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
        Account
      </div>
      <div className="flex flex-col gap-0.5 px-1.5">
        {user ? (
          <>
            <NavButton
              active={location.pathname === `/users/${user.username}`}
              onClick={() => onNav(`/users/${user.username}`)}
              icon={User}
              label={user.displayName}
            />
            <NavButton active={false} onClick={handleSignOut} icon={LogOut} label="Sign out" />
          </>
        ) : (
          <NavButton active={false} onClick={() => onNav('/login')} icon={LogIn} label="Sign in" />
        )}
      </div>
    </nav>
  );
}

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleNav = (route: string) => {
    navigate(route);
    setNavOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — visible at md+ (768px+) */}
      <aside className="hidden shrink-0 border-r border-border md:block" style={{ width: 240 }}>
        <SidebarContent onNav={handleNav} />
      </aside>

      {/* Mobile sidebar — slides in from left */}
      <aside
        className="fixed inset-y-0 left-0 z-[80] shrink-0 border-r border-border transition-transform duration-200 ease-in-out md:hidden"
        style={{
          width: 240,
          transform: navOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <SidebarContent onNav={handleNav} />
      </aside>

      {/* Scrim */}
      {navOpen && (
        <div
          className="fixed inset-0 z-[70] md:hidden"
          style={{ background: 'rgba(31,29,26,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar with hamburger */}
        <div className="flex min-h-[56px] shrink-0 items-center border-b border-border bg-surface px-6 py-[14px] md:hidden">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] rounded text-fg-muted hover:text-fg"
            aria-label="Open navigation"
          >
            <span className="block h-[2px] w-5 bg-current" />
            <span className="block h-[2px] w-5 bg-current" />
            <span className="block h-[2px] w-5 bg-current" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
