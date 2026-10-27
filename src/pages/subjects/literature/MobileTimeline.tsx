import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import {
  eraIndex,
  eras,
  events,
  externals,
  influences,
  lanes as allLanes,
  type EraId,
  type Lane,
  type MapId,
  type Stage,
} from '@/data/literatureTimeline';
import { cn } from '@/utils/format';
import { TimelineMap, WorkMedal, type TimelineSelection } from './TimelineMap';

type View = 'era' | 'genre';

interface Props {
  map: MapId;
  onSelect: (s: TimelineSelection) => void;
}

const laneVar = (lane: Lane) => ({ '--lane': lane.color }) as React.CSSProperties;
const eraName = (id: EraId) => eras[eraIndex(id)].name;
const span = (s: Stage) => (s.from === s.to ? eraName(s.from) : `${eraName(s.from)} ~ ${eraName(s.to)}`);

/** 레인이 존재하는 시대 구간 */
function laneRange(lane: Lane) {
  return { first: Math.min(...lane.stages.map((s) => eraIndex(s.from))), last: Math.max(...lane.stages.map((s) => eraIndex(s.to))) };
}
const stageAt = (lane: Lane, i: number) => lane.stages.find((s) => eraIndex(s.from) <= i && i <= eraIndex(s.to));

/** 모바일 전용: 시대별 보기 / 갈래별 보기 (PC 지도와 같은 데이터) */
export function MobileTimeline({ map, onSelect }: Props) {
  const lanes = allLanes.filter((l) => l.map === map);
  const [view, setView] = useState<View>('era');
  const [eraIdx, setEraIdx] = useState(0);
  const [laneId, setLaneId] = useState<string | undefined>(lanes[0]?.id);
  const [flash, setFlash] = useState(0); // 다른 갈래로 건너왔을 때 금빛 하이라이트
  const [fullMap, setFullMap] = useState(false);

  // 탭(고전 시가/서사)을 바꾸면 처음으로
  useEffect(() => {
    setEraIdx(0);
    setLaneId(allLanes.find((l) => l.map === map)?.id);
  }, [map]);

  const goLane = (id: string) => {
    setLaneId(id);
    setView('genre');
    setFlash((n) => n + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        {(
          [
            { id: 'era', label: '시대별' },
            { id: 'genre', label: '갈래별' },
          ] as const
        ).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full border-2 font-serif text-[15px] font-bold transition-all',
              view === v.id ? 'border-gold bg-gradient-to-b from-royal-light to-royal text-hanji shadow-glow' : 'medallion border-gold/60 text-royal',
            )}
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFullMap(true)}
          className="ml-auto flex h-11 items-center gap-1.5 rounded-full border border-gold/50 bg-white/70 px-3.5 text-sm font-semibold text-ink-soft"
        >
          <Icon name="map" size={16} />
          전체 지도
        </button>
      </div>

      {view === 'era' ? (
        <EraView lanes={lanes} index={eraIdx} setIndex={setEraIdx} onSelect={onSelect} onLane={goLane} />
      ) : (
        <GenreView lanes={lanes} laneId={laneId ?? lanes[0].id} setLaneId={setLaneId} flash={flash} onSelect={onSelect} onLane={goLane} />
      )}

      {fullMap && <FullMap map={map} onClose={() => setFullMap(false)} onSelect={onSelect} />}
    </div>
  );
}

