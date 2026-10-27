import { publicReads } from '@/config/backend';
import { STORAGE_KEYS, readJSON, writeJSON } from './storage';

/**
 * 교수자 모드: 서버의 실제 내용 위에 교수자가 한 일(지우기·고치기)을 이 탭에서만 덧씌움.
 * 실제 데이터는 바뀌지 않고, 로그아웃하면 사라짐.
 */
interface Overlay {
  hidden: string[];
  patches: Record<string, Record<string, unknown>>;
}
const load = () => readJSON<Overlay>(STORAGE_KEYS.professorOverlay, { hidden: [], patches: {} });

export { publicReads };

export function hideItem(id: string) {
  const o = load();
  writeJSON(STORAGE_KEYS.professorOverlay, { ...o, hidden: [...new Set([...o.hidden, id])] });
}

export function patchItem(id: string, patch: Record<string, unknown>) {
  const o = load();
  writeJSON(STORAGE_KEYS.professorOverlay, { ...o, patches: { ...o.patches, [id]: { ...o.patches[id], ...patch } } });
}

/** 교수자가 만든 것(local) + 서버의 실제 내용(server) — 지운 것은 빼고 고친 것은 반영 */
export function mergeWithServer<T extends { id: string }>(server: T[], local: T[]): T[] {
  const o = load();
  const hidden = new Set(o.hidden);
  const localIds = new Set(local.map((x) => x.id));
  return [...local, ...server.filter((x) => !localIds.has(x.id))].filter((x) => !hidden.has(x.id)).map((x) => (o.patches[x.id] ? { ...x, ...o.patches[x.id] } : x));
}

/** 서버 조회가 실패해도 교수자 화면은 뜨도록 */
export async function serverOrEmpty<T>(fn: () => Promise<T[]>): Promise<T[]> {
  if (!publicReads()) return [];
  try {
    return await fn();
  } catch (e) {
    console.warn('[교수자 모드] 서버 내용을 불러오지 못했어요', e);
    return [];
  }
}
