import { isRemoteBackend } from '@/config/backend';
import { studentsMock } from '@/data/students.mock';
import type { RegisteredStudent, User } from '@/types';
import * as remote from './remote/rosterRemote';
import { STORAGE_KEYS, readJSON, resolve, writeJSON } from './storage';

/**
 * 학생 명단 서비스 — 선생님이 등록한 학생만 로그인할 수 있습니다.
 * Supabase 가 설정되어 있으면 서버에, 아니면 이 브라우저(localStorage)에 저장합니다.
 */

export class RosterError extends Error {}

function load(): RegisteredStudent[] {
  const saved = readJSON<RegisteredStudent[] | null>(STORAGE_KEYS.roster, null);
  if (saved) return saved;
  // 처음 실행(로컬 모드): 샘플 학생으로 시작
  const seeded = studentsMock.map((s) => ({ ...s, registeredAt: Date.now(), registeredBy: '샘플' }));
  try {
    writeJSON(STORAGE_KEYS.roster, seeded);
  } catch {
    /* 저장 불가 환경에서도 샘플로 동작 */
  }
  return seeded;
}
const save = (list: RegisteredStudent[]) => writeJSON(STORAGE_KEYS.roster, list);

const normalizeName = (name: string) => name.replace(/\s+/g, '').trim();
const normalizeId = (id: string) => id.replace(/\s+/g, '').trim();

/** 학번이 4~10자리 숫자인지 */
export function isValidStudentId(id: string): boolean {
  return /^\d{4,10}$/.test(normalizeId(id));
}

/** 학번 20301 → "2학년 3반 1번" (5자리일 때만) */
export function describeStudentId(id: string): string | undefined {
  const m = /^(\d)(\d{2})(\d{2})$/.exec(normalizeId(id));
  return m ? `${Number(m[1])}학년 ${Number(m[2])}반 ${Number(m[3])}번` : undefined;
}

export async function listStudents(): Promise<RegisteredStudent[]> {
  if (isRemoteBackend) return remote.listStudents();
  return [...load()].sort((a, b) => a.studentId.localeCompare(b.studentId));
}

/** 로그인용: 이름과 학번이 모두 맞는 학생 */
export async function findStudent(name: string, studentId: string): Promise<{ studentId: string; name: string } | undefined> {
  if (isRemoteBackend) return remote.findStudent(name, studentId);
  const n = normalizeName(name);
  const id = normalizeId(studentId);
  return load().find((s) => s.studentId === id && normalizeName(s.name) === n);
}

export async function registerStudent(teacher: User, input: { name: string; studentId: string }): Promise<RegisteredStudent> {
  const name = input.name.trim();
  const studentId = normalizeId(input.studentId);
  if (!name) throw new RosterError('이름을 입력해 주세요.');
  if (!isValidStudentId(studentId)) throw new RosterError('학번은 숫자 4~10자리로 입력해 주세요.');

  const dupName = isRemoteBackend
    ? await remote.getStudentName(studentId)
    : load().find((s) => s.studentId === studentId)?.name;
  if (dupName) throw new RosterError(`학번 ${studentId}은(는) 이미 ${dupName} 학생으로 등록되어 있어요.`);

  if (isRemoteBackend) return remote.insertStudent(teacher, name, studentId);
  const student: RegisteredStudent = { studentId, name, registeredAt: Date.now(), registeredBy: teacher.name };
  save([...load(), student]);
  return student;
}

export interface BulkResult {
  added: RegisteredStudent[];
  skipped: { line: string; reason: string }[];
}

/**
 * 여러 명 한 번에 등록. 한 줄에 한 명, "이름 학번" 또는 "이름,학번" (순서 무관).
 * 엑셀에서 두 칸을 복사해 붙여 넣어도 됩니다(탭 구분).
 */
export async function registerStudentsBulk(teacher: User, text: string): Promise<BulkResult> {
  const result: BulkResult = { added: [], skipped: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(/[,\t]|\s+/).map((p) => p.trim()).filter(Boolean);
    const id = parts.find((p) => /^\d+$/.test(p));
    const name = parts.filter((p) => p !== id).join(' ');
    if (!id || !name) {
      if (/학번|이름/.test(line)) continue; // 머리글 줄은 조용히 건너뜀
      result.skipped.push({ line, reason: '이름과 학번을 찾을 수 없어요' });
      continue;
    }
    try {
      result.added.push(await registerStudent(teacher, { name, studentId: id }));
    } catch (err) {
      result.skipped.push({ line, reason: (err as Error).message });
    }
  }
  return result;
}

export function removeStudent(studentId: string): Promise<void> {
  if (isRemoteBackend) return remote.removeStudent(studentId);
  save(load().filter((s) => s.studentId !== studentId));
  return resolve(undefined);
}
