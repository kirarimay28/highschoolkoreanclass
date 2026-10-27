import type { EraId } from '@/data/literatureTimeline';

/** 고전 어휘 한 개 (KoreanEdu VocabItem + 출전 정보) */
export interface VocabItem {
  num: number;
  vocab: string;
  answer: string;
  category?: '명사형' | '동사·형용사형' | '부사형' | '조사·어미형';
  /** 연대기 지도 작품 id */
  workId?: string;
  work?: string;
  genre?: string;
  era?: EraId;
}

export type QuizFormat = '단답형' | '객관식';
export type VocabMode = 'exam' | 'practice';

export interface GradeResult {
  num: number;
  vocab: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
}

/** 시험·연습 한 번의 기록 (KoreanEdu VocabExamRecord + 문항별 결과) */
export interface VocabAttempt {
  id: string;
  mode: VocabMode;
  studentId: string;
  studentName: string;
  format: QuizFormat;
  /** 한국 시간 기준 날짜 YYYY-MM-DD */
  date: string;
  startNum: number;
  endNum: number;
  carryoverNums: number[];
  score: number;
  total: number;
  results: GradeResult[];
  createdAt: number;
}
