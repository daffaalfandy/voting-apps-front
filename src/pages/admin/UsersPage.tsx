import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client';
import type { User, UserStatus } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Dialog } from '../../components/Dialog';
import { QueryState } from '../../components/QueryState';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useAdminContext } from './AdminLayout';
import { UserFormDialog } from './UserFormDialog';

type Filter = 'all' | 'voted' | 'not-voted';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'voted', label: 'Voted' },
  { value: 'not-voted', label: 'Not voted' },
];

type Confirmation = { kind: 'delete' | 'reset'; user: User };

export function UsersPage() {
  const { locked } = useAdminContext();
  const blocked = locked !== false;
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const notify = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useDebouncedValue(search.trim(), 250);
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ['users', query, filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (filter !== 'all') params.set('voted', String(filter === 'voted'));
      return api<{ users: User[] }>(`/users?${params}`).then((res) => res.users);
    },
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['results'] });
  };

  const setStatus = useMutation({
    mutationFn: ({ user, status }: { user: User; status: UserStatus }) =>
      api<{ user: User }>(`/users/${user.id}`, { method: 'PATCH', body: { status } }),
    onMutate: () => setActionError(null),
    onSuccess: ({ user }) => {
      refresh();
      notify(user.status === 'suspended' ? `${user.name} suspended` : `${user.name} reactivated`);
    },
    onError: (err) => setActionError(err.message),
  });

  const confirm = useMutation({
    mutationFn: ({ kind, user }: Confirmation) =>
      api<void>(kind === 'delete' ? `/users/${user.id}` : `/users/${user.id}/vote`, { method: 'DELETE' }),
    onSuccess: (_data, { kind, user }) => {
      setConfirmation(null);
      refresh();
      notify(kind === 'delete' ? `${user.name} deleted` : `${user.name}'s vote was reset`);
    },
  });

  function ask(kind: Confirmation['kind'], user: User) {
    confirm.reset();
    setConfirmation({ kind, user });
  }

  function clearFilters() {
    setSearch('');
    setFilter('all');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="user-search" className="block text-sm font-semibold">
            Search by name or email
          </label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filter by voting status" className="flex rounded-md border border-line-strong p-0.5">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={`min-h-10 rounded px-3 text-sm font-semibold transition-colors ${
                  filter === option.value ? 'bg-ink text-canvas' : 'text-ink hover:bg-surface-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button variant="primary" disabled={blocked} onClick={() => setEditing('new')}>
            Add user
          </Button>
        </div>
      </div>

      {actionError && <ErrorAlert>{actionError}</ErrorAlert>}

      <QueryState query={users} what="users">
        {(items) =>
          items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-line-strong p-6 text-center">
              <p className="text-ink-muted">
                {query ? `No users match “${query}”` : 'No users match this filter'}
                {filter !== 'all' && query ? ' with this filter' : ''}.
              </p>
              <Button onClick={clearFilters}>Clear search and filter</Button>
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface" aria-busy={users.isFetching}>
              {items.map((user) => {
                const isSelf = user.id === me?.id;
                return (
                  <li key={user.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {user.name}
                        {isSelf && <span className="font-normal text-ink-muted"> (you)</span>}
                      </p>
                      <p className="truncate text-sm text-ink-muted">{user.email}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                        <span>{user.role === 'admin' ? 'Administrator' : 'Voter'}</span>
                        {user.status === 'suspended' && <span className="font-semibold text-danger">Suspended</span>}
                        <span className="text-ink-muted">
                          {user.role === 'admin'
                            ? 'Does not vote'
                            : user.hasVoted && user.votedAt
                              ? `Voted ${formatDateTime(user.votedAt)}`
                              : 'Not voted yet'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={blocked} onClick={() => setEditing(user)} aria-label={`Edit ${user.name}`}>
                        Edit
                      </Button>
                      {user.hasVoted && (
                        <Button disabled={blocked} onClick={() => ask('reset', user)} aria-label={`Reset vote for ${user.name}`}>
                          Reset vote
                        </Button>
                      )}
                      {!isSelf && (
                        <Button
                          disabled={blocked || setStatus.isPending}
                          onClick={() => setStatus.mutate({ user, status: user.status === 'active' ? 'suspended' : 'active' })}
                          aria-label={`${user.status === 'active' ? 'Suspend' : 'Reactivate'} ${user.name}`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      )}
                      {!isSelf && (
                        <Button variant="danger" disabled={blocked} onClick={() => ask('delete', user)} aria-label={`Delete ${user.name}`}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </QueryState>

      <UserFormDialog
        key={editing === null ? 'closed' : editing === 'new' ? 'new' : editing.id}
        open={editing !== null}
        user={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />

      <Dialog
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        title={
          confirmation?.kind === 'delete'
            ? `Delete ${confirmation.user.name}?`
            : `Reset ${confirmation?.user.name ?? ''}'s vote?`
        }
      >
        <p className="text-ink-muted">
          {confirmation?.kind === 'delete'
            ? `Their account is removed${confirmation.user.hasVoted ? ' and their vote is taken out of the count' : ''}. This cannot be undone.`
            : 'Their vote is taken out of the count and they can vote again.'}
        </p>
        {confirm.isError && (
          <div className="mt-4">
            <ErrorAlert>{confirm.error.message}</ErrorAlert>
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmation(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={confirm.isPending}
            onClick={() => confirmation && confirm.mutate(confirmation)}
          >
            {confirm.isPending ? 'Working…' : confirmation?.kind === 'delete' ? 'Delete user' : 'Reset vote'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
