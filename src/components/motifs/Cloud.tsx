/** 뭉게구름 실루엣 (채움형) */
export function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 240 90" className={className} style={style} aria-hidden>
      <path
        fill="currentColor"
        d="M18 82c-10 0-14-12-4-16 4-14 20-20 32-14 6-18 26-26 42-18 10-16 36-18 48-2 14-6 30 2 32 16 14-2 26 8 24 20 10 2 12 14 2 14z"
      />
    </svg>
  );
}
