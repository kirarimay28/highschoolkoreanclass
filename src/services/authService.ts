import { professorAccount } from '@/config/professorQuiz';
import { teachersMock } from '@/data/teachers.mock';
import type { User } from '@/types';
import { getStudentRoster } from './rosterService';
import { STORAGE_KEYS, readJSON, removeKey, writeJSON } from './storage';

/**
 * 인증 서비스 (mock)
 * 실제 인증 연결 시: 각 login 함수 내부를 Supabase Auth 등으로 교체.
 * 반환 형태(User)만 유지하면 화면 코드는 그대로 동작합니다.
 */

export class AuthError extends Error {}

function saveSession(user: User): User {
  writeJSON(STORAGE_KEYS.session, user);
  return user;
}

export async function loginStudent(studentId: string, password: string): Promise<User> {
  const student = getStudentRoster().find((s) => s.studentId === studentId.trim());
  if (!student || student.password !== password) {
    throw new AuthError('학번 또는 비밀번호가 올바르지 않습니다.');
  }
  return saveSession({
    id: `student:${student.studentId}`,
    name: student.name,
    role: 'student',
    meta: `${student.grade}학년 ${student.classNo}반 ${student.number}번`,
  });
}

export async function loginTeacher(staffId: string, password: string): Promise<User> {
  const teacher = teachersMock.find((t) => t.staffId === staffId.trim());
  if (!teacher || teacher.password !== password) {
    throw new AuthError('교직원 ID 또는 비밀번호가 올바르지 않습니다.');
  }
  return saveSession({ id: `teacher:${teacher.staffId}`, name: teacher.name, role: 'teacher' });
}

/** 교수자 퀴즈를 모두 통과했을 때 호출 */
export async function loginProfessor(): Promise<User> {
  return saveSession({ id: `professor:${professorAccount.id}`, name: professorAccount.name, role: 'professor' });
}

export function getSessionUser(): User | null {
  return readJSON<User | null>(STORAGE_KEYS.session, null);
}

export async function logout(): Promise<void> {
  removeKey(STORAGE_KEYS.session);
}
