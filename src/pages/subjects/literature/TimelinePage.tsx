import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Modal } from '@/components/common/Modal';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { getSubject } from '@/config/subjects';
import { findWork, getEra, influences, standardTexts, timelineMaps, type MapId } from '@/data/literatureTimeline';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { MobileTimeline } from './MobileTimeline';
import { TimelineMap, type TimelineSelection } from './TimelineMap';

type TabId = MapId | 'modern';

/** 문학 › 한국 문학 연대기 지도 (데이터: src/data/literatureTimeline.ts) */
export function TimelinePage() {
  const subject = getSubject('literature')!;
  // ?work=작품id 로 들어오면 (예: 고전 어휘의 출전 작품) 그 작품 설명을 바로 엶
  const [params] = useSearchParams();
  const linked = findWork(params.get('work') ?? undefined);
  const [tab, setTab] = useState<TabId>(linked?.lane.map ?? 'poetry');
  const [showInfluences, setShowInfluences] = useState(false);
  const [selected, setSelected] = useState<TimelineSelection | null>(linked ? { kind: 'work', ...linked } : null);
  const wide = useMediaQuery('(min-width: 768px)');
  const current = timelineMaps.find((m) => m.id === tab)!;
  const hasArrows = influences.some((i) => i.map === tab);

  return (
    <MedalPageHeader
      backTo="/subject/literature"
      backLabel="문학"
      icon="map"
      title="한국 문학 연대기 지도"
      hanja="文學史"
      description="시대(가로) × 갈래(세로)로 보는 고전 문학의 흐름"
      accent={subject.accent}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TabBar items={timelineMaps.map((m) => ({ id: m.id, label: m.label }))} value={tab} onChange={setTab} size="sm" touch={!wide} className="max-w-xl" />
        {current.ready && hasArrows && wide && (
          <RoyalButton variant="secondary" size="sm" icon="sparkles" active={showInfluences} onClick={() => setShowInfluences((v) => !v)}>
            영향 관계 보기
          </RoyalButton>
        )}
      </div>

      {!current.ready ? (
        <div className="royal-card">
          <EmptyState icon="map" title="개화기 이후 현대 문학 지도는 준비 중이에요" />
        </div>
      ) : wide ? (
        <>
          <p className="mb-2 text-xs text-ink-faint">시대명·갈래명·작품 메달을 누르면 설명 카드가 열려요. 화면이 좁으면 옆으로 밀어 보세요.</p>
          <TimelineMap map={tab as MapId} showInfluences={showInfluences} onSelect={setSelected} />
        </>
      ) : (
        <MobileTimeline key={tab} map={tab as MapId} onSelect={setSelected} />
      )}

      <DetailCard selection={selected} onClose={() => setSelected(null)} onSelect={setSelected} mobile={!wide} />
    </MedalPageHeader>
  );
}

