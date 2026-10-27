import type { IconName } from '@/components/common/icons';

export interface StudyroomTab {
  id: 'planner' | 'timer' | 'ranking' | 'calendar';
  label: string;
  icon: IconName;
}

/** 스터디룸 탭 순서·이름 */
export const studyroomTabs: StudyroomTab[] = [
  { id: 'planner', label: '플래너', icon: 'todo' },
  { id: 'timer', label: '타이머', icon: 'timer' },
  { id: 'ranking', label: '랭킹', icon: 'trophy' },
  { id: 'calendar', label: '캘린더', icon: 'calendar' },
];

/** 뽀모도로 기본값(분) */
export const pomodoroConfig = {
  focusMinutes: 25,
  breakMinutes: 5,
  presets: [15, 25, 50],
};

export const rankingPeriods = [
  { id: 'daily', label: '오늘' },
  { id: 'weekly', label: '이번 주' },
] as const;

export type RankingPeriod = (typeof rankingPeriods)[number]['id'];
