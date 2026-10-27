/** 앱 전역에서 쓰는 도메인 타입 모음 */

export type Role = 'student' | 'teacher' | 'professor';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** 학생: "2학년 3반" 같은 부가 정보 */
  meta?: string;
}

export type SubjectId = 'literature' | 'reading-writing' | 'speech-language';

// ── 스터디룸 ──
export interface PlannerTask {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  text: string;
  done: boolean;
  createdAt: number;
}

export interface StudyRecord {
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  seconds: number;
}

// ── 질의응답 게시판 ──
export type BoardCategory = 'study' | 'life' | 'etc';

export interface BoardComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  anonymous: boolean;
  content: string;
  createdAt: number;
}

export interface BoardPost {
  id: string;
  category: BoardCategory;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  anonymous: boolean;
  createdAt: number;
  comments: BoardComment[];
}

// ── 도서관 ──
export interface LibraryFile {
  id: string;
  subjectId: SubjectId;
  title: string;
  description?: string;
  fileName: string;
  fileType: string; // 확장자 (pdf, pptx …)
  size: number; // bytes
  uploaderName: string;
  uploadedAt: number;
}

// ── 고쳐주세요 ──
export type FeedbackType = 'bug' | 'inconvenience' | 'request';
export type FeedbackStatus = 'received' | 'checking' | 'done';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  status: FeedbackStatus;
  createdAt: number;
}
