import { cn } from '@/utils/format';

/** 프로필 사진 대신 이름 첫 글자를 보여주는 원형 아바타 (사진 연결 시 src 사용) */
export function Avatar({ name, src, size = 48, className }: { name: string; src?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-royal-light to-royal font-serif font-bold text-hanji ring-2 ring-white shadow-soft',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.trim().charAt(0)}
    </span>
  );
}
