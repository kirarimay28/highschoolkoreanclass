import type { BoardCategory, BoardComment, BoardPost, User } from '@/types';
import { isRemoteBackend } from '@/config/backend';
import { getSessionUser } from './authService';
import * as remote from './remote/boardRemote';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

/** 서버 조회 시 "누가 보는지" (익명 처리·내 글 판별에 사용) */
function viewer(): User {
  const user = getSessionUser();
  if (!user) throw new Error('로그인이 필요합니다.');
  return user;
}

const load = () => readJSON<BoardPost[]>(STORAGE_KEYS.board, []);
const save = (posts: BoardPost[]) => writeJSON(STORAGE_KEYS.board, posts);

export function listPosts(category?: BoardCategory | 'all'): Promise<BoardPost[]> {
  if (isRemoteBackend) return remote.listPosts(viewer(), category);
  const posts = load().sort((a, b) => b.createdAt - a.createdAt);
  return resolve(!category || category === 'all' ? posts : posts.filter((p) => p.category === category));
}

export function getPost(id: string): Promise<BoardPost | undefined> {
  if (isRemoteBackend) return remote.getPost(viewer(), id);
  return resolve(load().find((p) => p.id === id));
}

export interface NewPostInput {
  category: BoardCategory;
  title: string;
  content: string;
  anonymous: boolean;
}

export function createPost(user: User, input: NewPostInput): Promise<BoardPost | void> {
  if (isRemoteBackend) return remote.createPost(user, input);
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
  if (isRemoteBackend) return remote.deletePost(viewer(), id);
  save(load().filter((p) => p.id !== id));
  return resolve(undefined);
}

export function addComment(postId: string, user: User, content: string, anonymous: boolean): Promise<BoardComment | void> {
  if (isRemoteBackend) return remote.addComment(postId, user, content, anonymous);
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
  if (isRemoteBackend) return remote.deleteComment(viewer(), commentId);
  save(load().map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)));
  return resolve(undefined);
}
