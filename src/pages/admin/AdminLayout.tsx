import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useOutletContext } from 'react-router';
import { api } from '../../api/client';
import type { Settings } from '../../api/types';
import { useToast } from '../../components/Toast';
import { Badge, Button, ErrorAlert } from '../../components/ui';

interface AdminContext {
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
      notify(next.locked ? 'System locked: voting is open' : 'System unlocked: voting is closed');
    },
  });

  const locked = settings.data?.locked;

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">Election console</h1>
          <p className="mt-1 text-ink-muted">Follow the count, keep the ballot tidy and manage who can vote.</p>
        </div>
        {settings.isSuccess && (
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              System
              <Badge tone={locked ? 'warn' : 'success'}>{locked ? 'Locked' : 'Unlocked'}</Badge>
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
      {locked === true && (
        <p role="status" className="mt-4 rounded-lg border border-warn-line bg-warn-wash px-4 py-3 text-sm text-warn-ink">
          <strong className="font-bold">The election is running.</strong> Voters can vote, and users and candidates are
          locked. Unlocking closes voting so you can make changes.
        </p>
      )}
      {locked === false && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-ink">
          <strong className="font-bold">Preparing the election.</strong> Voting has not started. Set up users and
          candidates, then lock the system to open voting.
        </p>
      )}

      <nav aria-label="Election console" className="mt-5">
        <ul className="inline-flex gap-1 rounded-lg bg-line-soft p-1">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center rounded-md px-4 text-sm font-bold transition-colors ${
                    isActive ? 'bg-surface text-ink-strong shadow-xs' : 'text-ink hover:bg-surface-muted'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-5">
        <Outlet context={{ locked } satisfies AdminContext} />
      </div>
    </div>
  );
}
