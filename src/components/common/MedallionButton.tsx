import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { forwardRef, useState, type CSSProperties } from 'react';
import { cn } from '@/utils/format';
import { iconRegistry, type IconName } from './icons';

/**
 * 곤룡포 흉배를 닮은 원형 메달 버튼.
 * - 등장: 아래에서 '퐁' 튀어 오름 (index 순서대로 0.08초 간격)
 * - 대기: 위아래로 둥실둥실 (index 마다 박자가 조금씩 다름)
 * - 호버·키보드 포커스: 1.08배로 '통' 커지고 금테가 빛남 / 누르면 0.92배
 * - state="selected": 1.15배 + 금테 위로 빛이 한 바퀴 + 금빛 파동
 * - state="dimmed": 0.9배 + 흐려짐
 * 움직임 줄이기 설정 사용자에게는 튀는·둥실 모션을 끄고 선택 강조만 남깁니다.
 */

export type MedallionState = 'idle' | 'selected' | 'dimmed';
export type MedallionSize = 'lg' | 'md' | 'sm';

/** 메달 색 변주 ("R G B"). 생략하면 기본 홍·금 */
export interface MedallionColors {
  accent: string; // 아이콘 색
  gold: string; // 금테
  tint: string; // 바탕에 번지는 색
}

export interface MedallionButtonProps {
  icon: IconName;
  label: string;
  /** 호버·포커스 때만 이름 아래에 보이는 설명 */
  description?: string;
  size?: MedallionSize;
  state?: MedallionState;
  /** 등장 순서 + 둥실 박자 */
  index?: number;
  /** 아래에서 튀어 오르며 등장 (기본 true) */
  entrance?: boolean;
  /** 하위 선택지를 펼치는 버튼이면 펼침 여부 */
  expanded?: boolean;
  onSelect?: () => void;
  className?: string;
  /** 다른 화면의 같은 layoutId 메달로 이어지는 전환 (framer-motion) */
  layoutId?: string;
  colors?: MedallionColors;
  /** false 면 누를 수 없는 장식용 메달 (페이지 헤더 등) */
  interactive?: boolean;
  /** 이름·설명을 원 아래에 표시할지 (기본 true) */
  showLabel?: boolean;
}

const sizes: Record<MedallionSize, { circle: string; icon: string; label: string }> = {
  lg: {
    circle: 'h-[120px] w-[120px] sm:h-[190px] sm:w-[190px]',
    icon: 'h-11 w-11 sm:h-[68px] sm:w-[68px]',
    label: 'mt-3 text-lg sm:mt-4 sm:text-2xl',
  },
  md: {
    circle: 'h-[96px] w-[96px] sm:h-[132px] sm:w-[132px]',
    icon: 'h-10 w-10 sm:h-14 sm:w-14',
    label: 'mt-2 text-lg sm:text-xl',
  },
  sm: {
    circle: 'h-[84px] w-[84px] sm:h-[112px] sm:w-[112px]',
    icon: 'h-8 w-8 sm:h-10 sm:w-10',
    label: 'mt-2 text-[15px] sm:text-lg',
  },
};

/** 살짝 넘쳤다가 제자리로 오는 스프링 */
const bouncy = { type: 'spring', stiffness: 520, damping: 13, mass: 0.8 } as const;

