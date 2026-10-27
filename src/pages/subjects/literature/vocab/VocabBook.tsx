import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { VOCAB_ITEMS } from '@/data/classicalVocab';
import { eras, getEra } from '@/data/literatureTimeline';
import { vocabSource, wrongNums } from '@/services/vocabService';
import type { VocabAttempt, VocabItem } from '@/types/vocab';
import { cn } from '@/utils/format';

type Filter = 'all' | 'work' | 'genre' | 'era' | 'wrong';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'work', label: '작품별' },
  { id: 'genre', label: '갈래별' },
  { id: 'era', label: '시대별' },
  { id: 'wrong', label: '내가 틀린 단어' },
];

const withSource = VOCAB_ITEMS.map((item) => ({ item, src: vocabSource(item) }));
type Row = (typeof withSource)[number];
const valueOf = (r: Row, f: Filter) => (f === 'work' ? r.src.work : f === 'genre' ? r.src.genre : f === 'era' ? r.src.era : undefined);
const labelOf = (f: Filter, v: string) => (f === 'era' ? getEra(v as Parameters<typeof getEra>[0]).name : f === 'work' ? `「${v}」` : v);

/** 단어장 (KoreanEdu VocabStudyTab: 단어 목록 + 플래시 카드) */
export function VocabBook({ attempts }: { attempts: VocabAttempt[] }) {
  const [view, setView] = useState<'list' | 'flash'>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const wrong = useMemo(() => wrongNums(attempts), [attempts]);

  // 작품·갈래·시대 칩 (데이터에 있는 값만, 시대는 지도 순서대로)
  const values = useMemo(() => {
    if (filter === 'all' || filter === 'wrong') return [];
    const set = [...new Set(withSource.map((r) => valueOf(r, filter)).filter(Boolean) as string[])];
    return filter === 'era' ? eras.map((e) => e.id as string).filter((id) => set.includes(id)) : set.sort((a, b) => a.localeCompare(b, 'ko'));
  }, [filter]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withSource.filter((r) => {
      if (filter === 'wrong' && !wrong.has(r.item.num)) return false;
      if (filter !== 'all' && filter !== 'wrong') {
        const v = valueOf(r, filter);
        if (!v || (value && v !== value)) return false;
      }
      return !q || r.item.vocab.toLowerCase().includes(q) || r.item.answer.toLowerCase().includes(q) || String(r.item.num) === q;
    });
  }, [filter, value, query, wrong]);

  return (
    <div className="space-y-4">
      <TabBar
        items={[
          { id: 'list', label: '단어 목록', icon: 'book' },
          { id: 'flash', label: '플래시 카드', icon: 'bookmark' },
        ]}
        value={view}
        onChange={setView}
        size="sm"
        touch
        className="max-w-xs"
      />

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="단어 고르기">
          {filters.map((f) => (
            <Chip key={f.id} on={filter === f.id} onClick={() => (setFilter(f.id), setValue(null))}>
              {f.label}
              {f.id === 'wrong' && wrong.size > 0 && <span className="ml-1 rounded-full bg-royal px-1.5 text-[11px] text-hanji">{wrong.size}</span>}
            </Chip>
          ))}
        </div>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip small on={!value} onClick={() => setValue(null)}>
              모두
            </Chip>
            {values.map((v) => (
              <Chip key={v} small on={value === v} onClick={() => setValue(v)}>
                {labelOf(filter, v)}
              </Chip>
            ))}
          </div>
        )}
        {filter !== 'all' && filter !== 'wrong' && (
          <p className="text-xs text-ink-faint">출전 정보가 있는 단어만 보여요. (출전은 선생님이 계속 채워 가요)</p>
        )}
      </div>

      {view === 'list' ? (
        <>
          <label className="relative block">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="royal-input pl-9" placeholder="고어 / 현대어 / 번호 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {rows.length === 0 ? (
            <div className="royal-card">
              <EmptyState icon="bookmark" title={filter === 'wrong' ? '틀린 단어가 없어요' : '찾는 단어가 없어요'}>
                {filter === 'wrong' && '시험 연습이나 시험 응시에서 틀린 단어가 여기에 모여요. 나중에 맞히면 빠져요.'}
              </EmptyState>
            </div>
          ) : (
            <ul className="royal-card divide-y divide-gold/15 overflow-hidden p-0">
              {rows.map((r) => (
                <WordRow key={r.item.num} row={r} wrong={wrong.has(r.item.num)} />
              ))}
            </ul>
          )}
          <p className="text-center text-xs text-ink-faint">
            {rows.length}개 / 전체 {VOCAB_ITEMS.length}개
          </p>
        </>
      ) : (
        <FlashCards filtered={filter === 'all' && !query ? null : rows.map((r) => r.item)} />
      )}
    </div>
  );
}

