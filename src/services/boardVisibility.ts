import { ANONYMOUS_LABEL } from '@/config/board';
import { can } from '@/config/permissions';
import type { Role } from '@/types';

interface Authored {
  authorId: string;
  authorName: string;
  anonymous: boolean;
}

interface Viewer {
  id: string;
  role: Role;
}

/**
 * 게시글·댓글 작성자 이름을 "보는 사람" 기준으로 결정하는 단 하나의 함수.
 *  - 실명 글: 누구에게나 실명
 *  - 익명 글: 학생에게는 "익명", 선생님·교수자에게는 "실명 (익명)"
 *  - 본인 글: "익명 (나)" 처럼 본인임을 표시
 *
 * ⚠️ 지금은 브라우저에 실명이 저장되어 있습니다. 실제 서버 연결 시에는
 *    서버가 학생에게 실명을 아예 내려주지 않도록 같은 규칙을 서버에서도 적용하세요.
 */
export function getAuthorDisplayName(item: Authored, viewer: Viewer | null): string {
  if (!item.anonymous) return item.authorName;
  if (viewer && can(viewer.role, 'seeAnonymousAuthor')) {
    return `${item.authorName} (${ANONYMOUS_LABEL})`;
  }
  if (viewer && viewer.id === item.authorId) return `${ANONYMOUS_LABEL} (나)`;
  return ANONYMOUS_LABEL;
}
