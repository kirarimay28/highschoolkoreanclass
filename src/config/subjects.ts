import type { IconName } from '@/components/common/icons';
import type { Tone } from '@/components/common/IconTile';
import type { SubjectId } from '@/types';
import type { PageAccent } from '@/utils/accent';

export interface SubjectSection {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  /**
   * 'ready'     — 기능이 있는 카드: 금색 "바로 가기" 배지 + 미리보기, 카드 전체가 링크 (path 필요)
   * 'preparing' — 준비 중 카드
   * 기능이 생기면 status 를 'ready' 로 바꾸고 path·preview 를 채우면 됩니다.
   */
  status: 'ready' | 'preparing';
  /** 카드가 여는 페이지 (과목 주소 기준 상대 경로) */
  path?: string;
  /** 'ready' 카드 아래 미니 미리보기 (pages/subjects/SectionPreviews.tsx) */
  preview?: SectionPreviewId;
}

export type SectionPreviewId = 'timeline' | 'diy' | 'lectures';

/**
 * 과목 포인트 색 ("R G B" 형식). 기본 홍·금 톤 안에서 과목마다 살짝 다르게.
 *  - accent: 제목·아이콘 색
 *  - gold:   메달 금테·강조선
 *  - tint:   배경에 아주 옅게 번지는 색
 */
export type SubjectAccent = PageAccent;

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
      { id: 'timeline', title: '한국 문학 연대기 지도', description: '시대 × 갈래로 보는 고전 문학의 흐름', icon: 'map', status: 'ready', path: 'timeline', preview: 'timeline' },
      { id: 'activities', title: '활동지', description: '작품 감상·비평 활동', icon: 'notebook', status: 'preparing' },
      { id: 'assignments', title: '과제', description: '감상문·창작 과제와 마감일', icon: 'todo', status: 'preparing' },
      { id: 'quiz', title: '형성평가', description: '작품 이해 확인 문제', icon: 'help', status: 'preparing' },
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
      { id: 'diy', title: 'DIY 구조도', description: '함께 읽은 지문을 구조도로 스스로 정리해요', icon: 'map', status: 'ready', path: 'diy', preview: 'diy' },
      { id: 'activities', title: '활동지', description: '글 구조 분석·개요 짜기 활동', icon: 'notebook', status: 'preparing' },
      { id: 'assignments', title: '과제', description: '논설문·보고서 과제와 마감일', icon: 'todo', status: 'preparing' },
      { id: 'quiz', title: '형성평가', description: '독해·작문 확인 문제', icon: 'help', status: 'preparing' },
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
      { id: 'lectures', title: '개념 복습 강의', description: '헷갈리는 개념을 영상으로 스스로 복습해요', icon: 'play', status: 'ready', path: 'lectures', preview: 'lectures' },
      { id: 'activities', title: '활동지', description: '토론·발표·문법 탐구 활동', icon: 'notebook', status: 'preparing' },
      { id: 'assignments', title: '과제', description: '발표 준비·탐구 보고서와 마감일', icon: 'todo', status: 'preparing' },
      { id: 'quiz', title: '형성평가', description: '음운·문법·화법 확인 문제', icon: 'help', status: 'preparing' },
    ],
  },
];

export function getSubject(id: string | undefined): SubjectConfig | undefined {
  return subjects.find((s) => s.id === id);
}

/** 과목 페이지 주소 */
export const subjectPath = (id: SubjectId) => `/subject/${id}`;

/** 로비 → 과목 페이지로 이어지는 메달 전환용 layoutId */
export const subjectMedalLayoutId = (id: SubjectId) => `subject-medal-${id}`;
