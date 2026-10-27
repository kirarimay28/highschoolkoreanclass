import { useMemo, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { useCurrentUser } from '@/context/AuthContext';
import { listAllTasks } from '@/services/plannerService';
import { getStudyMap } from '@/services/studyService';
import { formatDateLabel, formatDuration, toDateKey, todayKey } from '@/utils/date';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarPanel() {
  const user = useCurrentUser();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayKey());

  const { data } = useAsyncData(
    async () => ({ study: await getStudyMap(user.id), tasks: await listAllTasks(user.id) }),
    [user.id],
    { study: {} as Record<string, number>, tasks: [] as Awaited<ReturnType<typeof listAllTasks>> },
  );

  const cells = useMemo(() => {
    const first = cursor.getDay();
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: first }, () => null),
      ...Array.from({ length: days }, (_, i) => toDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))),
    ];
  }, [cursor]);

  const moveMonth = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const selectedSeconds = data.study[selected] ?? 0;
  const doneTasks = data.tasks.filter((t) => t.date === selected && t.done);
  const totalTasks = data.tasks.filter((t) => t.date === selected).length;
  const today = todayKey();

  return (
    <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1fr_18rem]">
      <section className="royal-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <RoyalButton variant="ghost" size="sm" icon="back" onClick={() => moveMonth(-1)} aria-label="이전 달" />
          <h2 className="text-xl font-bold">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h2>
          <RoyalButton variant="ghost" size="sm" onClick={() => moveMonth(1)} aria-label="다음 달">
            <Icon name="back" size={16} className="rotate-180" />
          </RoyalButton>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-soft sm:text-sm">
          {WEEK.map((w, i) => (
            <div key={w} className={cn('py-1 font-medium', i === 0 && 'text-royal-light', i === 6 && 'text-indigo')}>
              {w}
            </div>
          ))}
          {cells.map((key, i) => {
            if (!key) return <div key={`e${i}`} />;
            const sec = data.study[key] ?? 0;
            const level = sec === 0 ? 0 : sec < 1800 ? 1 : sec < 3600 * 2 ? 2 : 3;
            const isSel = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all sm:text-base',
                  isSel ? 'border-gold bg-royal text-hanji shadow-glow' : 'border-transparent hover:border-gold/50',
                  !isSel && key === today && 'border-gold/60 font-bold text-royal',
                )}
              >
                {Number(key.slice(-2))}
                <span
                  className={cn(
                    'mt-0.5 h-1.5 w-1.5 rounded-full',
                    level === 0 && 'opacity-0',
                    level === 1 && 'bg-gold/40',
                    level === 2 && 'bg-gold/75',
                    level === 3 && 'bg-gold',
                  )}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-right text-xs text-ink-faint">금색 점이 진할수록 공부를 많이 한 날이에요.</p>
      </section>

      <aside className="royal-card p-5">
        <h3 className="font-serif text-lg font-bold">{formatDateLabel(selected)}</h3>
        <div className="mt-3 rounded-2xl border border-white bg-white/60 p-3 text-center">
          <p className="text-xs text-ink-soft">공부 시간</p>
          <p className="font-serif text-2xl font-bold text-royal">{formatDuration(selectedSeconds)}</p>
        </div>
        <p className="mt-4 text-sm font-medium text-ink-soft">
          완료한 할 일 {doneTasks.length} / {totalTasks}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {doneTasks.map((t) => (
            <li key={t.id} className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-gold-dark" />
              <span className="break-all">{t.text}</span>
            </li>
          ))}
          {doneTasks.length === 0 && <li className="text-ink-faint">완료한 할 일이 없어요.</li>}
        </ul>
      </aside>
    </div>
  );
}
