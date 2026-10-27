import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { isRemoteBackend } from '@/config/backend';
import { MESSAGE_TIME_GAP_MS, quietNotice } from '@/config/messages';
import { roleLabels } from '@/config/roles';
import { useCurrentUser } from '@/context/AuthContext';
import { deleteMessage, listContacts, listConversations, markConversationRead, sendMessage, type Conversation } from '@/services/messageService';
import { markNotificationsSeenByLink, onNotificationsChanged } from '@/services/notifications';
import type { MessageContact, User } from '@/types';
import { formatDateTime } from '@/utils/date';
import { accentStyle } from '@/utils/accent';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

const accent = { accent: '128 60 110', gold: '196 150 50', tint: '190 120 160' };
const chatPath = (partnerId: string) => `/messages/${encodeURIComponent(partnerId)}`;

/** 목록 시각: 오늘이면 "14:05", 아니면 "10/27" */
function formatListTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n: number) => String(n).padStart(2, '0');
  return sameDay ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 교수자(퀴즈 로그인)는 서버 계정이 없어 Supabase 사용 중에는 쪽지를 쓸 수 없음 */
const cannotUse = (user: User) => isRemoteBackend && user.role === 'professor';

function useConversations(user: User) {
  const state = useAsyncData(() => listConversations(user), [user.id], [] as Conversation[]);
  useEffect(() => onNotificationsChanged(state.reload), [state.reload]);
  return state;
}

