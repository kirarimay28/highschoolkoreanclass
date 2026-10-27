import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { can } from '@/config/permissions';
import { getSubject } from '@/config/subjects';
import { useCurrentUser } from '@/context/AuthContext';
import { circled, emptyDiagram, guidedContentTemplate, guidedParagraphTemplate, readingStandards, splitSentences } from '@/data/readingPassages';
import {
  getModel,
  getNotes,
  getWork,
  listGallery,
  listPassages,
  listSubmissions,
  saveDraft,
  saveNotes,
  savePassage,
  submitDiagram,
  updateSubmission,
} from '@/services/structureService';
import type { Diagram, ReadingPassage, StructureActivity, StructureMode, StructureWork } from '@/types/structure';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { PassageView } from './PassageView';
import { StructureBoard, appendSentence, type DraggedSentence } from './StructureBoard';

const activities: { id: StructureActivity; label: string }[] = [
  { id: 'paragraph', label: '문단 구조도' },
  { id: 'content', label: '내용 구조도' },
];
const modes: { id: StructureMode; label: string }[] = [
  { id: 'guided', label: '도움 모드' },
  { id: 'free', label: '자유 모드' },
];

const templateFor = (p: ReadingPassage, a: StructureActivity, m: StructureMode): Diagram =>
  m === 'free' ? emptyDiagram() : a === 'paragraph' ? guidedParagraphTemplate(p) : guidedContentTemplate(p);

function sentenceLookup(p: ReadingPassage) {
  return (key: string) => {
    const [pi, si] = key.split('-').map(Number);
    return p.paragraphs[pi - 1] ? splitSentences(p.paragraphs[pi - 1])[si - 1] : undefined;
  };
}

