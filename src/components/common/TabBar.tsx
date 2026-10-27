import { useDesignGate } from '@/components/professor/DesignNotes';
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
  /** 터치 화면용: 높이 최소 44px */
  touch?: boolean;
  /** 지정하면 교수자에게 탭별 설계 의도('<noteScope>:<탭 id>')를 먼저 보여 줌 (문구가 있을 때만) */
  noteScope?: string;
}

/** 설정 배열을 받아 그리는 탭/필터 바 (모바일에서는 가로 스크롤) */
export function TabBar<T extends string>({ items, value, onChange, className, size = 'md', touch, noteScope }: TabBarProps<T>) {
  const gate = useDesignGate();
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto glass rounded-collar border border-white p-1 shadow-sm ring-1 ring-inset ring-gold/15 [scrollbar-width:none]',
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
            onClick={() => (noteScope && item.id !== value ? gate(`${noteScope}:${item.id}`, () => onChange(item.id)) : onChange(item.id))}
            className={cn(
              'flex flex-1 shrink-0 items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-collar font-medium transition-all',
              size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-2 text-[15px] sm:px-4',
              touch && 'min-h-[44px]',
              selected
                ? 'bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button'
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
