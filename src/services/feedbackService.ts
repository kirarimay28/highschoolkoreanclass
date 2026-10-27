import type { FeedbackItem, FeedbackStatus, FeedbackType, User } from '@/types';
import { isRemoteBackend } from '@/config/backend';
import * as remote from './remote/feedbackRemote';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<FeedbackItem[]>(STORAGE_KEYS.feedback, []);
const save = (items: FeedbackItem[]) => writeJSON(STORAGE_KEYS.feedback, items);

export function listFeedback(type?: FeedbackType | 'all'): Promise<FeedbackItem[]> {
  if (isRemoteBackend) return remote.listFeedback(type);
  const items = load().sort((a, b) => b.createdAt - a.createdAt);
  return resolve(!type || type === 'all' ? items : items.filter((i) => i.type === type));
}

export function createFeedback(
  user: User,
  input: { type: FeedbackType; title: string; content: string },
): Promise<FeedbackItem | void> {
  if (isRemoteBackend) return remote.createFeedback(user, input);
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
  if (isRemoteBackend) return remote.updateFeedbackStatus(id, status);
  save(load().map((i) => (i.id === id ? { ...i, status } : i)));
  return resolve(undefined);
}
