import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { api } from '../../api/client';
import { QueryState } from '../../components/QueryState';
import { Badge, Button, WriteInTag, card } from '../../components/ui';
import { formatDateTime, formatTime, percent, plural } from '../../lib/format';
import { ResetElection } from './ResetElection';

export function ResultsPage() {
  const queryClient = useQueryClient();
  const results = useQuery({
    queryKey: ['results'],
    queryFn: () => api('/results'),
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
              <Button
                disabled={results.isFetching}
                onClick={() => {
                  void results.refetch();
                  void queryClient.invalidateQueries({ queryKey: ['participation'] });
                }}
              >
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

          <ParticipationLedger />

          <ResetElection results={data} />
        </div>
      )}
    </QueryState>
  );
}

function ParticipationLedger() {
  const participation = useQuery({
    queryKey: ['participation'],
    queryFn: () => api('/participation').then((res) => res.participants),
    refetchInterval: 10_000,
  });

  return (
    <section aria-labelledby="participation-heading" className={`p-5 ${card}`}>
      <h2 id="participation-heading" className="text-lg font-bold text-ink-strong">
        Voter participation
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Who has cast a ballot, newest first. How each person voted is never shown.</p>
      <div className="mt-4">
        <QueryState query={participation} what="voter participation">
          {(participants) =>
            participants.length === 0 ? (
              <p className="text-ink-muted">No ballots cast yet. Voters appear here as soon as they vote.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Voters who have cast a ballot</caption>
                <thead className="border-b border-line">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-bold">
                      Voter
                    </th>
                    <th scope="col" className="hidden py-2 pr-3 font-bold sm:table-cell">
                      Voted
                    </th>
                    <th scope="col" className="hidden py-2 font-bold sm:table-cell">
                      Ballot
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="py-3 pr-3 align-top">
                        <span className="block font-bold text-ink-strong">{participant.name}</span>
                        <span className="block text-ink-muted [overflow-wrap:anywhere]">{participant.email}</span>
                        <span className="mt-1 block text-ink-muted tabular-nums sm:hidden">
                          Voted {formatDateTime(participant.votedAt)}
                        </span>
                        {participant.status === 'suspended' && (
                          <span className="mt-1 inline-block">
                            <Badge tone="danger">Suspended</Badge>
                          </span>
                        )}
                      </td>
                      <td className="hidden py-3 pr-3 align-top tabular-nums sm:table-cell">
                        {formatDateTime(participant.votedAt)}
                      </td>
                      <td className="hidden py-3 align-top sm:table-cell">
                        <Badge tone="success">Ballot cast</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </QueryState>
      </div>
    </section>
  );
}

function barColour(candidate, isLeader) {
  if (isLeader) return 'bg-success';
  if (candidate.isWriteIn) return 'bg-warn';
  return 'bg-primary';
}

function Standings({ data }) {
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
