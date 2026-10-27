import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { backendConfig, isRemoteBackend } from '@/config/backend';

/**
 * 선생님 초대 메일·비밀번호 재설정 메일의 링크로 들어왔는지.
 * (Supabase 가 주소의 #access_token=…&type=invite 를 읽고 지우기 전에 먼저 확인)
 */
export const passwordSetupType: 'invite' | 'recovery' | null = (() => {
  if (typeof window === 'undefined') return null;
  const type = new URLSearchParams(window.location.hash.slice(1)).get('type');
  return type === 'invite' || type === 'recovery' ? type : null;
})();

/** Supabase 연결 (설정이 없으면 null → 각 서비스가 localStorage 로 동작) */
export const supabase: SupabaseClient | null = isRemoteBackend
  ? createClient(backendConfig.supabaseUrl, backendConfig.supabaseAnonKey)
  : null;

export function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase 가 설정되지 않았습니다.');
  return supabase;
}

/** Supabase 응답에서 오류를 사람이 읽을 수 있는 메시지로 바꿔 던짐 */
export function unwrap<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    console.error('[supabase]', res.error);
    throw new Error(friendlyError(res.error));
  }
  return res.data;
}

export function friendlyError(error: { message: string; code?: string }): string {
  if (error.code === '42501' || /row-level security|permission denied/i.test(error.message)) {
    return '권한이 없어요. 다시 로그인해 주세요.';
  }
  if (/fetch|network/i.test(error.message)) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
  return '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

export const toMillis = (iso: string) => new Date(iso).getTime();
