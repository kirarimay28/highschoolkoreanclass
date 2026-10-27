import type { CSSProperties } from 'react';
import type { IconName } from '@/components/common/icons';
import type { Tone } from '@/components/common/IconTile';
import type { SubjectId } from '@/types';

export interface SubjectSection {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}

/**
 * 과목 포인트 색 ("R G B" 형식). 기본 홍·금 톤 안에서 과목마다 살짝 다르게.
 *  - accent: 제목·아이콘 색
 *  - gold:   메달 금테·강조선
 *  - tint:   배경에 아주 옅게 번지는 색
 */
export interface SubjectAccent {
  accent: string;
  gold: string;
  tint: string;
}

export interface SubjectConfig {
  id: SubjectId;
  name: string;
  hanja: string;
  description: string;
  icon: IconName;
  tone: Tone;
  accent: SubjectAccent;
  /** 과목 페이지 안의 메뉴 — 과목마다 다르게 구성 가능 */
  sections: SubjectSection[];
}

/** 과목 목록 — 로비 과목 선택, 과목 페이지, 도서관 분류에서 공통으로 사용 */
export const subjects: SubjectConfig[] = [
  {
    id: 'literature',
    name: '문학',
    hanja: '文學',
    description: '시·소설·수필·극으로 삶을 읽어요',
    icon: 'feather',
    tone: 'royal',
    // 연지(臙脂) — 붉은 꽃잎빛
    accent: { accent: '163 38 64', gold: '201 162 39', tint: '214 112 130' },
    sections: [
      { id: 'lessons', title: '수업 진도', description: '갈래별 작품과 차시별 학습 목표', icon: 'book' },
      { id: 'activities', title: '활동지', description: '작품 감상·비평 활동', icon: 'notebook' },
      { id: 'assignments', title: '과제', description: '감상문·창작 과제와 마감일', icon: 'todo' },
      { id: 'quiz', title: '형성평가', description: '작품 이해 확인 문제', icon: 'help' },
    ],
  },
  {
    id: 'reading-writing',
    name: '독서와 작문',
    hanja: '讀書',
    description: '깊이 읽고 논리적으로 써요',
    icon: 'notebook',
    tone: 'indigo',
    // 대추빛 홍색 + 먹 — 차분한 서재 느낌
    accent: { accent: '118 36 44', gold: '176 140 58', tint: '150 118 104' },
    sections: [
      { id: 'lessons', title: '수업 진도', description: '읽기 전략과 쓰기 과정 차시별 정리', icon: 'book' },
      { id: 'activities', title: '활동지', description: '글 구조 분석·개요 짜기 활동', icon: 'notebook' },
      { id: 'assignments', title: '과제', description: '논설문·보고서 과제와 마감일', icon: 'todo' },
      { id: 'quiz', title: '형성평가', description: '독해·작문 확인 문제', icon: 'help' },
    ],
  },
  {
    id: 'speech-language',
    name: '화법과 언어',
    hanja: '話法',
    description: '말하기와 우리말의 원리를 탐구해요',
    icon: 'mic',
    tone: 'jade',
    // 주홍(朱紅) — 밝고 또렷한 목소리
    accent: { accent: '178 62 34', gold: '214 172 52', tint: '226 140 92' },
    sections: [
      { id: 'lessons', title: '수업 진도', description: '화법 갈래와 국어 문법 차시별 정리', icon: 'book' },
      { id: 'activities', title: '활동지', description: '토론·발표·문법 탐구 활동', icon: 'notebook' },
      { id: 'assignments', title: '과제', description: '발표 준비·탐구 보고서와 마감일', icon: 'todo' },
      { id: 'quiz', title: '형성평가', description: '음운·문법·화법 확인 문제', icon: 'help' },
    ],
  },
];

export function getSubject(id: string | undefined): SubjectConfig | undefined {
  return subjects.find((s) => s.id === id);
}

/** 과목 페이지 주소 */
export const subjectPath = (id: SubjectId) => `/subject/${id}`;

/** 메달 등 화면 요소를 과목 색으로 칠하기 위한 CSS 변수 */
export function subjectStyle(subject: SubjectConfig): CSSProperties {
  return {
    '--subject-accent': subject.accent.accent,
    '--subject-gold': subject.accent.gold,
    '--subject-tint': subject.accent.tint,
  } as CSSProperties;
}

/** 로비 → 과목 페이지로 이어지는 메달 전환용 layoutId */
export const subjectMedalLayoutId = (id: SubjectId) => `subject-medal-${id}`;
