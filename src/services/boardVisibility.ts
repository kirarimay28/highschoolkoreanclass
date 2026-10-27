import { ANONYMOUS_LABEL } from '@/config/board';
import { can } from '@/config/permissions';
import type { Role } from '@/types';

interface Authored {
  authorId: string;
  authorName: string;
  anonymous: boolean;
  /** 서버가 작성자를 가린 경우 "내 글" 표시 */
  isMine?: boolean;
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
 * Supabase 사용 시에는 서버(list_posts/get_post 함수)가 학생에게 익명 글의
 *    실명을 아예 보내지 않습니다. 이 함수는 화면 표시만 담당합니다.
 */
export function getAuthorDisplayName(item: Authored, viewer: Viewer | null): string {
  if (!item.anonymous) return item.authorName;
  if (viewer && can(viewer.role, 'seeAnonymousAuthor')) {
    return `${item.authorName} (${ANONYMOUS_LABEL})`;
  }
  if (viewer && (item.isMine || viewer.id === item.authorId)) return `${ANONYMOUS_LABEL} (나)`;
  return ANONYMOUS_LABEL;
}

/** 내가 쓴 글·댓글인지 (익명이어도 본인은 알 수 있음) */
export function isOwnedBy(item: Authored, viewer: Viewer | null): boolean {
  return Boolean(viewer && (item.isMine || item.authorId === viewer.id));
}
