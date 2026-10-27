import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@/components/common/Icon';
import {
  eraIndex,
  eras,
  events,
  externals,
  influences,
  lanes as allLanes,
  type EraId,
  type Influence,
  type InfluenceEnd,
  type Lane,
  type MapId,
  type Work,
} from '@/data/literatureTimeline';
import { cn } from '@/utils/format';

export type TimelineSelection =
  | { kind: 'lane'; lane: Lane }
  | { kind: 'era'; era: EraId }
  | { kind: 'work'; work: Work; lane: Lane }
  | { kind: 'influence'; influence: Influence };

interface MapProps {
  map: MapId;
  showInfluences: boolean;
  onSelect: (s: TimelineSelection) => void;
}

const LABEL_W = 112; // 갈래 이름 칸
const COL_MIN = 150; // 시대 한 칸 최소 폭 (이보다 좁으면 옆으로 스크롤)
const laneColor = (lane: Lane) => ({ '--lane': lane.color }) as CSSProperties;
const cellKey = (end: InfluenceEnd) => (end.lane ? `lane:${end.lane}|${end.era}` : `ext:${end.external}|${end.era}`);

/** PC: 시대(가로) × 갈래(세로) 2차원 지도 + 영향 관계 화살표 */
export function TimelineMap({ map, showInfluences, onSelect }: MapProps) {
  const lanes = allLanes.filter((l) => l.map === map);
  const ext = externals.filter((x) => x.map === map);
  const arrows = influences.filter((i) => i.map === map);

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${LABEL_W}px repeat(${eras.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="royal-card overflow-x-auto p-0">
      <div className="relative w-full" style={{ minWidth: LABEL_W + eras.length * COL_MIN }} data-map-root>
        <div className="grid" style={gridStyle}>
          {/* 시대 머리줄 */}
          <div className="sticky left-0 z-20 border-b border-gold/30 bg-hanji-card/95 px-3 py-3 text-xs font-semibold text-ink-soft">
            시대 →
            <br />
            갈래 ↓
          </div>
          {eras.map((era) => (
            <button
              key={era.id}
              type="button"
              onClick={() => onSelect({ kind: 'era', era: era.id })}
              className="group border-b border-l border-dashed border-gold/30 px-3 py-3 text-left transition-colors hover:bg-gold/10"
            >
              <span className="block font-serif text-base font-bold text-royal-deep group-hover:text-royal">{era.name}</span>
              <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                {era.sub ?? '배경 보기'}
                <Icon name="help" size={12} className="opacity-60" />
              </span>
            </button>
          ))}

          {/* 역사 사건 깃발 */}
          <div className="sticky left-0 z-20 border-b border-gold/30 bg-hanji-card/95 px-3 py-2 text-xs font-semibold text-ink-soft">역사 사건</div>
          {eras.map((era) => (
            <div key={era.id} className="flex flex-wrap content-start gap-1 border-b border-l border-dashed border-gold/30 px-2 py-2">
              {events
                .filter((e) => e.era === era.id)
                .map((e) => (
                  <span
                    key={e.label}
                    title={`${e.label} (${e.year})`}
                    className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] leading-tight text-ink-soft ring-1 ring-inset ring-gold/30"
                  >
                    <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden className="shrink-0 text-royal">
                      <path d="M1 0v11" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M1.5 1h6.5l-2 2.3 2 2.3H1.5z" fill="currentColor" />
                    </svg>
                    <span>
                      {e.label}
                      <span className="ml-0.5 tabular-nums text-ink-faint">{e.year}</span>
                    </span>
                  </span>
                ))}
            </div>
          ))}

          {/* 갈래 레인 */}
          {lanes.map((lane, r) => (
            <LaneRow key={lane.id} lane={lane} row={r + 3} onSelect={onSelect} />
          ))}

          {/* 지도 밖 외부 노드 */}
          {ext.length > 0 && (
            <>
              <div className="sticky left-0 z-20 bg-hanji-card/95 px-3 py-3 text-xs font-semibold text-ink-faint" style={{ gridRow: lanes.length + 3 }}>
                지도 밖
              </div>
              {eras.map((era, c) => (
                <div
                  key={era.id}
                  className="flex min-h-[64px] items-center justify-center border-l border-dashed border-gold/20 px-2 py-3"
                  style={{ gridRow: lanes.length + 3, gridColumn: c + 2 }}
                >
                  {ext
                    .filter((x) => x.era === era.id)
                    .map((x) => (
                      <span
                        key={x.id}
                        data-cell={`ext:${x.id}|${x.era}`}
                        className="rounded-xl border border-dashed border-ink-faint/60 bg-white/50 px-3 py-1.5 text-center text-xs font-medium text-ink-soft"
                      >
                        {x.label}
                      </span>
                    ))}
                </div>
              ))}
            </>
          )}
        </div>

        <InfluenceArrows arrows={arrows} show={showInfluences} onSelect={(influence) => onSelect({ kind: 'influence', influence })} />
      </div>
    </div>
  );
}

