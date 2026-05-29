import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SystemList } from './components/SystemList';
import { SystemEditor } from './components/SystemEditor';
import { UserProfilePage } from './components/UserProfilePage';
import { ConventionLibraryPage } from './components/ConventionLibraryPage';
import { ConventionEditorPage } from './components/ConventionEditorPage';
import { AppShell } from './layouts/AppShell';
import { ComingSoonPage } from './layouts/ComingSoonPage';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation('common');
  if (loading) return <div className="p-[60px] text-fg-muted">{t('status.loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useTranslation('common');
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
        <Route
          path="/conventions/:id"
          element={
            <Protected>
              <ConventionEditorPage />
            </Protected>
          }
        />
        <Route path="/systems/:id/conventions" element={<Navigate to="/conventions" replace />} />
        <Route path="/gallery" element={<Navigate to="/" replace />} />
        <Route path="/users/:username" element={<UserProfilePage />} />
        <Route path="/partners" element={<ComingSoonPage title={t('nav.partners')} icon={Users} />} />
        <Route path="/history" element={<ComingSoonPage title={t('nav.history')} icon={Clock} />} />
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
