import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Role, User } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Dialog } from '../../components/Dialog';
import { useToast } from '../../components/Toast';
import { Button, ErrorAlert, Field, SelectField } from '../../components/ui';

interface UserFormDialogProps {
  open: boolean;
  /** The user being edited, or null to create one. */
  user: User | null;
  onClose(): void;
}

export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const { user: me, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(user?.role ?? 'voter');

  const isSelf = user !== null && user.id === me?.id;
  const roleLockedReason = isSelf
    ? 'You cannot change your own role.'
    : user?.hasVoted
      ? 'This voter has already voted, so their role stays the same.'
      : undefined;

  const save = useMutation({
    mutationFn: () => {
      if (!user) {
        return api<{ user: User }>('/users', { method: 'POST', body: { name, email, password, role } });
      }
      const changes: Record<string, string> = { name, email };
      if (role !== user.role) changes.role = role;
      if (password) changes.password = password;
      return api<{ user: User }>(`/users/${user.id}`, { method: 'PATCH', body: changes });
    },
    onSuccess: ({ user: saved }) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['results'] });
      if (isSelf) void refreshUser();
      notify(user ? `${saved.name} updated` : `${saved.name} added`);
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
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
        <Field
          label={user ? 'New password' : 'Password'}
          type="password"
          required={!user}
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={user ? 'Leave blank to keep the current password.' : 'At least 8 characters. Share it with the person directly.'}
        />
        <SelectField
          label="Role"
          value={role}
          disabled={roleLockedReason !== undefined}
          onChange={(e) => setRole(e.target.value as Role)}
          hint={roleLockedReason ?? 'Voters can only vote. Administrators run this console and cannot vote.'}
        >
          <option value="voter">Voter</option>
          <option value="admin">Administrator</option>
        </SelectField>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : user ? 'Save changes' : 'Add user'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