function LaneRow({ lane, row, onSelect }: { lane: Lane; row: number; onSelect: (s: TimelineSelection) => void }) {
  const first = Math.min(...lane.stages.map((s) => eraIndex(s.from)));
  const last = Math.max(...lane.stages.map((s) => eraIndex(s.to)));
  const faint = lane.foundation;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect({ kind: 'lane', lane })}
        style={{ gridRow: row, gridColumn: 1, ...laneColor(lane) }}
        className={cn(
          'sticky left-0 z-20 flex items-center gap-2 border-t border-gold/25 px-3 py-3 text-left transition-colors hover:bg-[rgb(var(--lane)/0.08)]',
          faint ? 'bg-hanji-dark/90' : 'bg-hanji-card/95',
        )}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--lane))]" aria-hidden />
        <span className={cn('font-serif text-[15px] font-bold leading-tight', faint ? 'text-ink-soft' : 'text-ink')}>
          {lane.name}
          {faint && <span className="block text-[10px] font-normal text-ink-faint">토대</span>}
        </span>
      </button>

      {/* 칸 (점선 격자 + 화살표 기준점) */}
      {eras.map((era, c) => (
        <div
          key={era.id}
          data-cell={`lane:${lane.id}|${era.id}`}
          style={{ gridRow: row, gridColumn: c + 2 }}
          className={cn('min-h-[104px] border-l border-t border-dashed border-gold/25', faint && 'bg-ink/[0.03]')}
        />
      ))}

      {/* 갈래가 존재한 구간의 띠 */}
      <div
        style={{ gridRow: row, gridColumn: `${first + 2} / ${last + 3}`, ...laneColor(lane) }}
        className={cn('pointer-events-none mx-2 mt-[38px] h-1.5 self-start rounded-full', faint ? 'bg-[rgb(var(--lane)/0.25)]' : 'bg-[rgb(var(--lane)/0.55)]')}
        aria-hidden
      />

      {/* 발전 단계 라벨 */}
      {lane.stages.map((s) => (
        <div
          key={s.label}
          style={{ gridRow: row, gridColumn: `${eraIndex(s.from) + 2} / ${eraIndex(s.to) + 3}`, ...laneColor(lane) }}
          className="pointer-events-none z-[1] mt-2.5 flex justify-center self-start px-2"
        >
          <span
            title={s.label}
            className={cn(
              'max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
              faint
                ? 'bg-hanji/90 text-ink-faint ring-ink/10'
                : 'bg-[rgb(var(--lane)/0.1)] text-[rgb(var(--lane))] ring-[rgb(var(--lane)/0.25)] backdrop-blur-sm',
            )}
          >
            {s.label}
          </span>
        </div>
      ))}

      {/* 작품 메달 */}
      {eras.map((era, c) => {
        const works = lane.works.filter((w) => w.era === era.id);
        if (!works.length) return null;
        return (
          <div key={era.id} style={{ gridRow: row, gridColumn: c + 2, ...laneColor(lane) }} className="z-[2] flex flex-wrap items-end justify-center gap-x-2 gap-y-1 self-end px-1 pb-2 pt-12">
            {works.map((w) => (
              <WorkMedal key={w.title} work={w} faint={faint} onClick={() => onSelect({ kind: 'work', work: w, lane })} />
            ))}
          </div>
        );
      })}
    </>
  );
}

/** 작품 메달 — 작은 원형 금테 + 제목 */
export function WorkMedal({ work, faint, onClick }: { work: Work; faint?: boolean; onClick: () => void }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { scale: 1.08 }}
      whileFocus={reduce ? undefined : { scale: 1.08 }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 600, damping: 12 }}
      className="group flex min-h-[44px] min-w-[44px] max-w-[84px] flex-col items-center outline-none"
      aria-label={`${work.title}${work.author ? ` (${work.author})` : ''}`}
    >
      <span
        className={cn(
          'medallion relative flex h-8 w-8 items-center justify-center rounded-full group-hover:medallion-glow group-focus-visible:medallion-glow',
          faint && 'opacity-70',
        )}
        style={{ '--medal-tint': 'var(--lane)' } as CSSProperties}
      >
        <span className="absolute inset-0 rounded-full border-[1.5px] border-[rgb(var(--lane))]" aria-hidden />
        <span className="absolute inset-[3px] rounded-full border border-gold/60" aria-hidden />
        <span className="relative font-serif text-[13px] font-bold text-[rgb(var(--lane))]">{work.title.replace(/^[《〈]/, '').charAt(0)}</span>
      </span>
      <span className="mt-0.5 line-clamp-2 text-center text-[11px] font-medium leading-tight text-ink">{work.title}</span>
    </motion.button>
  );
}

interface ArrowGeom {
  influence: Influence;
  d: string;
  mid: { x: number; y: number };
}

