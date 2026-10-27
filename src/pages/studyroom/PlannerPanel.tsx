import { useState, type FormEvent } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { useCurrentUser } from '@/context/AuthContext';
import { addTask, deleteTask, listTasks, toggleTask } from '@/services/plannerService';
import { addDays, formatDateLabel, fromDateKey, toDateKey, todayKey } from '@/utils/date';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

export function PlannerPanel() {
  const user = useCurrentUser();
  const [date, setDate] = useState(todayKey());
  const [text, setText] = useState('');
  const { data: tasks, reload } = useAsyncData(() => listTasks(user.id, date), [user.id, date], []);

  const done = tasks.filter((t) => t.done).length;
  const shift = (days: number) => setDate(toDateKey(addDays(fromDateKey(date), days)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addTask(user.id, date, text.trim());
    setText('');
    reload();
  };

  return (
    <div className="royal-card mx-auto max-w-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <RoyalButton variant="ghost" size="sm" icon="back" onClick={() => shift(-1)} aria-label="이전 날" />
        <div className="text-center">
          <p className="font-serif text-lg font-bold">{formatDateLabel(date)}</p>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-0.5 bg-transparent text-xs text-ink-faint"
            aria-label="날짜 선택"
          />
        </div>
        <RoyalButton variant="ghost" size="sm" onClick={() => shift(1)} aria-label="다음 날">
          <Icon name="back" size={16} className="rotate-180" />
        </RoyalButton>
      </div>

      {/* 진행률 */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-ink-soft">
          <span>완료 {done} / {tasks.length}</span>
          {date !== todayKey() && (
            <button type="button" className="text-indigo hover:underline" onClick={() => setDate(todayKey())}>
              오늘로
            </button>
          )}
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hanji-dark">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold transition-all"
            style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input
          className="royal-input"
          placeholder="할 일을 적어 보세요 (예: 문학 3단원 복습)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <RoyalButton type="submit" icon="plus" className="shrink-0">
          <span className="hidden sm:inline">추가</span>
        </RoyalButton>
      </form>

      <ul className="mt-4 space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-xl border border-gold/25 bg-white/60 px-3 py-2.5">
            <button
              type="button"
              onClick={async () => {
                await toggleTask(t.id);
                reload();
              }}
              aria-label={t.done ? '완료 취소' : '완료'}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                t.done ? 'border-gold bg-royal text-gold-light' : 'border-gold/60 hover:bg-gold/10',
              )}
            >
              {t.done && <Icon name="check" size={14} strokeWidth={3} />}
            </button>
            <span className={cn('flex-1 break-all', t.done && 'text-ink-faint line-through')}>{t.text}</span>
            <button
              type="button"
              onClick={async () => {
                await deleteTask(t.id);
                reload();
              }}
              className="rounded-full p-1 text-ink-faint hover:bg-royal/10 hover:text-royal"
              aria-label="삭제"
            >
              <Icon name="trash" size={16} />
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <EmptyState icon="todo" title="아직 할 일이 없어요">작은 목표부터 하나씩 적어 볼까요?</EmptyState>}
    </div>
  );
}
