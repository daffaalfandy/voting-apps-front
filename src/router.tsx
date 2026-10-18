import { Navigate, createBrowserRouter } from 'react-router';
import { homePathFor, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { AppShell } from './components/AppShell';
import { BallotPage } from './pages/BallotPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CandidatesPage } from './pages/admin/CandidatesPage';
import { ResultsPage } from './pages/admin/ResultsPage';
import { UsersPage } from './pages/admin/UsersPage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'vote',
        element: (
          <RequireRole role="voter">
            <BallotPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to="results" replace /> },
          { path: 'results', element: <ResultsPage /> },
          { path: 'candidates', element: <CandidatesPage /> },
          { path: 'users', element: <UsersPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
