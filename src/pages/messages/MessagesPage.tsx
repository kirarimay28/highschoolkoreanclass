import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { LONG_WAIT_HOURS, isPending, messageCategories, quietNotice, statusStyles, studentStatusLabels, teacherStatusLabels } from '@/config/messages';
import { can } from '@/config/permissions';
import { useCurrentUser } from '@/context/AuthContext';
import { listMessages, listRecipients, sendMessage } from '@/services/messageService';
import type { Message, MessageCategory } from '@/types';
import { formatRelative } from '@/utils/date';
import { cn, formatFileSize } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

export const messagesAccent = { accent: '128 60 110', gold: '196 150 50', tint: '190 120 160' };

const categoryLabel = (id: MessageCategory) => messageCategories.find((c) => c.id === id)?.label ?? id;
const isLongWait = (m: Message) => isPending(m.status) && Date.now() - m.createdAt >= LONG_WAIT_HOURS * 3600_000;

/** 선생님께 쪽지 — 학생은 쓰기·보낸 쪽지함, 선생님·교수자는 받은 쪽지함 */
export function MessagesPage() {
  const user = useCurrentUser();
  const inbox = can(user.role, 'receiveMessages');

  return (
    <MedalPageHeader
      backTo="/lobby"
      backLabel="로비"
      icon="mail"
      title="선생님께 쪽지"
      hanja="書信"
      description={inbox ? '학생들이 보낸 쪽지를 확인하고 답장해요.' : '시간 걱정 없이 선생님께 편하게 연락해요.'}
      accent={messagesAccent}
    >
      {inbox ? <Inbox /> : user.role === 'student' ? <StudentBox /> : <EmptyState icon="mail" title="이 계정으로는 쪽지를 보낼 수 없어요" />}
    </MedalPageHeader>
  );
}