/** PC: 가운데 창 / 모바일: 바텀시트 */
function DetailShell({ mobile, title, wide, onClose, children }: { mobile: boolean; title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  return mobile ? (
    <BottomSheet open title={title} onClose={onClose}>
      {children}
    </BottomSheet>
  ) : (
    <Modal open wide={wide} title={title} onClose={onClose}>
      {children}
    </Modal>
  );
}

export function DetailCard({
  selection,
  onClose,
  onSelect,
  mobile = false,
}: {
  selection: TimelineSelection | null;
  onClose: () => void;
  onSelect: (s: TimelineSelection) => void;
  /** 모바일: 바텀시트 + 표는 항목별 카드로 */
  mobile?: boolean;
}) {
  if (!selection) return null;

  if (selection.kind === 'era') {
    const era = getEra(selection.era);
    return (
      <DetailShell mobile={mobile} onClose={onClose} title={`${era.name}${era.sub ? ` (${era.sub})` : ''} · 사회·문화적 배경`}>
        <p className="font-serif text-lg font-bold text-royal-deep">{era.background.summary}</p>
        <ul className="mt-3 space-y-1.5 text-[15px]">
          {era.background.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </DetailShell>
    );
  }

  if (selection.kind === 'influence') {
    const inf = selection.influence;
    return (
      <DetailShell mobile={mobile} onClose={onClose} title="영향 관계">
        <p className="inline-flex rounded-full bg-gold px-3 py-1 text-sm font-bold text-royal-deep">{inf.label}</p>
        <p className="mt-3 leading-relaxed">{inf.description}</p>
      </DetailShell>
    );
  }

  if (selection.kind === 'work') {
    const { work, lane } = selection;
    return (
      <DetailShell mobile={mobile} onClose={onClose} title={work.title}>
        <dl className="grid grid-cols-[5rem_1fr] gap-y-2 text-[15px]">
          <dt className="text-ink-faint">갈래</dt>
          <dd>
            <button type="button" className="font-semibold text-indigo hover:underline" onClick={() => onSelect({ kind: 'lane', lane })}>
              {lane.name} ›
            </button>
          </dd>
          <dt className="text-ink-faint">시대</dt>
          <dd>{getEra(work.era).name}</dd>
          {work.author && (
            <>
              <dt className="text-ink-faint">작가</dt>
              <dd>{work.author}</dd>
            </>
          )}
          {work.note && (
            <>
              <dt className="text-ink-faint">특징</dt>
              <dd>{work.note}</dd>
            </>
          )}
        </dl>
      </DetailShell>
    );
  }

  const { lane } = selection;
  const d = lane.detail;
  return (
    <DetailShell mobile={mobile} onClose={onClose} wide title={lane.name}>
      <div className="space-y-5 text-[15px]">
        <section>
          <h3 className="mb-1 text-sm font-bold text-gold-dark">갈래 정의</h3>
          <p className="leading-relaxed">{d.definition}</p>
        </section>

        <section>
          <h3 className="mb-1.5 text-sm font-bold text-gold-dark">시대별 변화</h3>
          <ol className="space-y-1.5">
            {d.changes.map((c) => (
              <li key={c.era + c.text} className="flex gap-3">
                <span className="w-20 shrink-0 font-serif font-bold text-royal-deep">{getEra(c.era).name}</span>
                <span>{c.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {d.comparison && mobile && (
          <section>
            <h3 className="mb-1.5 text-sm font-bold text-gold-dark">신화 · 전설 · 민담 비교</h3>
            <div className="space-y-2">
              {d.comparison.headers.map((h, ci) => (
                <div key={h} className="rounded-2xl border border-gold/30 bg-white/60 p-3">
                  <p className="mb-1.5 font-serif text-lg font-bold text-royal-deep">{h}</p>
                  <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-1 text-sm">
                    {d.comparison!.rows.map((r) => (
                      <div key={r.label} className="contents">
                        <dt className="text-ink-faint">{r.label}</dt>
                        <dd>{r.cells[ci]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        )}

        {d.comparison && !mobile && (
          <section>
            <h3 className="mb-1.5 text-sm font-bold text-gold-dark">신화 · 전설 · 민담 비교</h3>
            <div className="overflow-x-auto rounded-xl border border-gold/30">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-gold/10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">구분</th>
                    {d.comparison.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-serif font-bold text-royal-deep">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.comparison.rows.map((r) => (
                    <tr key={r.label} className="border-t border-gold/20">
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-ink-soft">{r.label}</th>
                      {r.cells.map((c, i) => (
                        <td key={i} className="px-3 py-2">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {d.typeChips && (
          <section>
            <h3 className="mb-1.5 text-sm font-bold text-gold-dark">조선 후기 소설의 유형</h3>
            <div className="flex flex-wrap gap-2">
              {d.typeChips.map((t) => (
                <span key={t.label} className="rounded-2xl border border-royal/20 bg-royal/[0.05] px-3 py-1.5" title={t.examples}>
                  <span className="block text-sm font-bold text-royal">{t.label}</span>
                  <span className="text-xs text-ink-soft">{t.examples}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-1.5 text-sm font-bold text-gold-dark">대표 작품</h3>
          <ul className="flex flex-wrap gap-2">
            {lane.works.map((w) => (
              <li key={w.title}>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: 'work', work: w, lane })}
                  className="rounded-full border border-gold/40 bg-white/70 px-3 py-1 text-sm hover:border-gold"
                >
                  {w.title}
                  {w.author && <span className="ml-1 text-ink-faint">· {w.author}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1.5 text-sm font-bold text-gold-dark">관련 성취기준</h3>
          <ul className="space-y-1">
            {d.standards.map((code) => (
              <li key={code} className="flex gap-2">
                <span className="shrink-0 rounded-md bg-indigo/10 px-2 py-0.5 font-mono text-xs font-semibold text-indigo">[{code}]</span>
                {standardTexts[code] && <span className="text-sm">{standardTexts[code]}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DetailShell>
  );
}
