/**
 * 데이터 저장 위치
 *  - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 Supabase(온라인, 모든 기기 공유)
 *  - 없으면 이 브라우저(localStorage)에만 저장 — 개발·미리보기용
 * 값은 프로젝트 루트의 .env.production (배포용) 또는 .env.local (내 컴퓨터용) 에 넣습니다.
 */
export const backendConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '',
};

export const isRemoteBackend = Boolean(backendConfig.supabaseUrl && backendConfig.supabaseAnonKey);
