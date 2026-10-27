import type { FeedbackItem, FeedbackStatus, FeedbackType, User } from '@/types';
import { db, toMillis, unwrap } from '../supabase';

interface FeedbackRow {
  id: string;
  type: FeedbackType;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  status: FeedbackStatus;
  created_at: string;
}
const toItem = (r: FeedbackRow): FeedbackItem => ({
  id: r.id,
  type: r.type,
  title: r.title,
  content: r.content,
  authorId: r.author_id,
  authorName: r.author_name,
  status: r.status,
  createdAt: toMillis(r.created_at),
});

export async function listFeedback(type?: FeedbackType | 'all'): Promise<FeedbackItem[]> {
  let q = db().from('feedback').select('*').order('created_at', { ascending: false });
  if (type && type !== 'all') q = q.eq('type', type);
  return (unwrap(await q) as FeedbackRow[]).map(toItem);
}

export async function createFeedback(user: User, input: { type: FeedbackType; title: string; content: string }): Promise<void> {
  unwrap(await db().from('feedback').insert({ ...input, author_id: user.id, author_name: user.name }));
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  unwrap(await db().from('feedback').update({ status }).eq('id', id));
}
