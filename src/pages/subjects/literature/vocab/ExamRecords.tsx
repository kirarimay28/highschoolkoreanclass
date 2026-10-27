import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { deleteExamAttempt, kstToday, listExamAttempts } from '@/services/vocabService';
import type { VocabAttempt } from '@/types/vocab';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';
import { Chip } from './VocabBook';
import { rangeText } from './VocabQuiz';

/** 선생님·교수자: 시험 응시 기록 (KoreanEdu "전체 응시 기록(관리자)") — 연습 기록은 나오지 않음 */
export function ExamRecords() {
  const { data, loading, reload } = useAsyncData(() => listExamAttempts(), [], [] as VocabAttempt[]);
  const [date, setDate] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const dates = useMemo(() => [...new Set(data.map((r) => r.date))].sort().reverse(), [data]);
  const list = date === 'all' ? data : data.filter((r) => r.date === date);

  // 많이 틀린 단어 (보고 있는 기록 기준)
  const hardest = useMemo(() => {
    const m = new Map<number, { vocab: string; wrong: number; total: number }>();
    for (const r of list)
      for (const x of r.results) {
        const e = m.get(x.num) ?? { vocab: x.vocab, wrong: 0, total: 0 };
        e.total += 1;
        if (!x.correct) e.wrong += 1;
        m.set(x.num, e);
      }
    return [...m.values()].filter((e) => e.wrong > 0).sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong).slice(0, 5);
  }, [list]);

  const remove = async (r: VocabAttempt) => {
    if (!confirm(`${r.studentName} 학생의 ${r.date} 시험 기록을 지울까요? 지우면 이 학생은 그날 다시 응시할 수 있어요.`)) return;
    setError('');
    try {
      await deleteExamAttempt(r.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '지우지 못했어요.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
        <Icon name="scroll" size={16} className="mt-0.5 shrink-0 text-gold-dark" />
        학생은 [시험 응시]에서 범위·유형을 골라 하루 한 번 시험을 봐요. 여기에서 결과를 보고, 기록을 지우면 다시 응시할 수 있어요. 학생의 연습 기록은 보이지 않아요.
      </p>

      {dates.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Chip small on={date === 'all'} onClick={() => setDate('all')}>
            전체
          </Chip>
          {dates.map((d) => (
            <Chip key={d} small on={date === d} onClick={() => setDate(d)}>
              {d === kstToday() ? `오늘 (${d.slice(5)})` : d.slice(5).replace('-', '/')}
            </Chip>
          ))}
        </div>
      )}

      {hardest.length > 0 && (
        <div className="royal-card p-4">
          <p className="mb-2 text-sm font-bold">많이 틀린 단어</p>
          <ul className="flex flex-wrap gap-1.5">
            {hardest.map((h) => (
              <li key={h.vocab} className="rounded-full bg-royal/10 px-3 py-1 text-sm">
                <span className="font-serif font-bold">{h.vocab}</span>{' '}
                <span className="text-xs text-royal">
                  {h.wrong}/{h.total}명
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="rounded-xl bg-royal/5 px-3 py-2 text-sm text-royal">{error}</p>}

      {loading && data.length === 0 ? null : list.length === 0 ? (
        <div className="royal-card">
          <EmptyState icon="scroll" title="아직 응시 기록이 없어요" />
        </div>
      ) : (
        <ul className="royal-card divide-y divide-gold/15 p-0">
          {list.map((r) => {
            const open = openId === r.id;
            const wrong = r.results.filter((x) => !x.correct);
            return (
              <li key={r.id}>
                <div className="flex items-center gap-2 px-4 py-2">
                  <button type="button" onClick={() => setOpenId(open ? null : r.id)} className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{r.studentName}</span>
                      <span className="block truncate text-xs text-ink-faint">
                        {r.date} · {rangeText(r)} · {r.format}
                      </span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold', r.score / r.total >= 0.8 ? 'bg-gold/20 text-gold-dark' : 'bg-royal/10 text-royal')}>
                      {r.score}/{r.total}
                    </span>
                    <Icon name="down" size={16} className={cn('shrink-0 text-ink-faint transition-transform', open && 'rotate-180')} />
                  </button>
                  <button type="button" onClick={() => remove(r)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-royal/10 hover:text-royal" aria-label={`${r.studentName} 기록 지우기`}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {open && (
                  <div className="space-y-1 px-4 pb-4">
                    {wrong.length === 0 ? (
                      <p className="text-sm text-gold-dark">모두 맞혔어요.</p>
                    ) : (
                      wrong.map((x) => (
                        <p key={x.num} className="text-sm">
                          <span className="font-serif font-bold">{x.vocab}</span> <span className="text-ink-faint">— 답: {x.userAnswer || '(빈칸)'}</span>{' '}
                          <span className="text-royal">→ {x.correctAnswer}</span>
                        </p>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
