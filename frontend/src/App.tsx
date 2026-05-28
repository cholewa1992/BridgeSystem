import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SystemList } from './components/SystemList';
import { SystemEditor } from './components/SystemEditor';
import { UserProfilePage } from './components/UserProfilePage';
import { ConventionLibraryPage } from './components/ConventionLibraryPage';
import { AppShell } from './layouts/AppShell';
import { ComingSoonPage } from './layouts/ComingSoonPage';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-[60px] text-fg-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? null : user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={
            <Protected>
              <SystemList />
            </Protected>
          }
        />
        <Route
          path="/systems/:id"
          element={
            <Protected>
              <SystemEditor />
            </Protected>
          }
        />
        <Route
          path="/conventions"
          element={
            <Protected>
              <ConventionLibraryPage />
            </Protected>
          }
        />
        <Route path="/systems/:id/conventions" element={<Navigate to="/conventions" replace />} />
        <Route path="/gallery" element={<Navigate to="/" replace />} />
        <Route path="/users/:username" element={<UserProfilePage />} />
        <Route path="/partners" element={<ComingSoonPage title="Partners" icon={Users} />} />
        <Route path="/history" element={<ComingSoonPage title="Recent edits" icon={Clock} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
