import { Button } from './ui';

export function QueryState({ query, what, children }) {
  if (query.isPending) {
    return (
      <p role="status" className="py-10 text-center text-ink-muted">
        Loading {what}…
      </p>
    );
  }

  if (query.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-danger-line bg-danger-soft p-4 text-danger-ink">
        <p className="font-semibold">Could not load {what}.</p>
        <p className="text-sm">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}