// ───────────────────────── 대화 목록 ─────────────────────────
export function MessagesPage() {
  const user = useCurrentUser();
  const { data: conversations, loading } = useConversations(user);
  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <MedalPageHeader
      backTo="/lobby"
      backLabel="로비"
      icon="mail"
      title="선생님께 쪽지"
      hanja="書信"
      description={user.role === 'student' ? '시간 걱정 없이 선생님께 편하게 연락해요.' : '학생·선생님과 쪽지를 주고받아요.'}
      accent={accent}
    >
      {cannotUse(user) ? (
        <EmptyState icon="mail" title="교수자 계정으로는 쪽지를 쓸 수 없어요">선생님 계정으로 로그인해 주세요.</EmptyState>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              쪽지
              {totalUnread > 0 && <span className="rounded-full bg-royal-light px-2 py-0.5 text-xs font-bold text-hanji">{totalUnread}</span>}
            </h2>
            <Link to="/messages/new">
              <RoyalButton size="sm" icon="notebook" tabIndex={-1}>
                새 쪽지
              </RoyalButton>
            </Link>
          </div>

          {!loading && conversations.length === 0 ? (
            <div className="royal-card flex flex-col items-center gap-3 py-12">
              <Icon name="mail" size={40} className="text-ink-faint/50" />
              <p className="text-sm text-ink-soft">주고받은 쪽지가 없어요.</p>
              <Link to="/messages/new" className="text-sm font-semibold text-[rgb(var(--page-accent))] hover:underline">
                첫 쪽지 보내기 ›
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => {
                const last = c.messages.at(-1)!;
                const mine = last.senderId === user.id;
                return (
                  <li key={c.partnerId}>
                    <Link to={chatPath(c.partnerId)} className="royal-card flex items-center gap-3 px-4 py-3.5 transition-all hover:shadow-glow">
                      <span className="relative">
                        <Avatar name={c.partnerName} size={44} className={c.unreadCount ? '' : 'opacity-80 saturate-50'} />
                        {c.unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-light px-1 text-[10px] font-bold text-hanji ring-2 ring-hanji-card">
                            {c.unreadCount}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('truncate', c.unreadCount ? 'font-bold' : 'font-medium text-ink-soft')}>
                            {c.partnerName}
                            <PartnerRole id={c.partnerId} />
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-faint">{formatListTime(last.createdAt)}</span>
                        </span>
                        <span className={cn('block truncate text-sm', c.unreadCount ? 'font-medium text-ink' : 'text-ink-faint')}>
                          {mine && <span className="mr-1 text-ink-faint">나:</span>}
                          {last.content}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </MedalPageHeader>
  );
}

function PartnerRole({ id }: { id: string }) {
  const role = id.split(':')[0] as keyof typeof roleLabels;
  if (!roleLabels[role] || role === 'student') return null;
  return <span className="ml-1 text-xs font-normal text-gold-dark">{roleLabels[role]}</span>;
}

// ───────────────────────── 대화 (채팅) ─────────────────────────
export function ChatPage() {
  const user = useCurrentUser();
  const partnerId = decodeURIComponent(useParams().partnerId ?? '');
  const { data: conversations, reload } = useConversations(user);
  const { data: contacts } = useAsyncData(() => listContacts(user).catch(() => []), [user.id], [] as MessageContact[]);
  const conv = conversations.find((c) => c.partnerId === partnerId);
  const partner: MessageContact | undefined =
    contacts.find((c) => c.id === partnerId) ?? (conv ? { id: partnerId, name: conv.partnerName, role: partnerId.split(':')[0] as MessageContact['role'] } : undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = conv?.messages ?? [];

  // 열면 상대가 보낸 쪽지 읽음 + 알림 읽음
  useEffect(() => {
    if (!conv?.unreadCount) return;
    markConversationRead(user, partnerId).then(reload);
    markNotificationsSeenByLink(user, chatPath(partnerId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.unreadCount, partnerId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (content: string) => {
    if (!partner) return;
    await sendMessage(user, [partner], content);
    reload();
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100dvh - 9.5rem)', ...accentStyle(accent) }}>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gold/25 pb-3">
        <Link to="/messages" className="-ml-1 rounded-xl p-1.5 text-ink-faint hover:bg-gold/10 hover:text-ink" aria-label="쪽지 목록">
          <Icon name="back" size={20} />
        </Link>
        <Avatar name={partner?.name ?? '?'} size={32} />
        <p className="font-bold">
          {partner?.name ?? '알 수 없는 상대'}
          <PartnerRole id={partnerId} />
        </p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto py-3">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-ink-faint">첫 쪽지를 보내 보세요.</p>}
        {messages.map((msg, i) => {
          const mine = msg.senderId === user.id;
          const prev = messages[i - 1];
          const showTime = !prev || msg.createdAt - prev.createdAt > MESSAGE_TIME_GAP_MS;
          return (
            <div key={msg.id}>
              {showTime && <p className="my-2 text-center text-[11px] text-ink-faint">{formatDateTime(msg.createdAt)}</p>}
              <div className={cn('group flex items-end gap-1.5', mine ? 'justify-end' : 'justify-start')}>
                {!mine && <Avatar name={msg.senderName} size={26} className="mb-0.5 ring-1" />}
                <div className={cn('flex max-w-[75%] flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-relaxed',
                      mine ? 'rounded-2xl rounded-br-sm bg-gradient-to-b from-royal-light to-royal text-hanji' : 'royal-card rounded-2xl rounded-bl-sm',
                    )}
                  >
                    {msg.content}
                  </div>
                  <div className={cn('flex items-center gap-1 px-0.5', mine && 'flex-row-reverse')}>
                    {mine && msg.read && <span className="text-[10px] font-medium text-[rgb(var(--page-accent))]">읽음</span>}
                    {mine && (
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteMessage(user, msg.id);
                          reload();
                        }}
                        className="p-0.5 text-ink-faint opacity-0 transition hover:text-royal focus:opacity-100 group-hover:opacity-100"
                        aria-label="쪽지 지우기"
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {partner && !cannotUse(user) && <InputBar rows={1} onSend={send} showNotice={user.role === 'student' && messages.length === 0} studentHint={user.role === 'student'} />}
    </div>
  );
}

// ───────────────────────── 새 쪽지 ─────────────────────────
export function ComposePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { data: contacts, loading } = useAsyncData(() => listContacts(user), [user.id], [] as MessageContact[]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const shown = useMemo(() => contacts.filter((c) => !query.trim() || c.name.includes(query.trim())), [contacts, query]);

  const send = async (content: string) => {
    const recipients = contacts.filter((c) => selected.includes(c.id));
    if (!recipients.length) return;
    await sendMessage(user, recipients, content);
    navigate(recipients.length === 1 ? chatPath(recipients[0].id) : '/messages', { replace: true });
  };

  if (cannotUse(user)) return <EmptyState icon="mail" title="교수자 계정으로는 쪽지를 쓸 수 없어요" />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100dvh - 9.5rem)', ...accentStyle(accent) }}>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gold/25 pb-3">
        <Link to="/messages" className="-ml-1 rounded-xl p-1.5 text-ink-faint hover:bg-gold/10 hover:text-ink" aria-label="쪽지 목록">
          <Icon name="back" size={20} />
        </Link>
        <p className="font-bold">새 쪽지</p>
      </div>

      <div className="shrink-0 border-b border-gold/25 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">받는 사람</span>
          {selected.length > 0 && (
            <span className="rounded-full bg-[rgb(var(--page-accent)/0.1)] px-2 py-0.5 text-[11px] font-bold text-[rgb(var(--page-accent))]">{selected.length}명 선택</span>
          )}
        </div>
        {contacts.length > 8 && (
          <input className="royal-input mb-2 py-2 text-sm" placeholder="이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="받는 사람 검색" />
        )}
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {shown.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected((prev) => (on ? prev.filter((id) => id !== c.id) : [...prev, c.id]))}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-semibold transition',
                  on ? 'border-transparent bg-gradient-to-b from-royal-light to-royal text-hanji' : 'border-gold/40 bg-white/70 text-ink-soft hover:border-gold',
                )}
              >
                {c.name}
                {c.role !== 'student' && user.role !== 'student' && <span className="ml-1 text-[11px] font-normal opacity-70">{roleLabels[c.role]}</span>}
              </button>
            );
          })}
          {!loading && contacts.length === 0 && <p className="text-sm text-ink-faint">쪽지를 보낼 수 있는 상대가 없어요.</p>}
        </div>
      </div>

      <div className="flex-1" />
      <InputBar rows={3} onSend={send} disabled={selected.length === 0} showNotice={user.role === 'student'} studentHint={user.role === 'student'} />
    </div>
  );
}

function InputBar({
  rows,
  onSend,
  disabled,
  showNotice,
  studentHint,
}: {
  rows: number;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  showNotice?: boolean;
  studentHint?: boolean;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const content = input.trim();
    if (!content || disabled || busy) return;
    setBusy(true);
    setError('');
    try {
      await onSend(content);
      setInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shrink-0 space-y-2 border-t border-gold/25 pt-2">
      {showNotice && (
        <p className="rounded-2xl bg-[rgb(var(--page-accent)/0.07)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[rgb(var(--page-accent))]">
          <Icon name="bell" size={14} className="mr-1 inline-block align-[-2px]" />
          {quietNotice}
        </p>
      )}
      {error && <p className="text-sm text-royal-light">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          id="messageInput"
          rows={rows}
          className="royal-input flex-1 resize-none py-2.5 text-[15px] leading-relaxed"
          placeholder={studentHint ? '쪽지 입력… (실명으로 보내져요)' : '쪽지 입력…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={5000}
          aria-label="쪽지 내용"
        />
        <RoyalButton icon="send" onClick={submit} disabled={disabled || busy || !input.trim()} className="h-11 w-11 shrink-0 px-0" aria-label="보내기" />
      </div>
    </div>
  );
}