function WordRow({ row: { item, src }, wrong }: { row: Row; wrong: boolean }) {
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-x-2 gap-y-1 px-4 py-3 sm:grid-cols-[2.5rem_minmax(8rem,1fr)_1.4fr]">
      <span className="row-span-2 pt-0.5 font-mono text-xs text-ink-faint sm:row-span-1">{item.num}</span>
      <span className="font-serif text-lg font-bold leading-snug">
        {item.vocab}
        {wrong && <span className="ml-1.5 align-middle font-sans text-[11px] font-semibold text-royal">틀린 단어</span>}
      </span>
      <div className="min-w-0 sm:col-start-3">
        <p className="text-[15px] text-ink-soft">{item.answer}</p>
        {(src.work || src.genre || src.era) && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {src.work &&
              (src.workId ? (
                <Link
                  to={`/subject/literature/timeline?work=${src.workId}`}
                  className="inline-flex min-h-[32px] items-center gap-0.5 rounded-full border border-gold/50 bg-gold/10 px-2.5 font-semibold text-gold-dark hover:border-gold hover:bg-gold/20"
                  title="연대기 지도에서 이 작품 보기"
                >
                  「{src.work}」 <Icon name="map" size={12} />
                </Link>
              ) : (
                <span className="rounded-full border border-gold/30 px-2.5 py-1 text-ink-soft">「{src.work}」</span>
              ))}
            {src.genre && <span className="text-ink-faint">{src.genre}</span>}
            {src.era && <span className="text-ink-faint">· {getEra(src.era).name}</span>}
          </p>
        )}
      </div>
    </li>
  );
}

export function Chip({ on, small, onClick, children }: { on: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium transition-colors',
        small ? 'min-h-[36px] px-3 text-[13px]' : 'min-h-[44px] px-4 text-sm',
        on ? 'border-royal bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button' : 'border-gold/40 bg-white/60 text-ink-soft hover:border-gold',
      )}
    >
      {children}
    </button>
  );
}

// ───────── 플래시 카드 (KoreanEdu FlashCardView) ─────────
function FlashCards({ filtered }: { filtered: VocabItem[] | null }) {
  const [phase, setPhase] = useState<'setup' | 'study' | 'done'>('setup');
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(20);
  const [carryover, setCarryover] = useState<number[]>([]);
  const [cards, setCards] = useState<VocabItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const max = VOCAB_ITEMS.length;
  const rangeCount = Math.max(0, endNum - startNum + 1);

  const begin = (list: VocabItem[]) => {
    setCards(list);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setPhase('study');
  };
  const advance = () => {
    if (index < cards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else setPhase('done');
  };
  const mark = (ok: boolean) => {
    const n = cards[index].num;
    (ok ? setKnown : setUnknown)((s) => new Set([...s, n]));
    advance();
  };

  if (phase === 'setup') {
    const clamp = (v: number) => Math.max(1, Math.min(max, Number(v) || 1));
    return (
      <div className="space-y-4">
        {filtered && filtered.length > 0 && (
          <RoyalButton fullWidth variant="secondary" icon="bookmark" onClick={() => begin(filtered)}>
            지금 고른 단어 {filtered.length}개로 시작
          </RoyalButton>
        )}
        <div className="royal-card p-5">
          <p className="mb-3 text-sm font-bold">번호로 고르기</p>
          <div className="flex items-center gap-3">
            <NumberBox label="시작" value={startNum} onChange={(v) => (setStartNum(clamp(v)), clamp(v) > endNum && setEndNum(clamp(v)))} />
            <span className="pt-5 text-2xl text-ink-faint">~</span>
            <NumberBox label="끝" value={endNum} onChange={(v) => (setEndNum(clamp(v)), clamp(v) < startNum && setStartNum(clamp(v)))} />
          </div>
          <p className="mt-3 text-center text-xs text-ink-faint">{rangeCount}개 선택됨</p>
        </div>
        <CarryoverPicker startNum={startNum} endNum={endNum} value={carryover} onChange={setCarryover} />
        <RoyalButton fullWidth size="lg" icon="book" disabled={rangeCount === 0} onClick={() => begin([...VOCAB_ITEMS.filter((v) => carryover.includes(v.num)), ...VOCAB_ITEMS.filter((v) => v.num >= startNum && v.num <= endNum)])}>
          학습 시작 — 총 {rangeCount + carryover.length}개
        </RoyalButton>
      </div>
    );
  }

  if (phase === 'done') {
    const skipped = cards.length - known.size - unknown.size;
    return (
      <div className="space-y-3">
        <div className="royal-card p-6 text-center">
          <p className="font-serif text-2xl font-bold">한 바퀴 끝!</p>
          <p className="mt-1 text-sm text-ink-soft">
            {cards.length}개 중 {known.size}개를 기억했어요
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="알아요" n={known.size} tone="gold" />
            <Stat label="모르겠어요" n={unknown.size} tone="royal" />
            <Stat label="넘김" n={skipped} tone="ink" />
          </div>
        </div>
        {unknown.size > 0 && (
          <RoyalButton fullWidth icon="sparkles" onClick={() => begin(cards.filter((c) => unknown.has(c.num)))}>
            모르는 것만 다시 ({unknown.size}개)
          </RoyalButton>
        )}
        <RoyalButton fullWidth variant="secondary" onClick={() => (setPhase('setup'), setCarryover([]))}>
          처음으로
        </RoyalButton>
      </div>
    );
  }

  const card = cards[index];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-soft" onClick={() => setPhase('setup')}>
          <Icon name="back" size={16} /> 설정
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold">
            {index + 1} / {cards.length}
          </span>
          <span className="h-1.5 w-36 overflow-hidden rounded-full bg-gold/15">
            <span className="block h-full rounded-full bg-royal transition-all" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
          </span>
        </div>
        <span className="font-mono text-xs text-ink-faint">No.{card.num}</span>
      </div>

      <button type="button" onClick={() => setFlipped((f) => !f)} className="relative block h-72 w-full [perspective:1000px]" aria-label={flipped ? '앞면 보기' : '뜻 보기'}>
        <span className={cn('relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
          <span className="royal-card absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
            <span className="mb-6 text-xs font-bold tracking-widest text-gold-dark">고어</span>
            <span className="text-center font-serif text-4xl font-bold leading-relaxed">{card.vocab}</span>
            <span className="mt-8 text-xs text-ink-faint">눌러서 뜻 보기</span>
          </span>
          <span className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-gold/60 bg-gradient-to-br from-royal-light to-royal-deep p-8 text-hanji shadow-glow [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="mb-4 text-xs font-bold tracking-widest text-gold-light">현대어</span>
            <span className="text-center text-2xl font-bold leading-relaxed">{card.answer}</span>
            <span className="mt-6 w-full border-t border-gold/40 pt-4 text-center font-serif text-sm text-gold-light">{card.vocab}</span>
          </span>
        </span>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <RoyalButton size="lg" variant="secondary" onClick={() => mark(false)}>
            모르겠어요
          </RoyalButton>
          <RoyalButton size="lg" icon="check" onClick={() => mark(true)}>
            알아요
          </RoyalButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <RoyalButton size="lg" variant="secondary" disabled={index === 0} onClick={() => (setIndex((i) => i - 1), setFlipped(false))}>
            이전
          </RoyalButton>
          <RoyalButton size="lg" onClick={advance}>
            다음
          </RoyalButton>
        </div>
      )}
      <p className="flex justify-center gap-4 text-xs font-semibold">
        <span className="text-gold-dark">✓ 알아요 {known.size}</span>
        <span className="text-royal">✗ 모르겠어요 {unknown.size}</span>
      </p>
    </div>
  );
}

function NumberBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex-1 text-center">
      <span className="mb-1.5 block text-xs font-bold text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={VOCAB_ITEMS.length}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="royal-input py-3 text-center text-3xl font-bold"
      />
    </label>
  );
}

