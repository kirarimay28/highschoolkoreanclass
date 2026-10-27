import { cn } from '@/utils/format';

/** 운문(구름 무늬)이 가운데 들어간 금사 구분선 */
export function CloudDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-gold', className)} aria-hidden>
      <span className="gold-rule flex-1" />
      <svg width="44" height="18" viewBox="0 0 44 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M4 14c0-4 3-7 7-7 1-3 4-5 7-5 4 0 7 3 7 7" />
        <path d="M15 9c0-2 1.5-3.5 3.5-3.5S22 7 22 9" />
        <path d="M24 14c0-3 2.5-5 5-5 1-2 3-3 5-3 3 0 6 2.5 6 6" opacity="0.7" />
      </svg>
      <span className="gold-rule flex-1" />
    </div>
  );
}
