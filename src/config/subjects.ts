import type { IconName } from '@/components/common/icons';
import type { SubjectId } from '@/types';

export interface SubjectConfig {
  id: SubjectId;
  name: string;
  hanja: string;
  description: string;
  icon: IconName;
}

/** 과목 목록 — 과목 선택 화면, 과목 탭, 도서관 분류에서 공통으로 사용 */
export const subjects: SubjectConfig[] = [
  {
    id: 'literature',
    name: '문학',
    hanja: '文學',
    description: '시·소설·수필·극으로 삶을 읽어요',
    icon: 'feather',
  },
  {
    id: 'reading-writing',
    name: '독서와 작문',
    hanja: '讀書',
    description: '깊이 읽고 논리적으로 써요',
    icon: 'notebook',
  },
  {
    id: 'speech-language',
    name: '화법과 언어',
    hanja: '話法',
    description: '말하기와 우리말의 원리를 탐구해요',
    icon: 'mic',
  },
];

export interface SubjectSection {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}

/** 각 과목 페이지 안의 기본 구역 (지금은 "준비 중" 자리) */
export const subjectSections: SubjectSection[] = [
  { id: 'lessons', title: '수업 진도', description: '차시별 학습 목표와 내용', icon: 'book' },
  { id: 'activities', title: '활동지', description: '수업 중 함께 하는 활동', icon: 'notebook' },
  { id: 'assignments', title: '과제', description: '제출할 과제와 마감일', icon: 'todo' },
  { id: 'quiz', title: '형성평가', description: '배운 내용 확인 문제', icon: 'help' },
];

export function getSubject(id: string | undefined): SubjectConfig | undefined {
  return subjects.find((s) => s.id === id);
}
