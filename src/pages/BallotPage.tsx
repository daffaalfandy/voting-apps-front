import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Candidate, MyVote } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Dialog } from '../components/Dialog';
import { QueryState } from '../components/QueryState';
import { useToast } from '../components/Toast';
import { Button, ErrorAlert, Field, WriteInTag, card } from '../components/ui';
import { formatDateTime } from '../lib/format';

const WRITE_IN = 'write-in';

const normalize = (name: string) => name.trim().replace(/\s+/g, ' ');

export function BallotPage() {
  const myVote = useQuery({
    queryKey: ['myVote'],
    queryFn: () => api<{ vote: MyVote | null }>('/votes/me').then((res) => res.vote),
  });

  return (
    <div className="mx-auto max-w-xl">
      <QueryState query={myVote} what="your ballot">
        {(vote) => (vote ? <VoteReceipt vote={vote} /> : <Ballot />)}
      </QueryState>
    </div>
  );
}

function VoteReceipt({ vote }: { vote: MyVote }) {
  return (
    <section aria-labelledby="receipt-heading" className={`p-5 sm:p-6 ${card}`}>
      <h1 id="receipt-heading" className="text-2xl font-bold text-ink-strong">
        Your vote is in
      </h1>
      <div className="mt-5 rounded-lg border border-success-line bg-success-soft p-4 text-success-ink">
        <p className="text-sm">You voted for</p>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-xl font-bold">
          <span aria-hidden="true" className="ballot-mark border-success bg-success" data-filled="" />
          {vote.candidate.name}
          {vote.candidate.isWriteIn && <WriteInTag />}
        </p>
        <p className="mt-3 text-sm">Recorded {formatDateTime(vote.createdAt)}</p>
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        Votes cannot be changed. If something is wrong, contact the election administrator.
      </p>
    </section>
  );
}

function Ballot() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const notify = useToast();
  const [choice, setChoice] = useState('');
  const [writeIn, setWriteIn] = useState('');
  const [confirming, setConfirming] = useState(false);

  const candidates = useQuery({
    queryKey: ['candidates'],
    queryFn: () => api<{ candidates: Candidate[] }>('/candidates').then((res) => res.candidates),
  });

  const cast = useMutation({
    mutationFn: () =>
      api<{ vote: MyVote }>('/votes', {
        method: 'POST',
        body: choice === WRITE_IN ? { name: writeIn } : { candidateId: choice },
      }),
    onSuccess: ({ vote }) => {
      queryClient.setQueryData(['myVote'], vote);
      void queryClient.invalidateQueries({ queryKey: ['candidates'] });
      void refreshUser();
      notify('Vote recorded');
    },
    onError: (err) => {
      // Already voted in another tab: show the receipt instead of the ballot.
      if (err instanceof ApiError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['myVote'] });
      }
    },
  });

  const list = candidates.data ?? [];
  const writeInName = normalize(writeIn);
  const matchingCandidate = list.find((c) => c.name.toLowerCase() === writeInName.toLowerCase());
  const chosenName = choice === WRITE_IN ? writeInName : list.find((c) => c.id === choice)?.name ?? '';
  const ready = choice === WRITE_IN ? writeInName.length >= 2 : chosenName !== '';

  function openConfirm() {
    cast.reset();
    setConfirming(true);
  }

  return (
    <section aria-labelledby="ballot-heading" className={`p-5 sm:p-6 ${card}`}>
      <h1 id="ballot-heading" className="text-2xl font-bold text-ink-strong">
        Cast your vote
      </h1>
      <p className="mt-2 text-ink-muted">Choose one name, or write in someone who is not listed. You can vote once.</p>

      <div className="mt-6">
        <QueryState query={candidates} what="the ballot">
          {(items) => (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-bold text-ink">Names on the ballot</legend>

              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-ink-muted">
                  No names are on the ballot yet. Choose “Someone else” below to write in your choice.
                </p>
              )}

              {items.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border-2 border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong has-checked:border-primary has-checked:bg-primary-soft"
                >
                  <input
                    type="radio"
                    name="choice"
                    value={candidate.id}
                    checked={choice === candidate.id}
                    onChange={() => setChoice(candidate.id)}
                    className="ballot-mark"
                  />
                  <span className="font-semibold">{candidate.name}</span>
                  {candidate.isWriteIn && <WriteInTag />}
                </label>
              ))}

              <div className="rounded-xl border-2 border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong has-checked:border-warn-mark has-checked:bg-warn-wash">
                <label className="flex min-h-11 cursor-pointer items-center gap-4">
                  <input
                    type="radio"
                    name="choice"
                    value={WRITE_IN}
                    checked={choice === WRITE_IN}
                    onChange={() => setChoice(WRITE_IN)}
                    className="ballot-mark checked:border-warn-mark checked:bg-warn-mark"
                  />
                  <span className="font-semibold">Someone else</span>
                </label>
                <div className="mt-3 sm:pl-13">
                  <Field
                    label="Their full name"
                    value={writeIn}
                    maxLength={80}
                    autoComplete="off"
                    onFocus={() => setChoice(WRITE_IN)}
                    onChange={(e) => {
                      setWriteIn(e.target.value);
                      setChoice(WRITE_IN);
                    }}
                    hint={
                      matchingCandidate
                        ? `${matchingCandidate.name} is already on the ballot; your vote will count for them.`
                        : 'If this name is already on the ballot, your vote counts for that person.'
                    }
                  />
                </div>
              </div>
            </fieldset>
          )}
        </QueryState>
      </div>

      {candidates.isSuccess && (
        <div className="mt-6 flex flex-col gap-4 border-t border-line-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite">
            <span className="block text-sm font-bold text-ink-muted">Your choice</span>
            <span className="font-bold text-ink-strong">{ready ? chosenName : 'Nothing chosen yet'}</span>
          </p>
          <Button variant="primary" disabled={!ready} onClick={openConfirm} className="sm:min-w-40">
            Review vote
          </Button>
        </div>
      )}

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Confirm your vote">
        <p className="text-ink-muted">You are voting for</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold">
          {matchingCandidate && choice === WRITE_IN ? matchingCandidate.name : chosenName}
          {choice === WRITE_IN && !matchingCandidate && <WriteInTag />}
        </p>
        <p className="mt-4 text-sm text-ink-muted">You can vote once. Your vote cannot be changed after you submit it.</p>
        {cast.isError && (
          <div className="mt-4">
            <ErrorAlert>{cast.error.message}</ErrorAlert>
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirming(false)}>Go back</Button>
          <Button variant="primary" disabled={cast.isPending} onClick={() => cast.mutate()}>
            {cast.isPending ? 'Submitting…' : 'Submit vote'}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
