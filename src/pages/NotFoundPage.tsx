import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink-muted">This address does not match any page in CivicVote.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-primary underline">
        Go to your start page
      </Link>
    </div>
  );
}
