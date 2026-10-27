import type { Role } from '@/types';
import { isRemoteBackend } from './backend';

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
  /** DIY 구조도: 학생 제출 열람·코멘트·갤러리 공유·지문 관리 */
  manageStructure: ['teacher', 'professor'],
  /** 개념 복습 강의: 영상 올리기·수정·삭제·순서 바꾸기 (조회 수만 보임) */
  manageLectures: ['teacher', 'professor'],
  /** 고전 어휘: 시험 응시 기록 보기·지우기 (연습 기록은 볼 수 없음) */
  manageVocabExams: ['teacher', 'professor'],
  /** 학생 등록·삭제 */
  manageStudents: ['teacher', 'professor'],
  /** 게시판 글 삭제(타인 글 포함) */
  moderateBoard: ['teacher', 'professor'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof permissions;

/**
 * Supabase 를 쓸 때는 교수자(퀴즈 로그인, 서버 계정 없음)에게
 * 서버 권한이 필요한 기능을 열지 않습니다. 이 기능들은 선생님 계정으로 로그인해야 합니다.
 */
export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (isRemoteBackend && role === 'professor') return false;
  return (permissions[permission] as Role[]).includes(role);
}
