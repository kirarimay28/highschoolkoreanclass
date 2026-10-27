import type { Role } from '@/types';

/**
 * 역할별 권한 표.
 * 어떤 기능을 누가 쓸 수 있는지 바꾸려면 여기 배열만 수정하세요.
 */
export const permissions = {
  /** 도서관 자료 업로드·삭제 */
  uploadLibrary: ['teacher'],
  /** 고쳐주세요 처리 상태 변경 */
  changeFeedbackStatus: ['teacher'],
  /** 게시판 익명 글의 실명 열람 */
  seeAnonymousAuthor: ['teacher'],
  /** DIY 구조도: 학생 제출 열람·코멘트·갤러리 공유·지문 관리 */
  manageStructure: ['teacher'],
  /** 개념 복습 강의: 영상 올리기·수정·삭제·순서 바꾸기 (조회 수만 보임) */
  manageLectures: ['teacher'],
  /** 고전 어휘: 시험 응시 기록 보기·지우기 (연습 기록은 볼 수 없음) */
  manageVocabExams: ['teacher'],
  /** 학생 등록·삭제 */
  manageStudents: ['teacher'],
  /** 게시판 글 삭제(타인 글 포함) */
  moderateBoard: ['teacher'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof permissions;

/**
 * 교수자는 권한이 따로 없습니다. 교수자는 상단의 [학생 화면으로 보기]/[선생님 화면으로 보기]로
 * 학생·선생님 역할을 빌려 체험 모드(샘플 데이터, 실제 데이터에 남지 않음)에서 둘러봅니다.
 */
export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (permissions[permission] as Role[]).includes(role);
}
