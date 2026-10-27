import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { LECTURE_AUTO_DONE_RATIO, LECTURE_SAVE_INTERVAL, lectureSpeeds } from '@/config/lectures';
import { useCurrentUser } from '@/context/AuthContext';
import { addMyMemo, countView, deleteMyMemo, getVideoUrl, listMyMemos, saveMyProgress, updateMyMemo } from '@/services/lectureService';
import type { Lecture, LectureMemo, LectureProgress } from '@/types/lecture';
import { cn } from '@/utils/format';
import { IconBtn } from './LecturePage';
import { FileVideo, YouTubeVideo, fmtTime, isDirectVideoUrl, youTubeId, type PlayerHandle } from './players';

const SPEED_KEY = 'hkc:lectureSpeed';
const readSpeed = () => {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return lectureSpeeds.includes(v) ? v : 1;
  } catch {
    return 1;
  }
};

/** 영상 보기 (KoreanEdu VideoPlayer: 배속, 이어 보기, 봤어요, 타임스탬프 메모) */
export function LecturePlayer({ lecture, initial, isTeacher, onBack }: { lecture: Lecture; initial?: LectureProgress; isTeacher: boolean; onBack: () => void }) {
  const user = useCurrentUser();
  const player = useRef<PlayerHandle>(null);
  const ytId = lecture.linkUrl ? youTubeId(lecture.linkUrl) : null;
  const directLink = lecture.linkUrl && !ytId && isDirectVideoUrl(lecture.linkUrl) ? lecture.linkUrl : null;
  const external = !!lecture.linkUrl && !ytId && !directLink;

  // 파일 영상 주소 — 실패하면 계속 "불러오는 중"이 아니라 이유를 보여 줌 (KoreanEdu 수정)
  const [src, setSrc] = useState<string | null>(directLink);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!lecture.storagePath) return;
    let url: string | null = null;
    let alive = true;
    getVideoUrl(lecture)
      .then((u) => {
        url = u;
        if (alive) setSrc(u);
        else if (u.startsWith('blob:')) URL.revokeObjectURL(u);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [lecture]);

  // 조회 수 (학생만, 이름 없이 숫자만)
  useEffect(() => {
    if (!isTeacher) countView(lecture.id).catch(() => undefined);
  }, [lecture.id, isTeacher]);

  // ── 시청 기록 (나만 보기) ──
  const [completed, setCompleted] = useState(initial?.completed ?? false);
  const [resumed, setResumed] = useState<number | null>(null);
  const [speed, setSpeed] = useState(readSpeed);
  const state = useRef({ position: initial?.positionSeconds ?? 0, watched: initial?.watchedSeconds ?? 0, completed: initial?.completed ?? false, last: -1, savedAt: 0, dirty: false });

  const save = useCallback(() => {
    const s = state.current;
    if (!s.dirty) return;
    s.dirty = false;
    s.savedAt = Date.now();
    saveMyProgress(user, { lectureId: lecture.id, positionSeconds: s.position, watchedSeconds: s.watched, completed: s.completed, updatedAt: Date.now() }).catch((e) =>
      console.warn('[lecture] 시청 위치 저장 실패', e),
    );
  }, [user, lecture.id]);

  const setDone = (v: boolean) => {
    state.current.completed = v;
    state.current.dirty = true;
    setCompleted(v);
    save();
  };

  // 화면을 떠나거나 앱을 내릴 때도 위치 저장 (모바일은 언마운트 없이 백그라운드로 가는 경우가 많음)
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
      save();
    };
  }, [save]);

  /**
   * 이어 보기 — 재생기가 준비된 뒤에 옮김.
   * (KoreanEdu 는 영상 주소를 받기 전에 위치 이동을 시도해서 파일 영상에서 이어 보기가 안 되던 문제가 있었음)
   */
  const onReady = (duration: number) => {
    player.current?.setRate(speed);
    const at = initial?.positionSeconds ?? 0;
    if (!initial?.completed && at > 5 && (!duration || at < duration - 3)) {
      player.current?.seek(at);
      setResumed(at);
    }
  };

  const onTick = (cur: number, dur: number) => {
    const s = state.current;
    const delta = cur - s.last;
    // 실제로 재생된 만큼만 시청 시간에 더함 (건너뛰기는 빼고)
    if (s.last >= 0 && delta > 0 && delta < 3 * Math.max(1, speed)) s.watched += delta;
    s.last = cur;
    s.position = cur;
    s.dirty = true;
    if (dur > 0 && cur / dur >= LECTURE_AUTO_DONE_RATIO && !s.completed) return setDone(true);
    if (Date.now() - s.savedAt >= LECTURE_SAVE_INTERVAL) save();
  };

  const changeSpeed = (v: number) => {
    setSpeed(v);
    player.current?.setRate(v);
    try {
      localStorage.setItem(SPEED_KEY, String(v));
    } catch {
      /* noop */
    }
  };

  // ── 타임스탬프 메모 (나만 보기) ──
  const [memos, setMemos] = useState<LectureMemo[]>([]);
  const [draft, setDraft] = useState<{ at: number; text: string; id?: string } | null>(null);
  const [memoError, setMemoError] = useState('');
  const loadMemos = useCallback(() => listMyMemos(user, lecture.id).then(setMemos).catch((e: Error) => setMemoError(e.message)), [user, lecture.id]);
  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const hasPlayer = !external && !error;
  const saveMemo = async () => {
    if (!draft?.text.trim()) return;
    setMemoError('');
    try {
      if (draft.id) await updateMyMemo(user, draft.id, draft.text.trim());
      else await addMyMemo(user, lecture.id, draft.at, draft.text.trim());
      setDraft(null);
      loadMemos();
    } catch (e) {
      setMemoError(e instanceof Error ? e.message : '메모를 저장하지 못했어요.');
    }
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="-my-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-[rgb(var(--page-accent))]">
        <Icon name="back" size={16} /> 목록
      </button>

      <div>
        <p className="text-xs font-semibold text-[rgb(var(--page-accent))]">{lecture.unit}</p>
        <h2 className="font-serif text-2xl font-bold">{lecture.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          {lecture.standards.map((s) => (
            <span key={s} className="rounded-md bg-jade/10 px-1.5 py-0.5 font-mono text-jade">
              {s}
            </span>
          ))}
          {isTeacher && (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="eye" size={12} /> 조회 {lecture.views}
            </span>
          )}
        </div>
        {lecture.description && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{lecture.description}</p>}
      </div>

      {/* 재생기 */}
      {error ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-ink/5 px-6 text-center text-sm text-royal">영상을 열지 못했어요: {error}</div>
      ) : ytId ? (
        <YouTubeVideo ref={player} videoId={ytId} onReady={onReady} onTick={onTick} onPause={save} onError={setError} />
      ) : src ? (
        <FileVideo ref={player} src={src} onReady={onReady} onTick={onTick} onPause={save} onError={setError} />
      ) : external ? (
        <div className="royal-card space-y-3 p-6 text-center">
          <p className="text-sm text-ink-soft">앱 안에서 열 수 없는 주소라 새 창으로 열려요.</p>
          <a
            href={lecture.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-collar border border-gold/50 bg-gradient-to-b from-royal-light to-royal px-5 font-semibold text-hanji shadow-button"
          >
            <Icon name="external" size={18} /> 영상 열기
          </a>
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-ink/5 text-sm text-ink-faint">영상 불러오는 중…</div>
      )}
      {ytId && error && (
        <a href={lecture.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-royal underline">
          <Icon name="external" size={15} /> YouTube 에서 보기
        </a>
      )}

      {resumed !== null && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-gold/10 px-3 py-2 text-sm text-ink-soft">
          지난번 {fmtTime(resumed)}부터 이어서 봐요.
          <button type="button" className="min-h-[36px] font-semibold text-[rgb(var(--page-accent))] underline" onClick={() => (player.current?.seek(0, true), setResumed(null))}>
            처음부터
          </button>
        </p>
      )}

      {/* 배속 · 봤어요 */}
      <div className="flex flex-wrap items-center gap-2">
        {hasPlayer && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="재생 속도">
            {lectureSpeeds.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => changeSpeed(v)}
                aria-pressed={speed === v}
                className={cn(
                  'h-11 min-w-[48px] rounded-full px-2 text-sm font-bold transition-colors',
                  speed === v ? 'bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button' : 'bg-white/70 text-ink-soft ring-1 ring-inset ring-gold/25 hover:bg-gold/10',
                )}
              >
                {v}×
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {completed && hasPlayer && (
            <RoyalButton variant="ghost" onClick={() => (player.current?.seek(0, true), setResumed(null))}>
              다시 보기
            </RoyalButton>
          )}
          <RoyalButton variant={completed ? 'secondary' : 'primary'} icon="check" active={completed} onClick={() => setDone(!completed)} aria-label={completed ? '봤어요 표시 지우기' : '봤어요 표시하기'}>
            봤어요
          </RoyalButton>
        </div>
      </div>

      {/* 메모 */}
      <section className="royal-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-bold">
            <Icon name="notebook" size={17} className="text-[rgb(var(--page-accent))]" /> 내 메모
            <span className="inline-flex items-center gap-0.5 text-xs font-normal text-ink-faint">
              <Icon name="lock" size={12} /> 나만 보기
            </span>
          </h3>
          {!draft && (
            <RoyalButton size="sm" variant="secondary" icon="plus" className="h-11" onClick={() => setDraft({ at: hasPlayer ? player.current?.currentTime() ?? 0 : 0, text: '' })}>
              {hasPlayer ? '지금 장면에 메모' : '메모'}
            </RoyalButton>
          )}
        </div>

        {draft && (
          <div className="mt-3 space-y-2">
            {hasPlayer && <p className="font-mono text-xs text-[rgb(var(--page-accent))]">{fmtTime(draft.at)}</p>}
            <textarea
              className="royal-input resize-none text-sm"
              rows={2}
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder="헷갈렸던 점, 기억할 점을 적어 두세요"
              maxLength={1000}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <RoyalButton size="sm" variant="ghost" className="h-11" onClick={() => setDraft(null)}>
                취소
              </RoyalButton>
              <RoyalButton size="sm" className="h-11" disabled={!draft.text.trim()} onClick={saveMemo}>
                저장
              </RoyalButton>
            </div>
          </div>
        )}
        {memoError && <p className="mt-2 text-sm text-royal">{memoError}</p>}

        {memos.length === 0 && !draft ? (
          <p className="py-3 text-center text-sm text-ink-faint">{hasPlayer ? '보다가 기억하고 싶은 장면에서 메모를 남겨 보세요.' : '아직 메모가 없어요.'}</p>
        ) : (
          <ul className="mt-2 divide-y divide-gold/15">
            {memos.map((m) => (
              <li key={m.id} className="flex items-start gap-2 py-1.5">
                {hasPlayer && (
                  <button
                    type="button"
                    onClick={() => player.current?.seek(m.positionSeconds, true)}
                    className="flex h-11 shrink-0 items-center rounded-full px-2 font-mono text-sm font-semibold text-[rgb(var(--page-accent))] hover:bg-gold/10"
                    aria-label={`${fmtTime(m.positionSeconds)}로 이동`}
                  >
                    {fmtTime(m.positionSeconds)}
                  </button>
                )}
                <p className="min-w-0 flex-1 whitespace-pre-line break-words py-2.5 text-sm">{m.text}</p>
                <IconBtn icon="edit" label="메모 고치기" onClick={() => setDraft({ at: m.positionSeconds, text: m.text, id: m.id })} />
                <IconBtn
                  icon="trash"
                  label="메모 지우기"
                  danger
                  onClick={() => {
                    if (confirm('이 메모를 지울까요?')) deleteMyMemo(user, m.id).then(loadMemos);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