export const MedallionButton = forwardRef<HTMLButtonElement, MedallionButtonProps>(function MedallionButton(
  {
    icon,
    label,
    description,
    size = 'lg',
    state = 'idle',
    index = 0,
    entrance = true,
    expanded,
    onSelect,
    className,
    layoutId,
    colors,
    interactive = true,
    showLabel = true,
  },
  ref,
) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(false); // 호버 또는 키보드 포커스
  const IconComponent = iconRegistry[icon];
  const s = sizes[size];

  const stateVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 70, scale: 0.55 },
    idle: { opacity: 1, y: 0, scale: 1, filter: 'saturate(1)' },
    selected: { opacity: 1, y: 0, scale: 1.15, filter: 'saturate(1.1)' },
    dimmed: { opacity: 0.4, y: 0, scale: 0.9, filter: 'saturate(0.6)' },
  };

  const colorVars = colors
    ? ({ '--medal-ink': colors.accent, '--medal-gold': colors.gold, '--medal-tint': colors.tint } as CSSProperties)
    : undefined;
  const motionOn = interactive && !reduce && state === 'idle';
  const widths: Record<MedallionSize, string> = {
    lg: 'w-[140px] sm:w-[220px]',
    md: 'w-[110px] sm:w-[150px]',
    sm: 'w-[104px] sm:w-[140px]',
  };

  return (
    <motion.div
      className={cn('flex flex-col items-center', showLabel ? widths[size] : 'w-auto', className)}
      variants={stateVariants}
      initial={entrance ? 'hidden' : false}
      animate={state}
      transition={
        reduce
          ? { duration: 0.2 }
          : { ...bouncy, delay: entrance && state === 'idle' ? index * 0.08 : 0, opacity: { duration: 0.25, delay: entrance ? index * 0.08 : 0 } }
      }
      style={{ zIndex: state === 'selected' ? 2 : 1, ...colorVars }}
    >
      {/* 대기 중 둥실둥실 — 선택 연출 중에는 멈춤 */}
      <motion.div
        animate={motionOn ? { y: [0, -6, 0] } : { y: 0 }}
        transition={
          motionOn
            ? { duration: 3.2 + (index % 3) * 0.45, repeat: Infinity, ease: 'easeInOut', delay: 0.6 + index * 0.37 }
            : { duration: 0.2 }
        }
      >
        <MedalShell
          ref={ref}
          interactive={interactive}
          layoutId={layoutId}
          aria-label={description ? `${label} — ${description}` : label}
          aria-expanded={expanded}
          onClick={onSelect}
          onHoverStart={() => setActive(true)}
          onHoverEnd={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          whileHover={motionOn ? { scale: 1.08 } : undefined}
          whileFocus={motionOn ? { scale: 1.08 } : undefined}
          whileTap={interactive && !reduce ? { scale: 0.92 } : undefined}
          transition={{ type: 'spring', stiffness: 600, damping: 11, layout: { type: 'spring', stiffness: 260, damping: 26 } }}
          className={cn(
            'medallion group relative flex shrink-0 items-center justify-center rounded-full text-[rgb(var(--medal-ink))] outline-none',
            s.circle,
            interactive && active && 'medallion-glow',
            state === 'selected' && 'medallion-glow',
          )}
        >
          {/* 금테 두 겹 + 금사 바느질 */}
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-[rgb(var(--medal-gold))]" aria-hidden />
          <span className="pointer-events-none absolute inset-[5px] rounded-full border border-[rgb(var(--medal-gold)/0.7)] sm:inset-[7px]" aria-hidden />
          <span className="pointer-events-none absolute inset-[11px] rounded-full border border-dashed border-[rgb(var(--medal-gold)/0.3)] sm:inset-[15px]" aria-hidden />

          {/* 선택: 금테 위로 빛이 한 바퀴 + 바깥으로 금빛 파동 */}
          <AnimatePresence>
            {state === 'selected' && (
              <>
                <motion.span
                  key="sweep"
                  className="medallion-sweep pointer-events-none absolute -inset-[3px] rounded-full"
                  initial={{ rotate: 0, opacity: 1 }}
                  animate={reduce ? { opacity: 1 } : { rotate: 360, opacity: [1, 1, 0.85] }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  aria-hidden
                />
                {!reduce && (
                  <motion.span
                    key="ripple"
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-[rgb(var(--medal-gold))]"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.65, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    aria-hidden
                  />
                )}
              </>
            )}
          </AnimatePresence>

          <IconComponent className={cn('relative', s.icon)} strokeWidth={1.5} aria-hidden />
        </MedalShell>
      </motion.div>

      {showLabel && <p className={cn('text-center font-serif font-bold text-royal-deep', s.label)}>{label}</p>}

      {/* 설명은 호버·포커스 때만 */}
      {showLabel && <div className="relative h-10 w-full sm:h-11">
        <AnimatePresence>
          {description && active && state === 'idle' && (
            <motion.p
              key="desc"
              className="absolute inset-x-0 top-0 text-balance text-center text-xs text-ink-soft sm:text-sm"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>}
    </motion.div>
  );
});

type ShellProps = React.ComponentProps<typeof motion.button> & { interactive: boolean };

/** 누를 수 있으면 button, 장식용이면 div (같은 모양·같은 layoutId 전환) */
const MedalShell = forwardRef<HTMLButtonElement, ShellProps>(function MedalShell({ interactive, children, ...rest }, ref) {
  if (interactive) {
    return (
      <motion.button ref={ref} type="button" {...rest}>
        {children}
      </motion.button>
    );
  }
  const { onClick: _c, onFocus: _f, onBlur: _b, whileFocus: _wf, whileTap: _wt, whileHover: _wh, 'aria-expanded': _e, ...divProps } = rest;
  return (
    <motion.div {...(divProps as React.ComponentProps<typeof motion.div>)} role="img">
      {children}
    </motion.div>
  );
});
