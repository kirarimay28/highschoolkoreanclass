import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { useCurrentUser } from '@/context/AuthContext';
import { VOCAB_ITEMS, isAnswerCorrect } from '@/data/classicalVocab';
import { kstToday, saveAttempt } from '@/services/vocabService';
import type { GradeResult, QuizFormat, VocabAttempt, VocabItem, VocabMode } from '@/types/vocab';
import { cn } from '@/utils/format';
import { CarryoverPicker } from './VocabBook';

/** 제한 시간 (KoreanEdu: 단답형 10분 bb17fe8, 객관식 5분 3b3ffa7) */
const TIME_LIMIT: Record<QuizFormat, number> = { 단답형: 600, 객관식: 300 };
const CIRCLED = ['①', '②', '③', '④', '⑤'];

interface McQuestion {
  item: VocabItem;
  choices: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 5지선다 — 오답 보기는 다른 단어의 뜻에서. 정답과 같은 뜻·서로 같은 뜻은 빼서 보기가 겹치지 않게 */
function buildMC(items: VocabItem[]): McQuestion[] {
  return shuffle(items).map((item) => {
    const seen = new Set([item.answer]);
    const distractors: string[] = [];
    for (const v of shuffle(VOCAB_ITEMS)) {
      if (distractors.length === 4) break;
      if (v.num === item.num || seen.has(v.answer)) continue;
      seen.add(v.answer);
      distractors.push(v.answer);
    }
    const choices = shuffle([item.answer, ...distractors]);
    return { item, choices, correctIndex: choices.indexOf(item.answer) };
  });
}

/**
 * 시험 연습 / 시험 응시 (KoreanEdu VocabExamTab)
 * - 범위(시작~끝 번호) + 이월 번호, 단답형 / 객관식(5지선다)
 * - 시간이 다 되면 자동 채점
 * - 시험: 하루 한 번, 채점과 동시에 기록 / 연습: 본인만 보는 기록
 */
export function VocabQuiz({ mode, attempts, onSaved, onBusy }: { mode: VocabMode; attempts: VocabAttempt[]; onSaved: () => void; onBusy: (b: boolean) => void }) {
  const user = useCurrentUser();
  const isExam = mode === 'exam';
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [format, setFormat] = useState<QuizFormat>('단답형');
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(20);
  const [carryover, setCarryover] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [mc, setMc] = useState<McQuestion[]>([]);
  const [mcIndex, setMcIndex] = useState(0);
  const [mcSelected, setMcSelected] = useState<number[]>([]);
  const [results, setResults] = useState<GradeResult[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT.단답형);

  const mine = attempts.filter((a) => a.mode === mode);
  const todayExam = isExam ? mine.find((a) => a.date === kstToday()) : undefined;

  const items = useMemo(() => {
    const nums = new Set([...VOCAB_ITEMS.filter((v) => v.num >= startNum && v.num <= endNum).map((v) => v.num), ...carryover]);
    return VOCAB_ITEMS.filter((v) => nums.has(v.num));
  }, [startNum, endNum, carryover]);

  // 푸는 중에는 탭 이동·창 닫기 확인
  useEffect(() => {
    onBusy(phase === 'quiz');
    if (phase !== 'quiz') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase, onBusy]);

  // 제한 시간
  const timer = useRef<number>();
  useEffect(() => {
    if (phase !== 'quiz') return;
    setTimeLeft(TIME_LIMIT[format]);
    timer.current = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(timer.current);
  }, [phase, format]);

  const finish = (graded: GradeResult[]) => {
    window.clearInterval(timer.current);
    setResults(graded);
    setPhase('result');
    setSaveState('saving');
    saveAttempt(user, { mode, format, startNum, endNum, carryoverNums: carryover, results: graded })
      .then(() => (setSaveState('saved'), onSaved()))
      .catch((e: Error) => (setSaveState('error'), setSaveError(e.message)));
  };

  const gradeShort = () =>
    finish(
      items.map((item) => ({
        num: item.num,
        vocab: item.vocab,
        userAnswer: answers[item.num] ?? '',
        correctAnswer: item.answer,
        correct: isAnswerCorrect(answers[item.num] ?? '', item.answer),
      })),
    );
  const gradeMC = () =>
    finish(
      mc.map((q, i) => ({
        num: q.item.num,
        vocab: q.item.vocab,
        userAnswer: mcSelected[i] >= 0 ? q.choices[mcSelected[i]] : '',
        correctAnswer: q.item.answer,
        correct: mcSelected[i] === q.correctIndex,
      })),
    );

  // 시간이 다 되면 자동 채점
  useEffect(() => {
    if (phase === 'quiz' && timeLeft === 0) (format === '객관식' ? gradeMC : gradeShort)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const start = () => {
    setResults([]);
    setSaveState('idle');
    setSaveError('');
    // 지난번이 시간 초과로 끝났으면 0 이 남아 있어서 바로 채점되는 일이 없도록 먼저 되돌림
    setTimeLeft(TIME_LIMIT[format]);
    if (format === '객관식') {
      const qs = buildMC(items);
      setMc(qs);
      setMcIndex(0);
      setMcSelected(new Array(qs.length).fill(-1));
    } else setAnswers({});
    setPhase('quiz');
  };
  const cancel = () => {
    if (!confirm(isExam ? '시험을 그만둘까요? 기록되지 않아요.' : '연습을 그만둘까요?')) return;
    window.clearInterval(timer.current);
    setPhase('setup');
  };

  // ───── 설정 ─────
  if (phase === 'setup') {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
          <Icon name={isExam ? 'scroll' : 'sparkles'} size={16} className="mt-0.5 shrink-0 text-gold-dark" />
          {isExam
            ? '시험은 하루에 한 번 볼 수 있고, 결과는 선생님께 전달돼요.'
            : '연습 결과는 나만 볼 수 있어요. 틀린 단어는 단어장의 [내가 틀린 단어]에 모여요.'}
        </p>

        {todayExam ? (
          <div className="royal-card py-7 text-center">
            <p className="text-sm font-bold text-[rgb(var(--page-accent))]">오늘 시험을 봤어요</p>
            <p className="mt-1 font-serif text-4xl font-bold">
              {todayExam.score} / {todayExam.total}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {rangeText(todayExam)} · {todayExam.format}
            </p>
            <p className="mt-2 text-xs text-ink-faint">다시 보려면 선생님께 기록 삭제를 요청하세요. 연습은 [시험 연습]에서 언제든 할 수 있어요.</p>
          </div>
        ) : (
          <>
            <div className="royal-card space-y-3 p-5">
              <p className="text-sm font-bold">범위</p>
              <div className="flex items-end gap-3">
                <NumSelect label="시작 번호" value={startNum} options={VOCAB_ITEMS.map((v) => v.num)} onChange={(v) => (setStartNum(v), endNum < v && setEndNum(v))} />
                <span className="pb-3 text-ink-faint">~</span>
                <NumSelect label="끝 번호" value={endNum} options={VOCAB_ITEMS.map((v) => v.num).filter((n) => n >= startNum)} onChange={setEndNum} />
              </div>
              <p className="text-xs font-semibold text-[rgb(var(--page-accent))]">총 {items.length}문항</p>
            </div>
            <CarryoverPicker startNum={startNum} endNum={endNum} value={carryover} onChange={setCarryover} />
            <div className="royal-card space-y-3 p-5">
              <p className="text-sm font-bold">문제 유형</p>
              <div className="grid grid-cols-2 gap-2">
                {(['단답형', '객관식'] as QuizFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={format === f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'min-h-[52px] rounded-2xl border-2 px-2 text-sm font-semibold transition-colors',
                      format === f ? 'border-royal bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button' : 'border-gold/30 bg-white/60 text-ink-soft hover:border-gold',
                    )}
                  >
                    {f === '단답형' ? '단답형 · 10분' : '객관식 5지선다 · 5분'}
                  </button>
                ))}
              </div>
            </div>
            <RoyalButton fullWidth size="lg" icon={isExam ? 'scroll' : 'sparkles'} disabled={items.length === 0} onClick={start}>
              {isExam ? '시험 시작' : '연습 시작'}
            </RoyalButton>
          </>
        )}

        <History list={mine} title={isExam ? '내 응시 기록' : '내 연습 기록'} />
      </div>
    );
  }

