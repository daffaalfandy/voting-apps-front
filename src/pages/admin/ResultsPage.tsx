import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { api } from '../../api/client';
import type { Results } from '../../api/types';
import { QueryState } from '../../components/QueryState';
import { Button, WriteInTag } from '../../components/ui';
import { formatTime, percent, plural } from '../../lib/format';

export function ResultsPage() {
  const results = useQuery({
    queryKey: ['results'],
    queryFn: () => api<Results>('/results'),
    refetchInterval: 10_000,
  });

  return (
    <QueryState query={results} what="results">
      {(data) => (
        <div className="space-y-8">
          <section aria-labelledby="summary-heading" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="summary-heading" className="sr-only">
                Summary
              </h2>
              <p className="text-5xl font-extrabold tabular-nums">{data.totalVotes}</p>
              <p className="mt-1 font-semibold">{data.totalVotes === 1 ? 'vote cast' : 'votes cast'}</p>
              <p className="mt-2 text-ink-muted">
                {data.participation.eligible === 0 ? (
                  <>
                    No active voters yet. <Link to="../users" relative="path" className="font-semibold text-primary underline">Add voters</Link>
                  </>
                ) : (
                  `${data.participation.voted} of ${plural(data.participation.eligible, 'eligible voter', 'eligible voters')} ${
                    data.participation.voted === 1 ? 'has' : 'have'
                  } voted (${percent(data.participation.voted, data.participation.eligible)}%)`
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span aria-live="polite">Updated {formatTime(new Date(results.dataUpdatedAt))}</span>
              <Button variant="quiet" disabled={results.isFetching} onClick={() => results.refetch()}>
                {results.isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </section>

          <section aria-labelledby="standings-heading">
            <h2 id="standings-heading" className="text-lg font-bold">
              Standings
            </h2>
            {data.candidates.length === 0 ? (
              <p className="mt-3 text-ink-muted">
                No candidates yet. <Link to="../candidates" relative="path" className="font-semibold text-primary underline">Add names</Link>{' '}
                or wait for voters to write them in.
              </p>
            ) : (
              <Standings data={data} />
            )}
          </section>
        </div>
      )}
    </QueryState>
  );
}

function Standings({ data }: { data: Results }) {
  const topVotes = data.candidates[0]?.votes ?? 0;
  const leaders = topVotes > 0 ? data.candidates.filter((c) => c.votes === topVotes).length : 0;

  return (
    <ol className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
      {data.candidates.map((candidate) => {
        const isLeader = topVotes > 0 && candidate.votes === topVotes;
        const share = percent(candidate.votes, data.totalVotes);
        return (
          <li key={candidate.id} className="space-y-2 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{candidate.name}</span>
                {candidate.isWriteIn && <WriteInTag />}
                {isLeader && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <span aria-hidden="true" className="ballot-mark h-3.5 w-6" data-filled="" />
                    {leaders > 1 ? 'Tied for first' : 'Leading'}
                  </span>
                )}
              </p>
              <p className="text-sm tabular-nums">
                <span className="font-semibold">{plural(candidate.votes, 'vote', 'votes')}</span>
                <span className="text-ink-muted"> · {share}%</span>
              </p>
            </div>
            <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-bar-track">
              <div
                className={`h-full rounded-full ${isLeader ? 'bg-primary' : 'bg-bar-muted'}`}
                style={{ width: `${share}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
