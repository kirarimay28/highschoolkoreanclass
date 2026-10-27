import type { IconName } from '@/components/common/icons';

/** 튜토리얼 단계 — 내용은 자유롭게 채우거나 순서를 바꾸세요 */
export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  icon: IconName;
  tip?: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '국어 교실에 오신 것을 환영합니다',
    body: '로비에서 원하는 메뉴 카드를 눌러 이동할 수 있어요. 왼쪽 위 엠블럼을 누르면 언제든 로비로 돌아옵니다.',
    icon: 'crown',
  },
  {
    id: 'subjects',
    title: '과목 선택',
    body: '문학, 독서와 작문, 화법과 언어 중 하나를 골라 수업 내용을 확인하세요.',
    icon: 'book',
    tip: '과목 페이지 위쪽 탭으로 다른 과목으로 바로 넘어갈 수 있어요.',
  },
  {
    id: 'studyroom',
    title: '온라인 스터디룸',
    body: '플래너에 오늘 할 일을 적고, 타이머로 공부 시간을 재 보세요. 측정한 시간은 자동으로 기록되어 랭킹과 캘린더에 반영돼요.',
    icon: 'timer',
  },
  {
    id: 'board',
    title: '질의응답 게시판',
    body: '궁금한 점을 익명 또는 실명으로 질문할 수 있어요. 익명 글은 친구들에게는 "익명"으로 보이지만, 선생님께는 이름이 보여요.',
    icon: 'messages',
    tip: '서로 존중하는 말로 질문하고 답해 주세요.',
  },
  {
    id: 'library',
    title: '도서관',
    body: '수업 자료를 과목별로 찾아보고 내려받을 수 있어요. 검색창에 제목을 입력해 보세요.',
    icon: 'library',
  },
  {
    id: 'feedback',
    title: '고쳐주세요',
    body: '앱을 쓰다가 불편한 점이나 바라는 기능이 있으면 남겨 주세요. 처리 상태를 확인할 수 있어요.',
    icon: 'wrench',
  },
];
