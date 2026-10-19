import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { homePathFor, useAuth } from '../auth/AuthContext';
import { Button, ErrorAlert, Field, card } from '../components/ui';

function SignInCard({ title, intro, secretField, signIn, footer }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await signIn(email, secret);
      const from = location.state?.from;
      navigate(from ?? homePathFor(signedIn), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 sm:mt-6">
      <div className={`p-6 ${card}`}>
        <h1 className="text-2xl font-bold text-ink-strong">{title}</h1>
        <p className="mt-2 text-ink-muted">{intro}</p>

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
            label={secretField.label}
            type={secretField.type}
            autoComplete={secretField.autoComplete}
            hint={secretField.hint}
            required
            spellCheck={false}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
      <p className="text-center text-sm text-ink-muted">{footer}</p>
    </div>
  );
}

const footerLink = 'inline-flex min-h-11 items-center font-bold text-primary underline';

export function VoterLoginPage() {
  const { voterLogin } = useAuth();
  return (
    <SignInCard
      title="Sign in to vote"
      intro="Use the email address and vote code you received from the election administrator."
      secretField={{
        label: 'Vote code',
        type: 'text',
        autoComplete: 'off',
        hint: 'Eight letters and numbers, like ABCD-2345. Capitals and the dash are optional.',
      }}
      signIn={voterLogin}
      footer={
        <>
          Running the election?{' '}
          <Link to="/admin/login" className={footerLink}>
            Administrator sign in
          </Link>
        </>
      }
    />
  );
}

export function AdminLoginPage() {
  const { adminLogin } = useAuth();
  return (
    <SignInCard
      title="Administrator sign in"
      intro="For election staff who manage voters, candidates and the count."
      secretField={{ label: 'Password', type: 'password', autoComplete: 'current-password' }}
      signIn={adminLogin}
      footer={
        <>
          Here to vote?{' '}
          <Link to="/login" className={footerLink}>
            Voter sign in
          </Link>
        </>
      }
    />
  );
}
