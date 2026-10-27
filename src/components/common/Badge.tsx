import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', className ?? 'border-gold/40 bg-gold/10 text-gold-dark')}>
      {children}
    </span>
  );
}