// ───────────────────────── 시대별 보기 ─────────────────────────
function EraView({
  lanes,
  index,
  setIndex,
  onSelect,
  onLane,
}: {
  lanes: Lane[];
  index: number;
  setIndex: (i: number) => void;
  onSelect: (s: TimelineSelection) => void;
  onLane: (id: string) => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const [dir, setDir] = useState(1);
  const [bgOpen, setBgOpen] = useState(false);
  const era = eras[index];
  const here = lanes.filter((l) => {
    const r = laneRange(l);
    return r.first <= index && index <= r.last;
  });

  const go = (i: number) => {
    if (i < 0 || i >= eras.length || i === index) return;
    setDir(i > index ? 1 : -1);
    setIndex(i);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -450) go(index + 1);
    else if (info.offset.x > 60 || info.velocity.x > 450) go(index - 1);
  };

  return (
    <div className="pb-24">
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={era.id}
          custom={dir}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60 }}
          transition={{ duration: 0.22 }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
          style={{ touchAction: 'pan-y' }}
          className="space-y-4"
        >
          <header>
            <p className="text-xs text-ink-faint">
              {index + 1} / {eras.length} · 옆으로 밀어 시대 이동
            </p>
            <h2 className="font-serif text-4xl font-bold text-royal-deep">{era.name}</h2>
            {era.sub && <p className="text-sm text-ink-soft">{era.sub}</p>}
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {events
                .filter((e) => e.era === era.id)
                .map((e) => (
                  <span key={e.label} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm ring-1 ring-inset ring-gold/30">
                    <svg width="10" height="12" viewBox="0 0 9 11" aria-hidden className="shrink-0 text-royal">
                      <path d="M1 0v11" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M1.5 1h6.5l-2 2.3 2 2.3H1.5z" fill="currentColor" />
                    </svg>
                    {e.label}
                    <span className="tabular-nums text-xs text-ink-faint">{e.year}</span>
                  </span>
                ))}
            </div>
          </header>

          <section className="royal-card overflow-hidden">
            <button type="button" onClick={() => setBgOpen((v) => !v)} aria-expanded={bgOpen} className="flex min-h-[52px] w-full items-center gap-2 px-4 py-3 text-left">
              <span className="text-xs font-bold text-gold-dark">사회·문화적 배경</span>
              <span className="min-w-0 flex-1 truncate font-serif font-bold">{era.background.summary}</span>
              <Icon name="back" size={16} className={cn('shrink-0 text-ink-faint transition-transform', bgOpen ? 'rotate-90' : '-rotate-90')} />
            </button>
            <AnimatePresence initial={false}>
              {bgOpen && (
                <motion.ul initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="space-y-1.5 overflow-hidden px-4 text-[15px]">
                  {era.background.points.map((p) => (
                    <li key={p} className="flex gap-2 last:pb-4">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                      {p}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </section>

          <ul className="space-y-3">
            {here.map((lane) => {
              const stage = stageAt(lane, index);
              const works = lane.works.filter((w) => w.era === era.id);
              return (
                <li key={lane.id} className={cn('royal-card p-4', lane.foundation && 'opacity-80')} style={laneVar(lane)}>
                  <button type="button" onClick={() => onLane(lane.id)} className="flex min-h-[44px] w-full items-center gap-2 text-left">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-[rgb(var(--lane))]" aria-hidden />
                    <span className="font-serif text-lg font-bold">{lane.name}</span>
                    {stage ? (
                      <span className="min-w-0 truncate rounded-full bg-[rgb(var(--lane)/0.1)] px-2.5 py-0.5 text-sm font-semibold text-[rgb(var(--lane))]">{stage.label}</span>
                    ) : (
                      <span className="text-xs text-ink-faint">이어짐</span>
                    )}
                    <Icon name="back" size={16} className="ml-auto shrink-0 rotate-180 text-ink-faint" />
                  </button>
                  {works.length > 0 && (
                    <div className="-mx-1 mt-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                      {works.map((w) => (
                        <WorkMedal key={w.title} work={w} faint={lane.foundation} onClick={() => onSelect({ kind: 'work', work: w, lane })} />
                      ))}
                    </div>
                  )}
                  <InfluenceLine lane={lane} onLane={onLane} />
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>

      {/* 하단 고정: 시대 위치 표시 */}
      <nav
        aria-label="시대 이동"
        className="glass fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between py-1">
          {eras.map((e, i) => (
            <button key={e.id} type="button" onClick={() => go(i)} aria-label={e.name} aria-current={i === index} className="flex h-12 min-w-[48px] flex-1 flex-col items-center justify-center gap-1">
              <span className={cn('rounded-full transition-all', i === index ? 'h-3 w-3 bg-royal ring-2 ring-gold' : 'h-2 w-2 bg-gold/50')} />
              <span className={cn('text-[10px] leading-none', i === index ? 'font-bold text-royal' : 'text-ink-faint')}>{e.name.replace(' ', '')}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ───────────────────────── 갈래별 보기 ─────────────────────────
function GenreView({
  lanes,
  laneId,
  setLaneId,
  flash,
  onSelect,
  onLane,
}: {
  lanes: Lane[];
  laneId: string;
  setLaneId: (id: string) => void;
  flash: number;
  onSelect: (s: TimelineSelection) => void;
  onLane: (id: string) => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const lane = lanes.find((l) => l.id === laneId) ?? lanes[0];
  const chipRow = useRef<HTMLDivElement>(null);

  // 고른 칩이 보이도록 가로 스크롤
  useLayoutEffect(() => {
    chipRow.current?.querySelector<HTMLElement>(`[data-lane="${lane.id}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [lane.id, reduce]);

  return (
    <div className="space-y-4 pb-6">
      <div ref={chipRow} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label="갈래 고르기">
        {lanes.map((l) => (
          <button
            key={l.id}
            data-lane={l.id}
            role="tab"
            aria-selected={l.id === lane.id}
            type="button"
            onClick={() => setLaneId(l.id)}
            style={laneVar(l)}
            className={cn(
              'flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold transition-colors',
              l.id === lane.id ? 'border-transparent bg-[rgb(var(--lane))] text-hanji' : 'border-gold/40 bg-white/70 text-ink-soft',
              l.foundation && l.id !== lane.id && 'border-dashed',
            )}
          >
            {l.id !== lane.id && <span className="h-2 w-2 rounded-full bg-[rgb(var(--lane))]" aria-hidden />}
            {l.name}
          </button>
        ))}
      </div>

      <motion.section
        key={`${lane.id}-${flash}`}
        initial={flash && !reduce ? { boxShadow: '0 0 0 3px rgb(201 162 39 / 0.9), 0 0 28px 6px rgb(201 162 39 / 0.55)' } : false}
        animate={{ boxShadow: '0 0 0 0px rgb(201 162 39 / 0), 0 0 0 0 rgb(201 162 39 / 0)' }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="royal-card p-4"
        style={laneVar(lane)}
      >
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-[rgb(var(--lane))]" aria-hidden />
          <h2 className="font-serif text-2xl font-bold">{lane.name}</h2>
          {lane.foundation && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">토대</span>}
          <button type="button" onClick={() => onSelect({ kind: 'lane', lane })} className="ml-auto flex h-11 items-center px-2 text-sm font-semibold text-[rgb(var(--lane))]">
            자세히 ›
          </button>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{lane.detail.definition}</p>

        {/* 위에서 아래로 흐르는 세로 타임라인 */}
        <ol className="relative mt-4 space-y-5 border-l-2 border-[rgb(var(--lane)/0.35)] pl-5">
          {lane.stages.map((s) => {
            const from = eraIndex(s.from);
            const to = eraIndex(s.to);
            const inRange = (e: EraId) => from <= eraIndex(e) && eraIndex(e) <= to;
            const notes = lane.detail.changes.filter((c) => inRange(c.era));
            const works = lane.works.filter((w) => inRange(w.era));
            return (
              <li key={s.label} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-[rgb(var(--lane))] ring-4 ring-hanji-card" aria-hidden />
                <button type="button" onClick={() => onSelect({ kind: 'era', era: s.from })} className="-my-2 min-h-[44px] text-sm text-ink-faint underline-offset-2 hover:underline">
                  {span(s)}
                </button>
                <p className="font-serif text-lg font-bold text-[rgb(var(--lane))]">{s.label}</p>
                {notes.map((n) => (
                  <p key={n.era + n.text} className="mt-0.5 text-sm leading-relaxed text-ink">
                    {n.text}
                  </p>
                ))}
                {works.length > 0 && (
                  <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                    {works.map((w) => (
                      <WorkMedal key={w.title} work={w} faint={lane.foundation} onClick={() => onSelect({ kind: 'work', work: w, lane })} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <InfluenceLine lane={lane} onLane={onLane} />
      </motion.section>
    </div>
  );
}

// ───────────────────────── 영향 관계 줄 (화살표 대신) ─────────────────────────
function InfluenceLine({ lane, onLane }: { lane: Lane; onLane: (id: string) => void }) {
  const received = influences.filter((i) => i.to.lane === lane.id);
  const given = influences.filter((i) => i.from.lane === lane.id);
  if (!received.length && !given.length) return null;

  const label = (end: { lane?: string; external?: string }, inf: (typeof influences)[number]) => {
    if (end.external) return { text: externals.find((x) => x.id === end.external)?.label ?? end.external };
    if (end.lane === lane.id) return { text: inf.label }; // 같은 갈래 안 (산대극 → 탈춤)
    return { text: allLanes.find((l) => l.id === end.lane)?.name ?? '', laneId: end.lane };
  };
  const Chip = ({ inf, end }: { inf: (typeof influences)[number]; end: { lane?: string; external?: string } }) => {
    const { text, laneId } = label(end, inf);
    return laneId ? (
      <button type="button" onClick={() => onLane(laneId)} title={inf.description} className="inline-flex min-h-[44px] items-center rounded-full bg-gold/15 px-3 text-sm font-semibold text-royal-deep underline-offset-2 hover:underline">
        {text}
      </button>
    ) : (
      <span title={inf.description} className="inline-flex min-h-[44px] items-center rounded-full border border-dashed border-ink-faint/50 px-3 text-sm text-ink-soft">
        {text}
      </span>
    );
  };

  return (
    <div className="mt-3 space-y-1.5 border-t border-gold/20 pt-3 text-sm">
      <p className="text-xs font-bold text-gold-dark">영향 관계</p>
      {received.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">← 받은 영향:</span>
          {received.map((i) => (
            <Chip key={i.id} inf={i} end={i.from} />
          ))}
        </p>
      )}
      {given.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">→ 준 영향:</span>
          {given.map((i) => (
            <Chip key={i.id} inf={i} end={i.to} />
          ))}
        </p>
      )}
    </div>
  );
}

// ───────────────────────── 전체 지도 (핀치 줌) ─────────────────────────
function FullMap({ map, onClose, onSelect }: { map: MapId; onClose: () => void; onSelect: (s: TimelineSelection) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [size, setSize] = useState({ w: 1012, h: 1400 });
  const [arrows, setArrows] = useState(false);
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  // 처음엔 화면 폭에 맞춤
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => {
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    setScale(Math.min(1, (box.current!.clientWidth - 8) / el.offsetWidth));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    document.body.style.overflow = 'hidden';
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    };
  }, []);

  // 두 손가락으로 확대·축소
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) pinch.current = { dist: dist(e.touches), scale };
    };
    const move = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        setScale(Math.min(1.6, Math.max(0.25, pinch.current.scale * (dist(e.touches) / pinch.current.dist))));
      }
    };
    const end = () => (pinch.current = null);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
    };
  }, [scale]);

  const zoom = (d: number) => setScale((s) => Math.min(1.6, Math.max(0.25, +(s + d).toFixed(2))));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-hanji" role="dialog" aria-modal="true" aria-label="전체 지도">
      <div
        className="flex shrink-0 items-center gap-2 border-b border-gold/30 bg-hanji-card py-2"
        style={{ paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))', paddingTop: 'max(8px, env(safe-area-inset-top))' }}
      >
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-gold/10" aria-label="닫기">
          <Icon name="close" />
        </button>
        <p className="font-serif font-bold">전체 지도</p>
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setArrows((v) => !v)} aria-pressed={arrows} className={cn('flex h-11 items-center rounded-full px-3 text-xs font-semibold', arrows ? 'bg-gold text-royal-deep' : 'text-ink-soft')}>
            영향 관계
          </button>
          <button type="button" onClick={() => zoom(-0.15)} className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-royal" aria-label="축소">
            −
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-ink-faint">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.15)} className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-royal" aria-label="확대">
            +
          </button>
        </span>
      </div>
      {portrait && (
        <p className="shrink-0 bg-gold/15 px-4 py-2 text-center text-xs text-gold-dark">📱 휴대폰을 가로로 돌리면 더 넓게 볼 수 있어요. 두 손가락으로 확대·축소하세요.</p>
      )}
      <div ref={box} className="min-h-0 flex-1 overflow-auto overscroll-contain p-1" style={{ touchAction: 'pan-x pan-y' }}>
        <div style={{ width: size.w * scale, height: size.h * scale }}>
          <div ref={inner} className="w-[1012px] origin-top-left" style={{ transform: `scale(${scale})` }}>
            <TimelineMap map={map} showInfluences={arrows} onSelect={onSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
