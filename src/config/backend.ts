/**
 * 데이터 저장 위치
 *  - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 Supabase(온라인, 모든 기기 공유)
 *  - 없으면 이 브라우저(localStorage)에만 저장 — 개발·미리보기용
 * 값은 프로젝트 루트의 .env.production (배포용) 또는 .env.local (내 컴퓨터용) 에 넣습니다.
 *
 * 교수자 체험 모드(sandbox): 교수자로 로그인하면 Supabase 를 쓰지 않고
 * 이 탭에서만 유지되는 임시 저장소(sessionStorage)의 샘플 데이터로 동작 → 실제 데이터에 아무것도 남지 않음
 */
export const backendConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '',
};

/** Supabase 값이 설정되어 있는지 (체험 모드와 상관없이) */
export const isBackendConfigured = Boolean(backendConfig.supabaseUrl && backendConfig.supabaseAnonKey);

/** 교수자 체험 모드인지 — 앱 시작 시 저장된 로그인이 교수자면 바로 켬 */
export let isSandbox = (() => {
  try {
    return (JSON.parse(localStorage.getItem('hkc:session') ?? 'null') as { role?: string } | null)?.role === 'professor';
  } catch {
    return false;
  }
})();

/** 지금 서버를 쓰는지 (체험 모드에서는 항상 false). 다른 파일에서 import 해도 값이 따라 바뀜 */
export let isRemoteBackend = isBackendConfigured && !isSandbox;

export function setSandbox(on: boolean) {
  isSandbox = on;
  isRemoteBackend = isBackendConfigured && !on;
}
