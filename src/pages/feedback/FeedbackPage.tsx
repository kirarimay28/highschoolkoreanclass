import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { feedbackStatuses, feedbackTypes } from '@/config/feedback';
import { can } from '@/config/permissions';
import { useCurrentUser } from '@/context/AuthContext';
import { createFeedback, listFeedback, updateFeedbackStatus } from '@/services/feedbackService';
import type { FeedbackType } from '@/types';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

type Filter = FeedbackType | 'all';
const filters: { id: Filter; label: string }[] = [{ id: 'all', label: '전체' }, ...feedbackTypes];

export function FeedbackPage() {
  const user = useCurrentUser();
  const canManage = can(user.role, 'changeFeedbackStatus');
  const [filter, setFilter] = useState<Filter>('all');
  const [writing, setWriting] = useState(false);
  const { data: items, reload } = useAsyncData(() => listFeedback(filter), [filter], []);

  return (
    <div>
      <PageHeader
        title="고쳐주세요"
        description="여러분의 의견으로 국어 교실이 더 좋아져요."
        actions={
          <RoyalButton icon="plus" onClick={() => setWriting(true)}>
            의견 남기기
          </RoyalButton>
        }
      />
      <TabBar items={filters} value={filter} onChange={setFilter} size="sm" className="mb-4 max-w-lg" />

      <ul className="space-y-3">
        {items.map((item) => {
          const status = feedbackStatuses.find((s) => s.id === item.status)!;
          return (
            <li key={item.id} className="royal-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{feedbackTypes.find((t) => t.id === item.type)?.label}</Badge>
                <Badge className={status.className}>{status.label}</Badge>
                <h2 className="w-full font-sans text-base font-semibold sm:w-auto sm:flex-1">{item.title}</h2>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-soft">{item.content}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                <span>
                  {item.authorName} · {formatDateTime(item.createdAt)}
                </span>
                {canManage && (
                  <div className="flex gap-1" role="group" aria-label="처리 상태 변경">
                    {feedbackStatuses.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={async () => {
                          await updateFeedbackStatus(item.id, s.id);
                          reload();
                        }}
                        className={cn(
                          'rounded-full border px-2.5 py-1 transition-colors',
                          item.status === s.id ? s.className : 'border-gold/30 hover:bg-gold/10',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {items.length === 0 && <EmptyState icon="wrench" title="등록된 의견이 없어요" />}

      <NewFeedbackModal
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

function NewFeedbackModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const user = useCurrentUser();
  const [type, setType] = useState<FeedbackType>(feedbackTypes[0].id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await createFeedback(user, { type, title: title.trim(), content: content.trim() });
    setTitle('');
    setContent('');
    onCreated();
  };

  return (
    <Modal open={open} title="의견 남기기" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="royal-label">유형</span>
          <TabBar items={feedbackTypes} value={type} onChange={setType} size="sm" />
        </div>
        <div>
          <label className="royal-label" htmlFor="fbTitle">제목</label>
          <input id="fbTitle" className="royal-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="royal-label" htmlFor="fbContent">내용</label>
          <textarea
            id="fbContent"
            rows={5}
            className="royal-input resize-y"
            placeholder="어떤 화면에서, 무엇을 했을 때, 어떻게 되었는지 적어 주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <RoyalButton variant="ghost" onClick={onClose}>취소</RoyalButton>
          <RoyalButton type="submit" icon="send">보내기</RoyalButton>
        </div>
      </form>
    </Modal>
  );
}
