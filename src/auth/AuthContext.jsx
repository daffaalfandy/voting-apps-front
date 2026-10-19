import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(() => tokenStore.get() !== null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await api('/auth/me');
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

  const startSession = useCallback(async (path, body) => {
    const res = await api(path, { method: 'POST', body });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const voterLogin = useCallback((email, code) => startSession('/auth/login', { email, code }), [startSession]);

  const adminLogin = useCallback((email, password) => startSession('/auth/admin/login', { email, password }), [startSession]);

  const value = useMemo(
    () => ({ user, restoring, voterLogin, adminLogin, logout, refreshUser }),
    [user, restoring, voterLogin, adminLogin, logout, refreshUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const homePathFor = (user) => (user.role === 'admin' ? '/admin/results' : '/vote');
