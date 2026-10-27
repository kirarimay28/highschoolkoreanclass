import { cn } from '@/utils/format';
import { Icon } from './Icon';
import type { IconName } from './icons';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: IconName;
}

interface TabBarProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/** 설정 배열을 받아 그리는 탭/필터 바 (모바일에서는 가로 스크롤) */
export function TabBar<T extends string>({ items, value, onChange, className, size = 'md' }: TabBarProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-collar border border-gold/40 bg-hanji-card/80 p-1 [scrollbar-width:none]',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex flex-1 shrink-0 items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-collar font-medium transition-all',
              size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-2 text-[15px] sm:px-4',
              selected
                ? 'bg-royal text-hanji shadow-[inset_0_0_0_1px_rgb(var(--color-gold)/0.6)]'
                : 'text-ink-soft hover:bg-gold/10 hover:text-royal',
            )}
          >
            {item.icon && <Icon name={item.icon} size={size === 'sm' ? 15 : 17} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
