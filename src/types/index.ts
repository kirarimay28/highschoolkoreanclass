/** 앱 전역에서 쓰는 도메인 타입 모음 */

export type Role = 'student' | 'teacher' | 'professor';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** 학생: "2학년 3반" 같은 부가 정보 */
  meta?: string;
}

/** 선생님이 등록한 학생 (등록된 학생만 로그인 가능) */
export interface RegisteredStudent {
  studentId: string; // 학번
  name: string;
  registeredAt: number;
  registeredBy: string; // 등록한 선생님 이름
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
  /** 서버가 작성자 정보를 가린 익명 댓글에서 "내 댓글"인지 */
  isMine?: boolean;
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
  /** 목록 화면용 댓글 수 (서버 목록은 댓글 본문 없이 개수만 옴) */
  commentCount?: number;
  /** 서버가 작성자 정보를 가린 익명 글에서 "내 글"인지 */
  isMine?: boolean;
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
  /** Supabase Storage 안의 파일 위치 */
  storagePath?: string;
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