// ───────────────────────── 학생 ─────────────────────────
function StudentBox() {
  const user = useCurrentUser();
  const { data: messages, reload } = useAsyncData(() => listMessages(user), [user.id], []);
  const [composing, setComposing] = useState(false);
  const [sentNotice, setSentNotice] = useState('');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {composing ? (
        <ComposeForm
          onCancel={() => setComposing(false)}
          onSent={() => {
            setComposing(false);
            setSentNotice('쪽지를 보냈어요. 선생님께 소리 없이 전달돼요.');
            reload();
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <RoyalButton icon="plus" onClick={() => (setComposing(true), setSentNotice(''))}>
            새 쪽지 쓰기
          </RoyalButton>
          {sentNotice && <p className="text-sm text-success" role="status">{sentNotice}</p>}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">보낸 쪽지</h2>
        <ul className="space-y-3">
          {messages.map((m) => {
            const teacherReplies = m.replies.filter((r) => r.authorRole !== 'student').length;
            return (
              <li key={m.id}>
                <Link to={`/messages/${m.id}`} className="royal-card block p-4 transition-all hover:shadow-glow sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={m.status} labels={studentStatusLabels} />
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">{categoryLabel(m.category)}</span>
                    <span className="text-xs text-ink-faint">받는 분 · {m.recipientName}</span>
                    <span className="ml-auto text-xs text-ink-faint">{formatRelative(m.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 font-sans text-base font-semibold">{m.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{m.body}</p>
                  {teacherReplies > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[rgb(var(--page-accent))]">
                      <Icon name="comment" size={13} /> 답장 {teacherReplies}개 — 대화 보기
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {messages.length === 0 && (
          <div className="royal-card">
            <EmptyState icon="mail" title="아직 보낸 쪽지가 없어요">궁금한 게 있으면 언제든 편하게 보내 보세요.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

function ComposeForm({ onCancel, onSent }: { onCancel: () => void; onSent: () => void }) {
  const user = useCurrentUser();
  const { data: recipients } = useAsyncData(listRecipients, [], []);
  const [recipientId, setRecipientId] = useState('');
  const [category, setCategory] = useState<MessageCategory>(messageCategories[0].id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const recipient = recipients.find((r) => r.id === recipientId);
    if (!recipient) return setError('받는 선생님을 골라 주세요.');
    if (!title.trim() || !body.trim()) return setError('제목과 내용을 적어 주세요.');
    setBusy(true);
    setError('');
    try {
      await sendMessage(user, { recipientId, recipientName: recipient.name, category, title: title.trim(), body: body.trim(), file });
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="royal-card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg font-bold">새 쪽지</h2>
      <div>
        <span className="royal-label">받는 선생님</span>
        <div className="flex flex-wrap gap-2">
          {recipients.map((r) => (
            <RoyalButton key={r.id} size="sm" variant="secondary" active={recipientId === r.id} onClick={() => setRecipientId(r.id)}>
              {r.name}
            </RoyalButton>
          ))}
          {recipients.length === 0 && <p className="text-sm text-ink-faint">선생님 목록을 불러오는 중이에요…</p>}
        </div>
      </div>
      <div>
        <span className="royal-label">카테고리</span>
        <TabBar items={messageCategories} value={category} onChange={setCategory} size="sm" className="max-w-md" />
      </div>
      <div>
        <label className="royal-label" htmlFor="msgTitle">제목</label>
        <input id="msgTitle" className="royal-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </div>
      <div>
        <label className="royal-label" htmlFor="msgBody">내용</label>
        <textarea id="msgBody" rows={6} className="royal-input resize-y" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} required />
      </div>
      <div>
        <span className="royal-label">첨부 파일 (1개, 10MB까지)</span>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-gold/50 bg-white/50 px-4 py-2.5 text-sm text-ink-soft hover:border-gold">
          <Icon name="paperclip" size={16} />
          {file ? `${file.name} (${formatFileSize(file.size)})` : '파일 고르기'}
          <input id="msgFile" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {file && (
          <button type="button" className="ml-2 text-xs text-ink-faint hover:text-royal" onClick={() => setFile(null)}>
            빼기
          </button>
        )}
      </div>

      <p className="rounded-2xl bg-[rgb(var(--page-accent)/0.07)] px-4 py-3 text-sm leading-relaxed text-[rgb(var(--page-accent))]">
        <Icon name="bell" size={15} className="mr-1 inline-block align-[-2px]" />
        {quietNotice}
        <span className="mt-1 block text-xs text-ink-soft">쪽지는 {user.name}(실명)으로 보내져요.</span>
      </p>

      {error && <p className="text-sm text-royal-light">{error}</p>}
      <div className="flex justify-end gap-2">
        <RoyalButton variant="ghost" onClick={onCancel}>취소</RoyalButton>
        <RoyalButton type="submit" icon="send" disabled={busy}>
          보내기
        </RoyalButton>
      </div>
    </form>
  );
}

// ───────────────────────── 선생님·교수자 ─────────────────────────
type StatusFilter = 'all' | 'pending' | 'sent' | 'read' | 'complete';
const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '답장 대기' },
  { id: 'sent', label: '새 쪽지' },
  { id: 'read', label: '읽음' },
  { id: 'complete', label: '답장·처리 완료' },
];

function Inbox() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const filter = (statusFilters.find((f) => f.id === params.get('filter'))?.id ?? 'all') as StatusFilter;
  const [category, setCategory] = useState<MessageCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const { data: messages, loading } = useAsyncData(() => listMessages(user), [user.id], []);

  const filtered = useMemo(
    () =>
      messages
        .filter((m) => {
          if (filter === 'pending') return isPending(m.status);
          if (filter === 'complete') return m.status === 'replied' || m.status === 'done';
          return filter === 'all' || m.status === filter;
        })
        .filter((m) => category === 'all' || m.category === category)
        .filter((m) => !query.trim() || m.senderName.includes(query.trim()))
        .sort((a, b) => (filter === 'pending' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt)),
    [messages, filter, category, query],
  );
  const pendingCount = messages.filter((m) => isPending(m.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <TabBar
          items={statusFilters.map((f) => ({ ...f, label: f.id === 'pending' && pendingCount ? `${f.label} ${pendingCount}` : f.label }))}
          value={filter}
          onChange={(id) => setParams(id === 'all' ? {} : { filter: id }, { replace: true })}
          size="sm"
          className="lg:max-w-2xl"
        />
        <label className="relative lg:ml-auto lg:w-60">
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="royal-input pl-10" placeholder="학생 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="학생 이름 검색" />
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[{ id: 'all' as const, label: '모든 카테고리' }, ...messageCategories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              category === c.id ? 'border-[rgb(var(--page-accent)/0.4)] bg-[rgb(var(--page-accent)/0.1)] font-semibold text-[rgb(var(--page-accent))]' : 'border-gold/30 text-ink-soft hover:bg-gold/10',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((m) => (
          <li key={m.id}>
            <Link
              to={`/messages/${m.id}`}
              className={cn(
                'royal-card block p-4 transition-all hover:shadow-glow sm:p-5',
                isLongWait(m) && 'ring-2 ring-gold shadow-[0_0_14px_rgb(var(--color-gold)/0.35)]',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={m.status} labels={teacherStatusLabels} />
                <span className="font-semibold">{m.senderName}</span>
                {m.senderMeta && <span className="text-xs text-ink-faint">{m.senderMeta}</span>}
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">{categoryLabel(m.category)}</span>
                {m.attachment && <Icon name="paperclip" size={14} className="text-ink-faint" />}
                <span className={cn('ml-auto text-xs', isLongWait(m) ? 'font-bold text-gold-dark' : 'text-ink-faint')}>
                  {isLongWait(m) && '오래 기다림 · '}
                  {formatRelative(m.createdAt)}
                </span>
              </div>
              <h3 className="mt-2 font-sans text-base font-semibold">{m.title}</h3>
              <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{m.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && filtered.length === 0 && (
        <div className="royal-card">
          <EmptyState icon="mail" title={messages.length ? '조건에 맞는 쪽지가 없어요' : '아직 받은 쪽지가 없어요'} />
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status, labels }: { status: Message['status']; labels: Record<Message['status'], string> }) {
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusStyles[status])}>{labels[status]}</span>;
}
