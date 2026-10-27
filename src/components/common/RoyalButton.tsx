import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/format';
import { Icon } from './Icon';
import type { IconName } from './icons';

export type RoyalButtonVariant = 'primary' | 'secondary' | 'ghost';
export type RoyalButtonSize = 'sm' | 'md' | 'lg';

export interface RoyalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RoyalButtonVariant;
  size?: RoyalButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  /** 탭/토글처럼 "선택됨" 상태 표시 */
  active?: boolean;
}

const base =
  'relative inline-flex items-center justify-center gap-2 font-medium rounded-collar border transition-all duration-200 ' +
  'select-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] whitespace-nowrap';

const variants: Record<RoyalButtonVariant, string> = {
  primary:
    'bg-royal text-hanji border-gold/70 shadow-[inset_0_0_0_1px_rgb(var(--color-gold)/0.25)] ' +
    'hover:bg-royal-light hover:shadow-glow enabled:hover:border-gold',
  secondary:
    'bg-hanji-card text-royal border-gold/50 hover:border-gold hover:bg-white hover:shadow-glow',
  ghost: 'bg-transparent text-royal border-transparent hover:bg-gold/10 hover:border-gold/30',
};

const activeStyles: Record<RoyalButtonVariant, string> = {
  primary: 'bg-royal-deep shadow-glow',
  secondary: 'bg-royal text-hanji border-gold shadow-glow hover:bg-royal-light',
  ghost: 'bg-gold/15 border-gold/40',
};

const sizes: Record<RoyalButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-9 px-3.5 text-sm', icon: 16 },
  md: { button: 'h-11 px-5 text-[15px]', icon: 18 },
  lg: { button: 'h-14 px-7 text-base', icon: 20 },
};

/** 앱 공통 버튼 — 옷깃 곡선 + 금사 테두리 */
export const RoyalButton = forwardRef<HTMLButtonElement, RoyalButtonProps>(function RoyalButton(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth,
    active,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const iconEl = icon ? <Icon name={icon} size={sizes[size].icon} /> : null;
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(base, variants[variant], sizes[size].button, active && activeStyles[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {iconPosition === 'left' && iconEl}
      {children}
      {iconPosition === 'right' && iconEl}
    </button>
  );
});
