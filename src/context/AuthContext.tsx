import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as authService from '@/services/authService';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  role: User['role'] | null;
  /** 각 로그인 폼이 서비스 호출 후 받은 User 로 세션을 시작 */
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getSessionUser());

  const signIn = useCallback((next: User) => setUser(next), []);
  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, role: user?.role ?? null, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}

/** 로그인된 화면 안에서만 사용 (ProtectedRoute 하위) */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('로그인이 필요합니다.');
  return user;
}
