import type { SubjectId } from './index';

/**
 * 개념 복습 강의 (KoreanEdu 중세국어 강의 영상의 VideoLecture / VideoProgress / VideoMemo 를 옮김)
 * - 주차(week) 대신 개념 단원(unit) + 단원 안 순서(order)
 * - 메모는 "나만 보기"만 (공유 없음)
 */
export interface Lecture {
  id: string;
  subjectId: SubjectId;
  title: string;
  /** 개념 단원 (config/lectures.ts 의 단원 이름) */
  unit: string;
  /** 단원 안 순서 — 작을수록 위 */
  order: number;
  /** 관련 성취기준 코드 (예: 12화언01-03) */
  standards: string[];
  description?: string;
  /** 파일로 올린 영상의 저장 위치 */
  storagePath?: string;
  /** 링크로 추가한 영상 (YouTube 등) */
  linkUrl?: string;
  mimeType?: string;
  size?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
  uploadedByName: string;
  createdAt: number;
  /** 전체 조회 수 (누가 봤는지는 저장하지 않음) */
  views: number;
}

/** 학생 본인만 보는 시청 기록 */
export interface LectureProgress {
  lectureId: string;
  positionSeconds: number;
  /** 시청한 시간(초, 대략) */
  watchedSeconds: number;
  /** "봤어요" */
  completed: boolean;
  updatedAt: number;
}

/** 타임스탬프 메모 — 나만 보기 */
export interface LectureMemo {
  id: string;
  lectureId: string;
  positionSeconds: number;
  text: string;
  createdAt: number;
}

export interface LectureInput {
  subjectId: SubjectId;
  title: string;
  unit: string;
  standards: string[];
  description?: string;
  linkUrl?: string;
  file?: File;
}
