import type { PlannerTask, StudyRecord, User } from '@/types';
import { db, toMillis, unwrap } from '../supabase';

// ── 플래너 ──
interface TaskRow {
  id: string;
  user_id: string;
  date: string;
  text: string;
  done: boolean;
  created_at: string;
}
const toTask = (r: TaskRow): PlannerTask => ({
  id: r.id,
  userId: r.user_id,
  date: r.date,
  text: r.text,
  done: r.done,
  createdAt: toMillis(r.created_at),
});

export async function listTasks(userId: string, date?: string): Promise<PlannerTask[]> {
  let q = db().from('planner_tasks').select('*').eq('user_id', userId).order('created_at');
  if (date) q = q.eq('date', date);
  return (unwrap(await q) as TaskRow[]).map(toTask);
}

export async function addTask(userId: string, date: string, text: string): Promise<PlannerTask> {
  const row = unwrap(await db().from('planner_tasks').insert({ user_id: userId, date, text }).select().single());
  return toTask(row as TaskRow);
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  unwrap(await db().from('planner_tasks').update({ done }).eq('id', id));
}

export async function getTask(id: string): Promise<PlannerTask | undefined> {
  const rows = unwrap(await db().from('planner_tasks').select('*').eq('id', id)) as TaskRow[];
  return rows[0] ? toTask(rows[0]) : undefined;
}

export async function deleteTask(id: string): Promise<void> {
  unwrap(await db().from('planner_tasks').delete().eq('id', id));
}

// ── 공부 시간 ──
interface RecordRow {
  user_id: string;
  user_name: string;
  date: string;
  seconds: number;
}
const toRecord = (r: RecordRow): StudyRecord => ({ userId: r.user_id, userName: r.user_name, date: r.date, seconds: r.seconds });

export async function addStudySeconds(user: User, seconds: number, date: string): Promise<void> {
  unwrap(
    await db().rpc('add_study_seconds', {
      p_user_id: user.id,
      p_user_name: user.name,
      p_seconds: Math.round(seconds),
      p_date: date,
    }),
  );
}

export async function listRecordsByUser(userId: string): Promise<StudyRecord[]> {
  return (unwrap(await db().from('study_records').select('*').eq('user_id', userId)) as RecordRow[]).map(toRecord);
}

export async function listRecordsByDates(dates: string[]): Promise<StudyRecord[]> {
  return (unwrap(await db().from('study_records').select('*').in('date', dates)) as RecordRow[]).map(toRecord);
}
