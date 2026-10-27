import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { boardCategories, getCategoryLabel } from '@/config/board';
import { useCurrentUser } from '@/context/AuthContext';
import { createPost, listPosts } from '@/services/boardService';
import { getAuthorDisplayName } from '@/services/boardVisibility';
import type { BoardCategory } from '@/types';
import { formatDateTime } from '@/utils/date';
import { useAsyncData } from '@/utils/useAsyncData';
import { VisibilityToggle } from './VisibilityToggle';

type Filter = BoardCategory | 'all';
const filters: { id: Filter; label: string }[] = [{ id: 'all', label: '전체' }, ...boardCategories];

export function BoardPage() {
  const user = useCurrentUser();
  const [filter, setFilter] = useState<Filter>('all');
  const [writing, setWriting] = useState(false);
  const { data: posts, reload } = useAsyncData(() => listPosts(filter), [filter], []);

  return (
    <div>
      <PageHeader
        title="질의응답 게시판"
        description="모르는 것을 묻는 것은 부끄러운 일이 아니에요."
        actions={
          <RoyalButton icon="plus" onClick={() => setWriting(true)}>
            글쓰기
          </RoyalButton>
        }
      />
      <TabBar items={filters} value={filter} onChange={setFilter} size="sm" className="mb-4 max-w-md" />

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              to={`/board/${p.id}`}
              className="royal-card block p-4 transition-all hover:border-gold hover:shadow-glow sm:p-5"
            >
              <div className="flex items-center gap-2">
                <Badge>{getCategoryLabel(p.category)}</Badge>
                <h2 className="min-w-0 flex-1 truncate font-sans text-base font-semibold sm:text-lg">{p.title}</h2>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{p.content}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
                <span>{getAuthorDisplayName(p, user)}</span>
                <span>{formatDateTime(p.createdAt)}</span>
                <span className="ml-auto inline-flex items-center gap-1">
                  <Icon name="comment" size={14} />
                  {p.commentCount ?? p.comments.length}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {posts.length === 0 && <EmptyState icon="messages" title="아직 글이 없어요">첫 질문을 남겨 보세요!</EmptyState>}

      <NewPostModal
        open={writing}
        onClose={() => setWriting(false)}
        onCreated={() => {
          setWriting(false);
          reload();
        }}
      />
    </div>
  );
}

function NewPostModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const user = useCurrentUser();
  const [category, setCategory] = useState<BoardCategory>(boardCategories[0].id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(user.role === 'student');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await createPost(user, { category, title: title.trim(), content: content.trim(), anonymous });
    setTitle('');
    setContent('');
    onCreated();
  };

  return (
    <Modal open={open} title="질문 작성" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="royal-label">카테고리</span>
          <TabBar items={boardCategories} value={category} onChange={setCategory} size="sm" />
        </div>
        <div>
          <label className="royal-label" htmlFor="postTitle">제목</label>
          <input id="postTitle" className="royal-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="royal-label" htmlFor="postContent">내용</label>
          <textarea
            id="postContent"
            rows={6}
            className="royal-input resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <span className="royal-label">작성자 표시</span>
          <VisibilityToggle anonymous={anonymous} onChange={setAnonymous} />
          {anonymous && (
            <p className="mt-1.5 text-xs text-ink-faint">친구들에게는 "익명"으로 보이지만, 선생님께는 이름이 보여요.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <RoyalButton variant="ghost" onClick={onClose}>취소</RoyalButton>
          <RoyalButton type="submit" icon="send">등록</RoyalButton>
        </div>
      </form>
    </Modal>
  );
}
