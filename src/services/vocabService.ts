import { isRemoteBackend } from '@/config/backend';
import { findWork } from '@/data/literatureTimeline';
import type { User } from '@/types';
import type { GradeResult, QuizFormat, VocabAttempt, VocabItem, VocabMode } from '@/types/vocab';
import * as remote from './remote/vocabRemote';
import { STORAGE_KEYS, createId, readJSON, writeJSON } from './storage';

/**
 * 고전 어휘 시험·연습 기록 (KoreanEdu store.ts 의 vocabExamRecords 함수들을 옮김)
 * - 시험: 하루 한 번 (한국 시간 기준). 선생님·교수자가 기록을 지우면 다시 볼 수 있음
 * - 연습: 본인만 보는 기록 (선생님 화면에는 나오지 않음) — "내가 틀린 단어"를 만드는 데 씀
 * - Supabase 가 설정되어 있으면 서버(supabase/vocab.sql), 아니면 이 브라우저
 */

/** 한국 시간 기준 오늘 (KoreanEdu getKSTToday) — 해외·밤늦게 응시해도 날짜가 어긋나지 않게 */
export const kstToday = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

const load = () => readJSON<VocabAttempt[]>(STORAGE_KEYS.vocabAttempts, []);
const save = (list: VocabAttempt[]) => writeJSON(STORAGE_KEYS.vocabAttempts, list);
const useServer = (user: User) => isRemoteBackend && user.role === 'student';
const newestFirst = (a: VocabAttempt, b: VocabAttempt) => b.createdAt - a.createdAt;

export async function listMyAttempts(user: User): Promise<VocabAttempt[]> {
  const list = useServer(user) ? await remote.listMine(user) : load().filter((a) => a.studentId === user.id);
  return list.sort(newestFirst);
}

export interface AttemptInput {
  mode: VocabMode;
  format: QuizFormat;
  startNum: number;
  endNum: number;
  carryoverNums: number[];
  results: GradeResult[];
}

export const AlreadyTakenError = remote.AlreadyTakenError;

/** 채점 직후 바로 저장 (KoreanEdu 는 "기록하기"를 눌러야 저장돼서, 안 누르고 다시 보는 길이 있었음) */
export async function saveAttempt(user: User, input: AttemptInput): Promise<void> {
  const score = input.results.filter((r) => r.correct).length;
  if (useServer(user)) return remote.save(user, input);
  const all = load();
  const date = kstToday();
  if (input.mode === 'exam' && all.some((a) => a.mode === 'exam' && a.studentId === user.id && a.date === date)) throw new remote.AlreadyTakenError();
  save([
    ...all,
    { ...input, id: createId('va_'), studentId: user.id, studentName: user.name, date, score, total: input.results.length, createdAt: Date.now() },
  ]);
}

/** 내가 틀린 단어 — 단어마다 가장 최근 결과가 오답인 것 (나중에 맞히면 빠짐) */
export function wrongNums(attempts: VocabAttempt[]): Set<number> {
  const latest = new Map<number, boolean>();
  for (const a of [...attempts].sort((x, y) => x.createdAt - y.createdAt)) for (const r of a.results) latest.set(r.num, r.correct);
  return new Set([...latest].filter(([, ok]) => !ok).map(([n]) => n));
}

// ── 선생님·교수자: 시험 기록만 (연습 기록은 볼 수 없음) ──
export async function listExamAttempts(): Promise<VocabAttempt[]> {
  const list = isRemoteBackend ? await remote.listExams() : load().filter((a) => a.mode === 'exam');
  return list.sort(newestFirst);
}

/** 기록 삭제 → 그 학생은 그날 다시 응시 가능 (KoreanEdu 9dde8be) */
export async function deleteExamAttempt(id: string): Promise<void> {
  if (isRemoteBackend) return remote.deleteExam(id);
  save(load().filter((a) => !(a.id === id && a.mode === 'exam')));
}

/** 출전 정보 — workId 가 있으면 연대기 지도 데이터에서 작품명·갈래·시대를 가져옴 */
export function vocabSource(item: VocabItem): { work?: string; workId?: string; genre?: string; era?: VocabItem['era'] } {
  const found = findWork(item.workId);
  if (found) return { work: found.work.title, workId: found.work.id, genre: found.lane.name, era: found.work.era };
  return { work: item.work, genre: item.genre, era: item.era };
}
