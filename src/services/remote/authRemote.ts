import type { User } from '@/types';
import { db, unwrap } from '../supabase';

export class RemoteAuthError extends Error {}

/** 선생님: Supabase 계정(이메일+비밀번호) + teachers 표에 등록되어 있어야 함 */
export async function signInTeacher(email: string, password: string): Promise<User> {
  const { data, error } = await db().auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new RemoteAuthError('이메일 또는 비밀번호가 올바르지 않습니다.');
  const rows = unwrap(await db().from('teachers').select('name').eq('id', data.user.id));
  const teacher = (rows as { name: string }[])[0];
  if (!teacher) {
    await db().auth.signOut();
    throw new RemoteAuthError('선생님으로 등록되지 않은 계정이에요. 관리자에게 문의하세요.');
  }
  return { id: `teacher:${data.user.id}`, name: teacher.name, role: 'teacher' };
}

export async function signOut(): Promise<void> {
  await db().auth.signOut();
}

export async function hasTeacherSession(): Promise<boolean> {
  const { data } = await db().auth.getSession();
  return Boolean(data.session);
}
