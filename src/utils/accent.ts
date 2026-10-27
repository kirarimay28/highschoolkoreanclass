import type { CSSProperties } from 'react';

/** 페이지별 포인트 색 ("R G B"). 과목·스터디룸 도구마다 홍·금 톤 안에서 살짝 다르게 */
export interface PageAccent {
  accent: string; // 제목·아이콘
  gold: string; // 금테·강조선
  tint: string; // 배경에 아주 옅게 번지는 색
}

/** --page-accent / --page-gold / --page-tint CSS 변수로 변환 */
export function accentStyle(a: PageAccent): CSSProperties {
  return { '--page-accent': a.accent, '--page-gold': a.gold, '--page-tint': a.tint } as CSSProperties;
}
