import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { LONG_WAIT_HOURS, messageCategories } from '@/config/messages';
import type { Message } from '@/types';
import { formatRelative } from '@/utils/date';
import { cn } from '@/utils/format';

const isLongWait = (m: Message) => Date.now() - m.createdAt >= LONG_WAIT_HOURS * 3600_000;
const categoryLabel = (id: Message['category']) => messageCategories.find((c) => c.id === id)?.label;

/** 선생님·교수자 로비: 답장을 기다리는 쪽지 */
export function TeacherMessageBanner({ pending, loading }: { pending: Message[]; loading: boolean }) {
  if (loading) return <div className="mx-auto mb-6 h-6" aria-hidden />;
  if (pending.length === 0) {
    return (
      <p className="mx-auto -mt-4 mb-6 flex items-center justify-center gap-1 text-xs text-ink-faint sm:-mt-6 sm:mb-8">
        <Icon name="done" size={13} />
        모든 쪽지에 답했어요
      </p>
    );
  }
  const preview = pending.slice(0, 3); // 가장 오래된 것부터
  return (
    <Link
      to="/messages?filter=pending"
      className="royal-card group mx-auto -mt-2 mb-8 block max-w-2xl p-4 transition-all hover:shadow-glow sm:-mt-4 sm:mb-10 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum/10 text-plum">
          <Icon name="mail" size={20} />
        </span>
        <p className="flex-1 font-serif text-lg font-bold">
          답장을 기다리는 쪽지 <span className="text-royal">{pending.length}건</span>
        </p>
        <span className="text-sm text-ink-soft group-hover:text-royal">받은 쪽지함 ›</span>
      </div>
      <ul className="mt-3 space-y-2">
        {preview.map((m) => (
          <li
            key={m.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 text-sm',
              isLongWait(m) ? 'ring-2 ring-gold shadow-[0_0_12px_rgb(var(--color-gold)/0.35)]' : 'ring-1 ring-gold/20',
            )}
          >
            <span className="shrink-0 font-semibold">{m.senderName}</span>
            <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink-soft">{categoryLabel(m.category)}</span>
            <span className="min-w-0 flex-1 truncate text-ink-soft">{m.title}</span>
            <span className={cn('shrink-0 text-xs', isLongWait(m) ? 'font-bold text-gold-dark' : 'text-ink-faint')}>{formatRelative(m.createdAt)}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
