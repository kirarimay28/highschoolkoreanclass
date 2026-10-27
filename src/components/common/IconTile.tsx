import { cn } from '@/utils/format';
import { Icon } from './Icon';
import type { IconName } from './icons';

/** 아이콘 타일 색. 새 톤은 theme.css 에 색을 만들고 여기에 추가 */
export type Tone = 'royal' | 'gold' | 'indigo' | 'jade' | 'plum';

const tones: Record<Tone, string> = {
  royal: 'bg-royal/10 text-royal ring-royal/15',
  gold: 'bg-gold/15 text-gold-dark ring-gold/25',
  indigo: 'bg-indigo/10 text-indigo ring-indigo/15',
  jade: 'bg-jade/10 text-jade ring-jade/15',
  plum: 'bg-plum/10 text-plum ring-plum/15',
};

const sizes = {
  sm: { box: 'h-9 w-9 rounded-xl', icon: 18 },
  md: { box: 'h-12 w-12 rounded-2xl', icon: 22 },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 26 },
};

/** 둥근 사각형 안의 색깔 아이콘 */
export function IconTile({ icon, tone = 'royal', size = 'md', className }: { icon: IconName; tone?: Tone; size?: keyof typeof sizes; className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center bg-white/70 ring-1 ring-inset', tones[tone], sizes[size].box, className)}>
      <Icon name={icon} size={sizes[size].icon} />
    </span>
  );
}
