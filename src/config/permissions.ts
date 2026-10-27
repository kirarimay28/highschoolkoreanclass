import type { Role } from '@/types';

/**
 * 역할별 권한 표.
 * 어떤 기능을 누가 쓸 수 있는지 바꾸려면 여기 배열만 수정하세요.
 */
export const permissions = {
  /** 도서관 자료 업로드·삭제 */
  uploadLibrary: ['teacher', 'professor'],
  /** 고쳐주세요 처리 상태 변경 */
  changeFeedbackStatus: ['teacher', 'professor'],
  /** 게시판 익명 글의 실명 열람 */
  seeAnonymousAuthor: ['teacher', 'professor'],
  /** 게시판 글 삭제(타인 글 포함) */
  moderateBoard: ['teacher', 'professor'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof permissions;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (permissions[permission] as Role[]).includes(role);
}
