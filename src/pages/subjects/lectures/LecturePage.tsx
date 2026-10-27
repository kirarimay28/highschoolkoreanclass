import { useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { lectureNotice, lectureUnits } from '@/config/lectures';
import { can } from '@/config/permissions';
import { getSubject } from '@/config/subjects';
import { useCurrentUser } from '@/context/AuthContext';
import { deleteLecture, listLectures, listMyProgress, moveLecture } from '@/services/lectureService';
import type { SubjectId } from '@/types';
import type { Lecture, LectureProgress } from '@/types/lecture';
import { cn } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';
import { LectureForm } from './LectureForm';
import { LecturePlayer } from './LecturePlayer';
import { fmtTime, youTubeId } from './players';

/** 과목 › 개념 복습 강의 (config/lectures.ts 에 단원이 있는 과목에서만 열림) */
export function LecturePage() {
  const { subjectId } = useParams();
  const subject = getSubject(subjectId);
  const units = subject ? lectureUnits[subject.id] : undefined;
  if (!subject || !units || !subject.sections.some((s) => s.path === 'lectures')) return <Navigate to={subject ? `/subject/${subject.id}` : '/lobby'} replace />;
  return <LectureHome subjectId={subject.id} units={units} />;
}

function LectureHome({ subjectId, units }: { subjectId: SubjectId; units: string[] }) {
  const user = useCurrentUser();
  const subject = getSubject(subjectId)!;
  const isTeacher = can(user.role, 'manageLectures');
  const [params, setParams] = useSearchParams();
  const openId = params.get('v');

  const { data: lectures, loading, reload } = useAsyncData(() => listLectures(subjectId), [subjectId], [] as Lecture[]);
  const { data: progress, reload: reloadProgress } = useAsyncData(
    () => listMyProgress(user, subjectId).catch(() => [] as LectureProgress[]),
    [user.id, subjectId],
    [] as LectureProgress[],
  );
  const progressOf = useMemo(() => new Map(progress.map((p) => [p.lectureId, p])), [progress]);

  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Lecture | 'new' | null>(null);
  const [busy, setBusy] = useState(false);

  const allUnits = useMemo(() => [...units, ...[...new Set(lectures.map((l) => l.unit))].filter((u) => !units.includes(u))], [units, lectures]);
  const groups = allUnits
    .filter((u) => unitFilter === 'all' || u === unitFilter)
    .map((u) => ({ unit: u, items: lectures.filter((l) => l.unit === u) }))
    .filter((g) => g.items.length > 0 || (isTeacher && unitFilter !== 'all'));

  const open = (id: string | null) => setParams(id ? { v: id } : {}, { replace: false });
  const current = lectures.find((l) => l.id === openId);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : '처리하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MedalPageHeader
      backTo={`/subject/${subjectId}`}
      backLabel={subject.name}
      icon="play"
      title="개념 복습 강의"
      hanja="復習"
      description="헷갈리는 개념을 영상으로 다시 봐요."
      accent={subject.accent}
    >
      {!isTeacher && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ink-soft">
          <Icon name="sparkles" size={16} className="mt-0.5 shrink-0 text-gold-dark" />
          {lectureNotice}
        </p>
      )}

      {openId && current ? (
        <LecturePlayer
          key={current.id}
          lecture={current}
          initial={progressOf.get(current.id)}
          isTeacher={isTeacher}
          onBack={() => (open(null), reloadProgress())}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <TabBar
              items={[{ id: 'all', label: '전체' }, ...allUnits.map((u) => ({ id: u, label: u }))]}
              value={unitFilter}
              onChange={setUnitFilter}
              size="sm"
              touch
              className="min-w-0 max-w-full flex-1"
            />
            {isTeacher && (
              <RoyalButton icon="plus" onClick={() => setEditing('new')}>
                영상 추가
              </RoyalButton>
            )}
          </div>

          {isTeacher && (
            <p className="mb-4 text-xs text-ink-faint">
              학생 개인의 시청 기록과 메모는 학생 본인에게만 보여요. 여기에는 영상별 전체 조회 수만 나와요.
            </p>
          )}

          {loading && lectures.length === 0 ? null : groups.length === 0 ? (
            <EmptyState icon="play" title="아직 올라온 영상이 없어요">
              {isTeacher ? '[영상 추가]로 파일을 올리거나 YouTube 링크를 넣어 주세요.' : '선생님이 영상을 올리면 여기에 보여요.'}
            </EmptyState>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.unit}>
                  <h2 className="mb-2 flex items-baseline gap-2 font-serif text-xl font-bold text-[rgb(var(--page-accent))]">
                    {g.unit}
                    <span className="font-sans text-xs font-normal text-ink-faint">{g.items.length}개</span>
                  </h2>
                  {g.items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gold/40 px-4 py-5 text-center text-sm text-ink-faint">이 단원에는 아직 영상이 없어요.</p>
                  ) : (
                    <ul className="space-y-2">
                      {g.items.map((l, i) => (
                        <LectureRow
                          key={l.id}
                          lecture={l}
                          progress={progressOf.get(l.id)}
                          isTeacher={isTeacher}
                          busy={busy}
                          first={i === 0}
                          last={i === g.items.length - 1}
                          onOpen={() => open(l.id)}
                          onEdit={() => setEditing(l)}
                          onMove={(d) => run(() => moveLecture(l, d))}
                          onDelete={() => {
                            if (confirm(`"${l.title}" 영상을 지울까요? 학생들이 남긴 메모도 함께 지워져요.`)) run(() => deleteLecture(l));
                          }}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <LectureForm
          subjectId={subjectId}
          units={allUnits}
          editing={editing === 'new' ? undefined : editing}
          defaultUnit={unitFilter !== 'all' ? unitFilter : undefined}
          onClose={() => setEditing(null)}
          onSaved={() => (setEditing(null), reload())}
        />
      )}
    </MedalPageHeader>
  );
}

function LectureRow({
  lecture: l,
  progress,
  isTeacher,
  busy,
  first,
  last,
  onOpen,
  onEdit,
  onMove,
  onDelete,
}: {
  lecture: Lecture;
  progress?: LectureProgress;
  isTeacher: boolean;
  busy: boolean;
  first: boolean;
  last: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const ytId = l.linkUrl ? youTubeId(l.linkUrl) : null;
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumb = thumbFailed ? undefined : l.thumbnailUrl ?? (ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : undefined);
  const resumeAt = progress && !progress.completed && progress.positionSeconds > 5 ? progress.positionSeconds : 0;

  return (
    <li className="royal-card flex items-center gap-3 p-3">
      <button type="button" onClick={onOpen} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink/10 ring-1 ring-inset ring-gold/20 sm:h-16 sm:w-28">
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setThumbFailed(true)} /> : <Icon name="play" size={22} className="text-ink-faint" />}
          {l.durationSeconds ? (
            <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 font-mono text-[10px] text-hanji">{fmtTime(l.durationSeconds)}</span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold group-hover:text-[rgb(var(--page-accent))]">{l.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {l.standards.map((s) => (
              <span key={s} className="rounded-md bg-jade/10 px-1.5 py-0.5 font-mono text-[11px] text-jade">
                {s}
              </span>
            ))}
            {l.linkUrl && <span className="text-[11px] text-ink-faint">{ytId ? 'YouTube' : '링크'}</span>}
            {!isTeacher && progress?.completed && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-dark">
                <Icon name="check" size={11} /> 봤어요
              </span>
            )}
            {!isTeacher && resumeAt > 0 && <span className="text-[11px] text-[rgb(var(--page-accent))]">{fmtTime(resumeAt)}부터 이어 보기</span>}
            {isTeacher && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-faint">
                <Icon name="eye" size={12} /> 조회 {l.views}
              </span>
            )}
          </span>
        </span>
      </button>
      {isTeacher && (
        <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
          <div className="flex">
            <IconBtn icon="up" label="위로" disabled={busy || first} onClick={() => onMove(-1)} />
            <IconBtn icon="down" label="아래로" disabled={busy || last} onClick={() => onMove(1)} />
          </div>
          <div className="flex">
            <IconBtn icon="edit" label="고치기" disabled={busy} onClick={onEdit} />
            <IconBtn icon="trash" label="지우기" disabled={busy} onClick={onDelete} danger />
          </div>
        </div>
      )}
    </li>
  );
}

export function IconBtn({ icon, label, onClick, disabled, danger }: { icon: 'up' | 'down' | 'edit' | 'trash' | 'close'; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors disabled:opacity-30',
        danger ? 'hover:bg-royal/10 hover:text-royal' : 'hover:bg-gold/15 hover:text-[rgb(var(--page-accent))]',
      )}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
