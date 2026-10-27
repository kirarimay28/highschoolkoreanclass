/** DIY 구조도 데이터 구조 */

export type StructureActivity = 'paragraph' | 'content';
export type StructureMode = 'guided' | 'free';
/** 내용 구조도 노드 색: 핵심 개념(홍) / 원인·원리(금) / 활용(쪽빛) / 조건·수치(먹) */
export type ConceptColor = 'core' | 'cause' | 'use' | 'cond';

export interface DiagramNode {
  id: string;
  kind: 'paragraph' | 'concept';
  /** 문단 카드: 문단 번호(1~5) / 개념 노드: 없음 */
  paragraph?: number;
  /** 문단 카드: 역할 라벨 */
  role?: string;
  /** 문단 카드: 한 줄 요약 / 개념 노드: 개념 내용 */
  text: string;
  color?: ConceptColor;
  x: number;
  y: number;
  /** 지문에서 끌어온 문장 (예: "2-3" = ②문단 3번째 문장) */
  sentenceKey?: string;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  field: string;
  /** 문단 배열 (①, ②, … 순서) */
  paragraphs: string[];
  /** 전체 구조 유형 (모범 답안 화면에 표시) */
  structureType?: string;
  modelParagraph: Diagram;
  modelContent: Diagram;
  /** 생각 질문 */
  questions: string[];
}

/** 학생 한 명의 활동 기록 */
export interface StructureWork {
  id: string;
  passageId: string;
  activity: StructureActivity;
  studentId: string;
  studentName: string;
  mode: StructureMode;
  draft: Diagram;
  firstSubmission?: Diagram;
  firstAt?: number;
  revised?: Diagram;
  revisedAt?: number;
  teacherComment?: string;
  commentBy?: string;
  shared: boolean;
  shareName: boolean;
  updatedAt: number;
}

/** 학생이 지문에 남긴 형광펜·생각 질문 답 */
export interface StructureNotes {
  passageId: string;
  studentId: string;
  highlights: string[]; // sentenceKey 목록
  answers: string[];
}

/** 함께 보기 갤러리 항목 */
export interface GalleryItem {
  id: string;
  activity: StructureActivity;
  studentName?: string; // 이름 표시를 고른 경우만
  diagram: Diagram;
  teacherComment?: string;
}
