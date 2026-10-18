import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { homePathFor, useAuth } from '../auth/AuthContext';
import { Button, ErrorAlert, Field, card } from '../components/ui';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathFor(signedIn), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className={`mx-auto max-w-sm p-6 sm:mt-6 ${card}`}>
      <h1 className="text-2xl font-bold text-ink-strong">Sign in</h1>
      <p className="mt-2 text-ink-muted">Voters see their ballot. Administrators see the election console.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <Field
          label="Email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
