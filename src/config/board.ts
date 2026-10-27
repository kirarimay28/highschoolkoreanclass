import type { BoardCategory } from '@/types';

/** 질의응답 게시판 카테고리 — 추가하려면 types 의 BoardCategory 에도 추가 */
export const boardCategories: { id: BoardCategory; label: string }[] = [
  { id: 'study', label: '공부' },
  { id: 'life', label: '생활' },
  { id: 'etc', label: '기타' },
];

export const boardVisibilityOptions = [
  { id: 'named', label: '실명', anonymous: false },
  { id: 'anonymous', label: '익명', anonymous: true },
] as const;

export const ANONYMOUS_LABEL = '익명';

export function getCategoryLabel(id: BoardCategory): string {
  return boardCategories.find((c) => c.id === id)?.label ?? id;
}