/** 독서와 작문 › DIY 구조도 */
export function DiyStructurePage() {
  const user = useCurrentUser();
  const subject = getSubject('reading-writing')!;
  const isTeacher = can(user.role, 'manageStructure');
  const { data: passages, loading, reload } = useAsyncData(() => listPassages(user), [user.id], [] as ReadingPassage[]);
  const [passageId, setPassageId] = useState<string>('');
  const passage = passages.find((p) => p.id === passageId) ?? passages[0];
  type Tab = 'activity' | 'submissions' | 'gallery' | 'admin';
  const tabs: { id: Tab; label: string }[] = isTeacher
    ? [
        { id: 'activity', label: '지문·모범 보기' },
        { id: 'submissions', label: '학생 제출' },
        { id: 'gallery', label: '함께 보기' },
        { id: 'admin', label: '지문 관리' },
      ]
    : [
        { id: 'activity', label: '활동하기' },
        { id: 'gallery', label: '함께 보기' },
      ];
  const [tab, setTab] = useState<Tab>('activity');

  return (
    <MedalPageHeader
      backTo="/subject/reading-writing"
      backLabel="독서와 작문"
      icon="map"
      title="DIY 구조도"
      hanja="構造"
      description="함께 읽은 지문을 스스로 구조화해 봐요."
      accent={subject.accent}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {readingStandards.map((s) => (
          <span key={s.code} className="rounded-md bg-indigo/10 px-2 py-0.5 text-xs text-indigo">
            <b className="font-mono">{s.code}</b> {s.label}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TabBar items={tabs} value={tab} onChange={setTab} noteScope="reading-writing:diy" size="sm" className="max-w-2xl" />
        {passages.length > 1 && (
          <select className="royal-input w-auto py-2 text-sm" value={passage?.id} onChange={(e) => setPassageId(e.target.value)} aria-label="지문 고르기">
            {passages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.field})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && !passage ? null : !passage ? (
        <EmptyState icon="book" title="아직 지문이 없어요" />
      ) : tab === 'activity' ? (
        isTeacher ? (
          <ModelPreview key={passage.id} passage={passage} />
        ) : (
          <StudentActivity key={passage.id} passage={passage} />
        )
      ) : tab === 'submissions' ? (
        <Submissions key={passage.id} passage={passage} />
      ) : tab === 'gallery' ? (
        <Gallery key={passage.id} passage={passage} />
      ) : (
        <PassageAdmin passages={passages} current={passage} onSaved={(id) => (reload(), setPassageId(id))} />
      )}
    </MedalPageHeader>
  );
}

// ───────────────────────── 좌우 분할 (비율 조절) ─────────────────────────
function SplitPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const [ratio, setRatio] = useState(() => {
    try {
      return Number(localStorage.getItem('hkc:diySplit')) || 42;
    } catch {
      return 42;
    }
  });
  const box = useRef<HTMLDivElement>(null);
  const onDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const r = box.current!.getBoundingClientRect();
      setRatio(Math.min(70, Math.max(25, ((ev.clientX - r.left) / r.width) * 100)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setRatio((v) => {
        try {
          localStorage.setItem('hkc:diySplit', String(Math.round(v)));
        } catch {
          /* noop */
        }
        return v;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div ref={box} className="flex h-[680px] min-h-0 gap-0">
      <div className="royal-card min-w-0 overflow-y-auto p-5" style={{ width: `${ratio}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="지문과 작업판 너비 조절"
        aria-valuenow={Math.round(ratio)}
        tabIndex={0}
        onPointerDown={onDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setRatio((v) => Math.max(25, v - 3));
          if (e.key === 'ArrowRight') setRatio((v) => Math.min(70, v + 3));
        }}
        className="group flex w-4 shrink-0 cursor-col-resize items-center justify-center"
      >
        <span className="h-16 w-1 rounded-full bg-gold/40 transition-colors group-hover:bg-gold" />
      </div>
      <div className="min-w-0 flex-1">{right}</div>
    </div>
  );
}

// ───────────────────────── 학생 활동 ─────────────────────────
function StudentActivity({ passage }: { passage: ReadingPassage }) {
  const user = useCurrentUser();
  const wide = useMediaQuery('(min-width: 1024px)');
  const [activity, setActivity] = useState<StructureActivity>('paragraph');
  const [mobileTab, setMobileTab] = useState<'passage' | StructureActivity>('passage');
  const current: StructureActivity = wide ? activity : mobileTab === 'passage' ? activity : mobileTab;

  // 형광펜·생각 질문 답
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<string[]>([]);
  const notesLoaded = useRef(false);
  useEffect(() => {
    getNotes(user, passage.id).then((n) => {
      setHighlights(new Set(n.highlights));
      setAnswers(n.answers);
      notesLoaded.current = true;
    });
  }, [user, passage.id]);
  useEffect(() => {
    if (!notesLoaded.current) return;
    const t = window.setTimeout(() => saveNotes(user, { passageId: passage.id, studentId: user.id, highlights: [...highlights], answers }).catch(() => undefined), 700);
    return () => window.clearTimeout(t);
  }, [highlights, answers, user, passage.id]);

  // 활동별 구조도 (둘 다 들고 있어서 탭을 오가도 유지)
  const [state, setState] = useState<Record<StructureActivity, { mode: StructureMode; diagram: Diagram; work?: StructureWork; loaded: boolean }>>({
    paragraph: { mode: 'guided', diagram: emptyDiagram(), loaded: false },
    content: { mode: 'guided', diagram: emptyDiagram(), loaded: false },
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = useRef<Record<StructureActivity, boolean>>({ paragraph: false, content: false });

  const loadWork = useCallback(
    async (a: StructureActivity) => {
      const work = await getWork(user, passage.id, a);
      setState((s) => ({
        ...s,
        [a]: work ? { mode: work.mode, diagram: work.draft?.nodes ? work.draft : templateFor(passage, a, work.mode), work, loaded: true } : { mode: 'guided', diagram: templateFor(passage, a, 'guided'), loaded: true },
      }));
    },
    [user, passage],
  );
  useEffect(() => {
    loadWork('paragraph');
    loadWork('content');
  }, [loadWork]);

  const cur = state[current];
  const setDiagram = (d: Diagram) => {
    dirty.current[current] = true;
    setState((s) => ({ ...s, [current]: { ...s[current], diagram: d } }));
  };

  // 자동 저장
  useEffect(() => {
    if (!cur.loaded || !dirty.current[current]) return;
    setSaveState('saving');
    const t = window.setTimeout(() => {
      saveDraft(user, passage.id, current, cur.mode, cur.diagram)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
      dirty.current[current] = false;
    }, 800);
    return () => window.clearTimeout(t);
  }, [cur.diagram, cur.mode, cur.loaded, current, user, passage.id]);

  const changeMode = (m: StructureMode) => {
    if (m === cur.mode) return;
    const hasWork = cur.diagram.nodes.some((n) => n.text || n.role) || cur.diagram.edges.some((e) => e.label);
    if (hasWork && !window.confirm(`${modes.find((x) => x.id === m)!.label}로 바꾸면 지금 작업판이 새로 시작돼요. 바꿀까요?`)) return;
    dirty.current[current] = true;
    setState((s) => ({ ...s, [current]: { ...s[current], mode: m, diagram: templateFor(passage, current, m) } }));
  };

  const addSentence = (sen: DraggedSentence) => {
    setDiagram(appendSentence(current, cur.diagram, sen));
    if (!wide) setMobileTab(current);
  };

  // 제출·비교
  const [comparing, setComparing] = useState(false);
  const [model, setModel] = useState<{ model: Diagram | null; structureType?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submitted = !!cur.work?.firstSubmission;

  const submit = async () => {
    setBusy(true);
    try {
      await submitDiagram(user, passage.id, current, cur.diagram);
      await loadWork(current);
      const m = await getModel(user, passage, current);
      setModel(m);
      setComparing(true);
    } finally {
      setBusy(false);
    }
  };
  const openCompare = async () => {
    setModel(await getModel(user, passage, current));
    setComparing(true);
  };

  const sentenceText = useMemo(() => sentenceLookup(passage), [passage]);
  const passagePane = (
    <PassageView
      passage={passage}
      highlights={highlights}
      onHighlight={(keys, on) =>
        setHighlights((prev) => {
          const next = new Set(prev);
          keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
          return next;
        })
      }
      onAddToBoard={addSentence}
    />
  );

  const board = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {wide && <TabBar items={activities} value={activity} onChange={(a) => (setActivity(a), setComparing(false))} size="sm" className="w-auto" />}
        <TabBar items={modes} value={cur.mode} onChange={changeMode} size="sm" className="w-auto" />
        <span className="text-xs text-ink-faint" aria-live="polite">
          {saveState === 'saving' ? '저장 중…' : saveState === 'saved' ? '저장됨' : saveState === 'error' ? '저장하지 못했어요' : ''}
        </span>
        <span className="ml-auto flex gap-2">
          {submitted && !comparing && (
            <RoyalButton size="sm" variant="secondary" icon="book" onClick={openCompare}>
              모범과 비교
            </RoyalButton>
          )}
          {!comparing && (
            <RoyalButton size="sm" icon="check" onClick={submit} disabled={busy || !cur.diagram.nodes.length}>
              {submitted ? '다시 제출' : '다 만들었어요'}
            </RoyalButton>
          )}
        </span>
      </div>
      <StructureBoard
        key={`${current}-${cur.mode}-${cur.loaded}`}
        activity={current}
        diagram={cur.diagram}
        onChange={setDiagram}
        sentenceText={sentenceText}
        paragraphCount={passage.paragraphs.length}
        exportName={`${passage.title}_${activities.find((a) => a.id === current)!.label}_${user.name}`}
        className="min-h-0 flex-1"
      />
    </div>
  );

  const questions = (
    <details className="royal-card group mt-4 p-4" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 font-serif text-lg font-bold">
        <Icon name="help" size={18} className="text-gold-dark" />
        생각 질문
        <Icon name="back" size={16} className="ml-auto -rotate-90 text-ink-faint transition-transform group-open:rotate-90" />
      </summary>
      <ol className="mt-3 space-y-3">
        {passage.questions.map((q, i) => (
          <li key={i}>
            <p className="text-[15px] font-medium">
              {i + 1}. {q}
            </p>
            <textarea
              className="royal-input mt-1.5 resize-y text-sm"
              rows={2}
              placeholder="내 생각을 적어 보세요 (자동 저장)"
              value={answers[i] ?? ''}
              onChange={(e) => setAnswers((prev) => Object.assign([...prev], { [i]: e.target.value }))}
              aria-label={`생각 질문 ${i + 1} 답`}
            />
          </li>
        ))}
      </ol>
    </details>
  );

  if (comparing) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <RoyalButton size="sm" variant="ghost" icon="back" onClick={() => setComparing(false)}>
            작업판으로
          </RoyalButton>
          <h2 className="font-serif text-lg font-bold">{activities.find((a) => a.id === current)!.label} — 모범 구조도와 비교</h2>
          <span className="text-xs text-ink-faint">점수는 없어요. 다른 점을 찾아 내 구조도를 고쳐 보세요.</span>
        </div>
        {cur.work?.teacherComment && (
          <p className="mb-3 rounded-2xl bg-indigo/10 px-4 py-2.5 text-sm text-indigo">
            <b>{cur.work.commentBy ?? '선생님'}</b>의 코멘트: {cur.work.teacherComment}
          </p>
        )}
        <div className={cn('grid gap-3', wide ? 'h-[640px] grid-cols-2' : 'grid-cols-1')}>
          <div className={cn('flex min-h-0 flex-col gap-2', !wide && 'h-[520px]')}>
            <div className="flex items-center gap-2">
              <p className="font-bold">내 구조도</p>
              <span className="text-xs text-ink-faint">
                처음 제출 {cur.work?.firstAt ? formatDateTime(cur.work.firstAt) : '—'}
                {cur.work?.revisedAt && ` · 수정본 ${formatDateTime(cur.work.revisedAt)}`}
              </span>
              <RoyalButton size="sm" className="ml-auto" icon="check" onClick={submit} disabled={busy}>
                수정본 저장
              </RoyalButton>
            </div>
            <StructureBoard key={`cmp-${current}`} activity={current} diagram={cur.diagram} onChange={setDiagram} sentenceText={sentenceText} paragraphCount={passage.paragraphs.length} exportName={`${passage.title}_내구조도_${user.name}`} className="min-h-0 flex-1" />
          </div>
          <div className={cn('flex min-h-0 flex-col gap-2', !wide && 'h-[520px]')}>
            <p className="font-bold">
              모범 구조도
              {model?.structureType && current === 'paragraph' && <span className="ml-2 text-sm font-normal text-gold-dark">전체 구조: {model.structureType}</span>}
            </p>
            {model?.model ? (
              <StructureBoard key={`model-${current}`} activity={current} diagram={model.model} readOnly sentenceText={sentenceText} exportName={`${passage.title}_모범구조도`} className="min-h-0 flex-1" />
            ) : (
              <div className="royal-card flex flex-1 items-center justify-center text-sm text-ink-faint">모범 구조도를 불러오지 못했어요.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (wide) {
    return (
      <div>
        <SplitPane left={passagePane} right={board} />
        {questions}
      </div>
    );
  }
  return (
    <div>
      <TabBar
        items={[{ id: 'passage' as const, label: '지문' }, ...activities]}
        value={mobileTab}
        onChange={(t) => (setMobileTab(t), t !== 'passage' && setActivity(t), setComparing(false))}
        size="sm"
        className="mb-3"
      />
      {mobileTab === 'passage' ? (
        <div className="royal-card p-4">
          {passagePane}
          <p className="mt-3 text-xs text-ink-faint">형광펜 문장을 눌러 [작업판에 추가]하면 지금 고른 구조도({activities.find((a) => a.id === activity)!.label})에 들어가요.</p>
        </div>
      ) : (
        <div className="h-[560px]">{board}</div>
      )}
      {questions}
    </div>
  );
}

// ───────────────────────── 선생님: 지문·모범 보기 ─────────────────────────
function ModelPreview({ passage }: { passage: ReadingPassage }) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const [activity, setActivity] = useState<StructureActivity>('paragraph');
  const sentenceText = useMemo(() => sentenceLookup(passage), [passage]);
  const model = activity === 'paragraph' ? passage.modelParagraph : passage.modelContent;
  const right = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <TabBar items={activities} value={activity} onChange={setActivity} size="sm" className="w-auto" />
        {activity === 'paragraph' && passage.structureType && <span className="text-sm text-gold-dark">전체 구조: {passage.structureType}</span>}
      </div>
      <StructureBoard key={activity} activity={activity} diagram={model} readOnly sentenceText={sentenceText} exportName={`${passage.title}_모범_${activity}`} className="min-h-0 flex-1" />
      <p className="text-xs text-ink-faint">모범 구조도는 학생이 "다 만들었어요"를 누른 뒤에만 학생에게 보여요. 바꾸려면 [지문 관리]에서 편집하세요.</p>
    </div>
  );
  const left = <PassageView passage={passage} highlights={new Set()} onHighlight={() => undefined} readOnly />;
  return wide ? (
    <SplitPane left={left} right={right} />
  ) : (
    <div className="space-y-3">
      <div className="royal-card p-4">{left}</div>
      <div className="h-[520px]">{right}</div>
    </div>
  );
}

// ───────────────────────── 선생님: 학생 제출 ─────────────────────────
function Submissions({ passage }: { passage: ReadingPassage }) {
  const user = useCurrentUser();
  const { data: works, reload } = useAsyncData(() => listSubmissions(passage.id), [passage.id], [] as StructureWork[]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [version, setVersion] = useState<'first' | 'revised'>('revised');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState('');
  const open = works.find((w) => w.id === openId);
  const sentenceText = useMemo(() => sentenceLookup(passage), [passage]);

  useEffect(() => {
    setComment(open?.teacherComment ?? '');
    setVersion(open?.revised ? 'revised' : 'first');
    setSaved('');
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (p: Parameters<typeof updateSubmission>[1], msg: string) => {
    if (!open) return;
    await updateSubmission(open.id, p);
    setSaved(msg);
    reload();
  };

  if (!works.length) return <div className="royal-card"><EmptyState icon="users" title="아직 제출한 학생이 없어요" /></div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <ul className="royal-card h-fit divide-y divide-gold/15 overflow-hidden p-0">
        {works.map((w) => (
          <li key={w.id}>
            <button type="button" onClick={() => setOpenId(w.id)} className={cn('flex w-full flex-col items-start px-4 py-3 text-left hover:bg-gold/10', openId === w.id && 'bg-gold/15')}>
              <span className="flex w-full items-center gap-2">
                <span className="font-semibold">{w.studentName}</span>
                <span className="text-xs text-ink-faint">{activities.find((a) => a.id === w.activity)?.label}</span>
                {w.shared && <Icon name="sparkles" size={13} className="ml-auto text-gold-dark" aria-label="함께 보기에 공유됨" />}
              </span>
              <span className="text-[11px] text-ink-faint">
                {formatDateTime(w.firstAt!)}
                {w.revisedAt && ' · 수정본 있음'}
                {w.teacherComment && ' · 코멘트 남김'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-bold">
              {open.studentName} · {activities.find((a) => a.id === open.activity)?.label}
            </h3>
            {open.revised && (
              <TabBar
                items={[
                  { id: 'first' as const, label: '처음 버전' },
                  { id: 'revised' as const, label: '수정 버전' },
                ]}
                value={version}
                onChange={setVersion}
                size="sm"
                className="w-auto"
              />
            )}
          </div>
          <div className="h-[520px]">
            <StructureBoard
              key={`${open.id}-${version}`}
              activity={open.activity}
              diagram={version === 'revised' && open.revised ? open.revised : open.firstSubmission!}
              readOnly
              sentenceText={sentenceText}
              exportName={`${passage.title}_${open.studentName}`}
              className="h-full"
            />
          </div>
          <div className="royal-card space-y-3 p-4">
            <label className="royal-label" htmlFor="structComment">코멘트</label>
            <textarea id="structComment" rows={2} className="royal-input resize-y" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="학생에게 남길 말 (학생의 비교 화면에 보여요)" />
            <div className="flex flex-wrap items-center gap-2">
              <RoyalButton size="sm" icon="send" onClick={() => patch({ teacherComment: comment.trim(), commentBy: user.name }, '코멘트를 저장했어요.')}>
                코멘트 저장
              </RoyalButton>
              <RoyalButton size="sm" variant="secondary" icon="sparkles" active={open.shared} onClick={() => patch({ shared: !open.shared }, open.shared ? '함께 보기에서 내렸어요.' : '함께 보기에 공유했어요.')}>
                {open.shared ? '함께 보기 공유 중' : '함께 보기에 공유'}
              </RoyalButton>
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input type="checkbox" checked={open.shareName} onChange={(e) => patch({ shareName: e.target.checked }, e.target.checked ? '이름을 함께 보여요.' : '이름 없이 보여요.')} />
                공유할 때 이름 표시
              </label>
              {saved && <span className="text-sm text-success" role="status">{saved}</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="royal-card flex items-center justify-center p-10 text-sm text-ink-faint">왼쪽에서 학생을 고르세요.</div>
      )}
    </div>
  );
}

// ───────────────────────── 함께 보기 ─────────────────────────
function Gallery({ passage }: { passage: ReadingPassage }) {
  const { data: items, loading } = useAsyncData(() => listGallery(passage.id), [passage.id], []);
  const sentenceText = useMemo(() => sentenceLookup(passage), [passage]);
  if (!loading && !items.length) return <div className="royal-card"><EmptyState icon="sparkles" title="아직 공유된 구조도가 없어요">선생님이 잘 만든 구조도를 골라 여기에 올려 주실 거예요.</EmptyState></div>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((g) => (
        <figure key={g.id} className="royal-card space-y-2 p-3">
          <figcaption className="flex items-center gap-2 px-1">
            <span className="font-semibold">{g.studentName ?? '익명'}</span>
            <span className="text-xs text-ink-faint">{activities.find((a) => a.id === g.activity)?.label}</span>
          </figcaption>
          <div className="h-80">
            <StructureBoard activity={g.activity} diagram={g.diagram} readOnly toolbar sentenceText={sentenceText} exportName={`${passage.title}_함께보기`} className="h-full" />
          </div>
          {g.teacherComment && <p className="px-1 text-sm text-indigo">💬 {g.teacherComment}</p>}
        </figure>
      ))}
    </div>
  );
}

// ───────────────────────── 선생님: 지문 관리 ─────────────────────────
function PassageAdmin({ passages, current, onSaved }: { passages: ReadingPassage[]; current: ReadingPassage; onSaved: (id: string) => void }) {
  const user = useCurrentUser();
  const [editingId, setEditingId] = useState<string>(current.id);
  const base = passages.find((p) => p.id === editingId);
  const blank: ReadingPassage = { id: '', title: '', field: '', paragraphs: [], questions: [], modelParagraph: emptyDiagram(), modelContent: emptyDiagram() };
  const [draft, setDraft] = useState<ReadingPassage>(base ?? blank);
  const [text, setText] = useState((base ?? blank).paragraphs.join('\n\n'));
  const [questions, setQuestions] = useState((base ?? blank).questions.join('\n'));
  const [activity, setActivity] = useState<StructureActivity>('paragraph');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const p = passages.find((x) => x.id === editingId) ?? blank;
    setDraft(p);
    setText(p.paragraphs.join('\n\n'));
    setQuestions(p.questions.join('\n'));
    setMsg('');
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const paragraphs = text.split(/\n\s*\n/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const preview: ReadingPassage = { ...draft, paragraphs };
  const sentenceText = sentenceLookup(preview);

  const save = async () => {
    if (!draft.title.trim() || !paragraphs.length) return setMsg('제목과 지문을 입력해 주세요.');
    const id = draft.id || `p${Date.now().toString(36)}`;
    await savePassage(user, { ...draft, id, title: draft.title.trim(), field: draft.field.trim(), paragraphs, questions: questions.split('\n').map((q) => q.trim()).filter(Boolean) });
    setMsg('저장했어요. 학생 화면에 바로 반영돼요.');
    onSaved(id);
    setEditingId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="royal-input w-auto py-2 text-sm" value={editingId} onChange={(e) => setEditingId(e.target.value)} aria-label="편집할 지문">
          {passages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
          <option value="">+ 새 지문</option>
        </select>
        <RoyalButton icon="check" onClick={save}>
          {draft.id ? '지문·모범 구조도 저장' : '새 지문 추가'}
        </RoyalButton>
        {msg && <span className="text-sm text-success" role="status">{msg}</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="royal-card space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="royal-label" htmlFor="psTitle">제목</label>
              <input id="psTitle" className="royal-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <label className="royal-label" htmlFor="psField">분야</label>
              <input id="psField" className="royal-input" placeholder="예: 과학·기술" value={draft.field} onChange={(e) => setDraft({ ...draft, field: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="royal-label" htmlFor="psText">지문 (문단 사이는 빈 줄 한 줄)</label>
            <textarea id="psText" rows={12} className="royal-input resize-y text-sm leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} />
            <p className="mt-1 text-xs text-ink-faint">문단 {paragraphs.length}개 · {paragraphs.map((_, i) => circled(i + 1)).join(' ')}</p>
          </div>
          <div>
            <label className="royal-label" htmlFor="psType">전체 구조 유형 (모범 답안에 표시)</label>
            <input id="psType" className="royal-input" value={draft.structureType ?? ''} onChange={(e) => setDraft({ ...draft, structureType: e.target.value })} />
          </div>
          <div>
            <label className="royal-label" htmlFor="psQ">생각 질문 (한 줄에 하나)</label>
            <textarea id="psQ" rows={3} className="royal-input resize-y text-sm" value={questions} onChange={(e) => setQuestions(e.target.value)} />
          </div>
        </div>

        <div className="flex h-[640px] flex-col gap-2">
          <div className="flex items-center gap-2">
            <TabBar items={activities.map((a) => ({ ...a, label: `모범 ${a.label}` }))} value={activity} onChange={setActivity} size="sm" className="w-auto" />
          </div>
          <StructureBoard
            key={`${editingId}-${activity}`}
            activity={activity}
            diagram={activity === 'paragraph' ? draft.modelParagraph : draft.modelContent}
            onChange={(d) => setDraft((p) => (activity === 'paragraph' ? { ...p, modelParagraph: d } : { ...p, modelContent: d }))}
            sentenceText={sentenceText}
            paragraphCount={paragraphs.length || 5}
            exportName={`${draft.title}_모범`}
            className="min-h-0 flex-1"
          />
          <p className="text-xs text-ink-faint">여기서 만든 모범 구조도의 카드 위치·연결선이 학생 &quot;도움 모드&quot;의 틀이 돼요.</p>
        </div>
      </div>
    </div>
  );
}
