import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { api } from '../../api/client';
import type { Results, Standing } from '../../api/types';
import { QueryState } from '../../components/QueryState';
import { Badge, Button, WriteInTag, card } from '../../components/ui';
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
        <div className="space-y-5">
          <section
            aria-labelledby="summary-heading"
            className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between ${card}`}
          >
            <div>
              <h2 id="summary-heading" className="sr-only">
                Summary
              </h2>
              <p className="text-5xl font-extrabold tabular-nums text-ink-strong">{data.totalVotes}</p>
              <p className="mt-1 font-bold">{data.totalVotes === 1 ? 'vote cast' : 'votes cast'}</p>
              <p className="mt-2 text-ink-muted">
                {data.participation.eligible === 0 ? (
                  <>
                    No active voters yet. <Link to="/admin/users" className="font-bold text-primary underline">Add voters</Link>
                  </>
                ) : (
                  <>
                    {data.participation.voted} of {plural(data.participation.eligible, 'eligible voter', 'eligible voters')}{' '}
                    {data.participation.voted === 1 ? 'has' : 'have'} voted{' '}
                    <span className="font-bold text-primary">
                      ({percent(data.participation.voted, data.participation.eligible)}%)
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span aria-live="polite">Updated {formatTime(new Date(results.dataUpdatedAt))}</span>
              <Button disabled={results.isFetching} onClick={() => results.refetch()}>
                {results.isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </section>

          <section aria-labelledby="standings-heading" className={`p-5 ${card}`}>
            <h2 id="standings-heading" className="text-lg font-bold text-ink-strong">
              Standings
            </h2>
            {data.candidates.length === 0 ? (
              <p className="mt-3 text-ink-muted">
                No candidates yet. <Link to="/admin/candidates" className="font-bold text-primary underline">Add names</Link>{' '}
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

// Mockup colour coding: leader emerald, write-in amber, everyone else indigo.
function barColour(candidate: Standing, isLeader: boolean) {
  if (isLeader) return 'bg-success';
  if (candidate.isWriteIn) return 'bg-warn';
  return 'bg-primary';
}

function Standings({ data }: { data: Results }) {
  const topVotes = data.candidates[0]?.votes ?? 0;
  const leaders = topVotes > 0 ? data.candidates.filter((c) => c.votes === topVotes).length : 0;

  return (
    <ol className="mt-4 space-y-5">
      {data.candidates.map((candidate) => {
        const isLeader = topVotes > 0 && candidate.votes === topVotes;
        const share = percent(candidate.votes, data.totalVotes);
        return (
          <li key={candidate.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-ink-strong">{candidate.name}</span>
                {candidate.isWriteIn && <WriteInTag />}
                {isLeader && <Badge tone="success">{leaders > 1 ? 'Tied for first' : 'Leading'}</Badge>}
              </p>
              <p className="text-sm tabular-nums">
                <span className="font-bold">{plural(candidate.votes, 'vote', 'votes')}</span>
                <span className="text-ink-muted"> · {share}%</span>
              </p>
            </div>
            <div aria-hidden="true" className="h-3 overflow-hidden rounded-full border border-line bg-bar-track">
              <div className={`h-full ${barColour(candidate, isLeader)}`} style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
