import { iconRegistry, type IconName } from './icons';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, className, strokeWidth = 1.75 }: IconProps) {
  const Component = iconRegistry[name];
  return <Component size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
