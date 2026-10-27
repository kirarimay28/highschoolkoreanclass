import { useMemo } from 'react';

/** 로그인 성공 시 잠깐 피어오르는 금빛 반짝임 */
export function GoldSparkles({ count = 18 }: { count?: number }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${5 + Math.random() * 90}%`,
        top: `${10 + Math.random() * 80}%`,
        size: 8 + Math.random() * 14,
        delay: `${(i % 6) * 0.12}s`,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {sparks.map((s, i) => (
        <svg
          key={i}
          className="absolute animate-sparkle text-gold opacity-0"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </svg>
      ))}
    </div>
  );
}