function Stat({ label, n, tone }: { label: string; n: number; tone: 'gold' | 'royal' | 'ink' }) {
  return (
    <div className={cn('rounded-xl p-3', tone === 'gold' ? 'bg-gold/15 text-gold-dark' : tone === 'royal' ? 'bg-royal/10 text-royal' : 'bg-ink/5 text-ink-soft')}>
      <p className="text-xs font-bold">{label}</p>
      <p className="text-2xl font-bold">{n}</p>
    </div>
  );
}

/** 이월 번호 — 범위 밖에서 더 넣을 번호 (KoreanEdu 이월 번호 선택) */
export function CarryoverPicker({ startNum, endNum, value, onChange }: { startNum: number; endNum: number; value: number[]; onChange: (v: number[]) => void }) {
  const outside = VOCAB_ITEMS.filter((v) => v.num < startNum || v.num > endNum);
  const [open, setOpen] = useState(value.length > 0);
  return (
    <div className="royal-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">
          이월 번호 <span className="font-normal text-ink-faint">(범위 밖에서 더 넣기)</span>
        </p>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--color-royal))]" checked={!open} onChange={(e) => (setOpen(!e.target.checked), e.target.checked && onChange([]))} />
          없음
        </label>
      </div>
      {open &&
        (outside.length === 0 ? (
          <p className="py-2 text-center text-xs text-ink-faint">전체 범위가 이미 선택됐어요</p>
        ) : (
          <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {outside.map((v) => {
              const on = value.includes(v.num);
              return (
                <button
                  key={v.num}
                  type="button"
                  aria-pressed={on}
                  title={v.vocab}
                  onClick={() => onChange(on ? value.filter((n) => n !== v.num) : [...value, v.num])}
                  className={cn('h-11 w-11 rounded-xl border text-sm font-bold transition-colors', on ? 'border-royal bg-royal text-hanji' : 'border-gold/40 bg-white/60 text-ink-soft hover:border-gold')}
                >
                  {v.num}
                </button>
              );
            })}
          </div>
        ))}
      {value.length > 0 && <p className="mt-2 text-xs font-semibold text-royal">+ 이월 {value.length}개</p>}
    </div>
  );
}
