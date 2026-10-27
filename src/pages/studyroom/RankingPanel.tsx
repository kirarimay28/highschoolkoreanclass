import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { TabBar } from '@/components/common/TabBar';
import { rankingPeriods, type RankingPeriod } from '@/config/studyroom';
import { useCurrentUser } from '@/context/AuthContext';
import { getRanking } from '@/services/studyService';
import { formatDuration } from '@/utils/date';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

const medal = ['bg-gold text-royal-deep', 'bg-[#C0C0C0] text-ink', 'bg-[#B87333] text-hanji'];

export function RankingPanel() {
  const user = useCurrentUser();
  const [period, setPeriod] = useState<RankingPeriod>('daily');
  const { data: ranking } = useAsyncData(() => getRanking(period), [period], []);
  const max = ranking[0]?.seconds ?? 1;

  return (
    <div className="royal-card mx-auto max-w-2xl p-5 sm:p-6">
      <TabBar items={rankingPeriods} value={period} onChange={setPeriod} size="sm" className="mx-auto mb-5 max-w-xs" />
      <ol className="space-y-2">
        {ranking.map((r) => {
          const isMe = r.userId === user.id;
          return (
            <li
              key={r.userId}
              className={cn(
                'relative overflow-hidden rounded-xl border px-3 py-2.5',
                isMe ? 'border-gold bg-gold/10 shadow-glow' : 'border-gold/25 bg-white/60',
              )}
            >
              <div
                className="absolute inset-y-0 left-0 bg-royal/[0.06]"
                style={{ width: `${(r.seconds / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif font-bold',
                    medal[r.rank - 1] ?? 'border border-gold/40 text-ink-soft',
                  )}
                >
                  {r.rank}
                </span>
                <span className="flex-1 font-medium">
                  {r.userName}
                  {isMe && <span className="ml-1.5 text-xs text-gold-dark">(나)</span>}
                </span>
                <span className="font-serif font-bold text-royal">{formatDuration(r.seconds)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {ranking.length === 0 && <EmptyState icon="trophy" title="아직 기록이 없어요">타이머로 첫 기록을 남겨 보세요!</EmptyState>}
    </div>
  );
}
