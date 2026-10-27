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

/** 지금 Supabase 로그인된 계정이 선생님이면 앱 사용자 정보로 변환 */
export async function teacherFromSession(): Promise<User> {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new RemoteAuthError('링크가 만료되었어요. 다시 요청해 주세요.');
  const rows = unwrap(await db().from('teachers').select('name').eq('id', data.user.id));
  const teacher = (rows as { name: string }[])[0];
  if (!teacher) {
    await db().auth.signOut();
    throw new RemoteAuthError('선생님으로 등록되지 않은 계정이에요. 관리자에게 문의하세요.');
  }
  return { id: `teacher:${data.user.id}`, name: teacher.name, role: 'teacher' };
}

/** 초대·재설정 링크로 들어온 뒤 새 비밀번호 저장 */
export async function setPassword(password: string): Promise<void> {
  const { error } = await db().auth.updateUser({ password });
  if (error) {
    throw new RemoteAuthError(
      /should be different/i.test(error.message) ? '이전과 다른 비밀번호를 입력해 주세요.' : '비밀번호를 저장하지 못했어요. 링크를 다시 요청해 주세요.',
    );
  }
}

/** 비밀번호 재설정 메일 보내기 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await db().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
  if (error) throw new RemoteAuthError('메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
}

export async function signOut(): Promise<void> {
  await db().auth.signOut();
}

export async function hasTeacherSession(): Promise<boolean> {
  const { data } = await db().auth.getSession();
  return Boolean(data.session);
}
