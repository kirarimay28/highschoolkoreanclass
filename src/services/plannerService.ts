import type { PlannerTask } from '@/types';
import { isRemoteBackend } from '@/config/backend';
import * as remote from './remote/studyRemote';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<PlannerTask[]>(STORAGE_KEYS.planner, []);
const save = (tasks: PlannerTask[]) => writeJSON(STORAGE_KEYS.planner, tasks);

export function listTasks(userId: string, date: string): Promise<PlannerTask[]> {
  if (isRemoteBackend) return remote.listTasks(userId, date);
  return resolve(
    load()
      .filter((t) => t.userId === userId && t.date === date)
      .sort((a, b) => a.createdAt - b.createdAt),
  );
}

/** 캘린더용: 사용자의 모든 할 일 */
export function listAllTasks(userId: string): Promise<PlannerTask[]> {
  if (isRemoteBackend) return remote.listTasks(userId);
  return resolve(load().filter((t) => t.userId === userId));
}

export function addTask(userId: string, date: string, text: string): Promise<PlannerTask> {
  if (isRemoteBackend) return remote.addTask(userId, date, text);
  const task: PlannerTask = { id: createId('t_'), userId, date, text, done: false, createdAt: Date.now() };
  save([...load(), task]);
  return resolve(task);
}

export async function toggleTask(id: string): Promise<void> {
  if (isRemoteBackend) {
    const task = await remote.getTask(id);
    if (task) await remote.setTaskDone(id, !task.done);
    return;
  }
  save(load().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  return resolve(undefined);
}

export function deleteTask(id: string): Promise<void> {
  if (isRemoteBackend) return remote.deleteTask(id);
  save(load().filter((t) => t.id !== id));
  return resolve(undefined);
}