/** 곡선의 한가운데 지점 (이름표 위치) */
function pointOnPath(svg: SVGSVGElement, d: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
  const p = path.getPointAtLength(path.getTotalLength() / 2);
  svg.removeChild(path);
  return { x: p.x, y: p.y };
}

/** 레인 사이를 잇는 금색 곡선 화살표 (칸의 실제 위치를 재서 그림) */
function InfluenceArrows({ arrows, show, onSelect }: { arrows: Influence[]; show: boolean; onSelect: (i: Influence) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const [geoms, setGeoms] = useState<ArrowGeom[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduce = useReducedMotion() ?? false;

  const measure = useCallback(() => {
    const svg = ref.current;
    const root = svg?.parentElement;
    if (!svg || !root) return;
    const base = root.getBoundingClientRect();
    // 확대·축소(전체 지도 보기)된 상태여도 원래 좌표로 계산
    const k = root.offsetWidth ? base.width / root.offsetWidth : 1;
    setSize({ w: root.scrollWidth, h: root.scrollHeight });
    const center = (key: string) => {
      const el = root.querySelector(`[data-cell="${key}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: (r.left - base.left + r.width / 2) / k, y: (r.top - base.top + r.height / 2) / k, h: r.height / k };
    };
    const next =
      arrows.flatMap((influence) => {
        const a = center(cellKey(influence.from));
        const b = center(cellKey(influence.to));
        if (!a || !b) return [];
        let d: string;
        if (Math.abs(a.y - b.y) < 4) {
          // 같은 레인: 위로 둥글게
          const lift = Math.max(36, Math.abs(b.x - a.x) * 0.25);
          const y = a.y - a.h * 0.15;
          d = `M ${a.x + 18} ${y} C ${a.x + 40} ${y - lift}, ${b.x - 40} ${y - lift}, ${b.x - 18} ${y}`;
        } else if (Math.abs(a.x - b.x) < 4) {
          // 같은 시대 다른 레인: 옆으로 둥글게
          const dir = b.y > a.y ? 1 : -1;
          const bulge = 56;
          d = `M ${a.x + 24} ${a.y + dir * 14} C ${a.x + bulge} ${a.y + dir * 40}, ${b.x + bulge} ${b.y - dir * 40}, ${b.x + 24} ${b.y - dir * 18}`;
        } else {
          const dy = b.y - a.y;
          const sx = a.x + (b.x > a.x ? 20 : -20);
          const ex = b.x + (b.x > a.x ? -24 : 24);
          d = `M ${sx} ${a.y} C ${sx + (ex - sx) * 0.55} ${a.y + dy * 0.05}, ${sx + (ex - sx) * 0.45} ${b.y - dy * 0.05}, ${ex} ${b.y}`;
        }
        return [{ influence, d, mid: pointOnPath(svg, d) }];
      });
    // 이름표끼리 겹치면 아래로 밀기
    const placed: { x: number; y: number }[] = [];
    const maxX = root.scrollWidth - 74;
    for (const g of next) {
      g.mid = { ...g.mid, x: Math.min(Math.max(g.mid.x, LABEL_W + 74), maxX) };
      while (placed.some((p) => Math.abs(p.x - g.mid.x) < 140 && Math.abs(p.y - g.mid.y) < 26)) g.mid = { ...g.mid, y: g.mid.y + 26 };
      placed.push(g.mid);
    }
    setGeoms(next);
  }, [arrows]);

  useLayoutEffect(() => {
    measure();
    const root = ref.current?.parentElement;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <svg
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-30"
      width={size.w}
      height={size.h}
      aria-hidden={!show}
    >
      <defs>
        <marker id="arrow-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="rgb(var(--color-gold-dark))" />
        </marker>
        <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <AnimatePresence>
        {show &&
          geoms.map((g, i) => (
            <motion.g
              key={g.influence.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onSelect(g.influence)}
              role="button"
              aria-label={g.influence.label}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(g.influence)}
            >
              {/* 누르기 쉽게 넓은 투명 선 */}
              <path d={g.d} fill="none" stroke="transparent" strokeWidth={18} />
              <motion.path
                d={g.d}
                fill="none"
                stroke="rgb(var(--color-gold))"
                strokeWidth={2.6}
                strokeLinecap="round"
                markerEnd="url(#arrow-gold)"
                filter="url(#arrow-glow)"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : i * 0.12, ease: 'easeInOut' }}
              />
              <motion.foreignObject
                x={g.mid.x - 70}
                y={g.mid.y - 13}
                width={140}
                height={26}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduce ? 0 : 0.6 + i * 0.12 }}
              >
                <div className="flex h-full items-center justify-center">
                  <span className="truncate rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-royal-deep shadow">{g.influence.label}</span>
                </div>
              </motion.foreignObject>
            </motion.g>
          ))}
      </AnimatePresence>
    </svg>
  );
}
