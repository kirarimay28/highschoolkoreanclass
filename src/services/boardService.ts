import type { BoardCategory, BoardComment, BoardPost, User } from '@/types';
import { isRemoteBackend } from '@/config/backend';
import { getSessionUser } from './authService';
import { hideItem, mergeWithServer, publicReads, serverOrEmpty } from './professorOverlay';
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

export async function listPosts(category?: BoardCategory | 'all'): Promise<BoardPost[]> {
  if (isRemoteBackend) return remote.listPosts(viewer(), category);
  // 교수자 모드: 실제 게시글(학생에게 보이는 그대로, 익명은 가려짐) + 교수자가 쓴 글
  const server = await serverOrEmpty(() => remote.listPosts(viewer(), category));
  const posts = mergeWithServer(server, load()).sort((a, b) => b.createdAt - a.createdAt);
  return !category || category === 'all' ? posts : posts.filter((p) => p.category === category);
}

export async function getPost(id: string): Promise<BoardPost | undefined> {
  if (isRemoteBackend) return remote.getPost(viewer(), id);
  const local = load().find((p) => p.id === id);
  if (local || !publicReads()) return local;
  const server = (await serverOrEmpty(async () => [await remote.getPost(viewer(), id)])).filter(Boolean) as BoardPost[];
  return mergeWithServer(server, [])[0];
}

/** 교수자 모드에서 실제 글에 단 댓글 → 그 글을 이 탭에 복사해 두고 거기에 붙임 */
async function localCopy(postId: string): Promise<BoardPost[]> {
  const posts = load();
  if (posts.some((p) => p.id === postId)) return posts;
  const server = publicReads() ? await getPost(postId) : undefined;
  return server ? [server, ...posts] : posts;
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
  if (publicReads()) hideItem(id);
  save(load().filter((p) => p.id !== id));
  return resolve(undefined);
}

export async function addComment(postId: string, user: User, content: string, anonymous: boolean): Promise<BoardComment | void> {
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
  save((await localCopy(postId)).map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
  return comment;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  if (isRemoteBackend) return remote.deleteComment(viewer(), commentId);
  save((await localCopy(postId)).map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)));
}
