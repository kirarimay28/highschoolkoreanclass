import { useCallback, useEffect, useRef, useState } from 'react';
import { TabBar } from '@/components/common/TabBar';
import { RoyalButton } from '@/components/common/RoyalButton';
import { pomodoroConfig } from '@/config/studyroom';
import { useCurrentUser } from '@/context/AuthContext';
import { addStudySeconds, getStudySeconds } from '@/services/studyService';
import { formatClock, formatDuration, todayKey } from '@/utils/date';
import { cn } from '@/utils/format';

type Mode = 'stopwatch' | 'pomodoro';
type Phase = 'focus' | 'break';

const modeTabs = [
  { id: 'stopwatch' as const, label: '스톱워치', icon: 'clock' as const },
  { id: 'pomodoro' as const, label: '뽀모도로', icon: 'timer' as const },
];

/** 실행 중에도 이 간격마다 기록을 저장 (창이 갑자기 닫혀도 손실 최소화) */
const FLUSH_INTERVAL_MS = 30_000;

export function TimerPanel() {
  const user = useCurrentUser();
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [phase, setPhase] = useState<Phase>('focus');
  const [focusMinutes, setFocusMinutes] = useState(pomodoroConfig.focusMinutes);
  const [running, setRunning] = useState(false);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [notice, setNotice] = useState('');
  const [, setTick] = useState(0);

  // 시간 계산은 timestamp 기반 (탭이 백그라운드여도 정확)
  const runStartRef = useRef<number | null>(null);
  const baseRef = useRef(0); // 현재 세션에서 이미 지난 초
  const lastFlushRef = useRef(0);
  const recordingRef = useRef(true); // 쉬는 시간은 기록하지 않음
  recordingRef.current = mode === 'stopwatch' || phase === 'focus';

  const refreshToday = useCallback(() => {
    getStudySeconds(user.id, todayKey()).then(setTodaySeconds);
  }, [user.id]);

  useEffect(refreshToday, [refreshToday]);

  const elapsed = () => baseRef.current + (runStartRef.current ? (Date.now() - runStartRef.current) / 1000 : 0);

  /** 지금까지 달린 구간을 기록에 누적하고 구간을 새로 시작 */
  const flush = useCallback(
    (keepRunning: boolean) => {
      if (runStartRef.current === null) return;
      const now = Date.now();
      const seg = (now - runStartRef.current) / 1000;
      baseRef.current += seg;
      runStartRef.current = keepRunning ? now : null;
      lastFlushRef.current = now;
      if (recordingRef.current && seg >= 1) {
        addStudySeconds(user, seg).then(refreshToday);
      }
    },
    [user, refreshToday],
  );

  const targetSeconds = (phase === 'focus' ? focusMinutes : pomodoroConfig.breakMinutes) * 60;

  // 틱 + 뽀모도로 종료 감지 + 주기적 저장
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (mode === 'pomodoro' && elapsed() >= targetSeconds) {
        // 목표 시간까지만 기록
        if (runStartRef.current !== null) runStartRef.current += (elapsed() - targetSeconds) * 1000;
        flush(false);
        setRunning(false);
        baseRef.current = 0;
        if (phase === 'focus') {
          setPhase('break');
          setNotice(`집중 완료! ${pomodoroConfig.breakMinutes}분 쉬어 가요.`);
        } else {
          setPhase('focus');
          setNotice('쉬는 시간 끝! 다시 집중해 볼까요?');
        }
      } else if (Date.now() - lastFlushRef.current >= FLUSH_INTERVAL_MS) {
        flush(true);
      }
      setTick((t) => t + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [running, mode, phase, targetSeconds, flush]);

  // 페이지를 떠나거나 창을 닫을 때 남은 시간 저장
  useEffect(() => {
    const onUnload = () => flush(false);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      flush(false);
    };
  }, [flush]);

  const start = () => {
    setNotice('');
    runStartRef.current = Date.now();
    lastFlushRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    flush(false);
    setRunning(false);
  };
  const reset = () => {
    flush(false);
    setRunning(false);
    baseRef.current = 0;
    setPhase('focus');
    setNotice('');
    setTick((t) => t + 1);
  };
  const changeMode = (next: Mode) => {
    reset();
    setMode(next);
  };

  const seconds = elapsed();
  const display = mode === 'stopwatch' ? seconds : Math.max(0, targetSeconds - seconds);
  const progress = mode === 'pomodoro' ? Math.min(1, seconds / targetSeconds) : (seconds % 3600) / 3600;
  const R = 110;
  const C = 2 * Math.PI * R;

  return (
    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-[1fr_15rem]">
      <section className="royal-card flex flex-col items-center p-5 sm:p-8">
        <TabBar items={modeTabs} value={mode} onChange={changeMode} size="sm" className="w-full max-w-xs" />

        {mode === 'pomodoro' && (
          <div className="mt-4 flex gap-2">
            {pomodoroConfig.presets.map((m) => (
              <RoyalButton
                key={m}
                size="sm"
                variant="secondary"
                active={focusMinutes === m}
                disabled={running}
                onClick={() => {
                  reset();
                  setFocusMinutes(m);
                }}
              >
                {m}분
              </RoyalButton>
            ))}
          </div>
        )}

        <div className="relative mt-6 h-64 w-64 sm:h-72 sm:w-72">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
            <circle cx="120" cy="120" r={R} fill="none" stroke="rgb(var(--color-hanji-dark))" strokeWidth="8" />
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke={phase === 'break' && mode === 'pomodoro' ? 'rgb(var(--color-success))' : 'rgb(var(--color-gold))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-300"
            />
            <circle cx="120" cy="120" r={R - 14} fill="none" stroke="rgb(var(--color-gold))" strokeOpacity="0.35" strokeDasharray="2 5" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-serif text-sm text-gold-dark">
              {mode === 'stopwatch' ? '공부 중' : phase === 'focus' ? '집중' : '휴식'}
            </p>
            <p className={cn('font-sans text-5xl font-semibold tabular-nums tracking-tight', running ? 'text-royal' : 'text-ink')}>
              {formatClock(display)}
            </p>
          </div>
        </div>

        <p className="mt-2 min-h-[1.5rem] text-center font-serif text-gold-dark" aria-live="polite">
          {notice}
        </p>

        <div className="mt-3 flex gap-3">
          {running ? (
            <RoyalButton size="lg" variant="secondary" onClick={pause} className="min-w-[8rem]">
              일시정지
            </RoyalButton>
          ) : (
            <RoyalButton size="lg" onClick={start} className="min-w-[8rem]">
              {seconds > 0 ? '이어서' : phase === 'break' && mode === 'pomodoro' ? '휴식 시작' : '시작'}
            </RoyalButton>
          )}
          <RoyalButton size="lg" variant="ghost" onClick={reset} disabled={seconds === 0 && !running}>
            초기화
          </RoyalButton>
        </div>
      </section>

      <aside className="royal-card flex flex-col items-center justify-center gap-1 self-start p-5 text-center">
        <p className="text-sm text-ink-soft">오늘 누적 공부 시간</p>
        <p className="font-serif text-3xl font-bold text-royal">{formatDuration(todaySeconds)}</p>
        <p className="mt-2 text-balance text-xs text-ink-faint">
          측정한 시간은 자동으로 오늘 기록에 더해져
          <br />
          랭킹과 캘린더에 반영돼요. (휴식 시간 제외)
        </p>
      </aside>
    </div>
  );
}
