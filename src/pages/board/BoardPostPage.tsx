import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { RoyalButton } from '@/components/common/RoyalButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCategoryLabel } from '@/config/board';
import { can } from '@/config/permissions';
import { roleLabels } from '@/config/roles';
import { useCurrentUser } from '@/context/AuthContext';
import { addComment, deleteComment, deletePost, getPost } from '@/services/boardService';
import { getAuthorDisplayName } from '@/services/boardVisibility';
import { formatDateTime } from '@/utils/date';
import { useAsyncData } from '@/utils/useAsyncData';
import { VisibilityToggle } from './VisibilityToggle';

export function BoardPostPage() {
  const { postId = '' } = useParams();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { data: post, loading, reload } = useAsyncData(() => getPost(postId), [postId], undefined);
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(user.role === 'student');

  if (!loading && !post) {
    return (
      <div>
        <PageHeader title="질의응답 게시판" backTo="/board" backLabel="목록" />
        <EmptyState title="글을 찾을 수 없어요" />
      </div>
    );
  }
  if (!post) return null;

  const canDeletePost = post.authorId === user.id || can(user.role, 'moderateBoard');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(post.id, user, comment.trim(), anonymous);
    setComment('');
    reload();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="질의응답 게시판" backTo="/board" backLabel="목록" />

      <article className="royal-card p-5 sm:p-7">
        <Badge>{getCategoryLabel(post.category)}</Badge>
        <h1 className="mt-2 text-xl font-bold sm:text-2xl">{post.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-faint">
          <span>{getAuthorDisplayName(post, user)}</span>
          <span>{formatDateTime(post.createdAt)}</span>
          {canDeletePost && (
            <button
              type="button"
              className="ml-auto text-royal-light hover:underline"
              onClick={async () => {
                if (!confirm('이 글을 삭제할까요?')) return;
                await deletePost(post.id);
                navigate('/board', { replace: true });
              }}
            >
              삭제
            </button>
          )}
        </div>
        <div className="gold-rule my-4" />
        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </article>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold">댓글 {post.comments.length}</h2>
        <ul className="space-y-2">
          {post.comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-white bg-white/60 p-3.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{getAuthorDisplayName(c, user)}</span>
                {c.authorRole !== 'student' && !c.anonymous && <Badge>{roleLabels[c.authorRole]}</Badge>}
                <span className="text-xs text-ink-faint">{formatDateTime(c.createdAt)}</span>
                {(c.authorId === user.id || can(user.role, 'moderateBoard')) && (
                  <button
                    type="button"
                    className="ml-auto text-xs text-ink-faint hover:text-royal"
                    onClick={async () => {
                      await deleteComment(post.id, c.id);
                      reload();
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[15px]">{c.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="royal-card mt-4 space-y-3 p-4">
          <textarea
            rows={3}
            className="royal-input resize-y"
            placeholder="댓글을 남겨 주세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <VisibilityToggle anonymous={anonymous} onChange={setAnonymous} />
            <RoyalButton type="submit" size="sm" icon="send">
              등록
            </RoyalButton>
          </div>
        </form>
      </section>
    </div>
  );
}
