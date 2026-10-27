import type { BoardCategory, BoardComment, BoardPost, Role, User } from '@/types';
import { db, toMillis, unwrap } from '../supabase';

/**
 * 게시판 (Supabase)
 * - 선생님: 표를 직접 조회 → 익명 글도 실명 포함
 * - 학생·교수자: list_posts / get_post 함수로만 조회 → 익명 글 작성자 정보는 서버에서 지워져서 옴
 */

interface PostRow {
  id: string;
  category: BoardCategory;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  anonymous: boolean;
  created_at: string;
  is_mine?: boolean;
  comment_count?: number;
  comments?: CommentRow[] | { count: number }[];
}

interface CommentRow {
  id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  anonymous: boolean;
  content: string;
  created_at: string;
  is_mine?: boolean;
}

const toComment = (c: CommentRow, viewer: User): BoardComment => ({
  id: c.id,
  authorId: c.author_id,
  authorName: c.author_name,
  authorRole: c.author_role,
  anonymous: c.anonymous,
  content: c.content,
  createdAt: toMillis(c.created_at),
  isMine: c.is_mine ?? c.author_id === viewer.id,
});

function toPost(r: PostRow, viewer: User): BoardPost {
  const rawComments = Array.isArray(r.comments) ? r.comments : [];
  const isCount = rawComments.length === 1 && 'count' in rawComments[0] && !('id' in rawComments[0]);
  const comments = isCount ? [] : (rawComments as CommentRow[]).map((c) => toComment(c, viewer)).sort((a, b) => a.createdAt - b.createdAt);
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    content: r.content,
    authorId: r.author_id,
    authorName: r.author_name,
    authorRole: r.author_role,
    anonymous: r.anonymous,
    createdAt: toMillis(r.created_at),
    comments,
    commentCount: isCount ? (rawComments[0] as { count: number }).count : r.comment_count ?? comments.length,
    isMine: r.is_mine ?? r.author_id === viewer.id,
  };
}

const isTeacher = (viewer: User) => viewer.role === 'teacher';

export async function listPosts(viewer: User, category?: BoardCategory | 'all'): Promise<BoardPost[]> {
  const cat = !category || category === 'all' ? null : category;
  if (isTeacher(viewer)) {
    let q = db().from('posts').select('*, comments(count)').order('created_at', { ascending: false });
    if (cat) q = q.eq('category', cat);
    return (unwrap(await q) as PostRow[]).map((r) => toPost(r, viewer));
  }
  const rows = unwrap(await db().rpc('list_posts', { p_viewer: viewer.id, p_category: cat }));
  return (rows as PostRow[]).map((r) => toPost(r, viewer));
}

export async function getPost(viewer: User, id: string): Promise<BoardPost | undefined> {
  if (isTeacher(viewer)) {
    const rows = unwrap(await db().from('posts').select('*, comments(*)').eq('id', id)) as PostRow[];
    return rows[0] ? toPost(rows[0], viewer) : undefined;
  }
  const row = unwrap(await db().rpc('get_post', { p_id: id, p_viewer: viewer.id })) as PostRow | null;
  return row ? toPost(row, viewer) : undefined;
}

export async function createPost(
  user: User,
  input: { category: BoardCategory; title: string; content: string; anonymous: boolean },
): Promise<void> {
  unwrap(
    await db().from('posts').insert({
      ...input,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
    }),
  );
}

export async function deletePost(viewer: User, id: string): Promise<void> {
  if (isTeacher(viewer)) unwrap(await db().from('posts').delete().eq('id', id));
  else unwrap(await db().rpc('delete_own_post', { p_id: id, p_viewer: viewer.id }));
}

export async function addComment(postId: string, user: User, content: string, anonymous: boolean): Promise<void> {
  unwrap(
    await db().from('comments').insert({
      post_id: postId,
      content,
      anonymous,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
    }),
  );
}

export async function deleteComment(viewer: User, commentId: string): Promise<void> {
  if (isTeacher(viewer)) unwrap(await db().from('comments').delete().eq('id', commentId));
  else unwrap(await db().rpc('delete_own_comment', { p_id: commentId, p_viewer: viewer.id }));
}
