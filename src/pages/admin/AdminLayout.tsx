import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useOutletContext } from 'react-router';
import { api } from '../../api/client';
import type { Settings } from '../../api/types';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert } from '../../components/ui';

interface AdminContext {
  /** Undefined while the lock state is still loading; treat as locked so nothing fires early. */
  locked: boolean | undefined;
}

export const useAdminContext = () => useOutletContext<AdminContext>();

const tabs = [
  { to: 'results', label: 'Results' },
  { to: 'candidates', label: 'Candidates' },
  { to: 'users', label: 'Users' },
];

export function AdminLayout() {
  const queryClient = useQueryClient();
  const notify = useToast();

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ settings: Settings }>('/settings').then((res) => res.settings),
  });

  const toggleLock = useMutation({
    mutationFn: (locked: boolean) =>
      api<{ settings: Settings }>('/settings', { method: 'PUT', body: { locked } }).then((res) => res.settings),
    onSuccess: (next) => {
      queryClient.setQueryData(['settings'], next);
      notify(next.locked ? 'System locked' : 'System unlocked');
    },
  });

  const locked = settings.data?.locked;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Election console</h1>
          <p className="mt-1 text-ink-muted">Follow the count, keep the ballot tidy and manage who can vote.</p>
        </div>
        {settings.isSuccess && (
          <div className="flex items-center gap-3">
            <p className="text-sm">
              <span className="text-ink-muted">System: </span>
              <span className="font-semibold">{locked ? 'locked' : 'unlocked'}</span>
            </p>
            <Button disabled={toggleLock.isPending} onClick={() => toggleLock.mutate(!locked)}>
              {locked ? 'Unlock system' : 'Lock system'}
            </Button>
          </div>
        )}
      </div>

      {settings.isError && (
        <div className="mt-4">
          <ErrorAlert>Could not load the lock state: {settings.error.message} Changes are disabled until it loads.</ErrorAlert>
        </div>
      )}
      {toggleLock.isError && (
        <div className="mt-4">
          <ErrorAlert>{toggleLock.error.message}</ErrorAlert>
        </div>
      )}
      {locked && (
        <p role="status" className="mt-4 rounded-md border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
          <strong className="font-semibold">The system is locked.</strong> Users and candidates cannot be added, edited or
          removed. Voting continues as normal.
        </p>
      )}

      <nav aria-label="Election console" className="mt-6 border-b border-line">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors ${
                    isActive ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-6">
        <Outlet context={{ locked } satisfies AdminContext} />
      </div>
    </div>
  );
}
