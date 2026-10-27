import type { FeedbackItem, FeedbackStatus, FeedbackType, User } from '@/types';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<FeedbackItem[]>(STORAGE_KEYS.feedback, []);
const save = (items: FeedbackItem[]) => writeJSON(STORAGE_KEYS.feedback, items);

export function listFeedback(type?: FeedbackType | 'all'): Promise<FeedbackItem[]> {
  const items = load().sort((a, b) => b.createdAt - a.createdAt);
  return resolve(!type || type === 'all' ? items : items.filter((i) => i.type === type));
}

export function createFeedback(
  user: User,
  input: { type: FeedbackType; title: string; content: string },
): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: createId('fb_'),
    ...input,
    authorId: user.id,
    authorName: user.name,
    status: 'received',
    createdAt: Date.now(),
  };
  save([item, ...load()]);
  return resolve(item);
}

export function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  save(load().map((i) => (i.id === id ? { ...i, status } : i)));
  return resolve(undefined);
}
