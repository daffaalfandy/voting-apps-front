import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Candidate } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { QueryState } from '../../components/QueryState';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert, Field, WriteInTag, card } from '../../components/ui';
import { plural } from '../../lib/format';
import { useAdminContext } from './AdminLayout';

export function CandidatesPage() {
  const { locked } = useAdminContext();
  const blocked = locked !== false;
  const queryClient = useQueryClient();
  const notify = useToast();
  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Candidate | null>(null);

  const candidates = useQuery({
    queryKey: ['candidates'],
    queryFn: () => api<{ candidates: Candidate[] }>('/candidates').then((res) => res.candidates),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['candidates'] });
    void queryClient.invalidateQueries({ queryKey: ['results'] });
  };

  const add = useMutation({
    mutationFn: (candidateName: string) =>
      api<{ candidate: Candidate }>('/candidates', { method: 'POST', body: { name: candidateName } }),
    onSuccess: ({ candidate }) => {
      setName('');
      refresh();
      notify(`${candidate.name} added to the ballot`);
    },
  });

  const remove = useMutation({
    mutationFn: (candidate: Candidate) => api<void>(`/candidates/${candidate.id}`, { method: 'DELETE' }),
    onSuccess: (_data, candidate) => {
      setPendingDelete(null);
      refresh();
      notify(`${candidate.name} removed from the ballot`);
    },
  });

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    add.mutate(name);
  }

  function confirmDelete(candidate: Candidate) {
    remove.reset();
    setPendingDelete(candidate);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <section aria-labelledby="add-heading" className={`self-start p-5 ${card}`}>
        <h2 id="add-heading" className="text-lg font-bold text-ink-strong">
          Add a name
        </h2>
        <form onSubmit={handleAdd} className="mt-4 space-y-4">
          {add.isError && <ErrorAlert>{add.error.message}</ErrorAlert>}
          <Field
            label="Candidate name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            disabled={blocked}
            onChange={(e) => setName(e.target.value)}
            hint={blocked ? 'Unlock the system to add names.' : "Letters, spaces and . ' - only."}
          />
          <Button type="submit" variant="primary" disabled={blocked || add.isPending}>
            {add.isPending ? 'Adding…' : 'Add to ballot'}
          </Button>
        </form>
      </section>

      <section aria-labelledby="ballot-list-heading" className={`p-5 ${card}`}>
        <h2 id="ballot-list-heading" className="text-lg font-bold text-ink-strong">
          On the ballot
        </h2>
        <div className="mt-4">
          <QueryState query={candidates} what="candidates">
            {(items) =>
              items.length === 0 ? (
                <p className="text-ink-muted">No names on the ballot yet. Add the first one; voters can also write names in.</p>
              ) : (
                <ul className="divide-y divide-line-soft border-y border-line-soft">
                  {items.map((candidate) => (
                    <li key={candidate.id} className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink-strong">{candidate.name}</span>
                        {candidate.isWriteIn && <WriteInTag />}
                        <span className="text-sm text-ink-muted">{plural(candidate.voteCount ?? 0, 'vote', 'votes')}</span>
                      </div>
                      {(candidate.voteCount ?? 0) > 0 ? (
                        <span className="text-sm text-ink-muted">Has votes, so it stays</span>
                      ) : (
                        <Button
                          variant="danger"
                          disabled={blocked}
                          onClick={() => confirmDelete(candidate)}
                          aria-label={`Remove ${candidate.name}`}
                        >
                          Remove
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryState>
        </div>
      </section>

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title={`Remove ${pendingDelete?.name ?? ''}?`}>
        <p className="text-ink-muted">They will no longer appear on the ballot.</p>
        {remove.isError && (
          <div className="mt-4">
            <ErrorAlert>{remove.error.message}</ErrorAlert>
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() => pendingDelete && remove.mutate(pendingDelete)}
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
