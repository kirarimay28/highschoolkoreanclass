import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const HALF = 0.5; // 처음 열릴 때 화면의 절반
const FULL = 0.92; // 위로 끌면 거의 전체 화면

/**
 * 아래에서 올라오는 패널 (모바일 상세 보기)
 * - 절반 높이로 열리고, 손잡이를 위로 끌면 전체 화면, 아래로 끌면 닫힘
 * - 바깥을 누르거나 Esc 로 닫기
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const reduce = useReducedMotion() ?? false;
  const vh = () => window.innerHeight;
  const height = useMotionValue(vh() * HALF);
  const start = useRef(0);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFull(false);
    height.set(0);
    animate(height, vh() * HALF, reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 36 });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title]);

  const snap = (to: 'half' | 'full') => {
    setFull(to === 'full');
    animate(height, vh() * (to === 'full' ? FULL : HALF), reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38 });
  };

  const onPanStart = () => (start.current = height.get());
  const onPan = (_: PointerEvent, info: PanInfo) => height.set(Math.min(vh() * FULL, Math.max(80, start.current - info.offset.y)));
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const h = height.get();
    if (info.velocity.y > 600 || h < vh() * 0.3) return onClose();
    if (info.velocity.y < -500 || h > vh() * 0.7) return snap('full');
    snap('half');
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.section
        style={{ height }}
        className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[1.75rem] border-t border-gold/40 bg-hanji-card shadow-[0_-12px_40px_-12px_rgb(var(--color-royal-deep)/0.35)]"
      >
        {/* 손잡이: 끌어서 높이 조절 */}
        <motion.div
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
          className="shrink-0 cursor-grab touch-none select-none px-5 pb-2 pt-2 active:cursor-grabbing"
        >
          <button
            type="button"
            onClick={() => snap(full ? 'half' : 'full')}
            className="mx-auto flex h-6 w-16 items-center justify-center"
            aria-label={full ? '절반으로 줄이기' : '전체 화면으로 펼치기'}
          >
            <span className="h-1.5 w-12 rounded-full bg-ink-faint/50" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-serif text-xl font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-gold/10" aria-label="닫기">
              <Icon name="close" />
            </button>
          </div>
        </motion.div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </motion.section>
    </div>
  );
}