  // ───── 풀기 ─────
  if (phase === 'quiz') {
    const head = (
      <>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">
            {isExam ? '고전 어휘 시험' : '연습'} · {format === '객관식' ? `${mcIndex + 1}/${mc.length}` : `${items.length}문항`}
          </p>
          <button type="button" onClick={cancel} className="min-h-[44px] px-2 text-sm text-ink-faint hover:text-royal">
            그만두기
          </button>
        </div>
        <Clock seconds={timeLeft} />
      </>
    );

    if (format === '객관식') {
      const q = mc[mcIndex];
      const sel = mcSelected[mcIndex] ?? -1;
      const last = mcIndex === mc.length - 1;
      return (
        <div className="mx-auto max-w-xl space-y-4">
          {head}
          <div className="h-1.5 overflow-hidden rounded-full bg-gold/15">
            <div className="h-full rounded-full bg-royal transition-all" style={{ width: `${((mcIndex + 1) / mc.length) * 100}%` }} />
          </div>
          <div className="royal-card space-y-2 p-6 text-center">
            <p className="font-mono text-xs text-ink-faint">No. {q.item.num}</p>
            <p className="font-serif text-3xl font-bold leading-relaxed">{q.item.vocab}</p>
            <p className="text-xs text-ink-faint">현대어 뜻을 고르세요</p>
          </div>
          <div className="space-y-2">
            {q.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMcSelected((p) => p.map((v, k) => (k === mcIndex ? i : v)))}
                className={cn(
                  'flex min-h-[52px] w-full items-center gap-2 rounded-2xl border-2 px-4 text-left text-[15px] font-medium transition-colors',
                  sel === i ? 'border-royal bg-gradient-to-b from-royal-light to-royal text-hanji' : 'border-gold/30 bg-white/70 hover:border-gold',
                )}
              >
                <span className="w-5 shrink-0 font-bold opacity-70">{CIRCLED[i]}</span>
                {c}
              </button>
            ))}
          </div>
          <RoyalButton fullWidth size="lg" disabled={sel === -1} onClick={() => (last ? gradeMC() : setMcIndex((i) => i + 1))}>
            {last ? '채점하기' : '다음'}
          </RoyalButton>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-xl space-y-3">
        {head}
        <p className="text-xs text-ink-faint">띄어쓰기·괄호 속 내용은 채점하지 않아요. 뜻이 여러 개면 쉼표(,)로 나눠 쓰고, 순서는 상관없어요.</p>
        {items.map((item, idx) => (
          <label key={item.num} className="royal-card block space-y-2 p-4">
            <span className="flex items-baseline gap-2">
              <span className="text-xs text-ink-faint">#{idx + 1}</span>
              <span className="font-serif text-lg font-bold">{item.vocab}</span>
            </span>
            <input
              className="royal-input"
              placeholder="뜻을 입력하세요"
              value={answers[item.num] ?? ''}
              onChange={(e) => setAnswers((p) => ({ ...p, [item.num]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const inputs = [...document.querySelectorAll<HTMLInputElement>('[data-vocab-input]')];
                inputs[idx + 1]?.focus();
              }}
              data-vocab-input
              autoComplete="off"
              autoCapitalize="off"
            />
          </label>
        ))}
        <RoyalButton fullWidth size="lg" onClick={gradeShort}>
          채점하기
        </RoyalButton>
      </div>
    );
  }

