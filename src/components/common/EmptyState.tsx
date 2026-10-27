import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';

export function EmptyState({ icon = 'scroll', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-ink-soft">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 text-gold">
        <Icon name={icon} />
      </span>
      <p className="font-serif text-lg text-ink">{title}</p>
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}
