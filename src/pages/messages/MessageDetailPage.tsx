import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { messageCategories, studentStatusLabels, teacherStatusLabels } from '@/config/messages';
import { can } from '@/config/permissions';
import { useCurrentUser } from '@/context/AuthContext';
import { getAttachmentUrl, listMessages, markDone, markRead, replyMessage } from '@/services/messageService';
import { markNotificationsSeenByLink } from '@/services/notifications';
import type { Message, MessageReply } from '@/types';
import { formatDateTime, formatRelative } from '@/utils/date';
import { accentStyle } from '@/utils/accent';
import { cn, formatFileSize } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';
import { StatusPill, messagesAccent } from './MessagesPage';

/** 쪽지 대화 보기 */
export function MessageDetailPage() {
  const { messageId = '' } = useParams();
  const user = useCurrentUser();
  const isTeacher = can(user.role, 'receiveMessages');
  const { data: all, loading, reload } = useAsyncData(() => listMessages(user), [user.id], []);
  const message = all.find((m) => m.id === messageId);
  const readOnce = useRef(false);

  // 열면: 선생님은 자동 '읽음', 이 쪽지에 대한 알림은 모두 읽음 처리
  useEffect(() => {
    if (!message) return;
    markNotificationsSeenByLink(user, `/messages/${message.id}`);
    if (isTeacher && message.status === 'sent' && !readOnce.current) {
      readOnce.current = true;
      markRead(message).then(reload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id, message?.status, message?.replies.length]);

  if (!loading && !message) {
    return (
      <div>
        <PageHeader title="선생님께 쪽지" backTo="/messages" backLabel="쪽지함" />
        <EmptyState icon="mail" title="쪽지를 찾을 수 없어요" />
      </div>
    );
  }
  if (!message) return null;

  const others = isTeacher ? all.filter((m) => m.senderId === message.senderId && m.id !== message.id) : [];

  return (
    <div style={accentStyle(messagesAccent)}>
      <PageHeader title={message.title} backTo="/messages" backLabel={isTeacher ? '받은 쪽지함' : '보낸 쪽지함'} />

      <div className={cn('grid gap-6', others.length > 0 && 'lg:grid-cols-[1fr_18rem]')}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill status={message.status} labels={isTeacher ? teacherStatusLabels : studentStatusLabels} />
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">{messageCategories.find((c) => c.id === message.category)?.label}</span>
            <span className="text-ink-soft">
              {isTeacher ? `보낸 학생 · ${message.senderName}${message.senderMeta ? ` (${message.senderMeta})` : ''}` : `받는 분 · ${message.recipientName}`}
            </span>
          </div>

          {/* 대화 */}
          <ol className="space-y-3">
            <Bubble
              mine={!isTeacher}
              name={message.senderName}
              body={message.body}
              createdAt={message.createdAt}
              attachment={message.attachment && <Attachment message={message} canDownload={isTeacher || !!message.attachment.dataUrl} />}
            />
            {message.replies.map((r) => (
              <ReplyBubble key={r.id} reply={r} viewerIsTeacher={isTeacher} />
            ))}
          </ol>

          <ReplyForm message={message} isTeacher={isTeacher} onDone={reload} />
        </div>

        {others.length > 0 && (
          <aside className="royal-card h-fit p-4">
            <h2 className="mb-2 text-sm font-bold text-gold-dark">{message.senderName} 학생과 주고받은 이전 쪽지</h2>
            <ul className="space-y-2">
              {others.map((m) => (
                <li key={m.id}>
                  <Link to={`/messages/${m.id}`} className="block rounded-xl bg-white/60 px-3 py-2 hover:bg-white">
                    <span className="flex items-center gap-2">
                      <StatusPill status={m.status} labels={teacherStatusLabels} />
                      <span className="text-[11px] text-ink-faint">{formatRelative(m.createdAt)}</span>
                    </span>
                    <span className="mt-1 block truncate text-sm font-medium">{m.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function ReplyBubble({ reply, viewerIsTeacher }: { reply: MessageReply; viewerIsTeacher: boolean }) {
  const fromTeacherSide = reply.authorRole !== 'student';
  return (
    <Bubble
      mine={fromTeacherSide === viewerIsTeacher}
      name={fromTeacherSide && reply.authorRole === 'teacher' ? `${reply.authorName} 선생님` : reply.authorName}
      body={reply.body}
      createdAt={reply.createdAt}
    />
  );
}

function Bubble({ mine, name, body, createdAt, attachment }: { mine: boolean; name: string; body: string; createdAt: number; attachment?: React.ReactNode }) {
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-3xl px-4 py-3 sm:max-w-[75%]',
          mine ? 'rounded-br-md bg-[rgb(var(--page-accent)/0.09)] ring-1 ring-[rgb(var(--page-accent)/0.18)]' : 'royal-card rounded-bl-md',
        )}
      >
        <p className="mb-1 text-xs text-ink-faint">
          <span className="font-semibold text-ink-soft">{name}</span> · {formatDateTime(createdAt)}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        {attachment}
      </div>
    </li>
  );
}

function Attachment({ message, canDownload }: { message: Message; canDownload: boolean }) {
  const a = message.attachment!;
  const [error, setError] = useState('');
  const download = async () => {
    setError('');
    const url = await getAttachmentUrl(message).catch(() => null);
    if (!url) return setError('지금은 파일을 내려받을 수 없어요.');
    const link = document.createElement('a');
    link.href = url;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={canDownload ? download : undefined}
        disabled={!canDownload}
        className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-white/70 px-3 py-1.5 text-sm enabled:hover:border-gold"
      >
        <Icon name="paperclip" size={15} />
        {a.name} <span className="text-xs text-ink-faint">{formatFileSize(a.size)}</span>
        {canDownload && <Icon name="download" size={15} className="text-ink-faint" />}
      </button>
      {error && <p className="mt-1 text-xs text-royal-light">{error}</p>}
    </div>
  );
}

function ReplyForm({ message, isTeacher, onDone }: { message: Message; isTeacher: boolean; onDone: () => void }) {
  const user = useCurrentUser();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await replyMessage(user, message, body.trim());
      setBody('');
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    setBusy(true);
    try {
      await markDone(message);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="royal-card space-y-3 p-4">
      <label className="royal-label" htmlFor="replyBody">
        {isTeacher ? '답장 쓰기' : '이어서 쓰기'}
      </label>
      <textarea
        id="replyBody"
        rows={3}
        className="royal-input resize-y"
        placeholder={isTeacher ? '학생에게 답장을 적어 주세요' : '선생님께 더 하고 싶은 말이 있으면 적어 주세요'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
      />
      {error && <p className="text-sm text-royal-light">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isTeacher && message.status !== 'done' && message.status !== 'replied' && (
          <RoyalButton variant="ghost" icon="done" onClick={done} disabled={busy}>
            답장 없이 처리 완료
          </RoyalButton>
        )}
        <RoyalButton type="submit" icon="send" disabled={busy || !body.trim()}>
          {isTeacher ? '답장 보내기' : '보내기'}
        </RoyalButton>
      </div>
      {!isTeacher && <p className="text-xs text-ink-faint">이어 쓴 내용도 선생님께 소리 없이 전달돼요.</p>}
    </form>
  );
}
