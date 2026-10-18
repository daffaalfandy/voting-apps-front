import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Button } from './ui';

interface QueryStateProps<T> {
  query: UseQueryResult<T>;
  /** What is being loaded, e.g. "results", used in the loading and error copy. */
  what: string;
  children(data: T): ReactNode;
}

export function QueryState<T>({ query, what, children }: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <p role="status" className="py-10 text-center text-ink-muted">
        Loading {what}…
      </p>
    );
  }

  if (query.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border border-danger bg-danger-soft p-4 text-danger-strong">
        <p className="font-semibold">Could not load {what}.</p>
        <p className="text-sm">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}
