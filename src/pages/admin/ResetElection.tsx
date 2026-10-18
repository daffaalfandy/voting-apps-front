import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Results } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert, Field, card } from '../../components/ui';
import { plural } from '../../lib/format';
import { useAdminContext } from './AdminLayout';

const CONFIRM_WORD = 'RESET';

export function ResetElection({ results }: { results: Results }) {
  const { locked } = useAdminContext();
  const queryClient = useQueryClient();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const writeIns = results.candidates.filter((c) => c.isWriteIn).length;
  const nothingToReset = results.totalVotes === 0 && writeIns === 0;

  const reset = useMutation({
    mutationFn: () =>
      api<{ votesRemoved: number; writeInsRemoved: number }>('/election/reset', { method: 'POST' }),
    onSuccess: ({ votesRemoved, writeInsRemoved }) => {
      for (const key of ['results', 'participation', 'candidates', 'users']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      setOpen(false);
      notify(
        `Election reset: ${plural(votesRemoved, 'vote', 'votes')} and ${plural(writeInsRemoved, 'write-in name', 'write-in names')} removed`,
      );
    },
  });

  function openDialog() {
    reset.reset();
    setTyped('');
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    reset.mutate();
  }

  return (
    <section aria-labelledby="reset-heading" className={`p-5 ${card}`}>
      <h2 id="reset-heading" className="text-lg font-bold text-ink-strong">
        Reset the election
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Deletes every vote and every write-in name so voting can start over. Voters, their vote codes and the names you
        added stay.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="danger" disabled={locked !== false || nothingToReset} onClick={openDialog}>
          Reset election
        </Button>
        {nothingToReset ? (
          <p className="text-sm text-ink-muted">Nothing to reset yet: no votes or write-in names.</p>
        ) : (
          locked !== false && <p className="text-sm text-ink-muted">Unlock the system first to close voting, so no votes arrive during the reset.</p>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Reset the election?">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-ink-muted">
            This deletes {plural(results.totalVotes, 'vote', 'votes')} and {plural(writeIns, 'write-in name', 'write-in names')}.
            It cannot be undone.
          </p>
          {reset.isError && <ErrorAlert>{reset.error.message}</ErrorAlert>}
          <Field
            label={`Type ${CONFIRM_WORD} to confirm`}
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="danger"
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD || reset.isPending}
            >
              {reset.isPending ? 'Resetting…' : 'Reset election'}
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
