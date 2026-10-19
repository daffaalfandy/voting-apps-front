import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Dialog } from '../../components/Dialog';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert, Field, SelectField } from '../../components/ui';

function VoteCodeReveal({ code, name }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-success-line bg-success-soft p-4 text-success-ink">
      <p className="text-sm font-bold">Vote code for {name}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-wider tabular-nums select-all">{code}</p>
      <p className="mt-2 text-sm">
        Give it to {name} privately. It is shown only now; if it gets lost, issue a new one from Edit.
      </p>
      <Button onClick={copy} className="mt-3">
        <span aria-live="polite">{copied ? 'Copied' : 'Copy code'}</span>
      </Button>
    </div>
  );
}

export function UserFormDialog({ open, user, onClose }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const { user: me, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'voter');
  const [issuedCode, setIssuedCode] = useState(null);

  const isSelf = user !== null && user.id === me?.id;
  const needsPassword = user ? user.role === 'admin' : role === 'admin';

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['results'] });
    void queryClient.invalidateQueries({ queryKey: ['participation'] });
  };

  const save = useMutation({
    mutationFn: () => {
      if (!user) {
        const body = role === 'admin' ? { name, email, role, password } : { name, email, role };
        return api('/users', { method: 'POST', body });
      }
      const changes = { name, email };
      if (password) changes.password = password;
      return api(`/users/${user.id}`, { method: 'PATCH', body: changes });
    },
    onSuccess: ({ user: saved, voteCode }) => {
      refresh();
      if (isSelf) void refreshUser();
      notify(user ? `${saved.name} updated` : `${saved.name} added`);
      if (voteCode) {
        setIssuedCode({ code: voteCode, name: saved.name });
      } else {
        onClose();
      }
    },
  });

  const reissue = useMutation({
    mutationFn: (target) => api(`/users/${target.id}/vote-code`, { method: 'POST' }),
    onSuccess: ({ voteCode }, target) => setIssuedCode({ code: voteCode, name: target.name }),
  });

  function handleSubmit(event) {
    event.preventDefault();
    save.mutate();
  }

  if (!user && issuedCode) {
    return (
      <Dialog open={open} onClose={onClose} title={`${issuedCode.name} added`}>
        <VoteCodeReveal code={issuedCode.code} name={issuedCode.name} />
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title={user ? `Edit ${user.name}` : 'Add a user'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {save.isError && <ErrorAlert>{save.error.message}</ErrorAlert>}
        <Field label="Full name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Email"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {!user && (
          <SelectField
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            hint={
              role === 'voter'
                ? 'A vote code is generated when you save. Voters sign in with their email and that code.'
                : 'Administrators run this console with a password and cannot vote.'
            }
          >
            <option value="voter">Voter</option>
            <option value="admin">Administrator</option>
          </SelectField>
        )}
        {needsPassword && (
          <Field
            label={user ? 'New password' : 'Password'}
            type="password"
            required={!user}
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={user ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
          />
        )}

        {user?.role === 'voter' && (
          <div className="space-y-3 rounded-lg border border-line-soft bg-surface-muted p-4">
            <p className="text-sm font-bold">Vote code</p>
            {issuedCode ? (
              <VoteCodeReveal code={issuedCode.code} name={issuedCode.name} />
            ) : (
              <>
                <p className="text-sm text-ink-muted">Lost code? Issuing a new one stops the old code from working.</p>
                {reissue.isError && <ErrorAlert>{reissue.error.message}</ErrorAlert>}
                <Button disabled={reissue.isPending} onClick={() => reissue.mutate(user)}>
                  {reissue.isPending ? 'Issuing…' : 'Issue new code'}
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>{issuedCode ? 'Close' : 'Cancel'}</Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : user ? 'Save changes' : 'Add user'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
