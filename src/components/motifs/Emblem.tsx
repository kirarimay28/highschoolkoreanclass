import { useId } from 'react';
import { cn } from '@/utils/format';

interface EmblemProps {
  size?: number;
  className?: string;
  /** 가운데에 한자 한 글자를 넣고 싶을 때 (예: "國"). 없으면 용·여의주 문양 */
  char?: string;
  /** 바깥 금사 점선 링이 천천히 회전 */
  animated?: boolean;
}

/**
 * 곤룡포 가슴의 원형 흉배(補)를 단순화한 엠블럼.
 * 실제 용 흉배 일러스트가 준비되면 이 컴포넌트 내부만 <img> 로 바꾸면 됩니다.
 */
export function Emblem({ size = 96, className, char, animated = false }: EmblemProps) {
  const uid = useId().replace(/:/g, '');
  const bg = `emblem-bg-${uid}`;
  const goldGrad = `emblem-gold-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn('shrink-0 drop-shadow-sm', className)}
      role="img"
      aria-label="흉배 엠블럼"
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--color-royal-light))" />
          <stop offset="100%" stopColor="rgb(var(--color-royal-deep))" />
        </radialGradient>
        <linearGradient id={goldGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-gold-light))" />
          <stop offset="55%" stopColor="rgb(var(--color-gold))" />
          <stop offset="100%" stopColor="rgb(var(--color-gold-dark))" />
        </linearGradient>
      </defs>

      {/* 바깥 금테 */}
      <circle cx="100" cy="100" r="96" fill={`url(#${goldGrad})`} />
      <circle cx="100" cy="100" r="90" fill={`url(#${bg})`} />
      {/* 금사 바느질 링 */}
      <g className={animated ? 'origin-center animate-slow-spin' : undefined} style={{ transformBox: 'fill-box' }}>
        <circle
          cx="100"
          cy="100"
          r="83"
          fill="none"
          stroke="rgb(var(--color-gold))"
          strokeOpacity="0.7"
          strokeWidth="1.6"
          strokeDasharray="2 5"
        />
      </g>
      <circle cx="100" cy="100" r="76" fill="none" stroke="rgb(var(--color-gold))" strokeOpacity="0.45" strokeWidth="1" />

      {/* 운문 — 사방의 구름 */}
      <g fill="none" stroke={`url(#${goldGrad})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <path d="M86 40c0-5 4-9 9-9 2-4 6-6 10-6 6 0 10 4 11 9 4 0 7 3 7 7" />
            <path d="M97 35c0-3 2-5 5-5s5 2 5 5" />
          </g>
        ))}
      </g>

      {char ? (
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-serif)"
          fontSize="64"
          fontWeight="700"
          fill={`url(#${goldGrad})`}
        >
          {char}
        </text>
      ) : (
        <g>
          {/* 용의 몸 — 여의주를 감싸는 S자 곡선 */}
          <path
            d="M62 128c10 14 34 16 44 2s-4-30 6-44 30-10 32 4"
            fill="none"
            stroke={`url(#${goldGrad})`}
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M62 128c10 14 34 16 44 2s-4-30 6-44 30-10 32 4"
            fill="none"
            stroke="rgb(var(--color-royal-deep))"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeDasharray="1.5 5"
            strokeLinecap="round"
          />
          {/* 머리 & 뿔 */}
          <circle cx="144" cy="90" r="8" fill={`url(#${goldGrad})`} />
          <path d="M146 83l6-9M140 83l1-10" stroke={`url(#${goldGrad})`} strokeWidth="2.4" strokeLinecap="round" />
          {/* 여의주 + 불꽃 */}
          <circle cx="100" cy="102" r="11" fill={`url(#${goldGrad})`} />
          <circle cx="96" cy="98" r="3.2" fill="rgb(var(--color-hanji))" opacity="0.7" />
          <path
            d="M100 88c-4-6 0-12 0-12s5 5 2 10c3-2 5-1 5-1s-2 5-7 3z"
            fill={`url(#${goldGrad})`}
            opacity="0.9"
          />
        </g>
      )}
    </svg>
  );
}
