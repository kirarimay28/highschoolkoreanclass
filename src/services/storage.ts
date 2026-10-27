/**
 * 저장소 어댑터 (현재: localStorage)
 * ─────────────────────────────────────────────
 * 모든 서비스는 이 파일의 함수만 통해서 저장/조회합니다.
 * Supabase/Firebase 로 옮길 때는 각 서비스 함수의 내부만 바꾸면 되고,
 * 화면(페이지) 코드는 건드릴 필요가 없습니다.
 */

import { isSandbox } from '@/config/backend';

const PREFIX = 'hkc:'; // highschool korean class
const SANDBOX_PREFIX = 'hkc-sandbox:';

/**
 * 교수자 체험 모드에서는 이 탭에서만 유지되는 sessionStorage 에 따로 저장 (로그인 정보 제외).
 * 로그아웃하면 clearSandbox() 로 모두 지움.
 */
function area(key: string): { store: Storage; name: string } {
  if (isSandbox && key !== 'session') return { store: sessionStorage, name: SANDBOX_PREFIX + key };
  return { store: localStorage, name: PREFIX + key };
}

export function clearSandbox(): void {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith(SANDBOX_PREFIX)) sessionStorage.removeItem(k);
  } catch {
    /* noop */
  }
}

export const STORAGE_KEYS = {
  session: 'session',
  planner: 'planner',
  studyRecords: 'studyRecords',
  board: 'board',
  library: 'library',
  feedback: 'feedback',
  roster: 'roster',
  messages: 'messages',
  passages: 'passages',
  structureWorks: 'structureWorks',
  structureNotes: 'structureNotes',
  lectures: 'lectures',
  lectureProgress: 'lectureProgress',
  lectureMemos: 'lectureMemos',
  vocabAttempts: 'vocabAttempts',
  professorView: 'professorView',
  notificationsSeen: 'notificationsSeen',
  seeded: 'seeded:v1',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const { store, name } = area(key);
    const raw = store.getItem(name);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    const { store, name } = area(key);
    store.setItem(name, JSON.stringify(value));
  } catch (err) {
    console.warn('[storage] 저장 실패 (용량 초과 가능)', err);
    throw err;
  }
}

export function removeKey(key: string): void {
  try {
    const { store, name } = area(key);
    store.removeItem(name);
  } catch {
    /* noop */
  }
}

export function createId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

/** 네트워크 호출처럼 보이도록 비동기로 감싸는 헬퍼 (교체 시 그대로 await 가능) */
export function resolve<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}
