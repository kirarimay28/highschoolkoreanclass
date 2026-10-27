/**
 * 단정학(丹頂鶴) 실루엣 — 문관 흉배의 학 문양에서 따온 장식.
 * 머리 위 붉은 점(단정)이 포인트입니다.
 */
export function Crane({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden>
      <g fill="currentColor">
        {/* 꼬리 깃 */}
        <path d="M62 120 L14 132 L58 127 Z" opacity="0.8" />
        <path d="M64 125 L22 148 L66 131 Z" opacity="0.65" />
        {/* 몸통 */}
        <path d="M58 120c10-28 58-34 80-14 12 11 4 30-22 33-22 2-44-4-58-19z" />
        {/* 날개 */}
        <path d="M72 116c18-20 54-20 66-6-18 2-38 10-66 6z" opacity="0.55" />
        {/* 다리 */}
        <path d="M104 138l-6 48h2.5l6.5-48zM116 137l3 49h2.5l-2.5-49z" opacity="0.85" />
        <path d="M92 186h14M113 186h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      </g>
      {/* 목 */}
      <path d="M134 106c14-22 14-52 24-76" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* 머리 · 부리 · 단정 */}
      <circle cx="158" cy="28" r="7" fill="currentColor" />
      <path d="M163 26l26-5-25 10z" fill="currentColor" />
      <circle cx="157" cy="22" r="3.2" fill="rgb(var(--color-royal-light))" />
    </svg>
  );
}
