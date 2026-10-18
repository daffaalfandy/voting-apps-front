import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  restoring: boolean;
  voterLogin(email: string, code: string): Promise<User>;
  adminLogin(email: string, password: string): Promise<User>;
  logout(): void;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(() => tokenStore.get() !== null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await api<{ user: User }>('/auth/me');
    setUser(fresh);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    refreshUser()
      .catch(() => logout())
      .finally(() => setRestoring(false));
  }, [refreshUser, logout]);

  const startSession = useCallback(async (path: string, body: object) => {
    const res = await api<{ token: string; user: User }>(path, { method: 'POST', body });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const voterLogin = useCallback(
    (email: string, code: string) => startSession('/auth/login', { email, code }),
    [startSession],
  );

  const adminLogin = useCallback(
    (email: string, password: string) => startSession('/auth/admin/login', { email, password }),
    [startSession],
  );

  const value = useMemo(
    () => ({ user, restoring, voterLogin, adminLogin, logout, refreshUser }),
    [user, restoring, voterLogin, adminLogin, logout, refreshUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const homePathFor = (user: User) => (user.role === 'admin' ? '/admin/results' : '/vote');
