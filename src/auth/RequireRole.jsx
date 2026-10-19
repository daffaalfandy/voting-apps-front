import { Navigate, useLocation } from 'react-router';
import { homePathFor, useAuth } from './AuthContext';

export function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace state={{ from: location.pathname }} />;
  }
  if (user.role !== role) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return <>{children}</>;
}
