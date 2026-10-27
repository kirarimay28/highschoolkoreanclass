import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { studentsMock } from '@/data/students.mock';
import { teachersMock } from '@/data/teachers.mock';
import * as authService from '@/services/authService';
import { describeStudentId } from '@/services/rosterService';
import { STORAGE_KEYS, readJSON, writeJSON } from '@/services/storage';
import type { User } from '@/types';

/** 교수자가 빌려 쓰는 시점 */
export type ProfessorView = 'student' | 'teacher';

interface AuthContextValue {
  /** 화면에서 쓰는 사용자. 교수자는 지금 고른 시점의 샘플 학생·선생님 */
  user: User | null;
  role: User['role'] | null;
  /** 실제로 로그인한 사람 (교수자인지 확인할 때) */
  account: User | null;
  isProfessor: boolean;
  professorView: ProfessorView;
  setProfessorView: (v: ProfessorView) => void;
  /** 각 로그인 폼이 서비스 호출 후 받은 User 로 세션을 시작 */
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 교수자 체험용 샘플 사용자 (실제 학생·선생님 정보가 아님) */
function borrowedUser(view: ProfessorView): User {
  if (view === 'teacher') {
    const t = teachersMock[0];
    return { id: `teacher:${t.staffId}`, name: t.name, role: 'teacher', meta: '체험용 샘플 계정' };
  }
  const s = studentsMock[0];
  return { id: `student:${s.studentId}`, name: s.name, role: 'student', meta: describeStudentId(s.studentId) ?? '체험용 샘플 계정' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<User | null>(() => authService.getSessionUser());
  const [professorView, setView] = useState<ProfessorView>(() => readJSON<ProfessorView>(STORAGE_KEYS.professorView, 'student'));

  useEffect(() => {
    authService.verifySession(authService.getSessionUser()).then((ok) => !ok && setAccount(null));
  }, []);

  const signIn = useCallback((next: User) => {
    setAccount(next);
    setView('student');
  }, []);
  const signOut = useCallback(async () => {
    await authService.logout();
    setAccount(null);
  }, []);
  const setProfessorView = useCallback((v: ProfessorView) => {
    setView(v);
    writeJSON(STORAGE_KEYS.professorView, v);
  }, []);

  const isProfessor = account?.role === 'professor';
  const user = useMemo(() => (isProfessor ? borrowedUser(professorView) : account), [isProfessor, professorView, account]);

  const value = useMemo(
    () => ({ user, role: user?.role ?? null, account, isProfessor, professorView, setProfessorView, signIn, signOut }),
    [user, account, isProfessor, professorView, setProfessorView, signIn, signOut],
  );
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
