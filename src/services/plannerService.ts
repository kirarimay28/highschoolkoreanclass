import type { PlannerTask } from '@/types';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<PlannerTask[]>(STORAGE_KEYS.planner, []);
const save = (tasks: PlannerTask[]) => writeJSON(STORAGE_KEYS.planner, tasks);

export function listTasks(userId: string, date: string): Promise<PlannerTask[]> {
  return resolve(
    load()
      .filter((t) => t.userId === userId && t.date === date)
      .sort((a, b) => a.createdAt - b.createdAt),
  );
}

/** 캘린더용: 사용자의 모든 할 일 */
export function listAllTasks(userId: string): Promise<PlannerTask[]> {
  return resolve(load().filter((t) => t.userId === userId));
}

export function addTask(userId: string, date: string, text: string): Promise<PlannerTask> {
  const task: PlannerTask = { id: createId('t_'), userId, date, text, done: false, createdAt: Date.now() };
  save([...load(), task]);
  return resolve(task);
}

export function toggleTask(id: string): Promise<void> {
  save(load().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  return resolve(undefined);
}

export function deleteTask(id: string): Promise<void> {
  save(load().filter((t) => t.id !== id));
  return resolve(undefined);
}
