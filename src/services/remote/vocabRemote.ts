import type { User } from '@/types';
import type { GradeResult, QuizFormat, VocabAttempt, VocabMode } from '@/types/vocab';
import { db, toMillis, unwrap } from '../supabase';
import type { AttemptInput } from '../vocabService';

/** 오늘 시험을 이미 봄 */
export class AlreadyTakenError extends Error {
  constructor() {
    super('오늘 시험은 이미 봤어요. 다시 보려면 선생님께 기록 삭제를 요청하세요.');
  }
}

const sid = (user: User) => user.id.replace(/^student:/, '');

interface AttemptRow {
  id: string;
  student_id: string;
  student_name: string;
  mode: VocabMode;
  format: QuizFormat;
  exam_date: string;
  start_num: number;
  end_num: number;
  carryover_nums: number[];
  score: number;
  total: number;
  results: GradeResult[];
  created_at: string;
}
const toAttempt = (r: AttemptRow): VocabAttempt => ({
  id: r.id,
  mode: r.mode,
  studentId: `student:${r.student_id}`,
  studentName: r.student_name,
  format: r.format,
  date: r.exam_date,
  startNum: r.start_num,
  endNum: r.end_num,
  carryoverNums: r.carryover_nums ?? [],
  score: r.score,
  total: r.total,
  results: r.results ?? [],
  createdAt: toMillis(r.created_at),
});

export async function listMine(user: User): Promise<VocabAttempt[]> {
  return (unwrap(await db().rpc('student_vocab_attempts', { p_student_id: sid(user), p_name: user.name })) as AttemptRow[]).map(toAttempt);
}

export async function save(user: User, input: AttemptInput): Promise<void> {
  const res = await db().rpc('student_vocab_save', {
    p_student_id: sid(user),
    p_name: user.name,
    p_mode: input.mode,
    p_format: input.format,
    p_start: input.startNum,
    p_end: input.endNum,
    p_carryover: input.carryoverNums,
    p_results: input.results,
  });
  if (res.error && /이미/.test(res.error.message)) throw new AlreadyTakenError();
  unwrap(res);
}

export async function listExams(): Promise<VocabAttempt[]> {
  return (unwrap(await db().from('vocab_attempts').select('*').eq('mode', 'exam').order('created_at', { ascending: false })) as AttemptRow[]).map(toAttempt);
}

export async function deleteExam(id: string): Promise<void> {
  unwrap(await db().from('vocab_attempts').delete().eq('id', id).eq('mode', 'exam'));
}
