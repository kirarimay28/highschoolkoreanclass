import { Cloud } from './Cloud';
import { Crane } from './Crane';

/**
 * 화면 뒤에 깔리는 장식 레이어 — 번지는 빛, 구름, 학.
 * 위치·투명도는 여기서만 조절하면 됩니다.
 */
export function BackgroundDecor({ crane = true }: { crane?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* 번지는 빛 */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-hanji-card blur-3xl" />
      <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-royal-light/10 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-gold/15 blur-3xl" />

      {/* 구름 */}
      <Cloud className="absolute left-[3%] top-[11%] w-28 animate-drift text-gold/15 sm:w-36" />
      <Cloud className="absolute -left-6 bottom-[4%] w-56 text-royal/[0.07] sm:w-72" />
      <Cloud className="absolute bottom-[3%] left-36 w-24 text-gold/15 sm:left-56" style={{ animationDelay: '-6s' }} />
      <Cloud className="absolute right-[8%] top-[62%] hidden w-32 animate-drift text-gold/[0.12] md:block" style={{ animationDelay: '-3s' }} />

      {/* 학 */}
      {crane && <Crane className="absolute -right-4 top-[6%] w-40 text-royal/[0.08] sm:right-[4%] sm:w-56" />}
    </div>
  );
}
