import type { BoardCategory, BoardComment, BoardPost, User } from '@/types';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

const load = () => readJSON<BoardPost[]>(STORAGE_KEYS.board, []);
const save = (posts: BoardPost[]) => writeJSON(STORAGE_KEYS.board, posts);

export function listPosts(category?: BoardCategory | 'all'): Promise<BoardPost[]> {
  const posts = load().sort((a, b) => b.createdAt - a.createdAt);
  return resolve(!category || category === 'all' ? posts : posts.filter((p) => p.category === category));
}

export function getPost(id: string): Promise<BoardPost | undefined> {
  return resolve(load().find((p) => p.id === id));
}

export interface NewPostInput {
  category: BoardCategory;
  title: string;
  content: string;
  anonymous: boolean;
}

export function createPost(user: User, input: NewPostInput): Promise<BoardPost> {
  const post: BoardPost = {
    id: createId('p_'),
    ...input,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    createdAt: Date.now(),
    comments: [],
  };
  save([post, ...load()]);
  return resolve(post);
}

export function deletePost(id: string): Promise<void> {
  save(load().filter((p) => p.id !== id));
  return resolve(undefined);
}

export function addComment(postId: string, user: User, content: string, anonymous: boolean): Promise<BoardComment> {
  const comment: BoardComment = {
    id: createId('c_'),
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    anonymous,
    content,
    createdAt: Date.now(),
  };
  save(load().map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
  return resolve(comment);
}

export function deleteComment(postId: string, commentId: string): Promise<void> {
  save(load().map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)));
  return resolve(undefined);
}
