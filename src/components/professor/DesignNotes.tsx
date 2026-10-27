import { motion, useReducedMotion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { RoyalButton } from '@/components/common/RoyalButton';
import { getDesignNote, noteIdForPath, type DesignNote } from '@/config/designNotes';
import { useAuth } from '@/context/AuthContext';
import { standardText } from '@/data/standards';
import { cn } from '@/utils/format';

/**
 * 교수자 전용 "설계 의도" 두루마리
 * - 문구가 있는 화면으로 들어갈 때마다(주소가 바뀔 때마다) 그 자리에서 펼쳐짐
 * - 로비 메달·탭처럼 주소가 바뀌지 않는 곳은 useDesignGate() 로 누르는 순간 펼침
 * - [들어가 보기]를 누르면 말려 올라가며 화면으로 들어감
 * - 학생·선생님 계정에서는 아무것도 하지 않음
 */
type Gate = (id: string, proceed?: () => void) => void;
const GateContext = createContext<Gate>((_id, proceed) => proceed?.());

/** 누르는 순간 설계 의도를 먼저 보여 주고, [들어가 보기] 후 proceed 실행. 교수자가 아니거나 문구가 없으면 바로 실행 */
export const useDesignGate = () => useContext(GateContext);

export function DesignNoteProvider({ children }: { children: ReactNode }) {
  const { isProfessor } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState<{ id: string; proceed?: () => void } | null>(null);
  /** 오른쪽 아래 버튼으로 다시 펼칠 문구 (이 화면에서 마지막으로 본 것) */
  const [current, setCurrent] = useState<string | undefined>();

  // 주소가 바뀔 때마다 — 같은 화면에 다시 들어가도 매번
  useEffect(() => {
    if (!isProfessor) return;
    const id = noteIdForPath(pathname);
    const has = !!getDesignNote(id);
    setCurrent(has ? id : undefined);
    setOpen(has ? { id: id! } : null);
  }, [pathname, isProfessor]);

  const gate = useCallback<Gate>(
    (id, proceed) => {
      if (!isProfessor || !getDesignNote(id)) return proceed?.();
      setCurrent(id);
      setOpen({ id, proceed });
    },
    [isProfessor],
  );

  const note = getDesignNote(open?.id);
  return (
    <GateContext.Provider value={gate}>
      {children}
      {isProfessor && (
        <>
          {/* 말려 올라가는 연출은 카드 안에서 끝내고 바로 내림 */}
          {open && note && (
            <ScrollOverlay
              key={open.id + pathname}
              note={note}
              onEnter={() => {
                const p = open.proceed;
                setOpen(null);
                p?.();
              }}
            />
          )}
          {current && !open && getDesignNote(current) && (
            <button
              type="button"
              onClick={() => setOpen({ id: current })}
              className="fixed bottom-5 right-4 z-40 flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-gold bg-hanji-card text-[10px] font-bold leading-tight text-royal shadow-glow transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
              aria-label="설계 의도 다시 보기"
            >
              <Seal size={18} />
              <span className="mt-0.5">설계 의도</span>
            </button>
          )}
        </>
      )}
    </GateContext.Provider>
  );
}

// ───────── 두루마리 ─────────
function ScrollOverlay({ note, onEnter }: { note: DesignNote; onEnter: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const paper = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const [closing, setClosing] = useState(false);
  const enterBtn = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => setH(paper.current?.offsetHeight ?? 0), [note]);
  useEffect(() => {
    const t = window.setTimeout(() => enterBtn.current?.focus({ preventScroll: true }), reduce ? 0 : 700);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setClosing(true);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [reduce]);

  const rolled = { clipPath: 'inset(50% 0% 50% 0%)' };
  const unrolled = { clipPath: 'inset(0% 0% 0% 0%)' };
  const ease = [0.65, 0, 0.35, 1] as const;
  const dur = reduce ? 0 : 0.75;

  return (
    <motion.div
      className={cn('fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 px-4 py-6 backdrop-blur-sm', closing && 'pointer-events-none')}
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: reduce ? 0.1 : 0.3, delay: closing && !reduce ? 0.55 : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`설계 의도: ${note.title}`}
    >
      <div className="relative w-full max-w-lg">
        {/* 위 축 */}
        <motion.div
          className="relative z-10"
          initial={{ y: h / 2 }}
          animate={{ y: closing ? h / 2 : 0 }}
          transition={{ duration: dur, ease }}
        >
          <Roller />
        </motion.div>

        {/* 한지 */}
        <motion.div
          ref={paper}
          initial={rolled}
          animate={closing ? rolled : unrolled}
          transition={{ duration: dur, ease }}
          onAnimationComplete={() => closing && onEnter()}
          className="relative -my-2 mx-3 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain border-x-2 border-gold/70 bg-[linear-gradient(180deg,rgb(var(--color-hanji-card)),rgb(var(--color-hanji)))] px-6 pb-6 pt-7 shadow-[inset_0_0_40px_rgb(var(--color-gold)/0.12)] sm:px-8"
        >
          <div className="pointer-events-none absolute inset-2 border border-gold/40" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-[0.35em] text-gold-dark">設計 意圖 · 설계 의도</span>
              <Seal size={34} />
            </div>
            <h2 className="mt-2 break-keep font-serif text-[28px] font-bold leading-tight text-royal-deep">{note.title}</h2>
            <div className="mt-1 h-px bg-gradient-to-r from-gold via-gold/60 to-transparent" />

            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink">
              {note.purpose && (
                <Section title="만든 목적">
                  <p>{note.purpose}</p>
                </Section>
              )}
              {note.effects && note.effects.length > 0 && (
                <Section title="기대 효과">
                  <ul className="space-y-1">
                    {note.effects.map((e) => (
                      <li key={e} className="flex gap-2">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden />
                        {e}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {(note.standards?.length || note.standardsNote) && (
                <Section title="연결 성취기준">
                  {note.standardsNote && <p className="mb-2">{note.standardsNote}</p>}
                  <ul className="space-y-2">
                    {note.standards?.map((code) => (
                      <li key={code} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="rounded-md border border-gold/70 bg-gradient-to-b from-gold-light/70 to-gold/40 px-2 py-0.5 font-mono text-xs font-bold text-royal-deep shadow-sm">
                          [{code}]
                        </span>
                        {standardText(code) && <span className="min-w-0 flex-1 basis-56">{standardText(code)}</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {note.goal && (
                <Section title="과목 총괄 목표">
                  <p>{note.goal}</p>
                </Section>
              )}
              {note.implementation && (
                <Section title="성취기준 구현 방식">
                  <p>{note.implementation}</p>
                </Section>
              )}
            </div>

            <RoyalButton ref={enterBtn} fullWidth size="lg" className="mt-6" onClick={() => setClosing(true)} disabled={closing}>
              들어가 보기
            </RoyalButton>
          </div>
        </motion.div>

        {/* 아래 축 */}
        <motion.div
          className="relative z-10"
          initial={{ y: -h / 2 }}
          animate={{ y: closing ? -h / 2 : 0 }}
          transition={{ duration: dur, ease }}
        >
          <Roller />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-serif text-sm font-bold text-[rgb(var(--color-royal))]">{title}</h3>
      {children}
    </section>
  );
}

/** 두루마리 축 (나무 + 금 마구리) */
function Roller() {
  return (
    <div className="relative flex h-5 items-center">
      <span className="absolute -left-0.5 h-6 w-3 rounded-full bg-gradient-to-b from-gold-light via-gold to-gold-dark shadow" />
      <span className="mx-2 h-4 flex-1 rounded-full bg-gradient-to-b from-[#7a3b22] via-[#5a2716] to-[#3d1a0e] shadow-[0_3px_6px_rgb(0_0_0/0.3)]" />
      <span className="absolute -right-0.5 h-6 w-3 rounded-full bg-gradient-to-b from-gold-light via-gold to-gold-dark shadow" />
    </div>
  );
}

/** 붉은 낙관(도장) */
export function Seal({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[4px] border-2 border-royal bg-royal font-serif font-bold leading-none text-hanji shadow-[0_1px_0_rgb(var(--color-royal-deep))]', className)}
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      aria-hidden
    >
      意
    </span>
  );
}
