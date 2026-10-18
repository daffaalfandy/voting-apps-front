import { Link, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui';

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span aria-hidden="true" className="ballot-mark" data-filled="" />
      CivicVote
    </span>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="inline-flex min-h-11 items-center rounded-md">
            <Wordmark />
          </Link>
          {user && (
            <div className="flex min-w-0 items-center gap-3">
              <p className="min-w-0 truncate text-sm">
                <span className="font-semibold">{user.name}</span>
                <span className="text-ink-muted"> · {user.role === 'admin' ? 'Administrator' : 'Voter'}</span>
              </p>
              <Button variant="quiet" onClick={logout}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
