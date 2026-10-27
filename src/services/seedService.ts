import { buildSeed } from '@/data/seed.mock';
import { STORAGE_KEYS, readJSON, writeJSON } from './storage';

/** 최초 1회 샘플 데이터 주입 (실제 백엔드 연결 시 삭제) */
export function ensureSeedData(): void {
  if (readJSON<boolean>(STORAGE_KEYS.seeded, false)) return;
  const seed = buildSeed();
  try {
    writeJSON(STORAGE_KEYS.studyRecords, seed.studyRecords);
    writeJSON(STORAGE_KEYS.board, seed.board);
    writeJSON(STORAGE_KEYS.library, seed.library);
    writeJSON(STORAGE_KEYS.feedback, seed.feedback);
    writeJSON(STORAGE_KEYS.seeded, true);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 앱은 뜨도록
  }
}
