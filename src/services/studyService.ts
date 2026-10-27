import type { RankingPeriod } from '@/config/studyroom';
import type { StudyRecord, User } from '@/types';
import { todayKey, weekKeys } from '@/utils/date';
import { STORAGE_KEYS, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<StudyRecord[]>(STORAGE_KEYS.studyRecords, []);
const save = (records: StudyRecord[]) => writeJSON(STORAGE_KEYS.studyRecords, records);

/** 타이머가 측정한 시간을 해당 날짜 기록에 누적 */
export function addStudySeconds(user: User, seconds: number, date = todayKey()): Promise<void> {
  if (seconds <= 0) return resolve(undefined);
  const records = load();
  const existing = records.find((r) => r.userId === user.id && r.date === date);
  if (existing) {
    existing.seconds += Math.round(seconds);
    existing.userName = user.name;
  } else {
    records.push({ userId: user.id, userName: user.name, date, seconds: Math.round(seconds) });
  }
  save(records);
  return resolve(undefined);
}

export function getStudySeconds(userId: string, date: string): Promise<number> {
  return resolve(load().find((r) => r.userId === userId && r.date === date)?.seconds ?? 0);
}

/** 캘린더용: 날짜 → 초 */
export function getStudyMap(userId: string): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  load()
    .filter((r) => r.userId === userId)
    .forEach((r) => (map[r.date] = r.seconds));
  return resolve(map);
}

export interface RankingEntry {
  userId: string;
  userName: string;
  seconds: number;
  rank: number;
}

export function getRanking(period: RankingPeriod): Promise<RankingEntry[]> {
  const dates = new Set(period === 'daily' ? [todayKey()] : weekKeys());
  const totals = new Map<string, { userName: string; seconds: number }>();
  load()
    .filter((r) => dates.has(r.date))
    .forEach((r) => {
      const cur = totals.get(r.userId) ?? { userName: r.userName, seconds: 0 };
      cur.seconds += r.seconds;
      cur.userName = r.userName;
      totals.set(r.userId, cur);
    });
  const sorted = [...totals.entries()]
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.seconds - a.seconds);
  // 동점자는 같은 순위
  let lastSeconds = -1;
  let lastRank = 0;
  return resolve(
    sorted.map((e, i) => {
      const rank = e.seconds === lastSeconds ? lastRank : i + 1;
      lastSeconds = e.seconds;
      lastRank = rank;
      return { ...e, rank };
    }),
  );
}