  // ───── 결과 ─────
  const score = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct);
  const right = results.filter((r) => r.correct);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="royal-card py-6 text-center">
        <p className="font-serif text-5xl font-bold text-[rgb(var(--page-accent))]">
          {score} / {results.length}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">{results.length ? Math.round((score / results.length) * 100) : 0}% 정답</p>
        <p className="mt-2 text-xs text-ink-faint" aria-live="polite">
          {saveState === 'saving'
            ? '기록하는 중…'
            : saveState === 'saved'
              ? isExam
                ? '기록했어요. 선생님께 전달돼요.'
                : '연습 기록에 남겼어요 (나만 보기)'
              : saveState === 'error'
                ? ''
                : ''}
        </p>
        {saveState === 'error' && <p className="mx-4 mt-2 rounded-xl bg-royal/5 px-3 py-2 text-sm text-royal">기록하지 못했어요: {saveError}</p>}
      </div>

      <div className="flex gap-2">
        {!isExam && (
          <RoyalButton fullWidth onClick={start}>
            다시 연습하기
          </RoyalButton>
        )}
        <RoyalButton fullWidth variant="secondary" onClick={() => setPhase('setup')}>
          처음으로
        </RoyalButton>
      </div>

      {wrong.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-royal">틀린 문항 ({wrong.length})</h3>
          {wrong.map((r) => (
            <div key={r.num} className="royal-card flex items-start gap-2 border-royal/20 p-4">
              <Icon name="close" size={16} className="mt-1 shrink-0 text-royal" />
              <div className="min-w-0">
                <p className="font-serif text-lg font-bold">{r.vocab}</p>
                {r.userAnswer && (
                  <p className="text-sm text-ink-faint">
                    내 답: <span className="line-through">{r.userAnswer}</span>
                  </p>
                )}
                <p className="text-sm font-semibold text-royal">정답: {r.correctAnswer}</p>
              </div>
            </div>
          ))}
        </section>
      )}
      {right.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-gold-dark">맞힌 문항 ({right.length})</h3>
          {right.map((r) => (
            <div key={r.num} className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2">
              <Icon name="check" size={15} className="shrink-0 text-gold-dark" />
              <span className="font-serif font-bold">{r.vocab}</span>
              <span className="ml-auto max-w-[55%] truncate text-xs text-ink-soft">{r.correctAnswer}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export const rangeText = (a: Pick<VocabAttempt, 'startNum' | 'endNum' | 'carryoverNums'>) =>
  `${a.startNum}~${a.endNum}번${a.carryoverNums.length ? ` + 이월 ${a.carryoverNums.join(', ')}` : ''}`;

function NumSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-xs text-ink-faint">{label}</span>
      <select className="royal-input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}번
          </option>
        ))}
      </select>
    </label>
  );
}

function Clock({ seconds }: { seconds: number }) {
  const urgent = seconds <= 60;
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl border py-2.5 font-mono text-lg font-bold',
        urgent ? 'border-royal/40 bg-royal/10 text-royal' : 'border-gold/30 bg-white/60 text-ink',
      )}
      role="timer"
      aria-label={`남은 시간 ${Math.floor(seconds / 60)}분 ${seconds % 60}초`}
    >
      <Icon name="clock" size={16} className={urgent ? 'animate-pulse' : ''} />
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </div>
  );
}

function History({ list, title }: { list: VocabAttempt[]; title: string }) {
  const [open, setOpen] = useState(false);
  if (list.length === 0) return null;
  return (
    <div className="royal-card p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-[44px] w-full items-center justify-between text-sm font-semibold" aria-expanded={open}>
        {title}
        <Icon name="down" size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-y divide-gold/15">
          {list.slice(0, 10).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-ink-soft">
                {r.date} · {rangeText(r)} · {r.format}
              </span>
              <span className="shrink-0 font-bold text-[rgb(var(--page-accent))]">
                {r.score}/{r.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
